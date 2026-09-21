# NordicMarket PRD Coverage Audit

Date: 2026-09-20
Audited workspace: `C:\Users\mican\Documents\Findnord`
Current artifact: static NordicMarket prototype served locally

## Executive Scorecard

| Area | Current coverage | Audit read |
| --- | ---: | --- |
| Overall PRD / MVP | 11% | Strong first browse/detail prototype, but most MVP systems are not built. |
| UI Surface | 28% | Core marketplace shell, browse grid, detail page, and sell preview exist. |
| UX / User Journeys | 20% | Guest browse and listing detail are clickable; messaging, auth, publishing, and deal completion are not real. |
| Engineering | 8% | Static frontend, local server, deterministic tests. No backend, data model, auth, storage, messaging, media, moderation, or analytics pipeline. |
| Product Promises | 18% | Browse-first, local-visible, photo-led, one-action contact are represented. Trust, privacy, localization, and safety are mostly copy-level. |
| Trust & Safety | 7% | Safety reminder and seller trust summary exist. Reporting, blocking, moderation, audit trails, detection, appeals, and policies are not implemented. |
| Monetization | 4% | Sponsored labeling exists. Boost products, launch seal logic, payments, caps, refunds, and performance reporting do not. |
| Localization / Nordic Readiness | 9% | Nordic scope controls, SEK sample prices, and de-accented search exist. No real language/currency/market configuration. |
| Analytics / Measurement | 3% | X tracking snippet is installed and tested for presence. Required product events are not instrumented. |
| Accessibility | 18% | Semantic labels and focus styles exist. No WCAG audit, screen-reader pass, or mobile assistive QA yet. |

## What Is Actually Built

- `index.html`: NordicMarket app shell with Browse, Categories, Sell, Inbox, You.
- `app.js`: seeded listings, client-side search/category filtering, listing detail rendering, view switching.
- `styles.css`: mobile-first layout, two-column grid, bottom navigation, sticky detail action row, focus states.
- `tests/e2e.js`: deterministic checks for browse, search, empty state, detail contact, trust, safety, tracking snippet, and local server load.
- `scripts/server.js`: simple static local server.
- `EVIDENCE.md`: VAD evidence packages and independent judge acceptance.

## PRD Section Coverage

