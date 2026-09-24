// Real email + password authentication (NM-A14), replacing every mocked-auth
// assumption from NM-A7 through NM-A13. No new npm dependency: password
// hashing uses Node's built-in `crypto.scrypt` (an OWASP-endorsed equivalent
// to bcrypt, and literally what Node's own docs use as the canonical
// password-hashing example) instead of adding a native bcrypt binding: the
// same "avoid an unnecessary native dependency" instinct that shaped the
// better-sqlite3 choice in NM-A11. Cookies are hand-rolled for the same
// reason -- Express doesn't parse them by default, and a real cookie is
// ~15 lines, not worth a dependency.
//
// Phase 2: SES integration for real transactional email (password resets).
// When AWS credentials are configured, sends real emails. In dev/test without
// credentials, falls back to console.log so existing workflows (tests reading
// the reset link from stdout) continue to work unchanged.

const crypto = require("node:crypto");
const express = require("express");
const { makeId } = require("./db");
const { verifyGoogleIdToken } = require("./google-auth");
const { rateLimiter } = require("./rate-limit");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const SESSION_COOKIE_NAME = "fn_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days -- "stay logged in across restarts"
const MIN_PASSWORD_LENGTH = 8;
// NM-A23: 45 minutes -- inside the "30-60 minutes" range a real password
// reset link should stay valid for: long enough that a real console-logged
// (see sendResetEmail below) link is still usable a few minutes later,
// short enough that a leaked-in-transit link doesn't stay exploitable for long.
const RESET_TOKEN_DURATION_MS = 45 * 60 * 1000;

// NM-A21: the one designated admin account, named by a real env var -- the
// same "ops-controlled setting, not a hardcoded value" pattern as
// BOOST_PAYMENTS_ENABLED/GOOGLE_CLIENT_ID. This is only ever READ at
// sign-in time (see syncAdminFlag) to decide whether to set the real,
// per-user `is_admin` DB column -- every actual admin-only request check
// reads that column, never this env var directly, so "only users MARKED as
// admin" stays literally true even if this env var later changes or unsets.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ? String(process.env.ADMIN_EMAIL).trim().toLowerCase() : null;

// A loose, real validation -- international phone formats vary a lot across
// FindNord's 5 countries, so this only rejects obvious garbage (letters,
// too short/long), not a specific national format.
const PHONE_PATTERN = /^[0-9+()\- ]{6,20}$/;

// BL-A06: the same 5 real countries app.js's countryThemes/CURRENCY_BY_COUNTRY
// already key on -- kept as a literal list here (not fetched) for the same
// "fixed geographic fact" reason CURRENCY_BY_COUNTRY is duplicated in
// scripts/api.js rather than imported from app.js (a browser-only file).
const VALID_HOME_COUNTRIES = ["Sweden", "Norway", "Denmark", "Finland", "Iceland"];

function rowToAuthUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    homeCountry: row.home_country || "Sweden",
    homeRegion: row.home_region || "",
    isAdmin: Boolean(row.is_admin)
  };
}

// Called right after every real sign-in (register/login/Google) -- keeps
// `is_admin` in sync with ADMIN_EMAIL without ever trusting the CLIENT to
// say who's an admin. A no-op for every other account, and a no-op again
// once already set (idempotent, like every other migration/sync in this app).
function syncAdminFlag(db, userId, email) {
  if (!ADMIN_EMAIL || !email || email.toLowerCase() !== ADMIN_EMAIL) return;
  db.prepare("UPDATE users SET is_admin = 1 WHERE id = ? AND is_admin = 0").run(userId);
}

// NM-A21: applied per-route, exactly like requireSession -- an admin route
// still requires a real session FIRST (requireSession's own 401), then this
// checks the real, server-verified is_admin column. A guest or an ordinary
// signed-in user both get the same clear 403, never a hint about which
// email the real admin account uses.
function requireAdmin(req, res, next) {
  if (!req.currentUser) {
    res.status(401).json({ error: "Sign in required.", code: "AUTH_REQUIRED" });
    return;
  }
  if (!req.currentUser.isAdmin) {
    res.status(403).json({ error: "Admin access required.", code: "ADMIN_REQUIRED" });
    return;
  }
  next();
}

// --- Passwords ---

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

