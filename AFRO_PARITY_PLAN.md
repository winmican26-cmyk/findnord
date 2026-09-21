# FindNord → AfroMarketplaces Functional Parity Plan

Date: 2026-09-21
Goal: bring FindNord to a **100% functional relationship** with afromarketplaces.com — every capability it has, FindNord has an equivalent of — without copying its visual identity/branding (already an explicit, standing constraint from earlier slices).

This is a **one-time roadmap**, written once and executed slice by slice using the same VAD methodology as every prior slice (NM-A1 through NM-A13): each phase below becomes one or more real, tested, evidenced slices, proposed and accepted one at a time, in the order listed. This document is the plan; EVIDENCE.md remains the execution log.

## How this was built

Researched afromarketplaces.com directly (homepage, `/boost-ads`, `/register`, `/how-it-works`, `/safety`, footer link inventory) rather than working from memory, since prior slices only used it as a visual/UX reference, not a functional audit.

## AfroMarketplaces' real functional feature set (as observed)

| Area | What afro actually does |
| --- | --- |
| Auth | Real registration: name + email/Google, country selection, profile. Real login recognizes returning users. |
| Browse/Search | 50+ categories, country + region filtering, sort (newest/price asc/desc), search. |
| Listings | Title, description, price **in the buyer's currency**, condition, location, multiple photos. |
| Seller trust | Public seller profile showing **reviews** and an optional **verified (identity/business) badge** — "verified sellers get more views and faster sales." |
| Reviews | Buyers leave a review after a transaction; feeds seller reputation, shown on profile + listing. |
| Messaging | In-app buyer-seller messaging to ask questions/negotiate before committing. |
| Monetization | 9 real paid tiers (one-time "Top Ad" boosts, monthly "Boost Plan" subscriptions, "Premium Store" branded storefronts) via real payment processors (Flutterwave/Paystack: mobile money, cards, bank transfer). |
| Trust & Safety | Static safety-tips content, scam warnings, "Report via Contact Support" (their "Resolution Center" is, in practice, just a contact form — not a real dispute engine). |
| Content pages | About, How It Works, FAQ/Help Center, Safety Tips, Pricing Guide, Photo Guide, Safe Selling Guide. |
| Localization | Per-country domains/segmentation (50+ African markets) rather than an in-app language switcher. |

## What FindNord already has (no work needed)

- Real Express + SQLite backend with genuine persistence, real local file storage for photos (NM-A11, NM-A12).
- Browse/search/category filter/sort, save items, report listing (NM-A3, NM-A5).
- Real in-app buyer-seller messaging + Inbox (NM-A8).
- Seller listing management: Edit, Reserved/Sold/Active, Delete, all server-side ownership-checked (NM-A13).
- Basic seller analytics (listings, saves, conversations, messages, boosted count) (NM-A9).
- i18n (en/sv full, groundwork for more) and country theming — FindNord's equivalent of afro's per-country segmentation, via a different (arguably more flexible) mechanism.
- A country/region-style scope selector (Nearby / Country / All Nordics) — conceptually the same idea as afro's country+region filter.

## Decisions locked in for this plan

