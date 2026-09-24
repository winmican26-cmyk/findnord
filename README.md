# FindNord

A Nordic marketplace prototype (Node/Express + better-sqlite3 backend, a vanilla-JS/no-build-step frontend). Real auth, real SQLite persistence, real file uploads, 6-language localization (English, Swedish, Norwegian Bokmål, Danish, Finnish, Icelandic).

This is a focused environment-and-run reference, not full product documentation — see `DEPLOYMENT_READINESS_PLAN.md` for the current state of production readiness, and `db/schema.sql` / `scripts/*.js` for the real source of truth on behavior.

## Running locally

```
npm install
npm start        # or: npm run serve
```

Serves on `http://127.0.0.1:4173` by default. The SQLite database is created automatically on first run at `data/findnord.db`, seeded with demo listings from `db/seed-data.js`.

## Running the test suite

```
npm test
```

Runs `tests/e2e.js` — a ~5,100-line suite with 1,478+ real assertions against a real Express + SQLite server (started and stopped automatically; no separate setup needed).

## Environment variables

See `.env.example` for the full list with explanations. Nothing is required for local dev — every variable has a safe fallback or a clear runtime error if left unset. For a real production deploy, see `DEPLOYMENT_READINESS_PLAN.md`, particularly:
- `NODE_ENV=production` (enables the session cookie's `Secure` flag and disables demo-data seeding)
- `DB_PATH` (point this at a real persistent volume — the default local path does not survive a redeploy on most PaaS hosting)
- `ADMIN_EMAIL`, `GOOGLE_CLIENT_ID`, `OPENAI_API_KEY`, `BOOST_PAYMENTS_ENABLED` + `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` as needed for those optional features

## Deployment readiness

This app has not yet been deployed to production. `DEPLOYMENT_READINESS_PLAN.md` is a full audit (security, infrastructure, data layer, legal/compliance, third-party integrations, testing/CI, performance) with a phased implementation plan. Phase 0 (self-contained code hardening — XSS fixes, authorization fixes, transactions, compression, security headers, etc.) is complete; later phases need real hosting/vendor/legal decisions.