// Constant-time comparison (via crypto.timingSafeEqual) so a wrong-password
// response can't be distinguished by response timing.
function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  const hash = Buffer.from(hashHex, "hex");
  const candidate = crypto.scryptSync(password, salt, 64);
  if (candidate.length !== hash.length) return false;
  return crypto.timingSafeEqual(candidate, hash);
}

// Phase 3: hash session IDs and password-reset tokens at rest.
// Tokens are already high-entropy (32 bytes = 256 bits), so a single
// SHA-256 is sufficient -- no salt/stretching needed. Stored hash is
// compared with constant-time equality to prevent timing attacks.
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function verifyToken(token, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;
  const candidate = hashToken(token);
  if (candidate.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(storedHash, "hex"));
}

// --- Sessions: a real DB row, not a client-trusted token -- this is what
// makes "stay logged in across a server restart" true: the row survives in
// SQLite, and the cookie survives in the browser, independently of either
// process staying alive. ---

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const now = Date.now();
  // Store the hash, not the plain token. The cookie still gets the plain token.
  db.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(tokenHash, userId, now, now + SESSION_DURATION_MS);
  return token;
}

function getUserBySessionToken(db, token) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(tokenHash);
  if (!session || session.expires_at < Date.now()) return null;
  const user = db.prepare("SELECT id, name, email, phone, home_country, home_region, is_admin FROM users WHERE id = ?").get(session.user_id);
  return rowToAuthUser(user);
}

function deleteSession(db, token) {
  if (token) db.prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
}

// --- NM-A23: Password reset -- a real, single-use, expiring token, the
// same "the random value itself is the row's id" shape createSession
// already uses for sessions. ---

function createPasswordResetToken(db, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const now = Date.now();
  // Store the hash, not the plain token. The email still gets the plain token.
  db.prepare("INSERT INTO password_reset_tokens (token, user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, NULL, ?)").run(
    tokenHash,
    userId,
    now + RESET_TOKEN_DURATION_MS,
    now
  );
  return token;
}

// No real email delivery provider is configured in this environment -- the
// exact same "not configured, clear console message, graceful degrade, no
// crash" shape already used for OPENAI_API_KEY/GOOGLE_CLIENT_ID (see
// scripts/server.js and this file's own /google/config route). This
// Phase 2: SES integration for real transactional email (password resets).
// When AWS credentials are configured, sends real emails via SES.
// In dev/test without credentials, falls back to console.log so existing
// workflows (tests reading the reset link from stdout) continue to work.
let sesClient = null;
let sesFromEmail = null;

function initSesClient() {
  if (sesClient) return sesClient;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const fromEmail = process.env.SES_FROM_EMAIL;

  if (!region || !accessKeyId || !secretAccessKey || !fromEmail) {
    return null; // SES not configured -- caller will fall back to console.log
  }

  sesClient = new SESClient({ region });
  sesFromEmail = fromEmail;
  return sesClient;
}

async function sendResetEmail(email, resetUrl) {
  const client = initSesClient();
  const fromEmail = sesFromEmail;

  if (!client || !fromEmail) {
    // Dev/test fallback: log to console so developers and automated tests
    // can still read the reset link from stdout.
    console.log(`[FindNord] Password reset requested for ${email}: ${resetUrl}`);
    return;
  }

  const subject = "FindNord — Reset your password";
  const textBody = `You requested a password reset for your FindNord account.\n\nClick this link to set a new password (valid for 45 minutes):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  const htmlBody = `<p>You requested a password reset for your FindNord account.</p><p><a href="${resetUrl}">Reset your password</a> (valid for 45 minutes)</p><p>If you didn't request this, you can safely ignore this email.</p>`;

  try {
    await client.send(new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: textBody, Charset: "UTF-8" },
          Html: { Data: htmlBody, Charset: "UTF-8" }
        }
      }
    }));
  } catch (error) {
    // Log the error but don't expose details to the client (generic response
    // is a security requirement -- no account enumeration).
    console.error(`[SES] Failed to send password reset email to ${email}:`, error);
    // Still log to console as fallback so dev/test workflows aren't broken
    // by a transient SES failure.
    console.log(`[FindNord] Password reset requested for ${email}: ${resetUrl}`);
  }
}

