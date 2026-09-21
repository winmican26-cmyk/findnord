// Real email + password authentication (NM-A14), replacing every mocked-auth
// assumption from NM-A7 through NM-A13. No new npm dependency: password
// hashing uses Node's built-in `crypto.scrypt` (an OWASP-endorsed equivalent
// to bcrypt, and literally what Node's own docs use as the canonical
// password-hashing example) instead of adding a native bcrypt binding: the
// same "avoid an unnecessary native dependency" instinct that shaped the
// better-sqlite3 choice in NM-A11. Cookies are hand-rolled for the same
// reason -- Express doesn't parse them by default, and a real cookie is
// ~15 lines, not worth a dependency.

const crypto = require("node:crypto");
const express = require("express");
const { makeId } = require("./db");
const { verifyGoogleIdToken } = require("./google-auth");

const SESSION_COOKIE_NAME = "fn_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days -- "stay logged in across restarts"
const MIN_PASSWORD_LENGTH = 8;

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

// --- Sessions: a real DB row, not a client-trusted token -- this is what
// makes "stay logged in across a server restart" true: the row survives in
// SQLite, and the cookie survives in the browser, independently of either
// process staying alive. ---

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  db.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(token, userId, now, now + SESSION_DURATION_MS);
  return token;
}

function getUserBySessionToken(db, token) {
  if (!token) return null;
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(token);
  if (!session || session.expires_at < Date.now()) return null;
  const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(session.user_id);
  return user || null;
}

function deleteSession(db, token) {
  if (token) db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
}

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

function serializeSessionCookie(token) {
  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function serializeExpiredSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
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

  router.post("/register", (req, res) => {
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
    const token = createSession(db, id);
    res.setHeader("Set-Cookie", serializeSessionCookie(token));
    res.status(201).json({ id, name, email });
  });

  router.post("/login", (req, res) => {
    const body = req.body || {};
    const email = String(body.email || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    const user = email ? db.prepare("SELECT * FROM users WHERE email = ?").get(email) : null;
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: "Incorrect email or password.", code: "INVALID_CREDENTIALS" });
      return;
    }

    const token = createSession(db, user.id);
    res.setHeader("Set-Cookie", serializeSessionCookie(token));
    res.json({ id: user.id, name: user.name, email: user.email });
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

    const token = createSession(db, user.id);
    res.setHeader("Set-Cookie", serializeSessionCookie(token));
    res.json({ id: user.id, name: user.name, email: user.email });
  });

  return router;
}

module.exports = {
  SESSION_COOKIE_NAME,
  MIN_PASSWORD_LENGTH,
  hashPassword,
  verifyPassword,
  createSession,
  getUserBySessionToken,
  deleteSession,
  parseCookies,
  serializeSessionCookie,
  serializeExpiredSessionCookie,
  attachSession,
  requireSession,
  createAuthRouter
};