| PRD area | Coverage | Evidence | Missing |
| --- | ---: | --- | --- |
| Executive summary / core loop | 18% | Browse -> open listing -> message prompt represented. | Real messaging, seller agreement flow, mark sold, accounts, data. |
| Vision and principles | 24% | Browse first, local visible, photos lead, one primary contact action. | Native Nordic localization, privacy controls, meaningful trust systems. |
| Problem/opportunity | 8% | Product direction reflected in UI. | No market liquidity, country rollout, supply strategy, cross-border data. |
| Competitive DNA | 22% | Facebook-style browse, Jiji-style trust hints, Nordic scopes. | Deep classified attributes, seller history, serious filters, business tools. |
| Target users / JTBD | 14% | Local buyer and casual seller preview. | Intentional buyer filters, repeat seller tools, seller management. |
| Goals, non-goals, guardrails | 12% | Guest browsing, visible location/radius, sponsored label. | Verified user publishing, messaging, auth, fraud controls, AI rules. |
| Mobile navigation | 70% | Five-tab nav exactly present. | Native app behavior, responsive left rail, saved items under You implemented only as copy. |
| Browse screen | 55% | Header, location, search, chips, two-column grid, filter button. | Real filter sheet, recently viewed, real inventory loading, mobile viewport QA. |
| Listing card | 58% | Photo area, price/free, title, locality/distance, freshness, save, sponsored. | Real images, save behavior, stable media loading, accessibility labels for sponsored state. |
| Listing detail | 42% | Gallery area, price/title, condition/location/time, message CTA, opener, trust, safety, similar items. | Swipeable gallery, real sticky bottom mobile CTA, report/share/save actions behavior, auth resume. |
| Search and category depth | 16% | Basic search, categories, de-accented match. | Synonyms, typo tolerance, structured filters, sorting, filter chips, counts from backend. |
| Geographic browse modes | 22% | Nearby/Country/All Nordics controls shown. | Real country inventory scopes, currency handling, saved home location, consent flow. |
| Guest browsing/sign-in | 18% | No login wall; You explains sign-in boundary. | Auth, interrupted-action resume, save/message/sell/report gates. |
| Feed ranking | 3% | Static ordering only. | Relevance, distance, freshness, diversity, quality, paid ranking controls. |
| Empty/low inventory states | 24% | Empty search state says scope will not silently change. | Radius expansion consent, related results, saved-search alert. |
| Buyer contacts seller | 12% | Detail CTA and suggested opener. | Auth, conversation creation, Inbox thread, preserved listing/message. |
| Seller publishes | 8% | Sell preview and required fields copy. | Photo upload, AI suggestions, form, validation, review, publish states. |
| Seller completes deal | 0% | None. | Reserved/Sold, completion prompt, ratings. |
| Functional requirements: location/localization | 7% | Static Stockholm/25 km, SEK samples, de-accented search. | IP/locale inference, permissions, manual city/postcode, languages, currency/date formats. |
| Functional requirements: listings | 12% | Static listing fields approximate required display. | Listing CRUD, states, attributes, media, seller controls. |
| Messaging | 3% | Inbox placeholder and message CTA. | Threads, messages, snapshots, read indicators, report/block, scam warnings. |
| Saved items/searches | 4% | Save buttons shown. | Save state, saved page, saved search alerts, frequency controls. |
| Profiles/trust | 12% | Seller type and trust copy shown. | Verification records, ratings, response stats, profiles, thresholds. |
| AI assistance | 4% | Sell copy mentions AI suggestions. | AI pipeline, labeling, review, confidence, kill switches. |
| Notifications | 0% | None. | Message/listing/security/marketing notification controls. |
| Trust, safety, policy | 7% | Safety reminder shown. | Report/block, detection, risk friction, moderation console, policies, appeals. |
| Monetization | 4% | Sponsored label shown. | Six-month seal logic, boost SKUs, payments, taxes, caps, refunds, performance summaries. |
| Metrics/analytics | 3% | X snippet present. | Required event taxonomy, funnels, privacy constraints, dashboard. |
| Non-functional requirements | 5% | Static app is fast locally; tests run. | p75/p95 performance, reliability, offline states, DR, security, GDPR, scaling. |
| Technical direction | 3% | Static modular-ish frontend only. | Modular backend, geospatial search, messaging, media pipeline, country config, ranking, admin. |
| MVP prioritization | 10% | Browse/detail/sell preview subset. | Most must-haves remain unbuilt. |
| Rollout plan | 1% | No rollout tooling. | Prototype research gates, private beta operations, market sequencing. |
| Release acceptance criteria | 7% | Guest local inventory and contact prompt partially covered. | Beta readiness criteria mostly unmet. |
| Risks/mitigations | 5% | Some clutter avoided; sponsored label clear. | Supply, fraud, professional seller imbalance, AI risk, localization risk mitigations absent. |
| Next deliverables | 14% | Browse/detail wireframe-like prototype and basic tests. | Taxonomy, seller prototype, scorecard, policy pack, analytics spec, architecture/data model, epics. |

## Engineering Audit

Current engineering coverage: 8%.

Completed:
- Static frontend prototype.
- Deterministic test harness.
- Local static server.
- Basic path traversal guard source check.
- X tracking snippet presence test.
- Client-side listing data and filtering.

Not yet engineered:
- Backend/API.
- Database and core entities.
- Auth and verification.
- Listing persistence and state machine.
- Media upload, processing, CDN, metadata stripping, moderation.
- Real geospatial search.
- Real messaging.
- Saved listings/searches.
- Reports, block, moderation console, audit log.
- Notifications.
- Analytics event pipeline.
- Feature flags/country config.
- Security, GDPR, retention, deletion/export flows.
- Payments/boosts.
- Load, recovery, abuse, and performance tests.

