# FindNord Deployment Readiness Plan

Date: 2026-09-24

## How this document was built

Every finding below was produced by a **processor** subagent that investigated one area of the codebase and cited exact `file:line` evidence, then independently re-verified by a separate **judge** subagent (read-only, no access to the processor's reasoning process, instructed to try to break the claim rather than confirm it) before being accepted into this plan. All 8 areas — security, infrastructure, data layer, legal/compliance, third-party integrations, testing/CI, known feature gaps, performance — returned a **PASS** verdict, with only minor corrections (a couple of off-by-a-few line numbers, an undercount of migration functions, a "repeated verbatim" claim that should have said "repeated in translation"). None of those corrections changed the substance of any finding. Nothing here is copied from EVIDENCE.md's own claims without independent verification — several of this project's own planning docs turned out to be stale (see §6).

This is a plan, not yet an implementation. Nothing described here has been changed in the codebase as part of producing this document.

---

## 1. Executive summary

FindNord is further along than a typical prototype: real auth, real SQLite persistence surviving restarts, a 5,148-line/1,478-assertion test suite that passes cleanly, real (if unexercised) Stripe rails, real Google OAuth, and now full 6-language localization including static legal pages. The gaps that remain are concentrated, well-understood, and mostly small, mechanical fixes — not a rewrite.

**Two findings are genuine launch-blockers on their own:**
1. **Stored XSS** in listing titles, chat messages, review text, and profile names — reproducible, unauthenticated, self-propagating. (§2.1)
2. **The live Privacy Policy and Cookie Policy actively lie** — both explicitly claim "no third-party ad-tracking of any kind," while a real Twitter/X conversion-tracking pixel fires unconditionally on every page load, and the "consent" banner has no reject path and blocks nothing. (§2.3)

Everything else is real, valuable hardening work but not something that should hold the whole launch hostage — see the phased plan in §3 for what's actually blocking vs. what can follow immediately after.

---

## 2. Launch-blocking findings (fix before any real users touch this)

### 2.1 Stored XSS — CRITICAL
**Where:** unescaped user content interpolated into `.innerHTML`-bound template literals throughout `app.js` — listing title (`app.js:4285` browse grid, `:3309` inbox row, `:3728` thread header, `:4713` listing detail), chat message text (`app.js:3707`), review text and reviewer name (`app.js:4824-4825`), profile name (`app.js:4867`). Server-side, `POST /listings` (`scripts/api.js:543-568`) and `POST /conversations/:id/messages` (`api.js:968`) store these fields verbatim; `scripts/review-moderation.js`'s `cleanReviewText` only masks a profanity word list and has no concept of HTML.

**Confirmed attack path:** a seller publishes a listing titled `<img src=x onerror=alert(1)>` → stored raw → every visitor who browses listings (no auth required) has it parsed as a real `<img>` tag → `onerror` fires → arbitrary JS executes in their session.

**Fix:** add one `escapeHtml(value)` helper (standard `&<>"'` entity-escaping) and wrap every user-supplied string at every `.innerHTML` sink listed above. This is a single, mechanical, low-risk change — no architecture change needed. Add a regression test that publishes a listing with `<script>`/`<img onerror>` in the title and asserts the rendered HTML contains the escaped entities, not a live tag.

**Effort: S (small).**

### 2.2 Conversation authorization (IDOR) — HIGH
**Where:** `scripts/api.js:893-987`.
- `GET /conversations/:id/messages` (`:981-984`) — no `requireSession`, no participant check at all. Anyone who knows/guesses a conversation id can read the full thread.
- `POST /conversations/:id/messages` (`:952-979`) — requires a session, but never checks the caller is actually a participant of that conversation.
- `GET /conversations` (`:936-945`) — no session check, trusts a client-supplied `?userId=` query param to decide whose conversations to return.
- `GET /conversations/all` (`:947-950`) — no auth check whatsoever, dumps every conversation in the system.

**Fix:** add `requireSession` to all four routes; on the two `:id` routes, add a real `SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?` check and 403 if the caller isn't a member; replace `GET /conversations`'s `req.query.userId` with `req.currentUser.id`.

**Effort: S.**

### 2.3 Privacy Policy / Cookie Policy actively contradicted by a live tracking pixel — CRITICAL
**Where:** `index.html:38-45` embeds a real, unconditional X (Twitter) conversion-tracking script (`static.ads-twitter.com/uwt.js`, `twq('config','rfixf')`) in `<head>`, firing on first paint before any user interaction — the source's own comment labels it "X conversion tracking base code." Meanwhile `app.js:6037`, `:6098`, and `:6420` (+ its sv/no/da/fi/is equivalents) explicitly state "we don't run third-party ad-tracking of any kind" / "we do not share it with third parties for advertising" / "no third-party ad-tracking or analytics cookie of any kind." These are direct, verified contradictions in a live legal document — real exposure under GDPR Art. 5(1)(a) and general misleading-representation rules, independent of anything else in this plan.

Compounding this: the cookie banner (`app.js:6579-6599`, buttons in `index.html:490-494`) only has "Accept" and "Cookie Settings" — the "Settings" button (`handleCookieSettingsClick`) just opens the read-only Cookie Policy page and **immediately grants the same consent as Accept**. There is no reject path, and nothing about the banner blocks or defers the Twitter pixel — it's a notice, not a consent gate.

**Fix — pick one before launch:**
- **(Recommended for a fast, clean launch)** Remove the Twitter pixel entirely. It's the only external tracking dependency in the app (confirmed — no Google Analytics, no Meta pixel, nothing else), and removing it makes the existing policy text true again with zero further consent-flow engineering.
- **(If marketing needs it)** Rebuild the cookie banner as real prior-blocking consent (don't inject the pixel script until `fn_cookie_consent === "accepted"`), add a genuine "Decline" button that does not consent, and rewrite the Privacy/Cookie Policy text in all 6 languages to honestly disclose the pixel. This is materially more work and should go through human legal review either way (see §2.5 and §5).

**Effort: S if removing; M if keeping + real consent gate.**

### 2.4 `/api/conversations/start-or-get` crashes with a leaked stack trace on a null participant — MEDIUM (confirmed live, reproducible)
**Where:** `scripts/api.js:896-934`. Seed listings have `sellerId: null` (`scripts/db.js:53`; `db/schema.sql:76` allows it). The route does zero validation on `participantIds` before inserting into `conversation_participants.user_id` (`NOT NULL`, `db/schema.sql:151-152`). A direct `POST` with a null participant produces a real `HTTP 500`, `Content-Type: text/html`, with a raw `SqliteError` stack trace including local file paths — because no custom Express error-handling middleware exists anywhere in the app and `NODE_ENV` is never set (see §2.6). Reproduced live twice (once by the audit judge, once during the investigation) with the exact same stack trace.

Note: the one live UI call site (`sendComposedMessage`, `app.js:3572`) already guards this exact case client-side, so it's not reachable through normal browsing today — but it's trivially reachable via any direct API call, and it reveals that seed listings' "seller" is never a real conversation participant.

**Fix:** validate `participantIds` are all non-null, non-empty strings before insert; return a clean `400` on failure. Small, contained fix, same shape as other input validation already in the codebase.

**Effort: S.**

### 2.5 Legal/compliance gaps beyond the two CRITICAL items — HIGH, bundle with legal review
- **No age verification anywhere** (`scripts/auth.js:285-317`'s `/register` only checks name/email/password), while the ToS says "you must be old enough to form a binding contract" — an enforcement claim with nothing behind it. Add a minimum-age checkbox/date-of-birth field at registration.
- **DSR page promises erasure/access/portability "by emailing support"** (`app.js:6216,6224`), but **no account-deletion or data-export endpoint exists anywhere** in `scripts/api.js`/`scripts/auth.js`. Build minimal real endpoints: self-service (or admin-assisted) account deletion, and a JSON data-export of a user's own listings/messages/reviews/saved-items. This also needs a real, monitored `support@findnord.com` inbox to exist — today there's no evidence any real email infrastructure exists at all (see §2.5 email gap below), which undermines the DSR page's 30-day SLA promise.
- **ToS claims prohibited items are "never allowed"** (`app.js:6314`), but moderation is 100% reactive (user report → admin hide, `api.js:777-859`) with zero proactive screening at listing-creation time. Either add a lightweight keyword-blocklist check on `POST /listings` (cheap, meaningfully reduces exposure) or soften the ToS wording to match reality — don't ship the overclaim as-is.
- **No governing-law/jurisdiction clause** in the ToS (checked all 6 languages) — real gap for a marketplace spanning 5 legal systems (Norway and Iceland are EEA, not EU — worth getting a lawyer's read on this specifically).
- **No company legal-entity disclosure** — "Micany Investment" is named throughout as the operator, but no registration number, VAT id, or registered address appears anywhere. Several EU/EEA member states require this (E-Commerce Directive Art. 5-style disclosure). This needs real company information from you, not code.

**Effort: age-gate + DSR endpoints = M; ToS/policy rewrites = human legal work, not engineering effort.**

### 2.6 Production error handling — HIGH
No custom Express error-handling middleware exists anywhere, and `NODE_ENV` is never set anywhere in the repo. Express's default error handler only hides stack traces when `NODE_ENV=production` — so any uncaught exception in production today (not just §2.4's specific case) returns a raw stack trace with local file paths to the client.

**Fix:** add a generic `(err, req, res, next)` error handler as the last middleware in `scripts/server.js` that logs the real error server-side and returns a clean generic JSON error to the client; set `NODE_ENV=production` in the actual deploy environment/start command.

**Effort: S.**

---

## 3. Phased plan

### Phase 0 — Pure-code fixes, no external dependencies (do first, ships as one focused PR)
All of these are self-contained code changes verifiable by the existing test suite plus a few new assertions. No hosting/vendor decisions needed.

| # | Item | Evidence | Effort |
|---|---|---|---|
| 1 | Escape all user content at `.innerHTML` sinks (§2.1) | app.js multiple sinks | S |
| 2 | Fix conversation IDOR — 4 routes (§2.2) | api.js:893-987 | S |
| 3 | Validate `participantIds`, return 400 not 500 (§2.4) | api.js:896-934 | S |
| 4 | Add generic Express error handler + set `NODE_ENV=production` in start command (§2.6) | server.js | S |
| 5 | Add `Secure` flag to session cookie (conditional on HTTPS in prod) | auth.js:238-245 | S |
| 6 | Add basic security headers (CSP, X-Content-Type-Options, Referrer-Policy at minimum) | server.js | S |
| 7 | Add `compression` middleware — real, high-impact, zero-risk (~350KB → ~90-120KB per load) | server.js, package.json | S |
| 8 | Add graceful `SIGTERM`/`SIGINT` shutdown (close server + DB handle cleanly) | server.js | S |
| 9 | Add `"start": "node scripts/server.js"` + `engines.node` to package.json | package.json | S |
| 10 | `app.set("trust proxy", 1)` — needed the moment this sits behind any reverse proxy, fixes IP-keyed rate limiting and `req.protocol` | server.js | S |
| 11 | Wrap `POST/PATCH/DELETE /listings` multi-statement writes in `db.transaction(...)` | api.js:561-604, 633-650, 672-691 | S |
| 12 | Add index on `listings(seller_id)` | schema.sql + a new migration | S |
| 13 | Cap images server-side at 6 on the **create** path too (edit path already does this) | api.js:546,555-558 | S |
| 14 | Add a rate limiter to `POST /api/generate-image` (real financial exposure otherwise — any signed-in account can run unlimited OpenAI calls) | server.js, rate-limit.js | S |
| 15 | Gate `seedIfEmpty()` behind an explicit opt-in (e.g. only seed when `SEED_DEMO_DATA=true`), so a fresh production DB doesn't silently fill with fake listings on first boot | db.js:19-65,319 | S |
| 16 | Write `.env.example` + a short README section listing every `process.env.X` this app reads, required vs. optional | new file | S |

**Total: ~16 small, independent, low-risk changes.** Recommend doing these as one PR (or a few grouped ones) gated by the existing `node tests/e2e.js` plus new regression tests for items 1-3, run against the same processor→judge discipline used to build this plan.

### Phase 1 — Legal/compliance close-out (needs your input, partly code)
1. Decide: remove the Twitter pixel, or build a real consent-gated version (§2.3) — **recommend removing for launch**.
2. Add age-verification field + check at registration (§2.5).
3. Build minimal DSR endpoints: account deletion, data export (§2.5).
4. Add a lightweight prohibited-item keyword check at listing creation, or soften the ToS's "never allowed" claim to match reactive-only enforcement (§2.5).
5. **Human-only, schedule now so it's not the last blocker**: get the 6-language Privacy Policy / Terms of Service / Cookie Policy / Data Subject Rights text in front of an actual lawyer — jurisdiction/governing-law clause, company registration/VAT/address disclosure, and a real review of every claim above against whatever you actually end up shipping. This is **BL-A03** from BRAND_LOCALIZATION_PLAN.md, still genuinely not started (confirmed: `EVIDENCE.md:3349` itself discloses the translations were AI-written and never reviewed by a native speaker).

### Phase 2 — Infrastructure & operational readiness (needs hosting/vendor decisions)
1. **Pick a host with a real persistent volume** (or move the DB off local disk entirely). Confirmed: `data/findnord.db` and `uploads/` are both plain local-disk paths (`scripts/db.js:12`, `scripts/image-storage.js:24`) with **zero volume-mount config** — on most ephemeral-filesystem PaaS (Heroku dynos, Railway/Render without an explicit disk add-on), **both the database and every uploaded photo get wiped on every redeploy**. This is the single most consequential infra finding — decide this before anything else in this phase.
2. Set up a real backup mechanism — confirmed **zero** backup/DR story exists today (no cron, no litestream, no integrity check anywhere). Cheapest real option: litestream continuous replication to S3-compatible storage, or a nightly `PRAGMA integrity_check` + `VACUUM INTO` + upload.
3. Wire in real transactional email (SendGrid/Postmark/SES/nodemailer+SMTP) and replace `sendResetEmail`'s `console.log` (`scripts/auth.js:157-158`) — confirmed this is the single most user-visible gap in the whole audit: **a real user requesting a password reset in production gets nothing today**.
4. TLS via the host's edge/reverse proxy — the app itself has zero HTTPS handling (confirmed), this is expected and fine as long as something in front terminates TLS.
5. Basic operational monitoring — confirmed **zero** error tracking or uptime monitoring exists anywhere. Free-tier Sentry (or similar) + an uptime pinger (UptimeRobot/Better Uptime) is a half-day of setup that closes a real blind spot, and is also a prerequisite for meeting GDPR's 72-hour breach-notification expectation in any meaningful way.
6. Stand up CI: one GitHub Actions workflow running `node tests/e2e.js` on every push/PR, blocking merge on failure. Confirmed **zero** CI exists today — nothing stops a regression from being pushed straight to `main`.
7. Before flipping `BOOST_PAYMENTS_ENABLED=true` for real, run one real end-to-end test against Stripe's own test mode (checkout → webhook → boost applied) — confirmed the Stripe integration code is real and well-structured but has **never been exercised against a live Stripe account** in this environment.

### Phase 3 — Scale-readiness (defer until you have real growth signals — not needed for initial launch)
Confirmed proportionate, not urgent, by the performance audit:
1. Server-side pagination + filtering for `GET /api/listings` (today: fetches the entire table, filters client-side, no `LIMIT`) and fix the N+1 pattern in `rowToListing` (1+2N queries per listings-page load). Fine through the low hundreds of listings; worth fixing before a few thousand.
2. If horizontal scaling (multiple server instances) is ever needed: this is a real architectural rewrite, not a config change — SQLite + local-disk uploads + the in-memory rate limiter (`scripts/rate-limit.js:21`, a plain `Map`) are all fundamentally single-instance today. Would need Postgres + S3-compatible object storage + a shared rate-limit store (Redis) first.
3. Debounce the search-input listener (`app.js:5412`) — currently re-filters the entire in-memory listings array on every keystroke with no debounce; fine at current scale, cheap to fix, worth doing alongside item 1.
4. Hash session ids and password-reset tokens at rest (currently stored as plaintext random hex — the same "the token is the secret" shape as an API key; defensible for a small app but best practice is to hash-and-compare like passwords already do). Ties to §Phase 2 item 2 — matters more once a real backup exists that could itself leak.

### Phase 4 — Brand/product backlog (not launch-blocking, tracked separately)
- **BL-A08** (final logo/favicon) — confirmed still a placeholder inline SVG (`index.html:32-36`), needs delivered vector assets from a designer.
- **BL-A09** (button-role audit) — confirmed **partially** done already (contrary to BRAND_LOCALIZATION_PLAN.md's framing that it's fully blocked on screenshot QA — real work already exists in `styles.css` tagged "BL-A09"). Worth a final pass once BL-A08 assets land, since button styling and final brand assets are naturally reviewed together.
- Product Work Still Needed (from BRAND_LOCALIZATION_PLAN.md, confirmed 0% built where marked, no bounded success criteria defined yet — needs product scoping before engineering, not part of "deployment readiness" proper):
  - Saved searches and alerts (confirmed 0% — only aspirational UI copy exists, no backend)
  - Analytics event pipeline per the PRD (confirmed 0% — the existing seller "Analytics" tab is a self-stats dashboard, not the PRD's event taxonomy)
  - Country-by-country launch configuration (confirmed 0% — only global flags exist today)
  - Filter/sort progressive disclosure, stronger listing-creation UX (both confirmed partial — base features are real, the specific polish isn't)
- From AFRO_PARITY_PLAN.md, still not started: the verification-badge admin-approval flow (its #4-ranked gap; the admin queue from NM-A21 is the natural home for this but it was never wired up), and "recently viewed"/view counters (#6-ranked gap). Real KYC/identity verification, real escrow, and automated fraud detection are all **deliberately out of scope** per that document, not gaps.

---

## 4. What's already solid (don't re-litigate these)

Worth stating plainly so effort isn't wasted re-verifying what's already confirmed good:
- **SQL injection**: every query across the codebase uses parameterized `.prepare()` calls — zero string-concatenated SQL found anywhere.
- **Password hashing**: scrypt, per-password random salt, timing-safe comparison — correctly implemented, OWASP-acceptable.
- **Password reset flow**: always a generic response (no account-enumeration), single-use expiring tokens, full session invalidation on reset.
- **Listing/boost ownership checks**: server-side seller-id verification on every mutation; client-supplied ids are explicitly discarded, never trusted.
- **Admin surface**: `is_admin` is only ever set server-side at sign-in against a designated env var, re-checked on every admin route; no self-promotion path exists.
- **Google Sign-In**: real JWKS fetch, real RS256 signature verification, issuer/audience/expiry/email_verified all checked — not a stub.
- **DB migrations**: all 13 `migrate*` functions are genuinely idempotent (checked via `PRAGMA table_info` before every `ALTER TABLE`), real foreign keys are enforced (`PRAGMA foreign_keys = ON`), fresh-DB schema and long-lived-migrated-DB schema are confirmed to converge on the same columns.
- **Test suite**: 1,478 real assertions, passes cleanly (verified by direct re-execution, not assumed), covers ~85 distinct feature slices against a real Express+SQLite server.
- **Dependency posture**: exactly two runtime dependencies (`better-sqlite3`, `express`), both current-generation majors, no bloat.
- **better-sqlite3 hosting compatibility**: ships prebuilt bindings for standard Linux hosting — no native rebuild step needed on a typical PaaS deploy.

---

## 5. Open questions that need your decision, not more investigation

1. **Twitter pixel**: remove it, or invest in a real consent-gated version? (Recommend: remove — see §2.3.)
2. **Hosting target**: which platform, and does it offer a real persistent volume, or should the DB move to a managed Postgres from day one to sidestep the problem entirely?
3. **Company legal details**: what's the real registration number/VAT id/registered address to disclose for Micany Investment, and in which country is it actually registered? Needed before the legal-copy rewrite in Phase 1 can be finished.
4. **Who does the native-language legal review (BL-A03)**? This needs a real bilingual/legal reviewer per language (sv/no/da/fi/is), not another AI pass — flag this as a genuine external dependency with its own lead time.
5. **Prohibited-items enforcement**: invest in proactive keyword screening now, or launch with honestly-reworded (reactive-only) ToS language and revisit later?

---

## 6. Note on this project's own planning documents

BRAND_LOCALIZATION_PLAN.md (dated 2026-09-22) is **stale as of this audit** — it lists BL-A02, BL-A04, BL-A05, BL-A06, and BL-A07 as remaining work, but all five are confirmed **done** in the current codebase (verified independently, not just via code comments — e.g. BL-A07's screenshot evidence directory contains 32 real, non-trivial-sized PNG files dated the day after that plan was written). Only BL-A08 (final logo) is confirmed still genuinely open as that document claims, and BL-A09 (button audit) is confirmed partially done rather than fully blocked. Worth updating that document to reflect current reality, or superseding it with this one, so a future session doesn't redo already-finished work.
