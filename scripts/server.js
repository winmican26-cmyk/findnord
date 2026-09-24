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

function renderIndexWithMeta(indexHtmlTemplate, { title, description, url, image, structuredData }) {
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
  // AI Optimization: inject JSON-LD structured data before </head>
  if (structuredData) {
    html = html.replace(
      /<\/head>/i,
      `${structuredData}\n  </head>`
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
    
    // AI Optimization: JSON-LD structured data for Product/Offer
    const priceMatch = listing.price.match(/[\d\s.,]+/);
    const priceValue = priceMatch ? parseFloat(priceMatch[0].replace(/[^\d.]/g, "")) : 0;
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": listing.title,
      "description": listing.description || "",
      "url": canonicalUrl,
      "image": image ? `${base}${image}` : undefined,
      "brand": {
        "@type": "Brand",
        "name": "FindNord"
      },
      "offers": {
        "@type": "Offer",
        "url": canonicalUrl,
        "priceCurrency": listing.currency,
        "price": priceValue,
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Person",
          "name": listing.seller
        }
      },
      "category": listing.category,
      "condition": listing.condition || "https://schema.org/UsedCondition"
    };
    
    const structuredDataScript = `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
    
    res.type("html").send(
      renderIndexWithMeta(indexHtmlTemplate, {
        title: `${listing.title} — FindNord`,
        description: excerpt(listing.description, 200) || DEFAULT_META_DESCRIPTION,
        url: canonicalUrl,
        image: image ? `${base}${image}` : null,
        structuredData: structuredDataScript
      })
    );
  });

  app.get("/profile/:id", (req, res) => {
    const base = `${req.protocol}://${req.get("host")}`;
    const canonicalUrl = `${base}/profile/${encodeURIComponent(req.params.id)}`;
    const row = db.prepare("SELECT id, name, created_at FROM users WHERE id = ?").get(req.params.id);
    if (!row) {
      res.status(404).type("html").send(renderIndexWithMeta(indexHtmlTemplate, { title: "Profile not found — FindNord", url: canonicalUrl }));
      return;
    }
    
    // AI Optimization: JSON-LD structured data for Person/Profile
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": row.name,
      "url": canonicalUrl,
      "description": `See ${row.name}'s listings and reviews on FindNord.`,
      "worksFor": {
        "@type": "Organization",
        "name": "FindNord"
      }
    };
    
    const structuredDataScript = `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
    
    res.type("html").send(
      renderIndexWithMeta(indexHtmlTemplate, {
        title: `${row.name} — FindNord`,
        description: `See ${row.name}'s listings and reviews on FindNord.`,
        url: canonicalUrl,
        structuredData: structuredDataScript
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

  // --- AI Optimization: robots.txt ---
  app.get("/robots.txt", (req, res) => {
    const base = `${req.protocol}://${req.get("host")}`;
    const robots = `User-agent: *
Allow: /

# AI/Research crawlers - full access for indexing and research
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Applebot
Allow: /
User-agent: Bytespider
Allow: /
User-agent: facebookexternalhit
Allow: /
User-agent: Twitterbot
Allow: /

# Sitemap
Sitemap: ${base}/sitemap.xml

# Crawl-delay for respectful crawling (optional, adjust as needed)
Crawl-delay: 10
`;
    res.type("text/plain").send(robots);
  });

  // --- AI Optimization: sitemap.xml ---
  app.get("/sitemap.xml", async (req, res) => {
    const base = `${req.protocol}://${req.get("host")}`;
    const now = new Date().toISOString().split("T")[0];
    
    // Get all active listings
    const listings = db.prepare("SELECT id, posted_at FROM listings WHERE status = 'active' AND (admin_hidden IS NULL OR admin_hidden = 0) ORDER BY posted_at DESC LIMIT 50000").all();
    
    // Get all public profiles
    const profiles = db.prepare("SELECT id FROM users WHERE is_admin = 0").all();
    
    // Static pages
    const staticPages = [
      "", // homepage
      "/categories",
      "/page/about",
      "/page/howItWorks",
      "/page/safetyTips",
      "/page/pricingGuide",
      "/page/photoGuide",
      "/page/safeSellingGuide",
      "/page/helpCenter",
      "/page/faq",
      "/page/contactSupport",
      "/page/reportIssue",
      "/page/boostAds",
      "/page/contentModeration",
      "/page/dataSafety",
      "/page/aboutMicany",
      "/page/privacyPolicy",
      "/page/dataSubjectRights",
      "/page/termsOfService",
      "/page/cookiePolicy",
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Homepage
    sitemap += `  <url>
    <loc>${base}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${base}/" />
    <xhtml:link rel="alternate" hreflang="sv" href="${base}/" />
    <xhtml:link rel="alternate" hreflang="no" href="${base}/" />
    <xhtml:link rel="alternate" hreflang="da" href="${base}/" />
    <xhtml:link rel="alternate" hreflang="fi" href="${base}/" />
    <xhtml:link rel="alternate" hreflang="is" href="${base}/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${base}/" />
  </url>
`;

    // Static pages
    for (const page of staticPages.slice(1)) {
      const url = `${base}${page}`;
      sitemap += `  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    // Listings
    for (const listing of listings) {
      const url = `${base}/listing/${encodeURIComponent(listing.id)}`;
      const lastmod = new Date(listing.posted_at).toISOString().split("T")[0];
      sitemap += `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Profiles
    for (const profile of profiles) {
      const url = `${base}/profile/${encodeURIComponent(profile.id)}`;
      sitemap += `  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    sitemap += `</urlset>`;
    res.type("application/xml").send(sitemap);
  });

  // --- AI Optimization: llms.txt for AI research agents ---
  app.get("/llms.txt", (req, res) => {
    const base = `${req.protocol}://${req.get("host")}`;
    const llms = `# FindNord - Nordic Marketplace
# LLM-friendly documentation for AI research agents

## Overview
FindNord is a mobile-first marketplace for the Scandinavians — nearby second-hand goods, vehicles, real estate, and more across Sweden, Norway, Denmark, Finland, and Iceland.

## Key URLs
- Homepage: ${base}/
- Browse Listings: ${base}/ (with filters)
- Categories: ${base}/categories
- About: ${base}/page/about
- How It Works: ${base}/page/howItWorks
- Safety Tips: ${base}/page/safetyTips
- Privacy Policy: ${base}/page/privacyPolicy
- Terms of Service: ${base}/page/termsOfService
- Cookie Policy: ${base}/page/cookiePolicy
- Data Subject Rights: ${base}/page/dataSubjectRights

## API Endpoints
- GET /api/listings - List all active listings (paginated, filterable)
- GET /api/listings/:id - Get single listing details
- GET /api/profile/:id - Get public seller profile
- POST /api/auth/register - Register new account
- POST /api/auth/login - Login
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password
- POST /api/auth/google - Google Sign-In
- GET /api/auth/me - Get current user
- GET /api/conversations - Get user's conversations
- GET /api/conversations/:id/messages - Get messages
- POST /api/conversations/start-or-get - Start/get conversation
- POST /api/conversations/:id/messages - Send message
- POST /api/listings - Create listing (auth required)
- PATCH /api/listings/:id - Update listing (auth required)
- DELETE /api/listings/:id - Delete listing (auth required)
- POST /api/saved-items/toggle - Toggle saved item (auth required)
- POST /api/reports - Report listing/user (auth required)
- POST /api/blocks - Block user (auth required)

## Structured Data
- Homepage: WebSite schema with SearchAction
- Listings: Product/Offer schema with price, availability, seller
- Profiles: Person/Organization schema with ratings
- Pages: WebPage/Article schema

## Languages Supported
- English (en) - default
- Swedish (sv)
- Norwegian Bokmål (no)
- Danish (da)
- Finnish (fi)
- Icelandic (is)

## Countries/Markets
- Sweden (SEK)
- Norway (NOK)
- Denmark (DKK)
- Finland (EUR)
- Iceland (ISK)

## Sitemap
${base}/sitemap.xml

## Robots
${base}/robots.txt

## OpenAPI Spec
${base}/openapi.json
`;
    res.type("text/plain").send(llms);
  });

  // --- AI Optimization: OpenAPI 3.0 spec ---
  app.get("/openapi.json", (req, res) => {
    const base = `${req.protocol}://${req.get("host")}`;
    const openapi = {
      openapi: "3.0.3",
      info: {
        title: "FindNord API",
        version: "1.0.0",
        description: "FindNord Nordic Marketplace API - Buy and sell locally across Scandinavia",
        contact: {
          name: "FindNord Support",
          email: "support@findnord.com"
        },
        license: {
          name: "Proprietary"
        }
      },
      servers: [
        {
          url: base,
          description: "Current server"
        }
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "fn_session"
          }
        },
        schemas: {
          Listing: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              category: { type: "string" },
              price: { type: "string" },
              currency: { type: "string" },
              country: { type: "string" },
              description: { type: "string" },
              images: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    css: { type: "string" },
                    aiGenerated: { type: "boolean" }
                  }
                }
              },
              seller: { type: "string" },
              sellerId: { type: "string" },
              sellerType: { type: "string" },
              status: { type: "string" },
              createdAt: { type: "integer" }
            }
          },
          Profile: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              memberSince: { type: "integer" },
              verified: { type: "boolean" },
              rating: {
                type: "object",
                properties: {
                  average: { type: "number" },
                  count: { type: "integer" }
                }
              },
              activeListingCount: { type: "integer" }
            }
          },
          Error: {
            type: "object",
            properties: {
              error: { type: "string" },
              code: { type: "string" }
            }
          }
        }
      },
      paths: {
        "/api/listings": {
          get: {
            summary: "List active listings",
            parameters: [
              { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
              { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
              { name: "category", in: "query", schema: { type: "string" } },
              { name: "country", in: "query", schema: { type: "string" } },
              { name: "q", in: "query", schema: { type: "string" } },
              { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "price_asc", "price_desc", "nearest"] } }
            ],
            responses: {
              "200": {
                description: "Paginated listings",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        listings: { type: "array", items: { $ref: "#/components/schemas/Listing" } },
                        pagination: {
                          type: "object",
                          properties: {
                            limit: { type: "integer" },
                            offset: { type: "integer" },
                            total: { type: "integer" },
                            hasMore: { type: "boolean" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/api/listings/{id}": {
          get: {
            summary: "Get single listing",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } }
            ],
            responses: {
              "200": {
                description: "Listing details",
                content: { "application/json": { schema: { $ref: "#/components/schemas/Listing" } } }
              },
              "404": { description: "Not found" }
            }
          }
        },
        "/api/profile/{id}": {
          get: {
            summary: "Get public seller profile",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } }
            ],
            responses: {
              "200": { description: "Profile details", content: { "application/json": { schema: { $ref: "#/components/schemas/Profile" } } } },
              "404": { description: "Not found" }
            }
          }
        },
        "/api/auth/register": {
          post: {
            summary: "Register new account",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["name", "email", "password", "ageConfirmed"],
                    properties: {
                      name: { type: "string" },
                      email: { type: "string", format: "email" },
                      password: { type: "string", format: "password", minLength: 8 },
                      ageConfirmed: { type: "boolean" }
                    }
                  }
                }
              }
            },
            responses: {
              "200": { description: "User created" },
              "400": { $ref: "#/components/schemas/Error" },
              "409": { $ref: "#/components/schemas/Error" }
            }
          }
        },
        "/api/auth/login": {
          post: {
            summary: "Login",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                      email: { type: "string", format: "email" },
                      password: { type: "string", format: "password" }
                    }
                  }
                }
              }
            },
            responses: {
              "200": { description: "Logged in" },
              "400": { $ref: "#/components/schemas/Error" },
              "401": { $ref: "#/components/schemas/Error" }
            }
          }
        }
      }
    };
    res.json(openapi);
  });

  // --- AI Optimization: site.webmanifest for PWA ---
  app.get("/site.webmanifest", (req, res) => {
    const base = `${req.protocol}://${req.get("host")}`;
    const manifest = {
      name: "FindNord",
      short_name: "FindNord",
      description: "Nordic Marketplace - Buy and sell locally across Scandinavia",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#006AA7",
      orientation: "portrait-primary",
      scope: "/",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      categories: ["shopping", "lifestyle"],
      lang: "en",
      dir: "ltr"
    };
    res.json(manifest);
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
