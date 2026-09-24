// FindNord server (NM-A11: Backend Foundation, NM-A12: real file storage for
// images, NM-A14: real email + password auth). Express replaces the old raw
// http.createServer; the app's data lives in a real SQLite database
// (scripts/db.js + scripts/api.js), every real (uploaded or AI-generated)
// photo is a real file under uploads/ (scripts/image-storage.js), served
// here at /uploads, and every request gets a real session attached
// (scripts/auth.js) via a cookie -- no more client-trusted identity.
//
// Phase 2: Sentry integration for error tracking. When SENTRY_DSN is
// configured, captures and reports unhandled exceptions and errors.
// In dev/test without DSN, runs silently without affecting behavior.

const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const compression = require("compression");
const { openDatabase } = require("./db");
const { createApiRouter, rowToListing } = require("./api");
const { createImageStorage } = require("./image-storage");
const { attachSession, requireSession, createAuthRouter } = require("./auth");
const { rateLimiter } = require("./rate-limit");
const Sentry = require("@sentry/node");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);

// Initialize Sentry as early as possible (before any other code that might throw)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    // Only capture errors, not transactions (no tracing overhead for now)
    tracesSampleRate: 0,
    // Attach stack traces to all captured errors
    attachStacktrace: true,
    // Filter out known non-actionable noise
    beforeSend(event, hint) {
      const error = hint.originalException;
      // Don't report expected 4xx errors (validation, auth, rate limits)
      if (error && typeof error === "object" && "status" in error) {
        const status = error.status;
        if (status >= 400 && status < 500) return null;
      }
      return event;
    }
  });

  // Global unhandled rejection/uncaught exception handlers
  process.on("unhandledRejection", (reason) => {
    Sentry.captureException(reason);
    console.error("[Unhandled Rejection]", reason);
  });
  process.on("uncaughtException", (error) => {
    Sentry.captureException(error);
    console.error("[Uncaught Exception]", error);
    // Don't exit - let the graceful shutdown handler deal with it
  });
}

const DEFAULT_META_DESCRIPTION =
  "FindNord is a mobile-first marketplace for the Scandinavians — nearby second-hand goods, vehicles, real estate, and more.";

// A listing's `image`/`images[0].css` is either a real uploaded file
// (`url(/uploads/xxx.jpg) center/cover no-repeat`) or a seed-style CSS
// gradient placeholder -- only the former is a real, resolvable file og:image
// can point at. Mirrors image-storage.js's own LOCAL_FILE_URL_PATTERN, which
// draws this exact same real-file-vs-gradient distinction for the opposite
// reason (deciding what to persist to disk).
const LOCAL_IMAGE_CSS_PATTERN = /^url\((\/uploads\/[^)]+)\)/;

function realImageUrlFromListing(listing) {
  const css = (listing.images && listing.images[0] && listing.images[0].css) || listing.image;
  if (!css) return null;
  const match = LOCAL_IMAGE_CSS_PATTERN.exec(css);
  return match ? match[1] : null;
}

// Real per-listing text, not boilerplate -- a plain, collapsed-whitespace
// excerpt of the listing's own description, cut to a length that fits
// og:description/twitter:description conventions.
function excerpt(text, maxLength) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]
  );
}