- **Payments (Boost/Premium tiers):** build the **real** integration (Stripe, test/sandbox mode — chosen over Flutterwave/Paystack since those are Africa-mobile-money-specific and FindNord is a Nordic-market app; Stripe's test mode gives the most realistic "real integration" without needing a live business account). The tiers themselves ship and are visible, but **paid boosting stays off by default** behind a `BOOST_PAYMENTS_ENABLED` flag — until that flag is flipped on, the existing free single-tier Boost keeps working exactly as it does today, and paid tiers show a "Coming soon" state. This lets the site run free for users now, with a real, tested path to flip on charging later without further engineering.
- **Auth methods:** both email+password (built first, no external dependency) and Google OAuth (built second, additive). Real password hashing, real sessions, real returning-user recognition — replacing every mocked-auth assumption from NM-A7–NM-A13.
- **Verification badge:** self-requested, admin-approved (a boolean flag) — not real identity/KYC document verification. Flagged explicitly as a scope boundary below.

## Explicit scope boundaries (things that stay out, and why)

- **Real identity/KYC verification** — afro's own "verified" badge almost certainly works this way too (self/admin-attested), and real document-verification integration is a compliance-heavy undertaking disproportionate to what "verified seller" needs to function. Self-declared + admin-approved achieves the same user-facing capability.
- **Real escrow ("Afro Trust")** — afro itself describes this as optional and "free during launch," i.e. not proven core functionality even on the reference site. Not built here; flagged as a legitimate future phase if afro's own escrow ships and matters.
- **Automated fraud/content-moderation detection** — afro's "Resolution Center" is, in practice, a contact form; FindNord will match that with a real admin review queue (Phase 5), not automated detection, since afro doesn't appear to have that either.
- **Infrastructure-scale parity** (multi-region, CDN, real production traffic) — this plan targets **feature** parity, not infrastructure parity. SQLite + local file storage stays; that's a separate, later conversation if FindNord ever needs to handle real production load.

---

## Phase 1 — Real Authentication (replaces all mocked auth)

The single biggest gap. Every other phase below assumes real accounts exist.

- **NM-A14: Email + password auth.** Real `password_hash` column (bcrypt), `POST /api/auth/register` (rejects duplicate emails), `POST /api/auth/login` (verifies password, recognizes returning users — the mocked-auth "every sign-in mints a new identity" quirk goes away here), `POST /api/auth/logout`, real server-side sessions (a `sessions` table + signed httpOnly cookie — no new framework, stays within the existing Express app). The auth modal and dedicated Login page get real password fields and real error states (wrong password, duplicate email, weak password).
  - **Design change to flag explicitly:** "Continue as Guest" (which today mints a real-but-fake mocked identity) is retired as a way to publish/save/message — those actions now require a genuinely registered account. Pure browsing stays fully open with no account at all, same as today.
  - Existing mocked-era user rows have no password and simply can't be logged into again post-migration — acceptable for a prototype; a fresh `data/findnord.db` is the clean path when this ships.
- **NM-A15: Google OAuth.** "Sign in with Google" alongside email/password, real OAuth 2.0 authorization-code flow, account linking by verified email. Requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (test-mode-equivalent: a real Google Cloud OAuth client you create) — gracefully degrades (button hidden, no error) if not configured, matching the existing `OPENAI_API_KEY` pattern.

## Phase 2 — Seller/Buyer Trust: Profiles, Verification, Reviews

- **NM-A16: Public seller profiles.** A real profile view (name, avatar/initial, join date, active listings, verified badge if approved). New public-safe `GET /api/users/:id/profile`.
- **NM-A17: Reviews & ratings.** A buyer who has messaged a seller about a listing can leave one 1–5 star rating + optional text per listing/seller pair. Average rating + count shown on the seller profile, the listing detail page, and as a small badge on listing cards. New `reviews` table with eligibility rules enforced server-side (can't review yourself, one per buyer per listing).
- Verification badge: a `verified` boolean on `users`, set via a "Request verification" action a seller can trigger and an admin approves (ties into Phase 5's admin view).

## Phase 3 — Monetization: Tiered Boost (real rails, gated off by default)

- **NM-A18: Boost/Premium tiers.** Multiple tiers modeled (duration + prominence + price, mirroring afro's one-time "Top Ad" and monthly "Boost Plan" shape) plus a "Premium Store" branded-storefront tier. Real Stripe test-mode Checkout integration server-side, behind `BOOST_PAYMENTS_ENABLED` (default off — see "Decisions locked in" above). Requires `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (test keys) from you when this slice starts.

## Phase 4 — Multi-Currency & Location Depth

- **NM-A19:** Per-listing currency field (structurally real, defaulting to today's kr display so nothing regresses), and sharpen the existing Nearby/Country/All Nordics scope into a real country+region model matching afro's granularity — extending, not replacing, NM-A3's scope selector.

## Phase 5 — Trust & Safety Completeness, Static Content, Admin

- **NM-A20: Static content pages.** Real routes for About, How It Works, FAQ/Help Center, Safety Tips, Pricing Guide, Photo Guide, Safe Selling Guide — i18n-ready, linked from the footer/You tab.
- **NM-A21: Minimal admin/moderation.** An `isAdmin` flag, a moderation queue over the existing `reports` table (resolve/dismiss), the verification-approval action from Phase 2, and a real block-user capability (a `blocked_users` table that prevents messaging).

## Phase 6 — Close the loop

- **NM-A22:** Listing view counters, a "recently viewed" section, and a final side-by-side re-audit against afromarketplaces.com to catch anything this plan missed, with an updated scorecard.

---

## Sequencing rationale

Auth first (Phase 1) because Phases 2–5 all assume real, persistent identities. Trust/profiles (Phase 2) before monetization (Phase 3) because "verified sellers get more views" only means something once profiles exist. Currency/location (Phase 4) and content/admin (Phase 5) are independent of each other and could reorder if priorities shift. Phase 6 is deliberately last — it's the honesty check.

## What "done" looks like

After Phase 5, every capability in the "AfroMarketplaces' real functional feature set" table above has a working FindNord equivalent, each with the same VAD evidence trail (deterministic tests + real Playwright verification + EVIDENCE.md entry) every prior slice has had. Phase 3's payment rails are real but switched off until you're ready to charge — flipping them on is a config change, not new engineering.
