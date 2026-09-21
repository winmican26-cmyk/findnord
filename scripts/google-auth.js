// Real Google Sign-In (NM-A15), verified via Google Identity Services' ID
// token flow. No new npm dependency: verifying an RS256-signed JWT against
// Google's published JWKS is done entirely with Node's built-in `crypto`
// (crypto.createPublicKey accepts a JWK directly since Node 15.12, and
// crypto.verify handles RS256 signature checking) -- the same "avoid an
// unnecessary dependency" instinct that shaped NM-A14's scrypt-over-bcrypt
// and hand-rolled-cookie choices.
//
// Only GOOGLE_CLIENT_ID is required. GOOGLE_CLIENT_SECRET is deliberately
// NOT used anywhere in this app: verifying an ID token's signature,
// audience, issuer, and expiry needs only Google's public keys, never a
// secret. A client secret is only needed for the OAuth 2.0 *authorization
// code* exchange (trading a code for tokens server-to-server), which this
// app does not use -- Google Identity Services' ID-token flow is the
// officially supported, simpler alternative for exactly this "who is this
// user" use case, and is explicitly allowed by NM-A15's own requirements
// ("Google Identity Services or equivalent").

const crypto = require("node:crypto");

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour -- matches Google's own Cache-Control on this endpoint

let jwksCache = { keys: [], fetchedAt: 0 };

function base64UrlDecode(segment) {
  return Buffer.from(segment.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function googleAuthError(message, code) {
  return Object.assign(new Error(message), { code });
}

async function fetchGoogleJwks() {
  const now = Date.now();
  if (jwksCache.keys.length > 0 && now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) return jwksCache.keys;
  const response = await fetch(GOOGLE_JWKS_URL);
  if (!response.ok) throw googleAuthError(`Could not fetch Google's public keys (${response.status}).`, "GOOGLE_JWKS_UNAVAILABLE");
  const data = await response.json();
  jwksCache = { keys: data.keys || [], fetchedAt: now };
  return jwksCache.keys;
}

// Exposed purely for tests: this project has no real Google Cloud OAuth
// client configured in its dev/test environment (see EVIDENCE.md), so tests
// verify a hand-signed token against a locally-generated JWKS instead of
// Google's real one, injected via verifyGoogleIdToken's `fetchJwks` option.
// Clearing the module-level cache between test runs keeps them isolated.
function resetGoogleJwksCache() {
  jwksCache = { keys: [], fetchedAt: 0 };
}

// Verifies a Google ID token (the `credential` Google Identity Services
// hands back to the client) completely -- signature, issuer, audience
// (must be OUR client id, not just any valid Google token), and expiry --
// and returns only the three claims this app actually needs. The raw token
// itself is never returned, logged, or persisted (NM-A15 requirement 8).
async function verifyGoogleIdToken(idToken, { clientId, fetchJwks = fetchGoogleJwks } = {}) {
  if (!clientId) throw googleAuthError("Google sign-in is not configured on this server.", "GOOGLE_NOT_CONFIGURED");
  if (!idToken || typeof idToken !== "string" || idToken.split(".").length !== 3) {
    throw googleAuthError("Malformed Google credential.", "INVALID_GOOGLE_TOKEN");
  }

  const [headerB64, payloadB64, signatureB64] = idToken.split(".");
  let header;
  let payload;
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString("utf8"));
    payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));
  } catch (error) {
    throw googleAuthError("Malformed Google credential.", "INVALID_GOOGLE_TOKEN");
  }

  if (header.alg !== "RS256") throw googleAuthError("Unsupported Google credential signing algorithm.", "INVALID_GOOGLE_TOKEN");

  const keys = await fetchJwks();
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw googleAuthError("Could not find a matching Google signing key.", "INVALID_GOOGLE_TOKEN");

  let publicKey;
  try {
    publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  } catch (error) {
    throw googleAuthError("Invalid Google signing key.", "INVALID_GOOGLE_TOKEN");
  }

  const signatureValid = crypto.verify("RSA-SHA256", Buffer.from(`${headerB64}.${payloadB64}`), publicKey, base64UrlDecode(signatureB64));
  if (!signatureValid) throw googleAuthError("Google credential signature is invalid.", "INVALID_GOOGLE_TOKEN");

  if (!GOOGLE_ISSUERS.has(payload.iss)) throw googleAuthError("Unexpected Google token issuer.", "INVALID_GOOGLE_TOKEN");
  if (payload.aud !== clientId) throw googleAuthError("Google token was not issued for this app.", "INVALID_GOOGLE_TOKEN");
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
    throw googleAuthError("Google credential has expired.", "INVALID_GOOGLE_TOKEN");
  }
  if (!payload.email) throw googleAuthError("Google account has no email.", "INVALID_GOOGLE_TOKEN");
  if (payload.email_verified === false) throw googleAuthError("Google email is not verified.", "GOOGLE_EMAIL_NOT_VERIFIED");

  return {
    googleId: payload.sub,
    email: String(payload.email).toLowerCase(),
    name: payload.name || payload.email
  };
}

module.exports = { verifyGoogleIdToken, resetGoogleJwksCache, GOOGLE_JWKS_URL };