// NM-A25: a plain string-replace over the real index.html template -- no SSR
// framework, matching this codebase's own "avoid unnecessary
// dependencies/frameworks" philosophy throughout. `\s+` between attribute
// tokens tolerates index.html's own multi-line `<meta ... />` formatting.
function metaReplace(html, selectorPattern, content) {
  return html.replace(selectorPattern, (full) => full.replace(/content="[^"]*"/, `content="${escapeHtml(content)}"`));
}

function renderIndexWithMeta(indexHtmlTemplate, { title, description, url, image }) {
  const safeTitle = title || "FindNord";
  const safeDescription = description || DEFAULT_META_DESCRIPTION;
  let html = indexHtmlTemplate;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(safeTitle)}</title>`);
  html = metaReplace(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/>/i, safeDescription);
  html = metaReplace(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/i, safeTitle);
  html = metaReplace(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/i, safeDescription);
  html = metaReplace(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/i, url || "/");
  html = metaReplace(html, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/i, safeTitle);
  html = metaReplace(html, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/i, safeDescription);
  if (image) {
    html = html.replace(/<meta\s+name="twitter:card"\s+content="[^"]*"(\s*)\/>/i, `<meta name="twitter:card" content="summary_large_image"$1/>`);
    html = html.replace(
      /<\/head>/i,
      `<meta property="og:image" content="${escapeHtml(image)}" />\n    <meta name="twitter:image" content="${escapeHtml(image)}" />\n  </head>`
    );
  }
  return html;
}

const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const OPENAI_IMAGE_SIZE = "1024x1024";
const MAX_PROMPT_LENGTH = 300;

// Deployment-readiness audit finding: this route spends real OpenAI credits
// on every call and, unlike listing creation/messaging/reporting (see
// scripts/api.js), had no rate limiter at all -- any signed-in account could
// call it unlimited times. 10/day/account is generous for genuine "quick
// placeholder photo" use while capping the real financial exposure of a
// compromised or abusive account. Falls back to IP for the (unreachable in
// practice, since the route is requireSession-gated) case of no currentUser.
const generateImageRateLimiter = rateLimiter({
  scope: "generate-image",
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  keyFn: (req) => (req.currentUser ? req.currentUser.id : req.ip || "unknown"),
  message: "You've reached today's AI photo generation limit. Please try again tomorrow.",
  code: "RATE_LIMITED"
});

// Real OpenAI image generation, proxied server-side so the API key never
// reaches the browser. Gated behind sign-in both in the frontend (NM-A4's
// requireAuth) and now server-side too (requireSession, NM-A14) -- the
// client-side gate alone never stopped a crafted request straight to this
// endpoint from spending the site owner's real OpenAI credits.
async function handleGenerateImage(req, res) {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim().slice(0, MAX_PROMPT_LENGTH) : "";
  if (!prompt) {
    res.status(400).json({ error: "A prompt is required to generate an image." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "OPENAI_API_KEY is not set on the server. Set it as an environment variable before running npm run serve, then try again."
    });
    return;
  }

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt: `Candid, natural amateur photo taken by a phone camera for a classifieds listing, slightly imperfect framing and everyday home lighting, not a professional or stock photo: ${prompt}`,
        size: OPENAI_IMAGE_SIZE,
        n: 1
      })
    });

    const data = await openaiResponse.json().catch(() => null);

    if (!openaiResponse.ok) {
      const message = (data && data.error && data.error.message) || `OpenAI request failed (${openaiResponse.status}).`;
      res.status(openaiResponse.status).json({ error: message });
      return;
    }

    const item = data && data.data && data.data[0];
    const image = item && item.b64_json ? `data:image/png;base64,${item.b64_json}` : item && item.url ? item.url : null;

    if (!image) {
      res.status(502).json({ error: "OpenAI did not return an image." });
      return;
    }

    res.status(200).json({ image });
  } catch (error) {
    res.status(502).json({ error: `Could not reach OpenAI: ${error.message}` });
  }
}

// Deployment-readiness audit finding: no security headers were set anywhere.
// Hand-rolled (not a helmet dependency) to match this codebase's existing
// "hand-roll it if it's small" instinct (see scripts/auth.js/google-auth.js).
// CSP is deliberately conservative but not so tight it breaks the app's own
// real external dependency (the X/Twitter conversion pixel in index.html) --
// see DEPLOYMENT_READINESS_PLAN.md §2.3 for the separate decision on whether
// that pixel should exist at all; this header doesn't take that position.
function securityHeaders(req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.ads-twitter.com; " +
      "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://analytics.twitter.com https://t.co; " +
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
}

function createApp(db, uploadsDir) {
  const imageStorage = createImageStorage(uploadsDir);
  imageStorage.ensureUploadsDir();

  const app = express();
  app.disable("x-powered-by");
  // Deployment-readiness audit finding: without this, req.ip resolves to the
  // reverse proxy's own address behind any real load balancer/edge (which
  // every real deployment needs -- this app has zero built-in TLS), silently
  // collapsing every IP-keyed rate limiter onto one shared bucket for the
  // whole site. `1` trusts exactly one hop (the immediate proxy), the
  // standard safe default for a single reverse-proxy deployment.
  app.set("trust proxy", 1);
  app.use(compression());
  app.use(securityHeaders);

  // Sentry request handler (must be before all other middleware)
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
  }

  app.use(attachSession(db));
  app.use("/api/auth", createAuthRouter(db));
  app.post(
    "/api/generate-image",
    express.json({ limit: "10kb" }),
    requireSession,
    generateImageRateLimiter,
    handleGenerateImage
  );
  app.use("/api", createApiRouter(db, { uploadsDir: imageStorage.uploadsDir }));
  app.use("/uploads", express.static(imageStorage.uploadsDir));

  // NM-A25: real, shareable deep-link routes. Read once here (not per
  // request) -- the same "read at startup" pattern already used for seed
  // data elsewhere in this codebase; a real server restart (which every
  // deploy already requires for any other file change) picks up a new
  // index.html too. Registered BEFORE the generic `express.static(root)`
  // below so a fresh page load of any of these 4 URLs lands on the real
  // content instead of a plain 404 (none of these paths ever collide with a
  // real static file at that same path, so ordering relative to static is
  // otherwise inert -- this is just the clearest place to put them).
  const indexHtmlTemplate = fs.readFileSync(path.join(root, "index.html"), "utf8");

  app.get("/listing/:id", (req, res) => {
    const base = `${req.protocol}://${req.get("host")}`;
    const canonicalUrl = `${base}/listing/${encodeURIComponent(req.params.id)}`;
    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
    if (!row) {
      res.status(404).type("html").send(renderIndexWithMeta(indexHtmlTemplate, { title: "Listing not found — FindNord", url: canonicalUrl }));
      return;
    }
    const listing = rowToListing(db, row);
    const image = realImageUrlFromListing(listing);
    res.type("html").send(
      renderIndexWithMeta(indexHtmlTemplate, {
        title: `${listing.title} — FindNord`,
        description: excerpt(listing.description, 200) || DEFAULT_META_DESCRIPTION,
        url: canonicalUrl,
        image: image ? `${base}${image}` : null
      })
    );
  });

  app.get("/profile/:id", (req, res) => {
    const base = `${req.protocol}://${req.get("host")}`;
    const canonicalUrl = `${base}/profile/${encodeURIComponent(req.params.id)}`;
    const row = db.prepare("SELECT id, name FROM users WHERE id = ?").get(req.params.id);
    if (!row) {
      res.status(404).type("html").send(renderIndexWithMeta(indexHtmlTemplate, { title: "Profile not found — FindNord", url: canonicalUrl }));
      return;
    }
    res.type("html").send(
      renderIndexWithMeta(indexHtmlTemplate, {
        title: `${row.name} — FindNord`,
        description: `See ${row.name}'s listings and reviews on FindNord.`,
        url: canonicalUrl
      })
    );
  });

  // Static-page OG injection is deliberately NOT done here (this slice's own
  // acceptance bar only requires it for listings -- see EVIDENCE.md's
  // Residual Risks): STATIC_PAGES' titles live only in app.js today, and
  // duplicating them into a second, server-side map would be a real,
  // silent-drift risk (one edited without the other) for a page that
  // renders identically either way once the client mounts. The route still
  // does its required job -- a fresh load of a real slug lands on that exact
  // static page, not Browse.
  app.get("/page/:slug", (req, res) => {
    res.type("html").send(indexHtmlTemplate);
  });

  // NM-A25: replaces NM-A23's `?resetToken=` query-string stopgap. No DB
  // lookup here -- token validity is checked for real only where it always
  // was, server-side in POST /api/auth/reset-password once the form
  // actually submits; this route's only job is making sure a fresh load of
  // the emailed/console-logged link lands on the app instead of a 404.
  app.get("/reset-password/:token", (req, res) => {
    res.type("html").send(indexHtmlTemplate);
  });

  app.use(express.static(root));

  // Sentry error handler (must be before custom error handler)
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }

  // Deployment-readiness audit finding: no custom error-handling middleware
  // existed anywhere, so any uncaught exception (e.g. the confirmed
  // NOT-NULL-constraint crash on a malformed /conversations/start-or-get
  // request -- see DEPLOYMENT_READINESS_PLAN.md §2.4) fell through to
  // Express's own default handler, which returns a raw HTML page with a full
  // stack trace and local file paths regardless of NODE_ENV unless it's
  // explicitly set to "production". This handler always returns a clean,
  // generic JSON error to the client and logs the real error server-side --
  // correct behavior independent of whatever NODE_ENV the deploy environment
  // does or doesn't set. Must be registered LAST (Express identifies an
  // error handler by its 4-argument signature).
  app.use((err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.originalUrl || req.path}:`, err);
    if (res.headersSent) {
      next(err);
      return;
    }
    res.status(500).json({ error: "Something went wrong on our end. Please try again.", code: "INTERNAL_ERROR" });
  });

  return app;
}

function startServer(options = {}) {
  const db = openDatabase(options.dbPath, { uploadsDir: options.uploadsDir });
  const app = createApp(db, options.uploadsDir);
  const server = app.listen(options.port ?? port, () => {
    if (!options.silent) {
      console.log(`FindNord running at http://127.0.0.1:${server.address().port}`);
      if (!process.env.OPENAI_API_KEY) {
        console.log("Note: OPENAI_API_KEY is not set — /api/generate-image will return a clear error until it is.");
      }
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.log(
          "Note: GOOGLE_CLIENT_ID is not set — \"Continue with Google\" will show as unavailable until it is. " +
            "GOOGLE_CLIENT_SECRET is NOT needed by this app at all (see scripts/google-auth.js)."
        );
      }
      const hasSes = Boolean(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.SES_FROM_EMAIL);
      if (!hasSes) {
        console.log(
          "Note: AWS SES not configured — password-reset links are logged to THIS console " +
            "(see sendResetEmail in scripts/auth.js) instead of being emailed. Set AWS_REGION, " +
            "AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and SES_FROM_EMAIL to enable real email."
        );
      } else {
        console.log("AWS SES configured — password-reset emails will be sent via SES.");
      }
      if (!process.env.SENTRY_DSN) {
        console.log("Note: SENTRY_DSN not set — error tracking disabled. Set SENTRY_DSN to enable Sentry.");
      } else {
        console.log("Sentry configured — error tracking enabled.");
      }
    }
  });

  // Deployment-readiness audit finding: no graceful-shutdown handling
  // existed anywhere. A container orchestrator (or any PaaS redeploy) sends
  // SIGTERM and expects in-flight requests to finish and the DB handle to
  // close cleanly within its grace period, rather than a hard kill that can
  // leave better-sqlite3's WAL file mid-checkpoint. Listeners are removed
  // when this specific server closes (including a test-driven
  // `server.close()`) so the test suite's own pattern of starting many
  // short-lived server instances in one process never accumulates listeners
  // across runs.
  function shutdown(signal) {
    if (!options.silent) console.log(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      try {
        db.close();
      } catch (error) {
        // Already closed (e.g. by a test) -- not a real shutdown failure.
      }
      process.exit(0);
    });
  }
  const onSigterm = () => shutdown("SIGTERM");
  const onSigint = () => shutdown("SIGINT");
  process.on("SIGTERM", onSigterm);
  process.on("SIGINT", onSigint);
  server.on("close", () => {
    process.off("SIGTERM", onSigterm);
    process.off("SIGINT", onSigint);
  });

  return { server, db, app };
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
