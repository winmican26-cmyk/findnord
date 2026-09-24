// NM-A23: a small, dependency-light in-memory rate limiter -- built for
// password-reset (the most abuse-prone endpoint in this slice's own
// acceptance bar) but deliberately shaped as a REUSABLE middleware FACTORY,
// not something hardcoded to just those routes: a future slice is expected
// to extend real rate limiting to listing creation, messaging, and
// reporting, and should be able to `require("./rate-limit")` and call
// `rateLimiter({...})` again rather than re-inventing this. No Redis, no new
// npm dependency -- the same "hand-roll it if it's small" instinct that
// already made this app hand-roll cookie parsing and JWT/JWKS verification
// (see scripts/auth.js, scripts/google-auth.js) rather than adding a
// package for either.
//
// Design: a real sliding-window request log per key (an array of request
// timestamps within the current window), not a coarser fixed-window
// counter -- a fixed window lets a client burst up to 2x `max` right across
// a window boundary; a sliding log doesn't.

// Module-level, process-wide state: every `rateLimiter(...)` call shares
// this one Map, each instance's entries namespaced by its own `scope` (see
// below) so unrelated routes/limiters never collide on the same key.
const hits = new Map(); // "<scope>:<key>" -> array of request timestamps (ms)

let sweeperStarted = false;
let instanceCounter = 0;

// Opportunistic background cleanup so a long-running server process doesn't
// grow `hits` forever -- deletes any key with no timestamps left inside the
// window. Runs on a real timer, `unref()`'d so it never by itself keeps the
// Node process alive (this project's test suite starts and stops many real
// server instances per run and must still exit cleanly when done).
function startSweeper() {
  if (sweeperStarted) return;
  sweeperStarted = true;
  const timer = setInterval(
    () => {
      const now = Date.now();
      for (const [key, timestamps] of hits) {
        // Each key can have its own effective window (different limiters
        // share this Map), so sweeping just drops anything older than a
        // generous 24h ceiling -- real per-request pruning inside
        // rateLimiter() below is what actually enforces each limiter's own
        // window; this is only a memory-growth safety net.
        const fresh = timestamps.filter((t) => now - t < 24 * 60 * 60 * 1000);
        if (fresh.length === 0) hits.delete(key);
        else hits.set(key, fresh);
      }
    },
    10 * 60 * 1000
  );
  if (typeof timer.unref === "function") timer.unref();
}

/**
 * rateLimiter(options) -- returns a real Express middleware that enforces a
 * sliding-window request cap per key.
 *
 *   windowMs  sliding window size in ms (default: 1 hour)
 *   max       max requests allowed per key inside that window (default: 8)
 *   keyFn(req)  returns the string to rate-limit on (default: req.ip) --
 *               callers pass e.g. an IP+email combiner for a real
 *               per-IP+email limit on an auth endpoint
 *   scope     namespaces this limiter's keys from every other limiter
 *             sharing the module-level Map (default: an auto-incrementing
 *             internal id, so two limiters never collide even if their
 *             keyFns happen to produce the same string) -- pass an explicit
 *             scope when two routes should deliberately share one bucket
 *   message   the 429 response's `error` text
 *   code      the 429 response's `code` field (default: "RATE_LIMITED")
 */
function rateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 60 * 1000;
  const max = options.max || 8;
  const keyFn = options.keyFn || ((req) => req.ip || "unknown");
  const scope = options.scope || `rl${instanceCounter++}`;
  const message = options.message || "Too many requests. Please try again later.";
  const code = options.code || "RATE_LIMITED";

  startSweeper();

  return (req, res, next) => {
    const key = `${scope}:${keyFn(req) || "unknown"}`;
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = (hits.get(key) || []).filter((timestamp) => timestamp > cutoff);

    if (timestamps.length >= max) {
      const retryAfterMs = timestamps[0] + windowMs - now;
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil(retryAfterMs / 1000))));
      // NM-A24: a plain, greppable server-side log line on every real trip --
      // not a dashboard (explicitly out of scope), just enough for an admin
      // to later correlate abuse patterns with `grep "[RateLimit]"` over the
      // server's own stdout. Logs the real key (which already carries the
      // account id or IP the limiter is keyed on -- see keyFn above), the
      // route, and the exact count/limit that tripped it. Fires here, in the
      // shared factory, so it automatically covers every limiter built on
      // this module -- the 4 pre-existing auth routes (NM-A23) as well as
      // the listings/messages/reports routes NM-A24 adds -- with no
      // per-call-site duplication.
      console.warn(
        `[RateLimit] blocked scope=${scope} key=${keyFn(req) || "unknown"} route=${req.method} ${req.originalUrl || req.path} count=${timestamps.length} max=${max}`
      );
      res.status(429).json({ error: message, code });
      return;
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}

// Test-only escape hatch: clears every limiter's state. The deterministic
// suite runs ONE real server for its entire run (not one per test), so
// without this, an earlier functional test that happens to share a
// limiter's key (e.g. reset-password's real per-IP scope, since every
// request in the suite comes from the same loopback IP) could eat into the
// budget a later, deliberate "fire N+1 requests, assert a real 429" test
// depends on. Never imported or called from any real request path.
function resetRateLimiterState() {
  hits.clear();
}

module.exports = { rateLimiter, resetRateLimiterState };