// --- NM-A23: rate limiting for the 4 real auth endpoints, front-loaded from
// the NEXT slice's own broader rate-limiting scope because password reset
// (the most abuse-prone endpoint of all -- it works for ANY email, guessed
// or not) can't honestly meet this slice's own acceptance bar without it.
// Built on scripts/rate-limit.js's reusable `rateLimiter(options)` factory,
// not a one-off, so the next slice can import and reuse the exact same
// module for listing/message/report routes. A real per-IP+email key for
// login/register/forgot-password (keeps one IP's spam against ONE target
// email from burning through a shared budget meant for everyone else at
// that IP); reset-password has no email field on its own request body (only
// a token), so it's limited per-IP instead -- which is also the right shape
// for its real abuse vector (token brute-forcing from one source), since a
// per-token key would let an attacker dodge the limit just by trying a
// different token on every guess. ---

function ipEmailRateLimitKey(req) {
  const email = req.body && typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return `${req.ip || "unknown"}|${email || "-"}`;
}

function ipRateLimitKey(req) {
  return req.ip || "unknown";
}

const AUTH_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const loginRateLimiter = rateLimiter({
  scope: "auth-login",
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: 10,
  keyFn: ipEmailRateLimitKey,
  message: "Too many login attempts. Please wait before trying again.",
  code: "RATE_LIMITED"
});

const registerRateLimiter = rateLimiter({
  scope: "auth-register",
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: 6,
  keyFn: ipEmailRateLimitKey,
  message: "Too many sign-up attempts. Please wait before trying again.",
  code: "RATE_LIMITED"
});

const forgotPasswordRateLimiter = rateLimiter({
  scope: "auth-forgot-password",
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: 6,
  keyFn: ipEmailRateLimitKey,
  message: "Too many password reset requests. Please wait before trying again.",
  code: "RATE_LIMITED"
});

const resetPasswordRateLimiter = rateLimiter({
  scope: "auth-reset-password",
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: 8,
  keyFn: ipRateLimitKey,
  message: "Too many password reset attempts. Please wait before trying again.",
  code: "RATE_LIMITED"
});