## UI Audit

Current UI coverage: 28%.

Strongest UI coverage:
- Brand/app shell.
- Mobile bottom navigation.
- Browse surface.
- Search and category chips.
- Listing cards.
- Detail layout.
- Seller trust and safety panels.
- Sell preview.

Weakest UI coverage:
- Real filter UI.
- Auth prompts.
- Listing creation composer.
- Inbox conversation UI.
- Saved items/searches.
- Seller listing management.
- Moderation console.
- Notification/settings screens.
- Empty state variants across radius/category/country.

## UX Audit

Current UX coverage: 20%.

Covered UX promises:
- User can browse immediately.
- User can see location/radius.
- User can search and narrow results.
- User can open a listing.
- User sees a clear Message seller action.
- Seller flow starts with photos conceptually.
- No marketing hero blocks inventory.

Not yet covered:
- Auth after intent and resume action.
- Real messaging.
- Save behavior.
- Publish in under two minutes.
- Seller edit/pause/reserve/sold controls.
- Report/block workflows.
- Saved searches and alerts.
- Mobile device QA across target viewports.
- Accessibility QA beyond basic focus/semantic checks.

## Product Promise Audit

| Promise | Status | Notes |
| --- | --- | --- |
| Open and browse nearby | Partial | Static nearby feed exists. No real location/inventory. |
| Find what matters | Partial | Basic search/category only. |
| Contact seller without unnecessary steps | Prototype-only | CTA exists, no messaging/auth flow. |
| Free to browse/list | Copy-level | No billing or listing system. |
| Local by default | Partial | Static Stockholm/radius. |
| Photos lead | Partial | Visual placeholders, not real media. |
| Trust without noise | Early | Trust summary copy exists; no trust system. |
| Nordic by design | Early | Nordic scopes/currency sample/de-accent search; no localization system. |
| Sponsored clearly labeled | Partial | Label exists; no boost system. |
| Exact home addresses private | Copy-level | Sell/detail copy says approximate area; no data enforcement. |

## Biggest Gaps Blocking MVP

1. Backend/data model for users, listings, media, categories, messages, reports, saved items, and moderation.
2. Authentication and phone/email verification.
3. Real listing creation with photo upload and publish/review states.
4. Real messaging and Inbox threads.
5. Geospatial search and filter/sort infrastructure.
6. Listing management: edit, pause, reserve, sold, delete.
7. Report/block and moderation console.
8. Analytics event taxonomy and instrumentation.
9. Country/language/currency configuration.
10. Mobile viewport, accessibility, and performance validation.

## Recommended Next VAD Atoms

1. `NM-A2-mobile-qa-hardening`: real mobile viewport checks, screenshots, no-overflow guarantees, sticky CTA validation.
2. `NM-A3-listing-creation-ui`: photo-first seller composer with required fields and preview/publish state.
3. `NM-A4-auth-boundaries`: sign-in prompts for save/message/sell/report with interrupted-action resume mocked locally.
4. `NM-A5-filter-sort`: location/radius/category/price/condition/seller type/sort UI and state.
5. `NM-A6-data-model`: define core entities and modular backend architecture.
6. `NM-A7-messaging-prototype`: listing-attached conversation UI and local state.
7. `NM-A8-trust-safety-mvp`: report/block flows and moderation queue prototype.
8. `NM-A9-analytics-events`: instrument required PRD events without message content or precise location.

## Audit Verdict

The current workspace is a credible first product prototype slice, not an MVP.

It proves the intended product direction and the highest-priority browse/detail UX, but it covers only about 11% of the full PRD because the PRD describes a real multi-country marketplace with identity, verification, messaging, media, search infrastructure, moderation, analytics, localization, and rollout operations.