// --- Cookies ---

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((pair) => {
    const index = pair.indexOf("=");
    if (index === -1) return;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

// Deployment-readiness audit finding: the session cookie never set `Secure`,
// so it would still be transmittable over plain HTTP in production. Gated on
// NODE_ENV=production (not unconditional) because this app's own dev/test
// story runs over plain http://127.0.0.1 -- see DEPLOYMENT_READINESS_PLAN.md
// §2.6/Phase 0 item 4, which also recommends setting NODE_ENV=production in
// the real deploy's start command. A real deployment sits behind a
// TLS-terminating reverse proxy (this app has no built-in HTTPS), so
// `Secure` is safe to set unconditionally once NODE_ENV really is
// "production".
const COOKIE_SECURE_SUFFIX = process.env.NODE_ENV === "production" ? "; Secure" : "";

function serializeSessionCookie(token) {
  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${COOKIE_SECURE_SUFFIX}`;
}

function serializeExpiredSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${COOKIE_SECURE_SUFFIX}`;
}

// --- Middleware ---

// Runs on every request: attaches req.currentUser (or null) from the real
// session cookie. Never blocks -- browsing stays open to everyone.
function attachSession(db) {
  return (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    req.sessionToken = cookies[SESSION_COOKIE_NAME] || null;
    req.currentUser = getUserBySessionToken(db, req.sessionToken);
    next();
  };
}

// Applied per-route: publishing, saving, messaging, reporting, and boosting
// (and the real-money AI image proxy) all require a genuine session now --
// requirement 4/7 of NM-A14, closing the gap where any client-supplied id
// used to be trusted at face value (NM-A13's requesterId body field).
function requireSession(req, res, next) {
  if (!req.currentUser) {
    res.status(401).json({ error: "Sign in required.", code: "AUTH_REQUIRED" });
    return;
  }
  next();
}

// --- /api/auth router ---

// `options.googleClientId` and `options.verifyGoogleIdToken` both default to
// the real thing (env var + real JWKS verification) but are overridable --
// tests use this to verify a hand-signed token against a local JWKS instead
// of a real Google Cloud OAuth client, which this project's dev/test
// environment does not have (see EVIDENCE.md).
function createAuthRouter(db, options = {}) {
  const router = express.Router();
  router.use(express.json({ limit: "10kb" }));
  const googleClientId = options.googleClientId !== undefined ? options.googleClientId : process.env.GOOGLE_CLIENT_ID || null;
  const verifyGoogle = options.verifyGoogleIdToken || verifyGoogleIdToken;

  router.post("/register", registerRateLimiter, (req, res) => {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required.", code: "MISSING_FIELDS" });
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: "Password must be at least 8 characters.", code: "PASSWORD_TOO_SHORT" });
      return;
    }
    // Deployment-readiness audit finding: the ToS said "you must be old
    // enough to form a binding contract" but nothing checked it. This is the
    // authoritative check -- the frontend's own checkbox validation
    // (app.js's submitAuthForm) is a UX convenience, not the real gate; a
    // direct API call must be rejected here regardless of what it claims.
    if (body.ageConfirmed !== true) {
      res.status(400).json({ error: "You must confirm you're at least 18 to create an account.", code: "AGE_NOT_CONFIRMED" });
      return;
    }
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      res.status(409).json({ error: "That email is already registered.", code: "EMAIL_TAKEN" });
      return;
    }

    const id = makeId("user");
    db.prepare("INSERT INTO users (id, name, email, guest, password_hash, created_at) VALUES (?, ?, ?, 0, ?, ?)").run(
      id,
      name,
      email,
      hashPassword(password),
      Date.now()
    );
    syncAdminFlag(db, id, email);
    const token = createSession(db, id);
    res.setHeader("Set-Cookie", serializeSessionCookie(token));
    res.status(201).json(rowToAuthUser(db.prepare("SELECT id, name, email, phone, home_country, home_region, is_admin FROM users WHERE id = ?").get(id)));
  });

  router.post("/login", loginRateLimiter, (req, res) => {
    const body = req.body || {};
    const email = String(body.email || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    const user = email ? db.prepare("SELECT * FROM users WHERE email = ?").get(email) : null;
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: "Incorrect email or password.", code: "INVALID_CREDENTIALS" });
      return;
    }

    syncAdminFlag(db, user.id, user.email);
    const token = createSession(db, user.id);
    res.setHeader("Set-Cookie", serializeSessionCookie(token));
    res.json(rowToAuthUser(db.prepare("SELECT id, name, email, phone, home_country, home_region, is_admin FROM users WHERE id = ?").get(user.id)));
  });

  router.post("/logout", (req, res) => {
    deleteSession(db, req.sessionToken);
    res.setHeader("Set-Cookie", serializeExpiredSessionCookie());
    res.json({ success: true });
  });

  // The frontend's "who am I" check -- real and server-verified (via the
  // httpOnly cookie the browser already sent), not a client-cached guess.
  router.get("/me", (req, res) => {
    res.json(req.currentUser || null);
  });

  // NM-A23: requirement 1 -- ALWAYS a generic 200, whether or not `email`
  // resolves to a real account. Never branch the status code, the message,
  // or even the response TIMING (no extra work is done for a hit vs. a
  // miss beyond the token insert itself) on account existence.
  router.post("/forgot-password", forgotPasswordRateLimiter, (req, res) => {
    const email = String((req.body || {}).email || "").trim().toLowerCase();
    const user = email ? db.prepare("SELECT id, email FROM users WHERE email = ?").get(email) : null;
    if (user) {
      const token = createPasswordResetToken(db, user.id);
      // NM-A25: a real route (`/reset-password/:token`), not a query-string
      // stopgap -- see app.js's parseRoute/applyRoute and server.js's
      // matching `/reset-password/:token` route, which both serve and
      // (client-side) parse this exact same URL shape.
      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${token}`;
      sendResetEmail(user.email, resetUrl);
    }
    res.status(200).json({ message: "If that email exists, we've sent a reset link." });
  });

  // NM-A23: requirements 2/3/7. `token` must exist, be unexpired, and be
  // unused; a Google-only account (no password_hash ever set) gets an
  // honest, distinct rejection HERE rather than at /forgot-password above --
  // reaching this branch already proves real possession of a genuine,
  // unexpired, single-use token for this exact account (it can only have
  // come from a real /forgot-password request against this email, via the
  // console-logged link sendResetEmail produced), so revealing "this
  // account has no password" at this point leaks nothing about any OTHER
  // email address the way answering it at /forgot-password would.
  router.post("/reset-password", resetPasswordRateLimiter, (req, res) => {
    const body = req.body || {};
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    const tokenHash = hashToken(token);
    const tokenRow = token ? db.prepare("SELECT * FROM password_reset_tokens WHERE token = ?").get(tokenHash) : null;
    if (!tokenRow) {
      res.status(400).json({ error: "This reset link is invalid.", code: "INVALID_RESET_TOKEN" });
      return;
    }
    if (tokenRow.used_at) {
      res.status(400).json({ error: "This reset link has already been used.", code: "RESET_TOKEN_USED" });
      return;
    }
    if (tokenRow.expires_at < Date.now()) {
      res.status(400).json({ error: "This reset link has expired. Request a new one.", code: "RESET_TOKEN_EXPIRED" });
      return;
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(tokenRow.user_id);
    if (!user) {
      res.status(400).json({ error: "This reset link is invalid.", code: "INVALID_RESET_TOKEN" });
      return;
    }

    if (!user.password_hash) {
      // The reset attempt is resolved either way -- consume the token here
      // too, rather than leaving it usable for repeated probing.
      db.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE token = ?").run(Date.now(), tokenHash);
      res.status(400).json({
        error: "This account signs in with Google — there's no password to reset. Try \"Continue with Google\" instead.",
        code: "GOOGLE_ACCOUNT_NO_PASSWORD"
      });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: "Password must be at least 8 characters.", code: "PASSWORD_TOO_SHORT" });
      return;
    }

    const now = Date.now();
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), user.id);
    db.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE token = ?").run(now, tokenHash);
    // NM-A23 requirement 3: a password reset is a real security event -- every
    // existing session for this user dies, everywhere (not just the device
    // that requested the reset), forcing a genuine re-login rather than
    // leaving an old or compromised session alive after the account owner
    // just proved control of the account and changed its password.
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);

    res.status(200).json({ success: true });
  });

  // NM-A21 follow-up: real Settings under Profile -- a signed-in user can
  // set their own contact phone number (email stays the real account
  // identifier, shown but not editable here -- changing it would need real
  // re-verification, out of scope for this small addition). `name` isn't
  // touched by this route; only phone, keeping this a narrow, real update
  // rather than a general "edit anything" endpoint.
  router.patch("/me", requireSession, (req, res) => {
    const body = req.body || {};
    const rawPhone = body.phone;
    if (rawPhone !== undefined && rawPhone !== "" && !PHONE_PATTERN.test(String(rawPhone))) {
      res.status(400).json({ error: "That doesn't look like a real phone number.", code: "INVALID_PHONE" });
      return;
    }
    // BL-A06: `homeCountry` must be one of the 5 real countries this app
    // supports -- same validation shape as PHONE_PATTERN above, a real 400
    // (not a silent 200) on garbage input. `homeRegion` is free text, same
    // as the Sell/Filter region combobox's own real values elsewhere.
    const rawHomeCountry = body.homeCountry;
    if (rawHomeCountry !== undefined && !VALID_HOME_COUNTRIES.includes(rawHomeCountry)) {
      res.status(400).json({ error: "That's not a real supported country.", code: "INVALID_HOME_COUNTRY" });
      return;
    }
    const phone = rawPhone === undefined ? req.currentUser.phone : String(rawPhone).trim();
    const homeCountry = rawHomeCountry === undefined ? req.currentUser.homeCountry : rawHomeCountry;
    const homeRegion = body.homeRegion === undefined ? req.currentUser.homeRegion : String(body.homeRegion).trim();
    db.prepare("UPDATE users SET phone = ?, home_country = ?, home_region = ? WHERE id = ?").run(
      phone || null,
      homeCountry || null,
      homeRegion || null,
      req.currentUser.id
    );
    res.json(rowToAuthUser(db.prepare("SELECT id, name, email, phone, home_country, home_region, is_admin FROM users WHERE id = ?").get(req.currentUser.id)));
  });

  // Deployment-readiness audit finding: the Data Subject Rights page
  // promised access/portability "by emailing support," with no actual
  // mechanism behind it anywhere in the code. This is a real, self-service
  // export of everything this account's own id/email touches -- no human
  // in the loop required, though the DSR page's emailed request path still
  // works too for anyone who prefers it.
  router.get("/me/export", requireSession, (req, res) => {
    const userId = req.currentUser.id;
    const profileRow = db.prepare("SELECT id, name, email, phone, home_country, home_region, created_at FROM users WHERE id = ?").get(userId);
    const listings = db.prepare("SELECT * FROM listings WHERE seller_id = ?").all(userId);
    const listingIds = listings.map((listing) => listing.id);
    const listingImages = listingIds.length
      ? db.prepare(`SELECT * FROM listing_images WHERE listing_id IN (${listingIds.map(() => "?").join(",")})`).all(...listingIds)
      : [];
    const conversationIds = db
      .prepare("SELECT conversation_id FROM conversation_participants WHERE user_id = ?")
      .all(userId)
      .map((row) => row.conversation_id);
    const conversations = conversationIds.length
      ? db.prepare(`SELECT * FROM conversations WHERE id IN (${conversationIds.map(() => "?").join(",")})`).all(...conversationIds)
      : [];
    // Every message IN a conversation this account is part of -- not just
    // ones they personally sent -- because a full "export everything I can
    // see" is what portability actually means for a two-party conversation;
    // messages FROM the other participant are still tagged with their own
    // sender_id, not attributed to this account.
    const messages = conversationIds.length
      ? db.prepare(`SELECT * FROM messages WHERE conversation_id IN (${conversationIds.map(() => "?").join(",")}) ORDER BY sent_at ASC`).all(...conversationIds)
      : [];
    const reviewsWritten = db.prepare("SELECT * FROM reviews WHERE reviewer_id = ?").all(userId);
    const reviewsReceived = db.prepare("SELECT * FROM reviews WHERE reviewee_id = ?").all(userId);
    const savedItems = db.prepare("SELECT * FROM saved_items WHERE user_id = ?").all(userId);
    const reportsFiled = db.prepare("SELECT * FROM reports WHERE reporter_id = ?").all(userId);
    const blocks = db.prepare("SELECT blocked_id, created_at FROM blocks WHERE blocker_id = ?").all(userId);

    res.setHeader("Content-Disposition", `attachment; filename="findnord-data-export-${userId}.json"`);
    res.json({
      exportedAt: new Date().toISOString(),
      profile: profileRow,
      listings: listings.map((listing) => ({ ...listing, images: listingImages.filter((image) => image.listing_id === listing.id) })),
      conversations,
      messages,
      reviewsWritten,
      reviewsReceived,
      savedItems,
      reportsFiled,
      blocks
    });
  });

  // Deployment-readiness audit finding: the Data Subject Rights page
  // promised erasure "by emailing support," with no actual mechanism behind
  // it anywhere in the code. Requires re-entering the real password (a
  // standard safety measure for an irreversible action, matching how a
  // password change already invalidates every session below) -- a Google-
  // only account (no password_hash) can't be asked for one, so it's exempt
  // from that specific check but still requires the real session.
  //
  // ANONYMIZES rather than deletes the users row: `listings`/`reviews`/
  // `sessions`/`conversation_participants`/etc. all have a real FK to
  // users(id) with PRAGMA foreign_keys=ON (see scripts/db.js) and no ON
  // DELETE CASCADE, so a hard DELETE would either throw a foreign key
  // violation (if any real row still references this user) or require
  // cascading deletes into every other user's shared conversations/reviews
  // -- content that isn't solely this account's to erase. Clearing the real
  // personal-data columns in place (name/email/phone/password_hash/
  // google_id/home location) while keeping the row/id achieves the same
  // real GDPR erasure of personal data without orphaning shared records.
  // Reviews already resolve a missing/anonymized reviewer name via a LEFT
  // JOIN fallback (see rowToReview) -- no separate fix needed there.
  router.delete("/me", requireSession, (req, res) => {
    const body = req.body || {};
    const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(req.currentUser.id);
    if (row && row.password_hash) {
      const password = typeof body.password === "string" ? body.password : "";
      if (!verifyPassword(password, row.password_hash)) {
        res.status(401).json({ error: "That password isn't correct.", code: "INVALID_PASSWORD" });
        return;
      }
    }

    const anonymizedEmail = `deleted-${req.currentUser.id}@deleted.findnord.invalid`;
    const deleteAccount = db.transaction(() => {
      db.prepare(
        "UPDATE users SET name = 'Deleted user', email = ?, phone = NULL, password_hash = NULL, google_id = NULL, home_country = NULL, home_region = NULL WHERE id = ?"
      ).run(anonymizedEmail, req.currentUser.id);
      // Listings' own `seller` display name is denormalized at publish time
      // (see scripts/api.js's POST /listings) -- update it too, or old
      // listings would keep showing the real name forever.
      db.prepare("UPDATE listings SET seller = 'Deleted user' WHERE seller_id = ?").run(req.currentUser.id);
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(req.currentUser.id);
      db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(req.currentUser.id);
      db.prepare("DELETE FROM saved_items WHERE user_id = ?").run(req.currentUser.id);
      db.prepare("DELETE FROM blocks WHERE blocker_id = ?").run(req.currentUser.id);
    });
    deleteAccount();

    res.setHeader("Set-Cookie", serializeExpiredSessionCookie());
    res.status(200).json({ success: true });
  });

  // The Google Client ID is a PUBLIC identifier (it is embedded directly in
  // every real Google Sign-In integration's frontend JS -- it is not a
  // secret), so serving it here is safe. `null` when unset tells the
  // frontend to render its "Google sign-in unavailable" fallback instead of
  // a broken button, rather than crashing.
  router.get("/google/config", (req, res) => {
    res.json({ clientId: googleClientId });
  });

  // NM-A15: Google Sign-In. `credential` is the ID token Google Identity
  // Services hands the frontend after a successful account picker flow --
  // verified here (signature, issuer, our own audience, expiry -- see
  // scripts/google-auth.js), then discarded; only the three claims below
  // are ever read out of it, and nothing about the raw token is stored.
  router.post("/google", async (req, res) => {
    const credential = req.body && typeof req.body.credential === "string" ? req.body.credential : "";
    let googleUser;
    try {
      googleUser = await verifyGoogle(credential, { clientId: googleClientId });
    } catch (error) {
      const code = error.code || "INVALID_GOOGLE_TOKEN";
      const status = code === "GOOGLE_NOT_CONFIGURED" ? 503 : code === "GOOGLE_EMAIL_NOT_VERIFIED" ? 403 : 401;
      res.status(status).json({ error: error.message, code });
      return;
    }

    let user = db.prepare("SELECT id, name, email FROM users WHERE google_id = ?").get(googleUser.googleId);
    if (!user) {
      // "Log in an existing user if the Google email is already registered"
      // (NM-A15 requirement 3): a real account that previously signed up
      // with email + password gets its google_id linked on, rather than a
      // second, duplicate account being created for the same person. Its
      // password (if any) is untouched -- either sign-in method keeps working.
      const existingByEmail = db.prepare("SELECT id, name, email FROM users WHERE email = ?").get(googleUser.email);
      if (existingByEmail) {
        db.prepare("UPDATE users SET google_id = ? WHERE id = ?").run(googleUser.googleId, existingByEmail.id);
        user = existingByEmail;
      } else {
        const id = makeId("user");
        db.prepare("INSERT INTO users (id, name, email, guest, password_hash, google_id, created_at) VALUES (?, ?, ?, 0, NULL, ?, ?)").run(
          id,
          googleUser.name,
          googleUser.email,
          googleUser.googleId,
          Date.now()
        );
        user = { id, name: googleUser.name, email: googleUser.email };
      }
    }

    syncAdminFlag(db, user.id, user.email);
    const token = createSession(db, user.id);
    res.setHeader("Set-Cookie", serializeSessionCookie(token));
    res.json(rowToAuthUser(db.prepare("SELECT id, name, email, phone, home_country, home_region, is_admin FROM users WHERE id = ?").get(user.id)));
  });

  return router;
}

module.exports = {
  SESSION_COOKIE_NAME,
  MIN_PASSWORD_LENGTH,
  RESET_TOKEN_DURATION_MS,
  hashPassword,
  verifyPassword,
  createSession,
  getUserBySessionToken,
  deleteSession,
  createPasswordResetToken,
  sendResetEmail,
  parseCookies,
  serializeSessionCookie,
  serializeExpiredSessionCookie,
  attachSession,
  requireSession,
  requireAdmin,
  createAuthRouter
};
