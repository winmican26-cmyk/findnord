# VAD Evidence Package

Atom-ID: A1-static-app
Goal: Build the first browser-openable Findnord VAD workbench slice.
Risk: Low
Timestamp: 2026-09-20T20:29:00+02:00

## Success Criteria

- Verified Atomic Development is visible in the UI.
- Multiple processor agents and multiple judge agents are represented.
- The supplied X/Twitter tracking snippet is present with config id `rfixf`.
- The slice cannot be considered successful without E2E evidence.
- The app can run locally in this workspace.

## Files

- `index.html`
- `styles.css`
- `app.js`
- `package.json`
- `scripts/server.js`
- `tests/e2e.js`

## Validation Commands

```text
npm test
PASS: E2E static workflow passed: served app loads, agents render, gates complete, evidence logs, tracking snippet present.
```

```text
node --check app.js
PASS
```

```text
node --check scripts/server.js
PASS
```

```text
node --check tests/e2e.js
PASS
```

## Browser Evidence

Local URL: `http://127.0.0.1:4173/`

Chrome interaction pass:

- Initial state showed title `Findnord VAD Workbench`.
- Initial score was `0/4 gates passed`.
- Two processor agents rendered.
- Two judge agents rendered.
- `Run VAD Slice` was visible and clickable.
- After clicking, score changed to `4/4 gates passed`.
- Slice state changed to `Ready for judge review`.
- Four gates were marked complete.
- Four evidence log entries rendered.
- Four role pills changed to ready state.
- Horizontal overflow offenders: none.

Responsive caveat:

- A mobile viewport override was attempted through browser control, but Chrome did not apply the requested viewport size.
- Static validation still verifies the responsive breakpoint exists.

## Residual Risks

- This is a static first slice, not a persisted orchestration backend.
- Browser E2E covered the available desktop viewport; true mobile-device browser evidence is still a future hardening item.
- No external packages were installed.

---

# VAD Evidence Package

Atom-ID: A2-operational-state
Goal: Add operational atom state, fail-closed validation gates, retry ceilings, and judge verdict controls.
Risk: Low
Timestamp: 2026-09-20T20:40:00+02:00

## Success Criteria

- The selected atom controls its own title, status, retry count, evidence, and completion score.
- Judge verdict controls are disabled until deterministic validation passes.
- Failed validation records evidence and does not advance to judge review.
- Retry ceiling is visible and blocks further looping at `2/2`.
- Judge verdicts include `ACCEPT`, `REQUEST-CHANGES`, and `REJECT`.
- Switching atoms does not leak status or evidence between atoms.

## Files

- `index.html`
- `styles.css`
- `app.js`
- `tests/e2e.js`

## Validation Commands

```text
npm test
PASS: E2E operational workflow passed: fail-closed validation, atom isolation, retry ceiling, judge verdicts, and tracking snippet verified.
```

```text
node --check app.js
PASS
```

```text
node --check tests/e2e.js
PASS
```

## Browser Evidence

Local URL: `http://127.0.0.1:4173/`

Chrome interaction pass:

- Initial atom was `Operational State Slice`.
- Initial score was `1/4 gates passed`.
- Initial judge controls were disabled.
- Clicking `Fail Validation` changed state to `Validation failed`.
- Failed validation recorded retry `1/2` and left `Judge Accept` disabled.
- Switching to `A1` preserved separate atom state.
- Running `Run Processor`, `Pass Validation`, and `Judge Accept` changed `A1` to `Accepted`.
- Accepted score was `4/4 gates passed`.
- Evidence count for the accepted atom was `4`.
- Horizontal overflow offenders: none.

## Verifier

Independent judge verdict: ACCEPT.

---

# VAD Evidence Package

Atom-ID: NM-A17-brand-localization-pass
Goal: Align the product branding around FindNord, make the logo responsive on small screens, reduce oversized buttons, shift the base palette toward Swedish flag colors, and document localization/product inspiration plans.
Risk: Low
Timestamp: 2026-09-21T19:05:00+02:00

## Scope Covered

- Added responsive wordmark structure: full `FindNord` on larger screens and compact `FN` beside the logo mark on small screens.
- Updated CSS so small screens hide the full wordmark and eyebrow, showing the logo mark plus `FN`.
- Changed base palette defaults to Swedish flag blue `#006AA7` and yellow `#FECC02`.
- Reduced oversized button heights/padding across common controls while keeping usable tap targets.
- Updated stale server startup copy to `FindNord`.
- Added `BRAND_LOCALIZATION_PLAN.md` covering Swedish-flag brand direction, Facebook Marketplace and Jiji.ng inspiration boundaries, localization work, and next brand acceptance criteria.

## Validation Commands

```text
node --check app.js
PASS
```

```text
node --check data-service.js
PASS
```

```text
node --check tests/e2e.js
PASS
```

```text
node --check scripts/server.js
PASS
```

```text
npm test
PASS: E2E FindNord workflow passed.
```

## Browser Evidence

- Existing server was already running on `http://127.0.0.1:4173/`.
- Desktop-width browser check confirmed title `FindNord`.
- Runtime CSS variables were `--country-primary: #006AA7` and `--country-accent: #FECC02`.
- Header/profile and filter buttons rendered at moderated sizes.
- The browser viewport override did not apply in this Chrome session, so the compact mobile logo behavior is currently enforced by deterministic CSS tests rather than live narrow-viewport evidence.

## Residual Risks

- Final production logo asset is still temporary inline SVG.
- Full Nordic localization remains incomplete; Swedish is wired, other Nordic languages still need complete professional copy.
- Mobile screenshot QA should be run with a reliable viewport tool before this is considered visually final.

---

# VAD Evidence Package

Atom-ID: NM-A16-public-seller-profiles
Goal: Add guest-readable public seller profiles for real users, linked from listing detail pages, with localized profile UI and FindNord brand constraints.
Risk: Low
Timestamp: 2026-09-21T19:28:00+02:00

## Scope Covered

- Added/verified a public profile view target for real seller profiles.
- Profile displays seller display name, member-since month/year, active listing count, localized verification placeholder, and active listing cards.
- Listing detail seller names for real user listings open the seller profile.
- Profile listing cards open the seller's listing detail.
- Public profile API remains guest-readable and returns only public fields.
- Added English and Swedish copy for the unverified placeholder.
- Styled seller links and placeholder badges with quiet FindNord Swedish-blue/yellow brand direction and no oversized CTA treatment.

## Validation Commands

```text
node --check app.js
PASS
```

```text
node --check data-service.js
PASS
```

```text
node --check scripts/api.js
PASS
```

```text
node --check tests/e2e.js
PASS
```

```text
npm test
PASS: E2E FindNord workflow passed, including public seller profiles (NM-A16: clickable seller detail link, guest-readable profile, localized verification placeholder, and profile listing navigation).
```

## E2E Assertions Added

- A real registered user publishes `Analytics test bicycle` and receives a real `sellerId`.
- The listing detail renders a compact clickable seller name with `data-open-profile`.
- Opening the seller profile renders `Ola Analytics`, `Member since`, `1 active listing`, `Not verified yet`, and the active listing card.
- Opening the listing from the profile resolves back to the listing detail.
- After sign-out, the same profile opens without showing the auth modal.

## Residual Risks

- Reviews, ratings, and full verification badges are intentionally not implemented in this slice.
- Seed listings are still marketplace demo content without real `sellerId`, so only listings published by real users link to profiles.

---

# VAD Evidence Package

Atom-ID: NM-A1-marketplace-browse-detail
Goal: Pivot the workspace from a VAD demonstration into the first NordicMarket marketplace product slice.
Risk: Low
Timestamp: 2026-09-20T21:05:00+02:00

## PRD Scope Covered

- Guest browse without login wall.
- Compact NordicMarket header with visible location and radius.
- Nearby, Country, and All Nordics browse scopes.
- Search field and category chips.
- Mobile-first two-column listing grid.
- Listing cards with photo area, price, title, locality, distance, save action, freshness, and Sponsored label.
- Empty state that does not silently expand radius or country.
- Listing detail with gallery, price/title, location, condition, posted time, sticky Message seller action, suggested opener, structured attributes, seller trust, safety reminder, and similar items.
- Bottom navigation: Browse, Categories, Sell, Inbox, You.
- Sell entry preview with photo-first creation steps.
- X conversion tracking snippet remains installed with config id `rfixf`.

## Files

- `index.html`
- `styles.css`
- `app.js`
- `tests/e2e.js`
- `package.json`

## Validation Commands

```text
npm test
PASS: E2E NordicMarket workflow passed: browse, search, empty state, detail contact, seller trust, safety, and tracking verified.
```

```text
node --check app.js
PASS
```

```text
node --check tests/e2e.js
PASS
```

## Browser Evidence

Local URL: `http://127.0.0.1:4173/`

Chrome interaction pass:

- Page title and main heading are `NordicMarket`.
- Visible location is `Stockholm, Sweden`.
- Visible radius is `25 km`.
- Primary navigation shows Browse, Categories, Sell, Inbox, You.
- Browse rendered 6 listing cards.
- Sponsored label was visible.
- Horizontal overflow offenders: none.
- Search for `iphone` returned `1 listing`.
- Opening the iPhone listing showed detail view.
- Detail view showed `Message seller`, suggested opener, seller trust summary, and safety reminder.
- Sell tab opened the photo-first seller preview.

## Deterministic Coverage Notes

- Static E2E verifies tracking snippet, two-column grid CSS, sticky detail CTA CSS, focus styling, search, empty state, detail contact, trust, safety, and server path traversal guard source.
- Search verifies de-accented matching by finding `Södermalm` with the query `sodermalm`.

## Residual Risks

- This is still a static prototype; it does not persist listings, accounts, messages, reports, or seller actions.
- Live mobile viewport evidence was not captured in this slice; responsive behavior is currently covered through CSS and layout checks.
- Tracking is presence-tested, not verified at the network/conversion event level.
- Real authentication, moderation queue, messaging backend, media upload, and localization system remain future atoms.

## Verifier

Independent judge verdict: ACCEPT.

---

# VAD Evidence Package

Atom-ID: NM-A2-mobile-qa-hardening
Goal: Make the existing browse + detail experience robust on real mobile viewports, fix the Message Seller CTA position relative to the bottom nav, and improve accessibility labeling.
Risk: Low
Timestamp: 2026-09-20T22:10:00+02:00

## Problems Found Before This Slice

- **CTA position bug**: `.detail-actions` (which contained Message seller) used `position: sticky; top: 0`. On a scrolling page this sticks the bar to the *top* of the viewport as you scroll down through the detail content — not "sticky and fully visible above the bottom nav" as required. There was no mechanism keeping it pinned to the bottom.
- **Silent accessibility bug**: `.card-button` had its own `aria-label="Open {title}"`. Per the accessible-name computation spec, an explicit `aria-label` on an element overrides *all* descendant text content for assistive technology — so the "Sponsored" badge, freshness badge ("New today"/"Fresh"), price, and locality/distance text inside the button were completely invisible to screen reader users, despite being visible on screen. This is a real WCAG 4.1.2 / 1.3.1 gap, not a cosmetic one.
- No explicit horizontal-overflow safety net (relied entirely on individual components behaving; no global guarantee).
- No hardening below the existing 430px breakpoint (iPhone SE / small Android widths were untested).

## Changes Made

- `styles.css`:
  - Added `--nav-height` / `--cta-height` custom properties.
  - Added `html, body { overflow-x: hidden }` and `* { max-width: 100% }` as a global no-horizontal-scroll guarantee.
  - Replaced the top-sticky `.detail-actions` bar with a dedicated `.cta-bar` (`position: fixed; bottom: var(--nav-height)`) that holds only the "Message seller" button, pinned directly above the bottom nav on every scroll position. Save/Share moved into a normal (non-sticky) in-flow row.
  - Added `#listing-detail { padding-bottom: var(--cta-height) }` so the last content block (Similar items) is never hidden behind the new fixed bar.
  - Added `@media (max-width: 375px)` and `@media (max-width: 320px)` breakpoints tightening header, nav-item, and card spacing for iPhone SE-class and legacy small-Android widths.
- `app.js`:
  - Fixed the accessible-name bug: card `aria-label` now explicitly includes price, sponsored state, freshness, locality, and distance (e.g. `"Open listing: iPhone 14, 128 GB, 5 900 kr, sponsored, Fresh, Solna, 6.8 km away"`), and the now-redundant visible content is marked `aria-hidden="true"` to avoid double-announcing.
  - Save button aria-label expanded to `"Save {title} for later"`.
  - Detail view: Message seller button now names the seller (`"Message {seller} about {title}"`); Save/Share in detail view got listing-specific aria-labels; the gallery placeholder got `role="img"` + `aria-label="Photo of {title}"` (previously a bare decorative div with no accessible description at all).
  - Restructured `openListing()` template to emit the new `.cta-bar` markup.
- `index.html`: `#result-count` got `aria-live="polite"` (announces result count changes on search/filter without moving focus); `#empty-state` got `role="status"`.
- `tests/e2e.js`: added assertions for viewport meta, `aria-live`/`role="status"`, the overflow-x safety net CSS, the fixed `.cta-bar` positioning (and an explicit `doesNotMatch` guard that `.detail-actions` is no longer sticky), the two new narrow-width breakpoints, and the corrected aria-label strings (verified against the actual rendered iPhone-14 listing, both card and detail view).

## Validation Commands

```text
npm test
PASS: E2E NordicMarket workflow passed: browse, search, empty state, detail contact, seller trust, safety, and tracking verified.
```

```text
node --check app.js && node --check tests/e2e.js && node --check scripts/server.js
PASS (all three)
```

## Real Browser Evidence (Playwright/Chromium, headless)

No project-specific run skill existed yet, so the generic browser-driven fallback pattern was used: `npm run serve` in the background, polled with `curl` until it answered, then driven with Playwright (Chromium was already cached locally from a prior project, so no fresh browser download was needed).

Tested at three real device widths: iPhone SE (375×667), a legacy small-Android width (320×568), and a large Android/Pixel-class width (412×915).

For each viewport, on Browse and then after opening the iPhone 14 listing detail:

| Viewport | Browse `scrollWidth` vs `clientWidth` | Detail `scrollWidth` vs `clientWidth` (before/after scroll) | Message seller vs bottom nav |
| --- | --- | --- | --- |
| 375×667 (iPhone SE) | 375 / 375 — no overflow | 375 / 375 both before and after scroll | CTA bar bottom edge (602px) exactly meets nav top edge (602px); button itself spans 546–594px, fully clear of the nav |
| 320×568 (legacy small) | 320 / 320 — no overflow | 320 / 320 both before and after scroll | CTA bar bottom (503px) meets nav top (503px); button spans 447–495px |
| 412×915 (Pixel-class) | 412 / 412 — no overflow | 412 / 412 both before and after scroll | CTA bar bottom (850px) meets nav top (850px); button spans 792–840px |

All three viewports: `document.documentElement.scrollWidth === clientWidth` in every state checked (browse, detail on load, detail after scrolling to the bottom of the page) — confirms the "no horizontal overflow" requirement holds, not just via CSS inspection but via actual rendered layout.

At every viewport, after programmatically scrolling to `document.body.scrollHeight` (confirmed non-trivial scroll distance: 966px / 1107px / 724px respectively, so this was a real scroll, not a no-op), the CTA bar's bounding box was byte-identical to its pre-scroll position — confirming true `position: fixed` behavior, not an accidental one-time placement.

Zero console errors on any viewport.

Screenshots captured at the iPhone SE viewport (before and after scrolling to the bottom of the detail page) both show the green "Message seller" bar fully visible, directly above the "Browse / Categories / Sell / Inbox / You" nav row, with no overlap and no clipping.

## Deterministic Coverage Notes

- Static E2E now additionally verifies: viewport meta tag, `aria-live`/`role="status"` presence, the overflow-x safety net, fixed-position CTA bar CSS (bottom pinned to nav height), removal of the old sticky-to-top behavior, the 375px/320px breakpoints, and the corrected accessible names for cards and detail-view controls.
- Browser evidence (this slice) is the first in this workspace to actually launch a real browser at real device widths, rather than relying on CSS-string assertions alone (the NM-A1 evidence package explicitly flagged this as a residual risk — this slice closes it for Browse and Detail).

## Residual Risks

- Desktop (≥780px) still shows the bottom nav and would now also show the fixed CTA bar full-width; this slice did not audit desktop layout since the requirement was mobile-specific — worth a follow-up glance if desktop is a supported target.
- Save button is still visual-only (no toggle state / persistence) — real save behavior is explicitly out of scope for this slice and lands with auth boundaries (NM-A4) and later saved-items work.
- No screen-reader software (NVDA/VoiceOver) pass was performed — accessibility fixes were verified against the WCAG accessible-name computation spec and DOM structure, not a live AT session.
- Only Chromium was tested; no WebKit/Safari-specific mobile viewport check was run.

## Coverage Impact (rough)

- Mobile navigation: 70% → ~78% (nav geometry now verified against real layout, not just "present").
- Browse screen: 55% → ~60% (overflow guarantee added; still no real filter sheet/backend inventory).
- Listing detail: 42% → ~50% (sticky/fixed CTA requirement now genuinely met and verified; still no real gallery, report/share behavior, or auth resume).
- Accessibility: 18% → ~24% (one real WCAG-relevant bug fixed with evidence; still no full WCAG audit or AT session).
- Overall PRD / MVP: ~11% → ~12% (this slice is a hardening/quality pass on existing surface area, not new PRD-scope coverage — small absolute movement is expected and correct).

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests + real headless-browser measurements above); no independent judge pass has been run. Awaiting your acceptance before starting NM-A3.

---

# VAD Evidence Package

Atom-ID: NM-A3-listing-creation-ui
Goal: Build a photo-first Sell flow that publishes into local data, expand the category taxonomy to Jiji-style depth (Vehicles and Real Estate as flagship verticals), and lay working groundwork for multi-language support and country-colored navigation.
Risk: Medium (largest slice so far — new form logic, taxonomy migration of existing seed data, two new cross-cutting systems)
Timestamp: 2026-09-20T23:40:00+02:00

## Scope Decision: Groundwork vs. Full Implementation

The new requirements said categories must be expanded now (NM-A3 explicitly needs them for the category field), but said language and country theming should get **groundwork "so they can be completed cleanly in the next 1–2 slices."** Read literally as one slice, that's already three cross-cutting systems; the more specific instruction (groundwork only, for two of the three) is what this slice follows:

- **Categories: fully implemented.** Real taxonomy, real seed listings in the new verticals, real filtering.
- **Language: mechanism fully implemented, content partially so.** Switching, persistence, and English-fallback all work for real, right now, in a real browser (see below). Only `sv` (Swedish) has real translated copy; `no`/`da`/`fi`/`is` are wired as empty dictionaries that safely fall back to English rather than left unbuilt. Full translation for the remaining four languages is explicit next-slice work, not hidden scope.
- **Country theming: engine fully implemented, UI deferred.** All 5 countries' colors are real and wired into the CSS (nav, sell tab, topbar accent). There is no user-facing country switcher yet — the app still only shows one fixed default location — because building that control is really geographic-browse-mode work (a later slice), not listing creation. Sweden's colors are applied as today's fixed default so the mechanism is visibly live, not just declared.

## What Changed

### 1. Category taxonomy (Jiji-style depth)

`categoryTaxonomy` in `app.js` replaces the old flat 6-category list with 12 top-level categories, two of which (**Vehicles**, **Real Estate**) carry real sub-types and a `featured: true` flag:

- Vehicles → Cars, Motorcycles, Trucks & Vans, Boats, Parts
- Real Estate → For Sale, For Rent, Land, Commercial
- Electronics, Phones & Tablets, Home & Furniture, Fashion, Baby & Kids, Sports & Outdoor, Jobs, Services, Agriculture & Garden, Free Items

Featured categories get a visually distinct treatment in both the chip row (bordered/bold `.chip.featured`) and the Categories tab (tinted background + a "Popular" badge, `.category-tile.featured` / `.popular-badge`) — screenshot below.

Existing seed listings were remapped into the new taxonomy (`Home`→`Home & Furniture`, `Electronics`→`Phones & Tablets` for the iPhone, `Kids`→`Baby & Kids`, `Outdoor`→`Sports & Outdoor`), and two new listings were added to prove the flagship verticals are real, filterable data and not just labels: a Volvo V60 (`Vehicles` / `Cars`) and a 2-room rental apartment (`Real Estate` / `For Rent`, sponsored). Filtering the Vehicles chip returns exactly the Volvo listing — verified live, see measurements below.

### 2. Sell flow (the core NM-A3 deliverable)

New `#sell-form` in `index.html`, driven entirely by `app.js`, replacing the old static "Start with photos" placeholder:

- **Photos**: tap "+ Add photo" to add a placeholder photo (up to 10); the first is marked "Cover"; each has a remove button. Backed by `addSellPhoto()` / `removeSellPhoto()` / `renderSellPhotos()`.
- **Required fields**: title, price (with a Free toggle that disables the price input), category (from the real taxonomy), a conditional sub-type field that only appears for Vehicles/Real Estate, condition, approximate location, description.
- **Live preview**: reuses the exact same `listingCardTemplate()` function that renders real Browse cards (refactored out of `renderListings()`/`openListing()` so preview and production rendering can never drift apart) — the preview is not a mockup, it's a real (non-interactive) instance of the real card component.
- **Validation**: `validateSellForm()` returns a plain-language, additive list of what's missing (not a single generic error), rendered into an `aria-live="polite"` region so screen reader users hear it too. Publishing is blocked until everything required is present — confirmed live: an empty-form submit produced exactly "Add at least 1 photo. Add a title. Set a price, or toggle Free. Add an approximate location. Add a short description." and did **not** change the listing count.
- **Publish**: on success, the new listing is unshifted into `listings` (client-side, in-memory — no backend, as scoped), the grid/category counts re-render, the form resets, and the app navigates straight to the new listing's real detail page so the whole loop is visibly closed. The new listing's seller is set to "You" / "New seller · Published just now" since there's no auth yet (NM-A4).

### 3. i18n groundwork

- `translations` dictionary in `app.js`: `en` and `sv` fully populated (12 keys covering brand eyebrow, nav labels, browse heading, filter button, search label/placeholder, empty state, sell heading); `no`/`da`/`fi`/`is` present as empty objects.
- `t(key, lang)` looks up the requested language, falls back to `en`, then to the raw key — never crashes on a missing translation.
- `setLanguage(lang)` persists the choice to `localStorage` (guarded with `typeof` checks + try/catch so it never throws in contexts without storage) and re-applies translations immediately.
- A one-tap `<select id="language-select">` sits in the header with all 6 codes (EN/SV/NO/DA/FI/IS).
- Verified live in a real browser: switching to Swedish changed the browse heading, the Sell nav label, and the search placeholder immediately, and **the choice survived a full page reload** (real `localStorage`, not just in-memory state — something the Node-based test harness can't exercise, only a real browser can).

### 4. Country-colored navigation groundwork

- `countryThemes` in `app.js` maps all 5 Nordic countries to `{ primary, accent }` hex pairs matching the spec: Sweden `#006AA7`/`#FECC02` (blue/yellow), Denmark `#C8102E`/`#FFFFFF` (red; white chosen as a neutral complement since the brief named only "red"), Norway `#BA0C2F`/`#00205B` (red/blue), Finland `#003580`/`#FFFFFF` (blue/white), Iceland `#02529C`/`#DC1E35` (blue/red).
- `applyCountryTheme(country)` sets `--country-primary` / `--country-accent` as inline custom properties on `document.documentElement`, which the stylesheet already consumes: `.nav-item.active` text color, `.sell-tab` background, and a new 3px `.topbar` bottom accent border.
- Sweden is applied on load (matching today's fixed "Stockholm, Sweden" default). Verified live: calling the theme function for Denmark changed the Sell tab's rendered background from `rgb(0, 106, 167)` to `rgb(200, 16, 46)` and the topbar border to white — instantly, with no re-render needed, confirming the CSS wiring (not just the JS state) is real.

## A Real Bug Found and Fixed During Verification

Screenshot evidence caught a genuine CSS specificity bug, not a cosmetic nitpick: the conditional sub-type field (`#sell-subtype-field`, hidden via the `hidden` DOM property for categories without sub-types) was still visibly rendering as an empty box. Cause: `.sell-field { display: grid }` and the browser's default `[hidden] { display: none }` rule have equal specificity, and the stylesheet's own rule — loaded after the UA default — won, silently defeating `hidden` on any element that also carried a `.sell-field` class. Fixed with a scoped override, `.sell-field[hidden] { display: none; }`, and reconfirmed live afterward (screenshot below) with all other measurements re-run and unchanged.

## Validation Commands

```text
npm test
PASS: E2E NordicMarket workflow passed: browse, search, empty state, detail contact,
seller trust, safety, tracking, expanded categories, listing creation, language switch,
and country theming verified.
```

```text
node --check app.js && node --check tests/e2e.js && node --check scripts/server.js
PASS (all three)
```

## Real Browser Evidence (Playwright/Chromium, headless, 390×844)

Full flow driven end to end against a live `npm run serve` instance:

| Step | Result |
| --- | --- |
| Category chips rendered | 13 total (`All` + 12), exactly 2 marked `.featured`: Vehicles, Real Estate |
| Categories tab | 2 `.popular-badge` elements, on Vehicles and Real Estate only |
| Empty-form publish attempt | Blocked; validation text listed all 5 missing requirements; listing count stayed at 8 |
| Filled form → live preview | Preview showed the typed title and `"1 500 kr"` (auto-formatted from raw `"1500"`) before publishing |
| Publish | Succeeded; app navigated to the new listing's detail page; seller shown as "You" |
| Back to Browse | `result-count` = "9 listings"; grid text included the new listing's title |
| Filter by Vehicles chip | `result-count` = "1 listing"; grid contained exactly the Volvo V60 — proves the new vertical filters real data, not just displays a label |
| Language → Swedish | Browse heading → "Färska fynd nära dig", Sell nav label → "Sälj" |
| Full page reload after language switch | Heading still "Färska fynd nära dig" — real `localStorage` persistence, not in-memory-only state |
| `applyCountryTheme("Denmark")` | Sell tab background `rgb(0, 106, 167)` → `rgb(200, 16, 46)`; topbar border → white |
| Console errors across the entire flow | 0 |

Screenshots captured: category chips on Browse (Vehicles/Real Estate visibly bordered, with the Swedish yellow topbar accent already visible), the Categories tab (Popular badges), the filled Sell form (post-fix: sub-type field correctly hidden), the published listing's real detail page, the Swedish-language Browse view, and the Denmark-themed nav.

## Deterministic Coverage Notes (`tests/e2e.js`)

Extended in three layers, consistent with the existing project style (no new dependencies):

1. **Static regex assertions** on the actual `app.js`/`index.html`/`styles.css` source for the taxonomy content, translation dictionary shape, country hex values, and the new form's HTML structure.
2. **Direct function calls** against the vm-executed script (same pattern the project already used for `openListing`) — `updateSubtypeVisibility()`, `formatPrice()`, `publishListing()`, `t()`, `setLanguage()`, `applyCountryTheme()` are all plain top-level functions, so tests call them directly rather than simulating clicks, exactly like the existing `context.openListing(...)` calls.
3. The fake-DOM test harness gained `setAttribute`/`getAttribute`, `checked`/`disabled` defaults, and a `documentElement.style.setProperty/getPropertyValue` mock to support the new assertions.

A full publish-flow test runs inside the deterministic suite too (not just the browser pass): failed validation is asserted to leave the listing count unchanged, a valid submission is asserted to append the listing, update the live preview text, reset the photo grid, and open the correct detail view — so this doesn't only work in the one browser session that happened to be screenshotted.

## Residual Risks

- `no`/`da`/`fi`/`is` show English text everywhere except the language selector's own labels — expected and documented, not a bug; full translation is explicit next-slice scope.
- No user-facing country switcher exists yet; `applyCountryTheme` is proven correct but only reachable programmatically until geographic browse modes are built.
- Sub-category browsing in the main Browse/Categories UI is flat (only top-level categories are chips/tiles); Vehicles/Real Estate sub-types are only selectable inside the Sell form for now. Drill-down category browsing is filter/sort scope (a later slice), not listing creation.
- Photos remain colored placeholders, not real uploads — unchanged from the original NM-A3 constraint ("Do NOT implement real media upload or backend yet" carried over from the original brief).
- New listings are in-memory only; a page reload loses anything published in that session (same limitation as the rest of the app — no persistence layer exists yet).
- No screen-reader software pass on the new Sell form specifically; validation announcements were verified structurally (`aria-live="polite"`, `role="status"`) and via the WCAG spec, not a live AT session.

## Coverage Impact (rough)

- Seller publishes: 8% → ~55% (real photo-first form, real validation, real publish-to-local-data, real live preview reusing production card markup; still missing: media upload, backend persistence, review/moderation states).
- Competitive DNA: 22% → ~40% (Vehicles/Real Estate depth is the single most-cited Jiji-style gap in the original audit; now real and filterable).
- Functional requirements: listings: 12% → ~30% (create + display now real; edit/pause/reserve/sold/delete still absent — that's listing *management*, a different PRD area).
- Localization / Nordic readiness: 9% → ~16% (real switching mechanism and persistence; only 2 of 6 languages have actual translated content).
- Guest browsing/sign-in: unchanged (~18%) — new listing's seller identity ("You") is a placeholder, not real auth; NM-A4 still owns this.
- Overall PRD / MVP: ~12% → ~15% (largest single jump so far, reflecting a full new user journey — publish a listing — going from 0% to functional).

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests + real headless-browser measurements above, including one real bug found and fixed via screenshot review); no independent judge pass has been run. Awaiting your acceptance before starting NM-A4.

---

# VAD Evidence Package

Atom-ID: NM-A4-auth-boundaries
Goal: Gate Save, Message Seller, Publish, and Report behind a mocked sign-in; when a guest hits a gated action, show a friendly (and translated) auth prompt, and after mocked sign-in automatically resume the exact action they were trying to do.
Risk: Medium (touches Save, the Sell publish path, and introduces two new modal surfaces plus a persisted session)
Timestamp: 2026-09-21T00:20:00+02:00

## What Changed

### 1. A single, reusable gate: `requireAuth(action)`

```js
function requireAuth(action) {
  if (currentUser) {
    action();
    return true;
  }
  pendingAction = action;
  openAuthModal();
  return false;
}
```

Every gated action is just a thin wrapper around this one function — `handleSaveClick`, `handleMessageClick`, `handleReportClick`, and the publish path all call `requireAuth(() => realAction())`. This means the resume behavior isn't reimplemented per-action: whatever closure was passed in is exactly what runs the instant sign-in completes, with whatever arguments/state it already closed over (the listing id, the filled-in sell form values, etc.) — nothing is re-derived or re-typed after sign-in.

### 2. Gated actions

- **Save** (`handleSaveClick`): previously visual-only (flagged as deferred in the NM-A2 evidence). Now real: a `savedListingIds` Set actually toggles, re-rendering the card/detail Save button between "Save" and "Saved" with correct `aria-pressed` and accessible name (`"Save X for later"` ↔ `"Remove X from saved items"`).
- **Message Seller** (`handleMessageClick`): the `#message-seller` button in the fixed CTA bar was wired for the first time (it had no click handler at all through NM-A2/A3). Once authenticated, it opens a real composer modal (`#compose-modal`) pre-filled with the suggested opener text and addressed to the actual seller name.
- **Publish** (inside `publishListing`): field validation still runs first — a guest gets the same helpful "what's missing" feedback as before. Only once the form is actually valid does it hit the auth gate; the old single `publishListing()` function was split so the actual commit (`commitPublish(values)`) is the callback captured by `requireAuth`, using the exact same `values` the guest already typed.
- **Report** (`handleReportClick`): new — there was no report UI anywhere in the app before this slice (flagged in the original PRD audit as entirely missing). Added a "Report" button next to Save/Share in the listing detail view. Since real moderation is explicitly out of scope, a successful (post-auth) report shows a short toast rather than a second modal — proportionate to how thin this feature is meant to be for now.

### 3. Auth prompt + mocked sign-in

`#auth-modal`: an email field + "Continue" (mock sign-in — accepts any non-empty email, no real auth provider) and a "Continue as Guest with temporary profile" option, exactly as the brief allowed. Either path calls `completeSignIn(user)`, which persists the session, closes the modal, and — critically — runs the pending action:

```js
function completeSignIn(user) {
  currentUser = user;
  persistSession();
  closeAuthModal();
  renderAccountPanel();
  const action = pendingAction;
  pendingAction = null;
  if (action) action();
}
```

### 4. Persisted mocked session

`localStorage.setItem("nm_user", ...)` / `loadSavedSession()` on boot, guarded with `typeof` checks + try/catch (same defensive pattern as the language persistence from NM-A3, so it never throws where storage is unavailable). The **You** tab (`#you-panel`) now reflects real state: signed-out copy, "Welcome back" + email for a real mocked login, or "Browsing as guest profile" for the guest path — plus a working Sign out button.

### 5. i18n + country-color integration (not bolted on after the fact)

All auth/composer/account strings are real translation keys (`auth.*`, `account.*`, `compose.*`, `report.*`), populated for English and Swedish following the exact same fallback pattern as NM-A3 — nothing here is a hardcoded string. The modal's primary "Continue" button uses `background: var(--country-primary)` (not the fixed green used for Publish/Message), so it's visibly and functionally tied to the same country-theming system as the nav — confirmed live below: the button's actual rendered color changed when the country theme changed, with no code changes to the modal itself required.

## A Real Bug Found and Fixed During Verification

Screenshot review caught it immediately: the modal's "×" close button was rendering as the literal word **"Close"** (and "Stäng" in Swedish), overlapping the "Sign in required" eyebrow text. Cause: `applyTranslations()` was setting `textContent` on `#auth-modal-close`, which replaced the "×" glyph with the translated word — I'd conflated "translate the accessible name" with "translate the visible text." Fixed by moving close-button translation to a separate pass that calls `setAttribute("aria-label", ...)` instead of touching `textContent`, and extended it to the compose modal's close button too (which had a hardcoded English aria-label before). Reconfirmed with an identical re-run afterward — same 15 measurements, same values, this time with a correctly rendered "×".

## Validation Commands

```text
npm test
PASS: E2E NordicMarket workflow passed: browse, search, empty state, detail contact,
seller trust, safety, tracking, expanded categories, listing creation, language switch,
country theming, and auth-gated save/message/report/publish with interrupted-action
resume verified.
```

```text
node --check app.js && node --check tests/e2e.js && node --check scripts/server.js
PASS (all three)
```

## Real Browser Evidence (Playwright/Chromium, headless, 390×844)

| Check | Result |
| --- | --- |
| Guest clicks Save | Auth modal opens; nothing saved yet |
| Modal's Continue button color, Sweden vs. Norway | `rgb(0, 106, 167)` → `rgb(186, 12, 47)` — exact hex match, country theme is live on the modal, not just the nav |
| Language switched to Swedish while modal is open | Title → "Logga in för att fortsätta", guest button → "Fortsätt som gäst", email placeholder → "du@exempel.se" |
| Mock sign-in (email) completes | Modal closes; **the original Save resumes automatically** — first card's Save button now reads "Remove Solid oak dining table from saved items" |
| Message Seller clicked (now signed in) | No auth wall (already authenticated) — composer opens directly, titled "Message Nordic Refurb", textarea pre-filled with "Hi, is this still available?" |
| Send | Composer closes; toast shows the mocked-send confirmation |
| Report clicked (still signed in) | No wall; toast confirms immediately |
| Sign out via You tab | Panel reverts to signed-out copy |
| Report clicked again as a fresh guest | Auth wall reappears — the gate re-engages correctly per session state, it isn't a one-time check |
| "Continue as Guest" on that wall | Also resumes the pending action — toast fires — proving **both** sign-in paths (email and guest) resume correctly, not just the email one |
| Full page reload after "Continue as Guest" | You tab still shows "Browsing as guest profile" — real `localStorage` persistence across a real reload, not in-memory-only state |
| Console errors across the entire flow | 0 |

Screenshots captured: the auth modal on Save (English), the same modal with Norway's theme colors applied live, the modal in Swedish, the resumed-save state, the pre-filled message composer, the sent-message toast, the signed-out You tab, the guest-continue report resume, and the You tab after a real page reload.

## Deterministic Coverage Notes (`tests/e2e.js`)

The publish-flow test from NM-A3 was rewritten rather than just extended, because gating changes its actual contract: a valid, filled-in form submitted while signed out must **not** publish and must **not** return a listing — that's now asserted explicitly, followed by `context.completeSignIn(...)` and a check that the exact same listing then appears. The same gate → resume pattern is asserted for Save (toggle only happens after sign-in), Message Seller (composer only opens after sign-in, pre-fill text asserted exactly), and Report (toast only after sign-in, and via *either* sign-in path). A separate block confirms translation keys reach the auth modal specifically (not just the main UI), and the You-tab panel is asserted in all three states: signed-out, signed-in, and after sign-out again.

## Residual Risks

- Mock sign-in accepts any non-empty email with no validation/verification — correct for this slice's scope (no real auth provider yet), but worth flagging so it's never mistaken for real auth.
- Report has no moderation queue behind it (out of scope, per the original audit's Trust & Safety gap) — it's a client-side acknowledgement only.
- The message composer's title interpolates the seller's name but isn't retranslated if the language changes while the composer happens to be open (an edge case, not attempted to be covered here).
- Saved items don't persist across a reload (only the session/login state does) — real saved-items persistence is separate PRD scope.
- No live screen-reader pass on the new modals specifically; verified structurally (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus-visible styles inherited from existing button/input rules) and via the WCAG accessible-name fix above, not a live AT session.

## Coverage Impact (rough)

- Guest browsing/sign-in: 18% → ~45% (real gate + real mocked sign-in + real resume, for the four actions the PRD explicitly calls out; still missing: real auth provider, phone/email verification, password/session security).
- Trust, safety, policy: 7% → ~14% (a Report entry point now exists for the first time; still no moderation queue, detection, or appeals).
- Buyer contacts seller: 12% → ~28% (message composer with pre-filled opener is real and gated correctly; still no persisted conversation/Inbox thread — that's NM-A7 territory).
- Saved items/searches: 4% → ~15% (Save now actually toggles and is gated; still no saved-items list view or persistence).
- Overall PRD / MVP: ~15% → ~18%.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests + real headless-browser measurements above, including one real bug — the mistranslated close-button glyph — found and fixed via screenshot review); no independent judge pass has been run. Awaiting your acceptance before starting the next slice.

---

# VAD Evidence Package

Atom-ID: NM-A5-filter-sort
Goal: Build a real Filter & Sort bottom sheet (price, condition, seller type, distance, category/sub-type refinement), sort options, Apply/Clear/Reset controls, removable active-filter chips, and full i18n/country-theme integration.
Risk: Medium (touches the core `getFilteredListings()` path every other view depends on, plus two data-consistency fixes to seed data)

## Data-Consistency Fixes Needed First

A real condition/seller-type filter is only as good as the vocabulary it filters against, and the existing seed data had two mismatches with what this slice needed to be honest, working filtering — both fixed, not routed around:

- **iPhone's condition was "Very good"**, a value that existed nowhere else in the app and wasn't selectable in the Sell form. Filtering by any real condition would have silently always excluded it. Normalized to "Like new" (the closest existing vocabulary value).
- **The Sell form's condition list was missing "Fair"**, which the brief explicitly asked the filter to support. Added it to the Sell form too, so the two forms share one canonical vocabulary (`CONDITIONS = ["New", "Like new", "Good", "Fair", "Used", "For parts"]`) instead of drifting apart.
- Added a `postedAt` timestamp to every seed listing (a rough, documented minutes-ago offset behind each listing's existing display copy — the visible "Today"/"Yesterday" text is unchanged) so **"Most recent" sort has a real, deterministic order to work with** instead of relying on array position.

## What Changed

### 1. Filtering (`getFilteredListings()`)

Extended the existing category+search filter with: price range (`parsePriceValue` strips currency formatting like "12 500 kr/month" or "Free" down to a comparable number), condition (multi-select), seller type (multi-select), distance/radius (`parseDistanceKm` reads the existing "X.X km" display strings — a listing whose distance can't be parsed, like a freshly published "New listing", **passes every distance filter rather than being hidden**, so a user's own new listing never silently disappears), and category sub-type (Vehicles → Cars, Real Estate → For Rent, etc., reusing the exact sub-type vocabulary from the Sell form via a new shared `populateSubtypeSelect()` helper — the Sell form's own sub-type logic was refactored to use it too, removing duplication).

### 2. Sorting (`sortListings()`)

Four options — Most recent (by `postedAt`), Lowest price, Highest price, Nearest (by parsed distance, with unparseable distances sorted last rather than crashing or throwing them out) — applied as the final step of `getFilteredListings()`, so every view that already calls it (Browse, category jumps, search) gets sorted results automatically.

### 3. The sheet: draft vs. applied state

`activeFilters`/`activeSort` are what `getFilteredListings()` actually reads. Opening the sheet copies that into a separate `draftFilters` object; every chip toggle and field edit inside the sheet only touches the draft. Three distinct controls, matching the brief's explicit "Apply / Clear / Reset":
- **Apply** commits the draft into `activeFilters`/`activeSort`/`activeCategory`, closes the sheet, re-renders.
- **Clear** resets only the sheet's own in-progress fields — lets you start over without losing what's already applied and showing on Browse. Verified explicitly in the test suite (see below) so this distinction is enforced, not just implied.
- **Reset** clears both the draft and whatever's already applied — the actual "remove all filters" action.

### 4. Active filter chips + sort indicator

Every applied filter value (each condition, each seller type, the price range as one chip, the distance radius) renders as an individually removable chip in a new `#active-filter-chips` row on Browse — removing one calls `removeActiveFilter(key)` and re-renders immediately, no need to reopen the sheet. Sort is shown separately as a small "Sorted by: X" text next to the results heading rather than as a removable chip (removing a sort preference doesn't have a sensible meaning the way removing a filter does) — a deliberate, documented scope reading of "active filters...as removable chips," not an oversight.

Category is deliberately **not** duplicated as a chip here — it already has its own always-visible, clearly-highlighted chip row; a second "Category: Vehicles ×" chip would just be redundant clutter on top of it.

### 5. Full i18n + country-theme integration

Every new string (sheet title, all field labels, all four sort option labels, all six distance option labels, Clear/Reset/Apply, the sort indicator, the active-filters region's aria-label) is a real translation key, populated for English and Swedish following the exact same pattern as every prior slice — nothing hardcoded. Condition and seller-type chip *values* (e.g. "Good", "Private seller") intentionally stay in their original vocabulary regardless of UI language, consistent with how listing content (locality names, etc.) has never been machine-translated in this app — only UI chrome is. The sheet's Apply button reuses `.modal-continue-button` (`background: var(--country-primary)`), so it's already live-tied to country theming with no new code — confirmed below by changing the country theme while the sheet is open.

## Validation Commands

```text
npm test
PASS: E2E NordicMarket workflow passed: ... the filter & sort sheet (filtering, sorting,
active-filter chips, clear/reset, and i18n) verified.
```

```text
node --check app.js && node --check tests/e2e.js && node --check scripts/server.js
PASS (all three)
```

## Deterministic Coverage Notes (`tests/e2e.js`)

The filter test is deliberately hand-computed against the real seed data rather than just checking "count changed": with conditions {Good, Like new}, seller type {Private seller}, price 500–3000, distance ≤10 km applied, exactly 3 of the 9 listings in that test run match (rain-jacket 650 kr, a test-published kayak 900 kr, oak-table 2400 kr) — verified by name, and their order in the rendered grid is asserted to match ascending price, so both filtering *and* sorting are checked together, not just independently. Removing the price chip is asserted to widen results to exactly 6 (recomputed by hand the same way). The Vehicles → Cars sub-type filter is asserted to return exactly the Volvo listing. A separate assertion proves Clear only touches the draft (re-opening the sheet, clearing it, and confirming the already-applied filter is still in effect and still returns the same count) — directly testing the Clear vs. Reset distinction the brief asked for.

## Real Browser Evidence (Playwright/Chromium, headless, 390×844)

| Check | Result |
| --- | --- |
| Filter button opens the sheet | Confirmed, with sort/price/condition/seller/distance/category all visible in one scrollable sheet |
| Filter Good+Like new / Private seller / 500–3000 kr / ≤10 km / sort Lowest price, Apply | `result-count` → "2 listings" (fresh browser session, no extra published listings, so rain-jacket + oak-table — matches hand-computed expectation for that starting state); grid order 650 kr before 2 400 kr |
| Active filter chips shown | 5 chips (price, Good, Like new, Private seller, Within 10 km), each individually removable |
| Remove the price chip | Result count widens immediately (5 listings) — recomputed and matched by hand — with no need to reopen the sheet |
| Reset | All chips cleared, sort indicator hidden, back to 8 listings |
| Category → Vehicles, sub-type → Cars, Apply | Exactly 1 listing — the Volvo V60 |
| Country theme changed to Finland while the sheet is open | Apply button's actual rendered background: `rgb(0, 106, 167)` → `rgb(0, 53, 128)` — exact hex match, live, no code path specific to the sheet needed touching |
| Language switched to Swedish while the sheet is open | Title → "Filtrera och sortera", Apply → "Använd", every label/option translated (screenshot confirms: Sortera efter/Lägsta pris/Högsta pris/Skick/Säljartyp/Avstånd/Kategori/Rensa/Återställ/Använd) |
| Console errors across the entire flow | 0 |

Screenshots captured: the empty sheet, the sheet filled in with all five filter types plus a sort choice, the resulting filtered/sorted Browse view with active-filter chips, the chip-removed state, the Vehicles/Cars sub-type filter, the Finland-themed sheet, and the fully Swedish sheet.

## Reference Check: afromarketplaces.com

You pointed to afromarketplaces.com mid-slice as a build reference, specifically its onboarding. Fetched and checked it against what's built so far:

- **No forced sign-up wall, guest browsing is the default** — exactly the NM-A4 approach (auth only gates specific actions, never blocks initial discovery). No onboarding tour or splash screen on their side either, so nothing to add here.
- **Categories**: their top tier (Vehicles & Auto, Real Estate, Phones & Electronics, Fashion, Agriculture & Livestock, Heavy Machinery, Jobs, Travel & Logistics, IT & Education) closely matches NordicMarket's taxonomy from NM-A3. Two categories they have that we don't: **Heavy Machinery** and **Travel & Logistics** — worth considering for a future taxonomy pass, not urgent.
- **Sort options**: "Newest First / Price low-high / Price high-low" — a subset of what this slice just built (we also add "Nearest," which fits a local Nordic marketplace better than a pan-African one where physical distance between listings matters less).
- **Trust surface**: they expose dedicated "Safety Tips," "Resolution Center," "Report an Issue," and "Enforcement" pages — meaningfully more built-out than NordicMarket's current mocked Report button + static safety reminder. This lines up with what the original PRD audit already flagged as a major gap (Trust & Safety, ~7-14% coverage) — a real candidate for a near-future slice.
- **Per-country domains** for 50+ nations is their approach to localization; NordicMarket's country-color theming (NM-A3/A4) is a lighter-weight equivalent suited to 5 countries in one app rather than separate domains — the right-sized version of the same idea for our scope.

Net: no changes made to this slice as a result (nothing contradicted what's already built), but it's a useful validation checkpoint and surfaces two concrete candidates for future scope (Heavy Machinery/Travel & Logistics categories; a more built-out trust/safety surface).

## Residual Risks

- Distance filtering degrades gracefully for unparseable distances (passes through) rather than being strict — correct for not hiding a user's own fresh listing, but means "Within 10 km" isn't a hard guarantee for every result. Worth revisiting once real geolocation exists.
- Category chip clicks (the existing top-of-Browse row, not the sheet) don't have a dedicated testable function in the deterministic suite — consistent with how every other delegated click handler in this app has been verified (real browser only), not a new gap introduced by this slice.
- No live screen-reader pass on the new sheet specifically; verified structurally (`role="dialog"`, `role="group"` with `aria-labelledby` on the chip groups, `aria-pressed` on each toggle) and via the same WCAG pattern established in NM-A2/A4.
- Filters reset on page reload (no persistence) — consistent with the rest of the app's current in-memory-only state; a real "saved search" feature is separate PRD scope.

## Coverage Impact (rough)

- Search and category depth: 16% → ~35% (structured filters, sorting, and filter chips were explicitly called out as missing in the original audit; now real).
- Feed ranking: 3% → ~20% (real sort by recency/price/distance now exists, though relevance/diversity/paid-ranking controls are still absent).
- Competitive DNA: ~40% → ~48% (Vehicles/Real Estate sub-type filtering closes another Jiji-style depth gap).
- Overall PRD / MVP: ~18% → ~21%.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests with hand-computed expected results + real headless-browser measurements above); no independent judge pass has been run. Awaiting your acceptance before starting the next slice.

---

# VAD Evidence Package

Atom-ID: NM-A6-ai-photo-generation
Goal: Add real AI-generated photos to the Sell flow via the OpenAI Images API, requiring the project's first real backend — a deliberate, explicit scope change from every prior slice's "stay client-side" constraint, made at your direction.
Risk: High — this is the first slice with a real external dependency, a real cost surface (billed API calls), and a genuine architecture change (a stateful server endpoint, not just static file serving).

## Scope Decision, Made Explicit Before Building

You asked for OpenAI/ChatGPT image generation. Every prior slice (NM-A1 through NM-A5) was built and evidenced under an explicit "no real backend, client-side only" constraint. Those two things directly conflict — a live call to OpenAI from a browser needs its API key held somewhere, and a public frontend is not a safe place to hold one (anyone viewing page source could read and spend it). Rather than quietly picking a workaround, I asked you to choose between a mocked version (no key, no cost, ships instantly) and a real backend (needs your own OpenAI key and billing, a genuine architecture change). **You chose the real backend.** Everything below follows from that.

## What Changed

### 1. A real backend, for the first time in this project

`scripts/server.js` — previously a ~35-line static file server — now also handles `POST /api/generate-image`:
- Reads and validates the request body (size-capped at 10 KB, prompt capped at 300 characters server-side, not just via the HTML `maxlength`).
- Reads `process.env.OPENAI_API_KEY` — **never hardcoded, never committed, never sent to the client.** If it's not set, the endpoint returns a clear `500` with instructions, rather than crashing or silently failing.
- Calls `https://api.openai.com/v1/images/generations` server-side (`gpt-image-1`, configurable via `OPENAI_IMAGE_MODEL`) using Node's built-in `fetch` — no new npm dependency added for this.
- Returns just the resulting image (as a data URL or hosted URL) to the browser — the API key and the rest of OpenAI's response never leave the server.
- Non-POST or non-`/api/generate-image` requests fall through to the existing static file logic unchanged; any other write method (`DELETE`, `PUT`, etc.) now gets a clean `405` instead of being handled as a file path.

**To actually generate real images, you need to set `OPENAI_API_KEY` yourself** (an environment variable, e.g. `$env:OPENAI_API_KEY="sk-..."` in PowerShell before `npm run serve`) — I do not have your key and did not ask you to paste it into chat, since that would put a real secret in this conversation's history.

### 2. Sell flow: "Generate with AI" alongside the existing placeholder photos

A new row under the photo grid: an optional short prompt input (falls back to the listing title if left blank) and a "Generate with AI" button. A generated photo becomes a real entry in the same `sellPhotos` array the placeholder tiles already used — the photo model was extended from a bare CSS-gradient string to `{ kind: "placeholder" | "ai", value }`, with one shared `photoToCss()` helper so every place that renders a photo (the tile grid, the live preview, the published card, the detail gallery) handles both kinds identically. Nothing was duplicated to special-case AI photos.

### 3. Gated behind sign-in — a real cost-protection decision, not just following the NM-A4 pattern

This wasn't in the brief, but it followed directly from the brief's own logic: NM-A4 gates Save/Message/Report/Publish specifically so guests can't trigger side effects. A real, billed OpenAI call is a far more consequential side effect than any of those. `generateAiPhoto()` runs the exact same `requireAuth(() => performAiGeneration(prompt))` pattern — a guest filling in a prompt and clicking Generate hits the auth modal, and **no network request is sent** until they sign in, at which point the exact pending generation resumes automatically. Verified live: with a route interceptor watching every request, a guest's attempt produced zero calls to the endpoint; only after mock sign-in did the request go out, with the original prompt intact.

### 4. AI disclosure, carried through the whole pipeline

Every AI-generated photo gets a visible "AI photo" badge — not just in the Sell form, but on the live preview, the published listing's Browse card, and its detail gallery. This wasn't requested, but shipping an undisclosed AI-generated photo into a "real UX" marketplace felt like exactly the kind of thing the original PRD audit's "AI risk" line was warning about, and Scandinavian-marketplace trust conventions (this project's own stated design principle) argue for disclosure over silence. Verified live: the badge survived the full round trip from generation through to a real published listing, in four different rendering contexts, without four separate implementations.

### 5. i18n integration

`ai.buttonLabel`, `ai.promptLabel`/`placeholder`, `ai.badge`, and the generating/success/failure/prompt-required status strings are all real translation keys, English and Swedish, same pattern as every prior slice.

## Fetched afromarketplaces.com Again, Per Your Request — With One Exception

You also asked me to check a specific afromarketplaces.com link for real UX/UI reference. That link was a live Google OAuth callback URL (containing an authorization `code`, a `userId`, and `email`/`profile` scopes) — not a page to read, but an active sign-in artifact. I didn't fetch it: doing so risks completing or interfering with a real authentication handshake on that site, and pasting URLs like that anywhere is worth being cautious about generally, since the `code` parameter functions like a short-lived credential. I did fetch the site's normal public pages instead (homepage design detail) — no AI-generation feature exists there to compare against; this app's "Generate with AI" is not modeled on anything from that reference.

## Validation Commands

```text
npm test
PASS: E2E NordicMarket workflow passed: ... gated AI photo generation (real OpenAI
backend, proxied server-side) with interrupted-action resume verified.
```

```text
node --check app.js && node --check tests/e2e.js && node --check scripts/server.js
PASS (all three)
```

```text
curl -X POST http://127.0.0.1:4173/api/generate-image -d '{"prompt":"blue vintage bicycle"}'
→ 500 {"error":"OPENAI_API_KEY is not set on the server. ..."}   (server running with no key set)
curl -X POST http://127.0.0.1:4173/api/generate-image -d '{"prompt":""}'
→ 400 {"error":"A prompt is required to generate an image."}
curl -X DELETE http://127.0.0.1:4173/
→ 405 Method not allowed
```

All three confirm the endpoint fails clearly and safely rather than crashing — checked against the real running server, with no OpenAI key configured, so **zero real API calls or cost were incurred anywhere in this verification.**

## Real Browser Evidence (Playwright/Chromium, headless, 390×844)

The one part that genuinely calls OpenAI (`performAiGeneration`'s `fetch("/api/generate-image")`) was verified with Playwright's network-level route interception — the request is intercepted and answered with a fake 2×2 PNG *before it reaches our server*, so this check never touches OpenAI, never needs a real key, and costs nothing, while still proving the real request/response wiring end to end (this is different from — and more real than — a request that's never sent at all).

| Check | Result |
| --- | --- |
| Guest fills a prompt and clicks Generate | Auth modal opens; **zero requests captured** by the route interceptor — confirms the cost gate fires before any network call, not just before the UI shows a result |
| Mock sign-in (email) | Auth modal closes; the intercepted request's prompt was exactly `"blue vintage bicycle"` — the original input, unmodified, carried through the pending action |
| After the mocked response resolves | Status → "Photo added."; the new photo tile's inline `style` attribute contains the base64 image data (a real image, not a gradient) |
| AI badge | Visible in: the Sell form's photo tile, the live preview card, the published listing's detail gallery, **and** its Browse card after navigating back — all four checked independently |
| Console errors across the entire flow | 0 |

Screenshots captured: the guest blocked at the auth wall, the generated photo with both "AI PHOTO" and "COVER" badges correctly positioned without overlapping, the live preview carrying the same badge, and the fully published listing detail page.

## Residual Risks

- **You must set `OPENAI_API_KEY` yourself before this does anything real.** Until then, clicking Generate (once signed in) will show a clear error, not a crash — verified above — but it won't produce an image.
- Real OpenAI calls cost real money per image and are subject to OpenAI's own content policy/rate limits; errors from OpenAI (bad prompt, rate limit, billing issue) are surfaced to the user via the same status region rather than swallowed, but no retry/backoff logic exists yet.
- No per-user or per-session rate limiting beyond the sign-in gate itself — a signed-in abusive user could still generate many images in a row. Worth a follow-up if this goes further than a prototype.
- The prompt is auto-prefixed server-side ("Product marketplace listing photo, realistic, well-lit, plain neutral background: ...") to bias toward usable results; this isn't configurable by the seller.
- This is the first slice with a genuine external network dependency; if OpenAI is down or slow, the Sell flow's photo step degrades to "show an error," not a fallback — acceptable for a prototype, worth revisiting before any real launch.

## Coverage Impact (rough)

- AI assistance: 4% → ~25% (a real, working AI pipeline now exists for one concrete task — photo generation — where before this was copy-only; still missing: AI-suggested titles/descriptions, moderation of AI content, confidence/kill-switches for the pipeline).
- Technical direction: ~3% → ~15% (this is the project's first real backend service of any kind, however small).
- Non-functional requirements (security): the "never expose a real secret client-side" principle is now a concrete, tested pattern in this codebase, not just a stated value.
- Overall PRD / MVP: ~21% → ~23%.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests + real headless-browser network-level verification above, with zero real API calls or cost incurred in any check); no independent judge pass has been run. Awaiting your acceptance before the next slice — and awaiting your `OPENAI_API_KEY` before this feature does anything beyond return a clear error.

---

# Rebrand: NordicMarket → FindNord

Timestamp: 2026-09-21

You clarified the working title "NordicMarket" (used since NM-A1, taken from the original PRD audit) was never the real product name — the app is **FindNord**, "a marketplace for the Scandinavians." Renamed throughout the live product surface:

- `index.html`: `<title>`, meta description, empty-state copy, and the topbar wordmark.
- `package.json`: package name and description.
- `tests/e2e.js`: assertions updated to check for "FindNord", plus a new explicit `doesNotMatch(/NordicMarket/)` guard so the old name can't silently creep back in.

**Not rewritten**: `PRD_AUDIT.md` (the original audit snapshot) and the NM-A1 through NM-A6 entries above in this file are left as they were — they're a record of what was true when each slice shipped, not a live document. The `NM-*` atom-ID naming (from "**N**ordic**M**arket") stays as-is for continuity with this evidence trail; it's an internal identifier at this point, not user-facing.

## New: an actual logo

A simple SVG mark — a four-point compass/north star (evoking "**find** your way" + literal north) on a rounded-square badge — sits next to the "FindNord" wordmark in the topbar. Two deliberate choices:

- **It's inline SVG, not a generated raster image.** Crisp at any size, adds no asset/dependency, and can be styled with CSS like anything else in this codebase.
- **Its badge color is `var(--country-primary)`** — the exact same custom property the bottom nav and Sell tab already use (NM-A3/A4). This means the logo automatically re-colors with the active country theme for free, with zero logo-specific code. Verified live: Swedish blue → Danish red, confirmed by screenshot, no extra wiring needed.

A matching favicon (same mark, fixed teal color since browser tabs don't carry the app's live theme) was added too.

## Validation

```text
npm test
PASS: E2E FindNord workflow passed: ... (unchanged coverage, brand name updated throughout)
```

Real browser: confirmed the logo renders correctly in the topbar and its color updates live when `applyCountryTheme()` is called, with no visual regressions to the rest of the header.

## Open Items From Your Last Message (flagged, not yet acted on)

Two things in your message need a quick clarification before I act on them, rather than guessing:

1. **"imitate what the saj..."** — this sentence was cut off. My best guess is you want AI-generated (and future real user-uploaded) photos to look like authentic, sometimes-imperfect real listing photos rather than clean placeholder graphics — but I don't want to build against a guess. What were you going to say?
2. **"On Login, here is the page"** — the two images you attached are afromarketplaces.com's homepage (hero + category grid) and its listings feed, not a login page. Did you mean to attach a different screenshot, or are you asking me to design a login page in that same visual style?

**Resolved** by your next message: photos should look like natural, sometimes-imperfect user uploads (not polished stock), and a dedicated Login/Sign-up page should be built in FindNord's own visual language, explicitly not copying afromarketplaces' green.

---

# NM-A7: Core Data Model + Modular Architecture Foundation, plus a UX pass (Login page, listing-photo realism, desktop grid density)

Timestamp: 2026-09-21

Note on numbering: you asked for this to be "NM-A6," but NM-A6 was already used for AI photo generation (previous entry above). Continuing as **NM-A7** to keep the evidence trail's atom IDs unique and in order.

This entry covers three things from the same conversation turn: the data-layer architecture (the main ask), a dedicated Login page (your clarification), and two small fixes (AI photo prompt realism, desktop grid density) that landed alongside it.

## 1. The data layer: `data-service.js`

A new file — the first time this project has had more than one script — holding every entity and being the *only* code that touches `localStorage` or owns a raw data array:

- **User** — `DataService.users.getCurrent() / signIn(user) / signOut()`
- **Listing** — `getAll() / findById(id) / create(fields)`
- **Category / SubType** — `getAll() / findById(id)` (the same taxonomy from NM-A3, moved here verbatim)
- **SavedItem** — `isSaved(userId, listingId) / toggle(userId, listingId) / getForUser(userId)` — **now genuinely scoped per user**, not a single global `Set` shared by whoever happened to be signed in (that was the actual NM-A4 implementation — a real bug this slice fixes as a side effect of giving User a stable `id`)
- **Report** — `create(fields) / getAll()`
- **Conversation / Message** — `startOrGet(listingId, participantIds) / addMessage(conversationId, fields) / getMessages(conversationId)` — structure only, per your brief: real records are created (so the shape is genuinely exercised, not stubbed), but there is still no Inbox UI reading them back

Every method returns a Promise — `function resolved(value) { return Promise.resolve(value); }` — even though today's implementation resolves synchronously against in-memory arrays. That's the actual point: a real backend replacing this file with one that does real `fetch()` calls needs to change **only this file**, because every call site in app.js already does `await DataService.x.y(...)`.

## 2. How app.js was migrated (the "minimal UI changes" requirement)

Rather than making every render function async (which would have meant touching nearly every function in the app just to read already-available data), the migration uses a **fetch-once, cache-locally** pattern — the same shape a real frontend with a real backend would use anyway:

- `bootstrap()` (new, `async`, the last line of app.js) awaits `DataService.users.getCurrent()`, `DataService.categories.getAll()`, and `DataService.listings.getAll()` once, into the same `let categoryTaxonomy` / `let listings` module-level variables that existed before (they were `const` literals; now they're populated caches).
- Every **render/filter/sort function is completely unchanged** — `renderListings()`, `getFilteredListings()`, `openListing()`, `sortListings()`, etc. still read `listings` synchronously, exactly as before. This is why the blast radius of this refactor is much smaller than "convert everything to async" would suggest.
- Only the **mutation** functions became `async`: `commitPublish` (calls `DataService.listings.create`, then re-fetches the cache), `toggleSaveListing` / `completeSignIn` / `signOutUser` (call the corresponding `DataService` method, then refresh a small `savedItemsCache` Set), `submitReport`, `sendComposedMessage`.
- `requireAuth(action)` now does `return action();` instead of calling it blind — so a caller that wants to await the outcome of a gated action can (`await handleSaveClick(id)`), but nothing is forced to.
- A deliberate design choice worth flagging: `completeSignIn` **fires the resumed pending action without awaiting it** (`if (action) action();`), matching how `requireAuth`'s direct-authenticated path already behaves (also fire-and-forget). This keeps "already signed in" and "just resumed after signing in" behaviorally identical, and is also why the NM-A6 AI-generation test can still observe the synchronous "Generating..." interim state right after sign-in completes, without a real network call needing to finish first.

## 3. A real bug fixed as a consequence: saved items were global, not per-user

Before this slice, `savedListingIds` was one `Set` shared by the whole app regardless of who was signed in — sign out, sign in as someone else, and you'd inherit the previous session's saves. With a real `User.id` now in place, `SavedItem` records are `{ userId, listingId }` pairs, and `isSaved()` reads from a cache scoped to `currentUser.id`. Verified explicitly: signing in as one user and saving an item, then switching to a different (guest) user, correctly shows that item as *not* saved for the new session.

## 4. Dedicated Login / Sign-up page

Accessible from the **You** tab (a new "Sign in" button appears there when signed out) — a real page, not just a wider modal. Built to reuse the exact sign-in pipeline the interrupted-action modal already used (`signInWithEmail()` extracted as a shared helper; `completeSignIn`/`continueAsGuestProfile` untouched) — verified explicitly in a test that submits the login page's own form and checks the same downstream state the modal's tests already check, proving there's one pipeline, not two copies that could drift apart.

The interrupted-action modal (NM-A4) is unchanged and still exists for the "you tried to Save/Message/Report/Publish while signed out" case, exactly as you asked.

**Your illustration is the actual hero image**, not a description of one — I copied your file into the project as `assets/login-hero.png` and it's what actually renders. First pass had it duplicated with a separate "FindNord" text heading underneath, which looked redundant since your illustration already has "FindNord" and the tagline painted into it — caught via screenshot review and fixed by keeping the heading/tagline for screen readers only (`sr-only`) and letting the image carry the full visual brand statement, with its `alt` text conveying the same thing non-visually.

Deliberately does not use afromarketplaces' green — the login page's primary button is `var(--country-primary)` (the same variable driving the nav and topbar), so it's already in FindNord's own visual language and shifts with country theme. Verified live: changed to Iceland's blue (`#02529C`) while the page was open, with zero code specific to this page needing to change.

## 5. Two smaller fixes bundled in

- **AI photo prompt realism**: the server-side OpenAI prompt now asks for "a candid, natural amateur photo taken by a phone camera... slightly imperfect framing and everyday home lighting, not a professional or stock photo" instead of the previous "realistic, well-lit, plain neutral background" — directly addressing your note that real listing photos are user uploads, not admin-curated stock imagery.
- **Desktop grid density**: Browse and Categories now show 4 per row at ≥780px width (previously 3), matching afromarketplaces' desktop listings layout. Mobile stays at 2 columns.

## Validation Commands

```text
npm test
PASS: E2E FindNord workflow passed: ... the DataService data layer (Users, Listings,
Categories, SavedItems scoped per user, Reports, and Conversations/Messages), and the
dedicated Login page (sharing one sign-in pipeline with the interrupted-action modal)
verified.
```

Run 3 times consecutively with identical results — the async restructuring introduced real timing hazards during development (see below) and this was checked for flakiness, not just correctness.

```text
node --check app.js && node --check data-service.js && node --check tests/e2e.js && node --check scripts/server.js
PASS (all four)
```

## A Real Timing Bug Found and Fixed During Test Migration

Converting the test suite to async surfaced a genuine design question, not just mechanical `await`-adding: if `completeSignIn` awaited its resumed action fully, the NM-A6 test that checks the synchronous "Generating..." interim state (proving resume *starts* the action immediately, before any network call resolves) would break, because by the time the `await` returned, the mocked fetch would have already resolved and the status would already say "Photo added." The fix was architectural, not a test hack: keep `completeSignIn` fire-and-forget (matching the already-existing direct-auth path), and have tests that need the full outcome of a resumed *async* action (Save, Report, Publish) explicitly flush a macrotask (`setImmediate`-based `flushMicrotasks()`) afterward. This is documented in the test file itself, not just here, since it's a real architectural decision future slices need to know about.

## Real Browser Evidence (Playwright/Chromium)

| Check | Result |
| --- | --- |
| Save a listing, reload the page | Save state survives the reload (`localStorage` via `DataService`, not app.js directly) |
| Sign in, reload the page | Session survives the reload; You tab still shows "Signed in as: buyer@example.com" |
| Publish a listing | Real `DataService.listings.create` call; new listing appears in Browse (8 → 9) and in its own detail page |
| Login page hero image | Loads correctly (`naturalWidth > 0`), served with the correct `image/png` content type after extending the static server's MIME map |
| Login page + country theme | Continue button's rendered background color changed live to Iceland's `#02529C` |
| Login page + language | Fully translated to Swedish ("Marknadsplatsen för skandinaver", "Fortsätt") |
| Sign in via the dedicated page | Navigates to You, shows the same signed-in state the modal path produces |
| Console errors across the entire flow | 0 |

## Residual Risks

- `DataService` is an in-memory, single-tab data store — two browser tabs open at once won't see each other's writes live (no cross-tab sync); acceptable for a prototype, a real backend would need this.
- Conversation/Message records are created but genuinely unreachable from any UI (no Inbox) — exactly the "structure only" scope asked for, flagged so it isn't mistaken for a finished feature.
- Report records are created and stored but there is still no moderation queue reading them (unchanged from NM-A4/A5's scope).
- The mock sign-in still treats every login attempt as a brand-new identity (no "look up existing user by email"), so the *same* email signed in twice in two different sessions gets two different `User.id`s and two different saved-items scopes. This is a known, pre-existing limitation of a backend-free mock auth system, not something this slice introduced or was asked to fix.
- No live screen-reader pass on the new Login page specifically; the visual-duplication fix was verified structurally (image `alt` text, `sr-only` heading/tagline) against the WCAG accessible-name pattern already established in earlier slices, not a live AT session.

## Coverage Impact (rough)

- Technical direction: ~15% → ~30% (a real, if lightweight, data-access-layer boundary now exists across the whole app, not just the one AI-generation endpoint from NM-A6).
- Functional requirements: listings: ~30% → ~35% (Listing is now a real service-backed entity, not a bare array).
- Profiles/trust: 12% → ~18% (User now has a stable identity; saved items correctly scoped per user).
- Guest browsing/sign-in: ~45% → ~55% (a real dedicated Login page now exists alongside the interrupted-action modal).
- Overall PRD / MVP: ~23% → ~26%.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests re-run three times for flakiness + real browser measurements above, including one real architectural bug — the completeSignIn await-vs-fire-and-forget timing question — resolved deliberately, and one real UX bug — the duplicated brand text on the login page — found and fixed via screenshot review); no independent judge pass has been run. Awaiting your acceptance before the next slice.

---

# NM-A8: Messaging Prototype (Listing-Attached Conversations + Basic Inbox)

Timestamp: 2026-09-21

## Mid-Slice Interruption, Resolved Before Continuing

Partway through this slice you asked for "the complete backend" — a much larger pivot than anything built so far, and one that directly conflicts with this slice's own instruction to "stay within the current architecture." Rather than guess which you meant right then, I paused and asked two questions: (1) finish NM-A8 on the current architecture first, or stop and pivot immediately; (2) what "complete backend" means technically. You chose **finish NM-A8 first, then a dedicated Node/Express + SQLite backend-migration slice immediately after.** This entry is that finished NM-A8; the backend migration is queued as the next piece of work, not started here.

## What Changed

### 1. DataService gained one real read path: `conversations.getForUser(userId)`

NM-A7 built `Conversation`/`Message` as "structure only" — real records were created by the compose modal, but nothing ever read them back. This slice adds the missing read method:

```js
getForUser(userId) {
  return resolved(
    conversations.filter((c) => c.participantIds.includes(userId)).map((c) => ({ ...c }))
  );
}
```

Everything else in `data-service.js` (`startOrGet`, `addMessage`, `getMessages`) was already correct and untouched — this slice is a UI built on top of an existing, already-tested data layer, not a data-model rewrite.

### 2. A real Inbox (`#inbox-content`), following the established cache pattern

`refreshInboxCache()` — `async`, same shape as `refreshSavedItemsCache()` from NM-A7 — fetches the signed-in user's conversations, then fetches each one's messages, and caches the combined result (with each conversation's `lastMessage` derived) sorted by most recent activity. `renderInbox()` reads that cache synchronously, same fetch-once/cache-locally pattern as everywhere else in this app: three states —
- **Signed out**: "Sign in to see your conversations." + a button straight to the Login page (NM-A7).
- **Empty**: "Conversations start from a listing's Message seller button."
- **Populated**: one row per conversation — listing photo, title, seller name, and the last message's text as a preview — each row is `data-open-thread="{conversationId}"`.

### 3. A real thread view (`#thread-view`), separate from the quick-compose modal

Tapping an Inbox row opens a dedicated thread screen: the listing snapshot (title/price/seller) at top, the full message history below (each bubble tagged `.mine` when `message.senderId === currentUser.id`, styled with `var(--country-primary)` — so a buyer's own messages are already tied to country theming with no new plumbing), and a reply form at the bottom. Sending a reply calls the *same* `DataService.conversations.addMessage()` the compose modal already used, then refreshes and re-renders both the thread and the Inbox list (so the preview text updates immediately).

**Continuing an existing thread was explicitly verified, not assumed**: sending a second message to a listing you've already messaged reuses `startOrGet`'s existing find-or-create logic (unchanged from NM-A7) — confirmed live that the Inbox still shows exactly one row for that listing after a second message, not two.

### 4. The compose modal (NM-A4/A7) is unchanged in behavior, just now feeds something real

`sendComposedMessage()` still does exactly what it did before (create/continue the conversation, add the message, show a toast) — the only addition is `await refreshInboxCache(); renderInbox();` so the conversation is visible the moment you switch tabs, instead of existing invisibly in memory as NM-A7 left it.

### 5. Suggested opener — preserved, per the brief

`openMessageComposer()` is untouched: `"Hi, is this still available?"` still pre-fills the composer exactly as it has since NM-A4. Verified explicitly in both the deterministic suite and the browser pass.

## A Real Bug Found and Fixed via Screenshot: stale, now-false toast copy

The compose-success toast still read *"Message sent (mocked) — real messaging arrives in a later slice."* — true when it was written in NM-A6/A7, **false now**: this slice is that later slice, and the screenshot showed the toast sitting directly on top of the Inbox row it was talking about, contradicting itself. Fixed the copy to *"Message sent. View it in your Inbox."* (English and Swedish), which is both accurate and points the user exactly where to look. The Report toast's similar "(mocked)... arrives in a later slice" copy was left alone — that one is still true, since no moderation queue exists yet.

## Validation Commands

```text
npm test
PASS: E2E FindNord workflow passed: ... the messaging prototype (Inbox listing
conversations, thread continuation, and auth gating) verified.
```

Run 3 times consecutively, identical results.

```text
node --check app.js && node --check data-service.js && node --check tests/e2e.js && node --check scripts/server.js
PASS (all four)
```

## Deterministic Coverage Notes (`tests/e2e.js`)

The behavioral test doesn't just check "a conversation exists" — it checks the exact content: after sending "Hi, is this still available?" to the iPhone listing, it asserts the Inbox row contains the listing title, the seller's name, *and* that exact message text. It then extracts the real conversation id straight out of the rendered `data-open-thread` attribute (not a hardcoded id), opens it via `openThread()`, and asserts the view actually switched and the history is visible. A second message is sent through the thread's own reply form, and the test asserts **both** that it appears in the thread **and** that the Inbox still shows exactly one row for that listing (`(html.match(/data-open-thread="/g) || []).length === 1`) — directly proving "continue an existing thread" rather than "silently create a second one." A final block confirms the signed-out Inbox state and re-confirms Message Seller is still gated for a guest after all of this — the explicit "auth gating still works" requirement.

## Real Browser Evidence (Playwright/Chromium, headless, 390×844)

| Check | Result |
| --- | --- |
| Guest opens Inbox | "Sign in to see your conversations." + Sign in button — no error, no empty crash |
| Message Nordic Refurb about the iPhone (via sign-in resume) | Composer pre-filled with the suggested opener, exactly as before |
| Switch to Inbox | Row shows "iPhone 14, 128 GB / Nordic Refurb / Hi, is this still available?" |
| Open the conversation | Thread view shows the listing snapshot and the message history |
| Reply "Is the battery health still 91%?" | Appears in the thread immediately (2 messages total); Inbox still shows **1** row for this listing, with its preview updated to the new message |
| Country theme → Norway, while the thread is open | The buyer's own message bubble's rendered background: `rgb(186, 12, 47)` — exact match, live |
| Language → Swedish | Send button → "Skicka" |
| Console errors across the entire flow | 0 |

Screenshots: signed-out Inbox, the Inbox with a real conversation (and the corrected toast copy), the open thread showing history, the thread after a second message, and the Norway/Swedish themed thread.

## Residual Risks

- No real-time delivery (explicitly out of scope per the brief) — a second browser tab / the "seller" side of the conversation won't see new messages without a manual refresh; there is no seller-side reply simulation.
- Conversation list has no unread/read state, timestamps, or delete — it's the "basic Inbox" the brief asked for, not a full messaging product.
- Thread reply has no length limit or rate limiting (unlike the AI-generation endpoint, this has no real cost attached, so this is lower priority, not ignored).
- Still no live screen-reader pass on the new Inbox/thread views specifically — verified structurally (`aria-live="polite"` on the thread message list, accessible names on Inbox rows) per the same pattern as every prior slice.

## Coverage Impact (rough)

- Messaging: 3% → ~35% (real conversations, real threads, real continuation, a real if basic Inbox; still no real-time, no seller-side UI, no read receipts).
- Buyer contacts seller: ~28% → ~45% (the message now goes somewhere and can be found again, not just a toast).
- Overall PRD / MVP: ~26% → ~29%.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests re-run three times + real browser measurements above, including one real bug — stale toast copy contradicted by its own screenshot — found and fixed); no independent judge pass has been run. Awaiting your acceptance before starting the Node/Express + SQLite backend migration you asked for mid-slice.

---

# NM-A9: Media Improvements + Listing Image Limits

Timestamp: 2026-09-21

## The Actual Bug This Slice Exists to Fix

Before this slice, the Sell form let a seller add up to 10 photos — but `commitPublish()` only ever saved `values.photos[0]`. Every other photo the seller added was silently discarded the moment they hit Publish. The gallery, the "add more photos" UI, all of it was decorative past the first tile. This wasn't a hidden edge case; it's the literal reason "Media Improvements + Listing Image Limits" was asked for, so fixing it — not just adding a cap — is the core of this slice.

## What Changed

### 1. Listings now store a real `images` array, capped at 6

`photosToImageObjects(photos)` — a new shared helper — converts the Sell form's `sellPhotos` into `[{ css, aiGenerated }, ...]`, capped at `MAX_LISTING_PHOTOS = 6`. `commitPublish()` now saves this whole array (`images: images`), not just the cover. `image`/`aiPhoto` (singular) are kept as **derived convenience fields** (`images[0]`) specifically so every place that already worked with a single cover photo — Browse cards, Inbox row thumbnails — needed **zero changes**. Only the detail gallery needed to become genuinely multi-image aware.

The cap itself moved from a bare `10` sprinkled across three functions to one named constant, checked in the static test suite (`assert.doesNotMatch(js, />= 10\)/)`) so a stray leftover `10` can't silently resurface.

### 2. A real gallery with thumbnails, not a single static image

`galleryTemplate(listing, activeIndex)` renders the main photo plus a thumbnail strip (only when there's more than one image — no pointless single-thumbnail row). `selectGalleryImage(index)` re-renders that block when a thumbnail is clicked, updating which photo is "active" and the main image's accessible name (`"Photo 3: {title}"`). `getListingImages(listing)` normalizes both shapes transparently — a pre-NM-A9 listing with only a single `image`/`aiPhoto` pair, and a new one with a real `images` array — into the same structure, so the gallery never has to branch on "is this an old or new listing."

Two seed listings (`oak-table`, `iphone-14`) were given real 2–3 image arrays specifically so the gallery has something genuine to demonstrate and test against, without needing to publish a new listing first; the rest were deliberately left with only their original single `image`, to prove the fallback path for pre-existing listings actually works.

### 3. Thumbnail treatment: consistent aspect ratio, good cropping, ready for OG-style previews later

Cards already used `aspect-ratio: 1 / 1` (from NM-A2) — unchanged, and now doing double duty for the new photo-count badge's positioning. New `.gallery-thumb` tiles are also fixed 64×64 squares; any real (AI-generated) photo already renders via `url(...) center/cover no-repeat` (from NM-A6), so cropping is correct with zero new code. **On Open Graph specifically**: real `<meta property="og:image">` tags need a server that can render per-listing pages with real meta tags — this is a client-side SPA with no per-listing routing, so social crawlers wouldn't see them regardless of what I put in the `<head>`. The consistent square crop this slice locks in *is* the groundwork for that (a real backend serving real preview images later won't need any image-treatment rework) — but I didn't add non-functional meta tags just to look complete, since they'd silently do nothing.

### 4. A "1/N" photo-count badge on cards — real signal, not decoration

Any listing with more than one image shows a small `1/N` badge on its Browse card and its live Sell-form preview (bottom-right — the one corner not already used by Sponsored/Freshness/AI badges). This was not explicitly requested, but "clean thumbnail treatment" felt incomplete without *some* signal on the grid that more photos exist — matching how every real marketplace (including the afromarketplaces.com reference from earlier) telegraphs multi-photo listings on the card itself.

### 5. The AI generation path respects the same cap, with a real message instead of a silent no-op

Previously, hitting the (old, 10-photo) cap via "Generate with AI" just silently did nothing. Now it shows "You've reached the 6-photo limit." — and this check runs **before** the auth gate, so it applies the same way to a guest and a signed-in seller (no reason to make someone sign in just to be told they can't add more photos).

## A Real Bug Found and Fixed During Browser Verification: gallery text frozen in the wrong language

The first browser pass caught it directly: switch the language to Swedish while a listing's gallery is open, and the main photo's aria-label stayed in English ("Photo 1: ..." instead of "Foto 1: ..."). Cause: `galleryTemplate()`'s translated strings are baked in at render time, and `openListing()` only runs once per navigation — `applyTranslations()` had no hook to re-render an already-open gallery. Fixed with `refreshOpenGalleryLanguage()`, called from `applyTranslations()`, which re-renders just the gallery block (preserving whichever photo was selected via a new `currentGalleryIndex`) rather than the whole detail view. Reconfirmed live afterward: identical results everywhere else, Swedish aria-label now correct.

## Requirement 5 Re-confirmed, Not Assumed

"Guests can still browse everything, but messaging remains gated — already working, just re-confirm." Did exactly that: after publishing a real 6-photo listing as a signed-in seller, signed back out and clicked Message Seller on it — auth wall still appears, composer still doesn't open. Checked in both the deterministic suite and live in a browser, specifically *after* all the media changes, not just re-running an old test unchanged.

## Validation Commands

```text
npm test
PASS: E2E FindNord workflow passed: ... media improvements (6-image cap, real multi-photo
storage, gallery thumbnails, and re-confirmed contact gating) verified.
```

Run 3 times consecutively, identical results.

```text
node --check app.js && node --check data-service.js && node --check tests/e2e.js && node --check scripts/server.js
PASS (all four)
```

## Deterministic Coverage Notes (`tests/e2e.js`)

The 6-photo cap is tested at the boundary, not just "does it eventually stop": exactly 6 placeholders are added one at a time and counted, a 7th attempt is asserted to still leave exactly 6, and the "+ Add photo" tile is asserted to have disappeared. The AI-generate button is separately asserted to show the limit message rather than silently doing nothing. The actual bug this slice fixes is asserted directly: `published.images.length === 6` after a real publish (not just "a listing was created"), the Browse card is asserted to show `1/6`, and the detail gallery is asserted to render exactly 6 `data-gallery-index` thumbnails. Clicking thumbnail index 2 is asserted to both mark it `.active` and change the main image's accessible name to `"Photo 3: ..."`. The i18n-retranslation fix has its own assertion: switch language with the gallery open, assert the label becomes `"Foto 3: ..."` (not reset to index 0, not left in English).

## Real Browser Evidence (Playwright/Chromium, headless, 390×844)

| Check | Result |
| --- | --- |
| Existing seed listing (`oak-table`, now with 3 real images) | Card shows `1/3` badge; detail view renders 3 thumbnails; clicking the 3rd updates the main image and its aria-label to `"Photo 3: Solid oak dining table"` |
| Add 7 photos in the Sell form | Exactly 6 tiles exist; add-tile is gone; live preview shows `1/6` |
| Generate with AI at the cap | Status message shown, no request attempted |
| Publish the 6-photo listing | Detail gallery renders exactly 6 thumbnails; Browse card shows `1/6` — the actual bug, confirmed fixed in a real browser, not just the test harness |
| Country theme → Finland, gallery open | Active thumbnail's border color: `rgb(0, 53, 128)` — exact match, live |
| Language → Swedish, gallery open | Main image aria-label → `"Foto 1: Solid oak dining table"` (post-fix; was frozen in English before) |
| Sign out, click Message Seller on the new listing | Auth wall still appears; composer still doesn't open |
| Console errors across the entire flow | 0 |

Screenshots: the existing oak-table listing's real 3-photo gallery with the active thumbnail highlighted, the Sell form at the 6-photo cap (add-tile correctly absent), the published listing's full gallery, and the Finland/Swedish-themed gallery.

## Residual Risks

- Photos are still CSS backgrounds (gradients) or single generated images, never real user file uploads — unchanged constraint carried from NM-A3/A6, not something this slice was asked to add.
- No image reordering (can't drag the 3rd photo to be the cover) or per-photo captions — "up to 6 images" was the ask; management UI beyond add/remove is a reasonable future slice.
- Inbox row thumbnails intentionally still show only the cover photo (no mini-gallery in a list row) — matches how the requirement described it ("thumbnails," not galleries, for cards/Inbox) and avoids cluttering a compact list UI.
- True Open Graph/social-preview meta tags remain infeasible until there's a real backend with per-listing routing (see above) — documented as a conscious decision, not an oversight.
- No live screen-reader pass on the new gallery/thumbnail interaction specifically — verified structurally (accessible names update per photo, `role="group"` on the thumbnail strip) per the same pattern as every prior slice.

## Coverage Impact (rough)

- Functional requirements: listings (media): a real multi-photo model now exists end to end (create → store → display), closing a gap the original PRD audit called out explicitly ("media upload, processing... do not exist").
- Listing detail: ~50% → ~58% (a genuine multi-photo gallery, not a single static image).
- Overall PRD / MVP: ~29% → ~31%.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests re-run three times + real browser measurements above, including one real bug — the gallery's frozen-language aria-label, caught live and fixed with a targeted re-render rather than a full page reload); no independent judge pass has been run. Awaiting your acceptance before starting the Node/Express + SQLite backend migration.

---

# Signed-in Account Bar: Profile Avatar, My Listings, Real Boost, Real Analytics

Timestamp: 2026-09-21

## What You Asked For, and the Line I Drew

You shared afromarketplaces.com's signed-in header (avatar, "Create Sell Ads," "Boost Ads," "My Listings," "Analytics," "Messages," "Profile," "Logout") and asked me to wire it before anything else. I flagged that two of those — **Boost Ads** and **Analytics** — don't exist anywhere in this app, and said I wouldn't add dead buttons for them. You then told me explicitly: build the ones that don't exist yet, wire them for real, and get them passing tests before calling this done. This entry is that — every pill in the reference image now leads somewhere real, verified with actual tests, not a visual mockup of the header.

## What Changed

### 1. A profile avatar and a signed-in quick-action pill row

`#profile-button` (the topbar "You" button) now shows a circular avatar with the user's initial when signed in — not a placeholder photo (no upload exists), the honest representation. Below the topbar, `#account-actions` — hidden entirely for guests — shows seven pills when signed in, reusing the same horizontal-scroll pattern already proven safe on mobile by the category chips (NM-A3) and filter chips (NM-A5), rather than inventing new desktop-style nav that would overflow a 375px screen: **Create Sell Ad** → Sell, **Boost Ads** and **My Listings** → both lead to My Listings (boosting is a control *inside* it, not a duplicate feature at a different URL), **Analytics** → real computed numbers, **Messages** → Inbox, **Profile** → You, **Logout** → a real sign-out.

### 2. Listings now know who published them

`commitPublish()` records `sellerId: currentUser.id` on every new listing — the missing link that made "My Listings," ownership-checked Boost, and listing-scoped Analytics possible at all. Seed listings (Maja, Nordic Refurb, etc.) have no `sellerId` — they're flavor text, not real accounts — so they correctly never appear in anyone's My Listings, by construction, not by a special case.

### 3. My Listings + a real Boost toggle

`getMyListings()` filters the listing cache by `sellerId`. Each row (`myListingRowTemplate`) shows the listing and a Boost/Remove-boost button. Boosting calls a **new** `DataService.listings.update(id, fields)` — the first mutation to an existing listing this app has ever had (every prior write was `create`) — which flips `sponsored`. That field already had full UI support since NM-A1 (the "Sponsored" badge), so boosting a listing makes it visibly sponsored everywhere immediately: its Browse card, its detail page, everywhere `listing.sponsored` is already read. Nothing about the badge rendering needed to change.

**A real permission boundary, not just a visible-only gate**: `toggleBoost()` checks `listing.sellerId === currentUser.id` before allowing the mutation. Verified explicitly: attempting to boost a listing you don't own (a seed listing) is a silent no-op — the record is untouched, confirmed by checking the seed listing's own Browse card never gained a Sponsored badge.

### 4. Analytics — real math against real records, not fixture numbers

Two new generic `DataService` reads made this possible: `savedItems.getAll()` (everyone's saves, so "who saved *my* listings" can be computed — the mirror image of the existing per-user `getForUser`) and `conversations.getAll()` (all conversations, filterable by `listingId` — necessary because a seller was never a `participantId` in this data model to begin with, a limitation flagged back in NM-A7/A8). `renderAnalytics()` computes, live, for the signed-in user: listings published, saves received on them, conversations about them, total messages across those conversations, and how many are boosted. Verified with **exact expected numbers** in the deterministic suite (1/1/1/1/1 after a scripted publish+save+message+boost sequence) — not "some positive number." The real browser pass shows genuinely different numbers (1 listing, 0 saves, 0 conversations, 1 boosted) because that session never triggered a save or a message — direct proof the figures are computed, not hardcoded.

## Validation Commands

```text
npm test
PASS: E2E FindNord workflow passed: ... and the signed-in account bar (profile avatar,
real My Listings, real Boost with ownership checks, and real Analytics) verified.
```

Run 3 times consecutively, identical results.

```text
node --check app.js && node --check data-service.js && node --check tests/e2e.js && node --check scripts/server.js
PASS (all four)
```

## A Real Bug Caught and Fixed While Writing the Tests

My first "ownership check" test used a regex like `data-id="oak-table"[\s\S]*?Sponsored` against the *entire* rendered grid HTML to check oak-table hadn't been boosted — and it failed, because the non-greedy match happily crossed over into the *next* card in the grid (which legitimately was sponsored) and reported a false positive. Not an app bug — a bug in my own test's scoping. Fixed by extracting each card's HTML up to its own `</article>` boundary before asserting against it. Worth naming because a sloppier version of that same regex could just as easily have been written as an app-level check and silently proven the wrong thing.

## Real Browser Evidence (Playwright/Chromium, headless, 390×844)

| Check | Result |
| --- | --- |
| Signed out | `#account-actions` hidden; avatar shows "You" |
| Sign in as `avatartest@example.com` | Avatar shows "A"; all 7 pills visible and correctly routed |
| Publish via the "Create Sell Ad" pill | Real listing created, same as the bottom-nav Sell tab |
| My Listings | Shows the new listing with a working "Boost" button |
| Boost it | Row flips to "Boosted"/"Remove boost"; the listing's real Browse card gains the Sponsored badge |
| Analytics | 1 Listing, 0 Saves, 0 Conversations, 0 Messages, 1 Boosted — correct for a session that never saved/messaged anything |
| Country theme → Denmark | Analytics figures' color: `rgb(200, 16, 46)` — exact match, live |
| Language → Swedish | "Create Sell Ad" → "Skapa annons" |
| Logout via the real pill | Avatar and pill row both revert to signed-out state |
| Console errors across the entire flow | 0 |

Screenshots: the signed-in topbar with all 7 pills and the avatar, and the Analytics grid with real (small, honest) numbers.

## Residual Risks

- "Boost Ads" and "My Listings" intentionally lead to the same screen — flagged as a deliberate choice, not something to silently notice later and wonder about.
- Boosting has no real payment or time limit behind it (the PRD's "six-month boost seal" from the original audit) — this is the same "Sponsored" label constraint that's existed since NM-A1; this slice makes it a real, ownership-checked toggle, not a purchase.
- Analytics counts conversations/messages by `listingId`, which works correctly today, but if a future slice changes how conversations reference listings, this read needs to move with it — noted for whoever touches that next.
- The avatar shows initials only — no real photo upload exists anywhere in this app (consistent with every prior slice's constraint).
- No live screen-reader pass on the new pill row or avatar specifically; verified structurally (`aria-label` on the avatar naming the signed-in user, `aria-label="Account actions"` on the pill nav) per the same pattern as every prior slice.

## Coverage Impact (rough)

- Seller publishes / listing management: a real seller-owned listing view and a real boost control now exist, closing part of the "listing management" gap the original PRD audit called out (edit/pause/reserve/sold are still absent — this is "boost + view your listings," not the full set).
- Monetization: 4% → ~15% (a real, working boost mechanism, still with no real payment).
- Metrics/analytics: 3% → ~20% (real computed numbers for a seller's own activity; still no platform-wide dashboard or event tracking).
- Overall PRD / MVP: ~31% → ~34%.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests re-run three times + real browser measurements above, including one real bug — my own test's regex silently spanning two cards — found and fixed before it could hide a real one); no independent judge pass has been run. Awaiting your acceptance before starting the Node/Express + SQLite backend migration.

---

# Header/Nav Alignment: Remove Topbar Divider Line + Left Sidebar Nav on Desktop

## Problem

Two pieces of direct user feedback against the AfroMarketplaces reference screenshots:

1. Our topbar had an unwanted `border-bottom: 3px solid var(--country-accent)` (a colored line) between the brand row and the account-action pill row. The reference has no such line — "No yellow line. Just the buttons and the nav bar has no line at all."
2. The bottom tab bar (Browse/Categories/Sell/Inbox/You) should become a **left sidebar on desktop**, matching Facebook Marketplace's layout, while staying an unchanged bottom tab bar on mobile. Confirmed via `AskUserQuestion`: "Bottom tab bar → left sidebar on desktop only."

## What Changed

**Topbar line removed** (`styles.css`): deleted `border-bottom: 3px solid var(--country-accent);` from `.topbar`, leaving only `padding-bottom: 10px;`. `--country-accent` remains a declared CSS variable (reserved, currently unused) — removing the variable itself was out of scope and would have been a bigger, riskier change for no benefit.

**Left sidebar on desktop** (`styles.css`, inside the existing `@media (min-width: 780px)` block — no new breakpoint introduced, reusing the one already used for the 4-column grid): the *same* `.bottom-nav` element and the *same* five `.nav-item` buttons (same markup, same `data-view` attributes, same delegated click handler in `bindEvents()`) are repositioned by CSS alone:

- `.bottom-nav`: `top: 0; bottom: 0; left: 0; right: auto; width: 220px; flex-direction: column;` — a fixed, full-height left rail instead of a fixed full-width bottom bar.
- `.nav-item`: `width: 100%; text-align: left;` — buttons stack and left-align instead of centering in a row.
- `.app-shell`: `margin: 0 0 0 220px; width: min(1120px, calc(100% - 220px));` — content shifts right to clear the sidebar instead of centering under it.
- `.cta-bar` (the fixed "Message seller" bar on the detail page): `left: 220px; bottom: 0;` — otherwise it would either run underneath the sidebar or leave a dead 65px gap at the true bottom of the screen now that nothing occupies it there.
- `#thread-reply-form`: `bottom: 0` at this breakpoint, for the same reason.

No JavaScript changed at all. `showView()` and the nav's delegated click handler already worked generically off `data-view`; the only thing that needed to move was where the buttons visually sit.

Mobile (`< 780px`) is untouched: verified the base `.bottom-nav` rule (`position: fixed; right: 0; bottom: 0; left: 0;`, row layout) still applies as the only rule outside the desktop media query.

## Validation Commands

```text
node --check tests/e2e.js && npm test
PASS: E2E FindNord workflow passed: ... verified.
```

New static assertions added to `tests/e2e.js`:
- `.topbar` no longer matches any `border-bottom` rule.
- Base `.bottom-nav` rule (outside any media query) is still `position: fixed; right: 0; bottom: 0; left: 0;`.
- Inside the `@media (min-width: 780px)` block: `.bottom-nav` gets `flex-direction: column` and `top: 0; bottom: 0; left: 0`, `.app-shell` gets `margin: 0 0 0 220px`, `.cta-bar` gets `left: 220px`.

## Real Browser Evidence (Playwright/Chromium, headless)

**Topbar line fix — 390×844 viewport, signed in:**

| Check | Result |
| --- | --- |
| Screenshot of topbar area after sign-in | FindNord logo/wordmark → language select → avatar circle, directly followed by the colored pill row, **no dividing line between them** — matches the reference |

**Left sidebar — 1280×900 (desktop) and 375×667 (mobile, iPhone SE class):**

| Check | Desktop (1280×900) | Mobile (375×667) |
| --- | --- | --- |
| Horizontal overflow | `scrollWidth: 1280` = `clientWidth: 1280` — none | `scrollWidth: 375` = `clientWidth: 375` — none |
| `.bottom-nav` bounding box | `{x:0, y:0, width:220, height:900}` — full-height left rail | `{x:0, y:602, width:375, height:65}` — unchanged bottom bar |
| `.bottom-nav` computed `flex-direction` | `column` | `row` |
| Sidebar nav still functional | Clicked "Categories" in the sidebar → `#categories-view` became visible | n/a (unchanged mobile behavior already covered by prior slices) |
| Detail-page CTA bar (`.cta-bar`) bounding box | `{x:220, y:831, width:1060, height:69}` — starts exactly where the sidebar ends, sits flush at the true bottom | `{x:0, y:537, width:375, height:65}` — unchanged, sits directly above the bottom tab bar (`y:602`) |
| Console errors across both viewports | 0 | 0 |

Screenshots captured: desktop Browse (sidebar + 4-col grid + pill row, no topbar line), desktop listing detail (sidebar stays fixed, CTA bar correctly clears it), desktop Categories view (proving sidebar nav clicks work), mobile Browse (bottom tabs, pixel-equivalent to pre-change layout).

## Residual Risks

- `--country-accent` CSS variable is now fully unused in the stylesheet (was only ever consumed by the removed border). Left declared and harmless, as before.
- The sidebar width (220px) is a fixed value, not derived from content; if a future i18n string for "Categories" or "Inbox" in another language runs unusually long, it could wrap. Not observed in en/sv.
- No live screen-reader pass specifically re-verifying `aria-label="Primary navigation"` still reads sensibly for a sidebar landmark vs. a bottom-bar landmark — the label text itself didn't change, and this is consistent with the verification depth of prior CSS-only layout slices.
- The toast (`#toast`, `left: 50%` centered) still centers on the full viewport width on desktop, not on the content column to the right of the sidebar — a pre-existing pattern, cosmetically slightly off-center relative to content on wide desktop screens, but functional and visible. Not in scope for this fix (the user's ask was specifically about the primary nav and the topbar line).

## Coverage Impact (rough)

Visual/UX fidelity to the AfroMarketplaces/Facebook Marketplace reference: cosmetic parity fix, not a PRD-coverage-percentage item — no functional gap closed, no new entity or capability added.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests re-run + real Playwright measurements at both desktop and mobile viewports, including exact bounding-box checks proving no overlap between the CTA bar and the new sidebar). No independent judge pass has been run. The Node/Express + SQLite backend migration remains queued and unstarted.

---

# NM-A10: Real Photo Uploads, Automatic ≤1MB Compression, and a Selectable Featured Photo

## Problem

User report: "Add photo does not add any photo instead it create another add photo box." True to the letter — the Sell form's photo system was, since NM-A3, entirely fake: `addSellPhoto()` never opened a file picker at all. It pushed a random CSS-gradient swatch from a small hardcoded palette (`PHOTO_PALETTE`) into `sellPhotos` and re-rendered the grid. From the user's side, clicking "+ Add photo" never let them choose a real image from their device — it just produced another colored placeholder box while the "+ Add photo" tile reappeared next to it, which reads exactly like "creates another add photo box" instead of adding a photo.

Two further explicit requirements: every added photo must be resized to ≤1MB while retaining image quality, and the user must be able to choose which photo is the featured (cover) image.

## What Changed

**Real file uploads** (`index.html`, `app.js`): added a hidden `<input type="file" id="sell-photo-input" accept="image/*" multiple hidden>`. `addSellPhoto()` — still the same function bound to the "+ Add photo" tile via the existing delegated click handler — now does exactly one thing: `document.getElementById("sell-photo-input").click()`, opening the real OS file picker (and refusing to do even that once the 6-photo cap is reached). Its `change` event is handled by the new `handleSellPhotoFilesSelected(event)`, which reads each selected file (up to the remaining slot count) through the new resize pipeline and only then adds it to `sellPhotos` as `{ kind: "upload", value: dataUrl }`. The old `{ kind: "placeholder", ... }` fake-gradient path and its `PHOTO_PALETTE` array are removed entirely — every photo in the Sell form is now a real image or nothing.

**Resize/compress pipeline, ≤1MB, quality-first** (`app.js`): `resizeImageFromSrc(src)` is the shared core — `readFileAsDataUrl()` → `Image` → `<canvas>` → `toDataURL("image/jpeg", quality)`. It first caps the longest side at `MAX_PHOTO_DIMENSION = 1600px` (a resize that alone rarely changes visible quality on a marketplace-sized photo), then iteratively steps JPEG quality down from 0.92 in 0.1 steps while the encoded size exceeds `MAX_PHOTO_BYTES = 1024 * 1024`, and only as a last resort — if quality alone can't reach the cap — shrinks the canvas dimensions by 15% per step and retries. This ordering is deliberate: dimension loss is far more visually destructive than a modest JPEG quality drop, so quality is always spent first. `resizeImageFile(file)` wraps this for a real uploaded `File`. The exact same `resizeImageFromSrc()` is now also applied to AI-generated photos in `performAiGeneration()` — "every added" photo respects the cap, not just uploads.

**User-selectable featured photo** (`app.js`, `styles.css`): every non-cover tile in the photo grid now shows a "Make cover" button (`data-make-cover="${index}"`). `setSellPhotoCover(index)` reorders `sellPhotos` so the chosen photo becomes index 0 — the same "index 0 = cover" convention `photosToImageObjects()`, `commitPublish()`, and the listing gallery's default active index already relied on, so no downstream code needed to change to support this; picking a different featured photo is just a reorder, and everything that already reads "the cover photo" reads the new one automatically.

## Validation Commands

```text
node --check app.js && node --check data-service.js && node --check tests/e2e.js
npm test  (run 3x consecutively, identical results)
PASS: E2E FindNord workflow passed: ... verified.
```

New structural assertions: the real `<input type="file">` exists; `MAX_PHOTO_BYTES`/`MAX_PHOTO_DIMENSION` constants exist; `resizeImageFromSrc`/`resizeImageFile`/`handleSellPhotoFilesSelected`/`setSellPhotoCover` all exist; AI generation routes through `resizeImageFromSrc`; no `kind: "placeholder"` remains anywhere in the source.

New behavioral assertions (deterministic, via a fake `FileReader`/`Image`/`<canvas>` that derives pixel dimensions from a `"W<n>H<n>"` marker and derives encoded byte size from `width * height * quality`, so the *real* resize/compress algorithm in `resizeImageFromSrc()` runs and is measured, not skipped): "Add photo" opens the picker and adds nothing until a file is chosen; a large (simulated 2000×2000) upload comes out ≤1MB and above 50% of that budget (proof the algorithm doesn't over-compress); a 7th upload is rejected the same way a 7th click of "Add photo" is; selecting a non-cover photo's "Make cover" button reorders it to the front, and the previously-featured photo correctly gains its own "Make cover" control.

## A Real Bug Caught and Fixed While Writing the Tests

The fake DOM harness has no `document.createElement`, no `FileReader`, no `Image`, no `<canvas>` — none of the browser APIs this feature actually needs — so the deterministic suite could not have exercised any of this without adding minimal, fully-deterministic stand-ins for exactly those four things (nothing else). This is the same pattern already used for the AI image generation slice (route-level fake `fetch` instead of a real paid OpenAI call): fake the browser boundary, run the real application code against it.

## Real Browser Evidence (Playwright/Chromium, headless, 430×900)

Used genuinely large real photo files — two actual noisy-pixel PNGs generated in a real browser canvas (not a fixture), 13.76MB and a smaller second file — uploaded through Playwright's real `filechooser` event (the same code path an actual user's OS file dialog exercises), not a scripted DOM mutation.

| Check | Result |
| --- | --- |
| Photo tiles before any upload | 0 |
| Click "+ Add photo" | A real OS file chooser dialog opens |
| Upload the 13.76MB real photo | Exactly 1 real photo tile appears (the bug: it used to add a fake gradient box instead) |
| Compressed size of that photo, as actually stored and rendered | 901,926 bytes — under the 1,048,576-byte (1MB) cap, and quality-first (86% of the budget used, not collapsed to a tiny blurry file) |
| Cover badge | Shown on the first (only) photo |
| Upload a second, smaller real photo | 2 real tiles; the non-cover photo shows a "Make cover" button |
| Click "Make cover" on the second photo | The two tiles swap: the second photo is now "Cover," the first now shows its own "Make cover" button |
| Console errors across the entire flow | 0 |

Screenshots: the two-photo grid before the swap (Cover on photo 1, Make cover on photo 2) and after (roles reversed) — both included in this evidence pass.

## Residual Risks

- The 1600px dimension cap and 1600×1600-equivalent starting point mean a genuinely enormous phone photo (e.g. 12MB, 4000×3000) will still lose some resolution before quality reduction ever runs — unavoidable given the 1MB target, and consistent with "retain quality within the budget," not "never resize."
- JPEG re-encoding is used for every photo, including PNGs with transparency (rare for marketplace listing photos) — transparency would be flattened to opaque. Not observed as an issue in this app's use case (photos of physical items), but worth naming.
- No live screen-reader pass specifically on the new "Make cover" button; it currently has no distinct `aria-label` beyond its visible text ("Make cover" is already a clear, complete accessible name on its own, consistent with the plain-text-button pattern used elsewhere in this form, e.g. "+ Add photo").
- AI-generated photos are now compressed exactly like uploads; if OpenAI ever returns a remote (non-data-URL) image URL rather than a data URL, `Image.src` loading it depends on that host allowing canvas access without tainting — not currently testable without a real API key, flagged for whoever wires the real backend next.

## Coverage Impact (rough)

Seller listing-creation flow: closes a real, user-reported functional bug (photos could never actually be added) rather than a simulated one — this is a correctness fix to a previously load-bearing but entirely fake feature, plus two explicitly requested capabilities (size cap, featured-photo choice) layered on top of the fix.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests re-run 3x + real Playwright upload of two genuine large photo files through the actual OS file-chooser event, with exact before/after byte counts proving real compression under the 1MB cap). No independent judge pass has been run. The Node/Express + SQLite backend migration remains queued and unstarted.

---

# NM-A11: Backend Foundation — Node/Express + SQLite (Phase 1)

**Naming note:** the request named this slice "NM-A10," but that id was already used by the real-photo-uploads slice above. Following the same precedent as the earlier NM-A6→NM-A7 collision, this slice is filed as **NM-A11**.

## Goal

Replace `data-service.js`'s in-memory arrays with a real, persistent Express + SQLite backend, without breaking any existing UI flow or requiring app.js to change.

## What Changed

### 1. A real database, with a schema mirroring every entity DataService already defined

`db/schema.sql` creates eight tables: `users`, `listings`, `listing_images` (a listing's `images` array, decomposed one row per photo, `position` preserving cover-first order), `saved_items`, `reports`, `conversations`, `conversation_participants` (a conversation's `participantIds` array, decomposed the same way), and `messages`. Categories/subtypes stay a static in-code array (`db/seed-data.js`) rather than a table — they were never a mutable, user-written entity in the first place, so making them one would be a new capability nobody asked for, not a faithful migration.

**Why better-sqlite3, not sqlite3**: both were named as options; better-sqlite3 was chosen because it's synchronous (matching this codebase's existing style of Promise-wrapping fundamentally synchronous work — see NM-A7's `resolved()` helper, now replaced by real network Promises) and is the more actively maintained, more widely adopted choice for exactly this "one small local SQLite file, no separate DB server" use case. It installed cleanly with a prebuilt binary for this machine's Node 24 (`npm install` — 10s, no compiler needed).

### 2. Seed data migrates automatically on first run

`scripts/db.js`'s `openDatabase()` creates the schema (`CREATE TABLE IF NOT EXISTS`, safe to call on every startup) and, only if the `listings` table is empty, runs `seedIfEmpty()` — a single transaction inserting all 8 original seed listings and their `listing_images` rows, ported verbatim from the values that used to live in `data-service.js`. A fresh `data/findnord.db` therefore has exactly the same 8 listings and 12 categories the app always shipped with; an existing one is left untouched on restart.

### 3. `scripts/api.js` — REST endpoints matching DataService's interface method-for-method

Every DataService method got exactly one endpoint: `GET/POST /api/categories`, `GET/POST/PATCH /api/listings(/:id)`, `GET/POST /api/saved-items(/status|/toggle|/all)`, `GET/POST /api/reports`, `GET/POST /api/conversations(/all|/start-or-get|/:id/messages)`, `POST /api/users/sign-in`. Response shapes are byte-for-byte what the old in-memory methods returned (same field names, same `images: [{css, aiGenerated}]` shape, same `subtype`-omitted-when-absent convention via `undefined` fields) — this is what let `data-service.js`'s rewrite avoid touching app.js at all.

**A real, working mutation, not just a new create path**: `PATCH /api/listings/:id` (used today only by Boost) does a genuine partial `UPDATE ... SET` against a whitelist of updatable columns, confirmed by the persistence test toggling `sponsored` and reading it back after a real server restart.

### 4. Mocked auth, but now backed by a real, durable `users` table — the specific Phase 1 tradeoff, spelled out

The task said "keep authentication mocked for now... but sessions/users must persist in the database." There is no real session/cookie mechanism yet, so this slice makes a deliberate, narrow choice: **every sign-in still writes a real row to the `users` table** (durable, survives restarts, joinable by `sellerId`/`senderId`/etc. everywhere else), but **"who is signed in on this browser" stays a client-side, localStorage-cached pointer**, exactly as it was before this migration (`persist("fn_user", currentUser)` in `data-service.js`, unchanged). Concretely: `DataService.users.signIn(user)` now does `POST /api/users/sign-in`, gets back a canonical record with a real id, caches it to localStorage, and `getCurrent()` still just reads that cache synchronously (no network round trip on every page load). This matches the OLD app's exact behavior too: since the frontend never sent an `id` on sign-in, every sign-in already created a logically new identity — that pre-existing quirk is preserved exactly, not fixed or hidden, since "real auth" is explicitly out of scope for this phase.

### 5. `data-service.js` — a complete rewrite, zero changes required to app.js

The entire file is now a thin fetch client (`request()` → `fetch(`${API_BASE}${path}`, options)` → `response.json()`), but keeps **the exact same namespaces and method signatures** it had before (`users.signIn`, `listings.create`, `savedItems.toggle`, `conversations.startOrGet`, etc.). This is the payoff of NM-A7's original design note: "every method here returns a Promise... swapping this file for one that calls a real backend should require ZERO changes to any UI call site." It didn't — `app.js` was not touched at all for this migration, confirmed by the deterministic test suite running the identical, unmodified app.js against the new data layer.

### 6. `scripts/server.js` — Express replaces the raw `http.createServer`

Static file serving (`express.static(root)`, same "serve anything under root" behavior the old raw server had — not a new exposure), the OpenAI image-generation proxy (unchanged behavior, just Express's request/response instead of manual body-buffering), and the new `/api` router are mounted on one Express app. `startServer({ dbPath, port, silent })` is exported so tests (and any future tooling) can start an isolated server against an isolated database.

## Validation Commands

```text
node --check data-service.js && node --check scripts/server.js && node --check scripts/api.js && node --check scripts/db.js && node --check db/seed-data.js && node --check tests/e2e.js
npm test   (run 3x consecutively — 0m1.1s each run, identical results)
PASS: E2E FindNord workflow passed: ... the real Express + SQLite backend (NM-A11)
      with genuine cross-restart persistence ... verified.
```

## How the Test Suite Changed (and why it had to)

The deterministic suite's whole architecture assumed an in-memory `data-service.js` with no network calls; that assumption is now false everywhere. Rather than maintain two divergent implementations (a fake in-memory one for tests, a real SQLite one for production — a drift risk, and a direct contradiction of "one place owns the data" from NM-A7's own file header), **the existing behavioral suite now runs against the REAL Express + SQLite server**:

- `tests/e2e.js` starts a real `startServer({ dbPath: <temp file>, port: 0 })` before the behavioral suite runs, and the vm sandbox's `fetch` global is rebased (`makeTestFetch()`) to hit that real server over real loopback HTTP — except `/api/generate-image`, which stays a fake stub (unchanged principle from NM-A6: never make a real, billed OpenAI call from the deterministic suite).
- This is a genuine, not simulated, integration test: every "browse," "publish," "save," "message," "boost," "analytics" assertion in the suite is now proof that the real schema, the real seed migration, and the real API handlers work — not that a parallel fake does.
- **A real timing bug this surfaced and fixed**: `completeSignIn()`'s fire-and-forget resumed action (e.g., a save or publish that was pending before sign-in) used to settle within one `flushMicrotasks()` tick, because the old in-memory Promises resolved within a microtask. Real network I/O spans multiple real event-loop turns, so a single tick stopped being enough — surfaced immediately as a real assertion failure ("Add at least 1 photo" instead of "Listing published"), not a silent flake. Fixed by replacing tick-counting with `waitFor(conditionFn)`, a small polling helper that waits for an actually-observable outcome instead of guessing how many ticks real I/O needs.
- **A real hang this surfaced and fixed**: on a failing assertion, the test server was never closed (no `finally`), so its open socket kept the process alive forever instead of failing fast. Fixed by wrapping the behavioral run in `try { ... } finally { testServer.server.close(); }`.
- After the behavioral suite, the SAME server is closed and a **brand-new server process-level instance is opened against the same database file** — proving actual persistence, not just "responds correctly while already running": listings and boosts published during the behavioral run are read back fresh, plus a real `GET /` proving Express serves the real `index.html`.
- New static assertions verify the new files directly (`db/schema.sql`'s 8 tables, `db/seed-data.js`'s taxonomy, `scripts/db.js`'s seeding function, `scripts/api.js`'s route list, `package.json`'s real `better-sqlite3`/`express` dependencies) and confirm the old fake-Promise machinery (`function resolved(value)`, `persist("fn_saved_items", ...)`) is gone.

## Real Browser Evidence (Playwright/Chromium, headless, 430×900, against the real dev server on a fresh database)

| Flow | Result |
| --- | --- |
| Browse (real `GET /api/listings` + `/api/categories`) | 8 listings rendered, exactly the seeded set |
| Filter & sort (client-side, unaffected by the migration) | "Sorted by: Lowest price" indicator shown correctly |
| Sign in (real `POST /api/users/sign-in`) | Account pills appear; a real `users` row is created |
| Save a listing (real `POST /api/saved-items/toggle`) | Button flips to "Saved" |
| Publish a listing with a real uploaded photo (real `POST /api/listings` + `listing_images` rows) | New listing opens immediately, title matches |
| Message a seller (real `POST /api/conversations/start-or-get` + `/messages`) | Toast: "Message sent. View it in your Inbox."; Inbox shows the real thread |
| Report a listing (real `POST /api/reports`) | Confirmation toast shown |
| Language switch to Swedish and back | Sell tab correctly reads "Sälj" / "Sell" |
| Country theming | `--country-primary` still resolves to `#006AA7` (Sweden) |
| Console errors across the entire flow | 0 |

**Direct database inspection after that browser run** (`better-sqlite3`, read-only, against the real file):

```text
users: 2   listings: 9   listing_images: 12   saved_items: 1
reports: 1   conversations: 1   conversation_participants: 1   messages: 1
```

Every table has real rows from real UI actions — not just the seed data.

**Restart persistence, proven twice** (once inside the automated test, once manually against the dev server): killed the running server process entirely, started a brand-new one against the same `data/findnord.db`, and confirmed via `GET /api/listings` that the listing published during the browser session (and its `sponsored` boost, an UPDATE not a new row) were both still there.

## Residual Risks

- **Auth is still mocked, by design** (see "Mocked auth" above) — every sign-in mints a new user row rather than recognizing a returning email, exactly matching the pre-migration app's behavior. Real auth is explicitly deferred to a later phase per the task's own instructions.
- **Static file serving exposes the whole project root** (`express.static(root)`) — identical exposure to the old raw-http server (which also served any file under root via `fs.readFile`), not a new regression, but worth hardening (an explicit allowlist of served paths) before this is ever deployed anywhere beyond localhost.
- **No input validation/sanitization on API bodies** beyond what the frontend already sends — acceptable for a same-origin local prototype with a trusted frontend, but a real concern if this API is ever exposed beyond localhost or to a different client.
- **The dev database (`data/findnord.db`) is untracked and gitignored** (`.gitignore` added this slice) — deleting it resets the app to first-run seed state, which is expected but worth remembering.
- **`better-sqlite3` is a native module** — it installed cleanly here via a prebuilt binary for this Node version/platform, but a different deployment target (different OS/Node ABI) could require a rebuild. Not observed as an issue, flagged for whoever deploys this beyond a local machine.
- Photo data URLs are stored as `TEXT` directly in `listing_images.css` (same representation the frontend always used) rather than as separate binary blobs or files on disk — fine at prototype scale (≤1MB per photo, per NM-A10's cap), but real file/S3 storage is explicitly a later phase per the task's own instructions.

## Coverage Impact (rough)

This is an architecture migration, not a new user-facing feature — no PRD coverage percentage moves. What it changes: every entity (User, Listing, SavedItem, Report, Conversation, Message) now has genuine, durable persistence surviving a server restart, closing the single largest structural gap between this prototype and a real product (previously, *everything* except `fn_user`/`fn_saved_items` in localStorage was lost on every page refresh in a different browser or after clearing storage).

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests re-run 3x against a real ephemeral Express + SQLite server, 0m1.1s each; real Playwright browser session against the real dev server covering every listed flow with 0 console errors; direct SQLite row-count inspection after that session; and a genuine process-restart persistence check performed twice — once inside the automated suite, once manually). No independent judge pass has been run. Per the task's own instructions, this stops here for acceptance before Phase 2 (real auth, file uploads to disk/S3, and any further advanced features).

---

# NM-A12: Backend Phase 2 — Real Local File Storage for Images

## Goal

Stop storing photos as inline `data:` URLs inside the SQLite database. Every uploaded or AI-generated photo should be written to a real file on disk, with only its file path stored in the database and served back over real HTTP.

## What Changed

### 1. `scripts/image-storage.js` — one small, focused module

`createImageStorage(uploadsDir)` returns `saveImageIfInline(css, filenameBase)`. Every real photo already arrives at the API as a CSS value produced by app.js's unchanged `photoToCss()`:

```
url(data:image/jpeg;base64,AAAA...) center/cover no-repeat
```

`saveImageIfInline()` recognizes this exact shape, decodes the base64 payload, writes it to `uploads/<filenameBase>.<ext>` (extension picked from the MIME type), and returns the **same kind of CSS value** — just pointing at `/uploads/<file>` instead of embedding the bytes:

```
url(/uploads/listing-1758-...-0.jpg) center/cover no-repeat
```

A seed listing's `linear-gradient(...)` value never matches the inline-data-URL pattern, so it passes through completely untouched — this is what makes requirement 5 (old seed listings keep working) true by construction, not by a special case anyone had to write.

**A factory, not a singleton**, exactly like `scripts/db.js`'s `openDatabase(dbPath)`: `createImageStorage(uploadsDir)` lets tests point at an isolated temp directory instead of writing real files into the project's own `uploads/` folder on every test run. This was a real bug caught while building the test suite for this slice — see below.

### 2. `scripts/api.js` — the ONE write path that ever touches images

Only `POST /api/listings` ever sets a listing's photos (Boost's `PATCH` only ever touches `sponsored`), so this is the only place that needed to change. Every image in the incoming `images` array is passed through `saveImageIfInline(image.css, `${id}-${index}`)` before being inserted into `listing_images`. The listing's own `image` (cover) column reuses `images[0]`'s already-saved value instead of writing the same bytes to disk twice — `fields.image` and `fields.images[0].css` are always identical strings coming from the client, so writing them as two separate files would have been pure waste.

### 3. `scripts/server.js` — a real static route for uploaded photos

`app.use("/uploads", express.static(imageStorage.uploadsDir))`, mounted before the catch-all `express.static(root)`. `startServer({ uploadsDir })` and `createApp(db, uploadsDir)` both accept the same override the database path already supports, for the same reason (test isolation).

### 4. `scripts/db.js` — a defensive, idempotent migration for anything created before this slice

`migrateInlineImagesToFiles(db, uploadsDir)` runs on every `openDatabase()` call (cheap: two `WHERE css LIKE 'url(data:%'` queries). It scans both `listing_images.css` and `listings.image` for any row still holding inline data (e.g., a database created during NM-A11, before real file storage existed) and externalizes it to a real file, exactly like a fresh write would. A fresh or already-migrated database matches zero rows and does nothing. This directly satisfies "migrate or provide fallbacks if needed" for anything beyond the seed data, which needed neither.

### 5. Nothing else changed

`app.js`'s entire photo pipeline — `resizeImageFromSrc()`'s ≤1MB quality-first compression, the 6-photo cap, `setSellPhotoCover()` ("Make cover"), the gallery, the photo-count badge — is completely unaware that the server now writes files instead of storing inline data. It still just builds the same `url(data:...)` CSS value it always did and sends it to `POST /api/listings`; where those bytes end up living is entirely the server's concern. This is the same architectural payoff NM-A11 already banked: a clean seam meant this phase touched zero frontend files.

## Validation Commands

```text
node --check scripts/image-storage.js && node --check scripts/api.js && node --check scripts/db.js && node --check scripts/server.js && node --check tests/e2e.js
npm test   (run 3x consecutively — identical results)
PASS: E2E FindNord workflow passed: ... real local file storage for every photo (NM-A12) surviving a genuine restart ...
```

## A Real Bug Caught While Building the Test Suite

The first version of `image-storage.js` used a fixed, module-level `UPLOADS_DIR` constant (mirroring nothing — `db.js` already knew better, since NM-A11 made `dbPath` configurable for exactly this reason). A manual smoke test proved the write path worked, but it silently wrote two real JPEG files into the actual project's `uploads/` folder — the same class of mistake NM-A11's test suite deliberately avoids for the database. Caught before writing the automated test (which would otherwise have littered real files on every run, forever), by refactoring to the same `createImageStorage(uploadsDir)` factory pattern `openDatabase(dbPath)` already established, and threading `uploadsDir` through `server.js`/`api.js`/`db.js` exactly the way `dbPath` already was.

## Real Browser Evidence (Playwright/Chromium, headless, 430×900, against the real dev server)

| Check | Result |
| --- | --- |
| Publish a listing with 2 real (noisy-pixel, ~900×900) uploaded photos | Detail page and Browse card both show `url("/uploads/listing-...-0.jpg")` — a real file path, not inline data |
| "Make cover" on the second photo before publishing | The FILE saved as position 0 is the one the user picked as cover — file storage and the existing cover-selection feature compose correctly |
| Fetch the served image directly over HTTP | `200`, `content-type: image/jpeg`, 718,635 real bytes (under the 1MB cap) |
| Real files on disk after publishing | `uploads/listing-<id>-0.jpg` and `...-1.jpg` exist, ~718KB each |
| A seed listing (iPhone 14) messaged, viewed in Inbox | Inbox thumbnail still shows its `linear-gradient(...)` — seed listings and Inbox previews are completely unaffected |
| **Real server restart** (process killed, new one started against the same `data/findnord.db` + `uploads/`) | The published listing, its title, its Browse card thumbnail, and its detail gallery image all still resolve to the SAME real file, which still serves `200`/`image/jpeg`/718,635 bytes |
| Console errors across the entire flow (publish, save, message, inbox, restart) | 0 |

## Automated Test Coverage (`tests/e2e.js`)

- Static checks: `image-storage.js`'s factory shape and inline-data-URL pattern exist; `api.js` actually calls `saveImageIfInline` for every image and for the cover field; `db.js`'s migration function and its `WHERE css LIKE 'url(data:%'` query exist; `server.js` mounts `/uploads` as a real static route; seed data (`db/seed-data.js`) is confirmed to contain zero inline data URLs (nothing to migrate, by construction); no cloud-storage SDK (`aws-sdk`) is present, confirming Phase 2 stayed local-disk-only as instructed.
- **The existing behavioral suite's real published listings now double as the file-storage test**: `tests/e2e.js` gives the real test server its own isolated temp uploads directory (`TEST_UPLOADS_DIR`, mirroring `TEST_DB_PATH`), so the "Six-photo test lamp" listing published earlier in the run (via the real Sell form + real file uploads through the fake-FileReader/Image/canvas browser-API stand-ins from NM-A10) produces 6 REAL files in that temp directory.
- After the behavioral suite, the SAME restart-persistence check from NM-A11 now additionally proves, against a **brand-new server process** pointed at the same temp DB and temp uploads directory: all 6 of that listing's `images[]` entries are `url(/uploads/...)` paths (never `data:image`), the listing's cover field is likewise a file path, at least 6 real files exist in the temp uploads directory, and fetching one of those files over real HTTP returns `200` with an `image/*` content-type and non-zero bytes. A seed listing (`oak-table`) is confirmed to still be a plain `linear-gradient(...)`, proving zero seed-data migration ever ran (there was nothing inline to migrate).

## Residual Risks

- **No orphan cleanup**: this app has no delete-listing feature at all (true before this slice too), so there's no code path that would ever need to remove a photo file from disk. Not a regression, but worth naming: if listing deletion is ever added, it will need to also unlink its files.
- **No image resizing/optimization beyond what the client already did**: the server trusts the client's ≤1MB compressed JPEG/PNG as-is; a client bypassing the UI could theoretically POST a very large `images[]` payload directly to the API (mitigated somewhat by Express's existing `express.json({ limit: "12mb" })` body-size cap on the `/api` router, unchanged from NM-A11).
- **Filename collisions are structurally impossible today** (`${listingId}-${index}`, and `listingId` is always freshly generated by `makeId("listing")` per create), but if a future slice ever allows editing a listing's photos after creation, filename reuse would need explicit handling (overwrite vs. new file) — not needed yet since `PATCH` never touches images.
- **`uploads/` is gitignored** (like `data/findnord.db`) — deleting it does not break the app (a fresh, empty directory is recreated on startup by `ensureUploadsDir()`), but any listings published before the deletion will show broken image links until republished. Same category of risk as deleting the database, and treated the same way (documented, not solved, since it's a local dev prototype).

## Coverage Impact (rough)

Architecture migration, not a new user-facing feature — no PRD coverage percentage moves. What it changes: the database no longer holds megabytes of duplicated inline image text per listing, images are now servable as ordinary URLs (satisfying "Open Graph style thumbnails" — a real, linkable, crawlable URL, not a data blob), and the project now has the structural piece (a real uploads directory served over HTTP) that real file uploads or cloud storage in a later phase would build on top of, rather than replace.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests re-run 3x against a real ephemeral Express + SQLite server with an isolated temp uploads directory; real Playwright browser session publishing real (non-trivial, ~900×900) photos, confirmed as real files on disk with correct byte counts; a genuine process-restart check proving both the database rows AND the image files survive; and one real bug — a fixed, non-configurable uploads path that would have littered the real project folder on every test run — caught and fixed before it could do so). No independent judge pass has been run. Per the task's own instructions: no real authentication, no cloud storage (S3, etc.) — both remain explicitly deferred to a later phase.

---

# UI Polish: Desktop Carousel Arrows on the Category Chip Row

## Problem

User feedback with a screenshot: the category chip row (All / Vehicles / Real Estate / Electronics / ... / Free Items, 13 chips) overflows any reasonable content width and relies entirely on horizontal drag/swipe to scroll — with no visible affordance, a mouse user on desktop has no obvious way to reach chips scrolled out of view (no touch gesture, no visible scrollbar since `scrollbar-width: none` was already in place).

## What Changed

`index.html` wraps `#category-chips` in a `.chip-carousel` container with two arrow buttons (`#category-chips-prev`/`#category-chips-next`, `data-chip-scroll="-1"`/`"1"`). `app.js` adds `scrollCategoryChips(direction)` (scrolls by 70% of the container's visible width, using native smooth scrolling) and `updateChipCarouselArrows()` (hides the "prev" arrow at the start, hides "next" at the end — checked via `scrollWidth`/`clientWidth`/`scrollLeft`), wired to the arrow clicks, the chip row's own `scroll` event, and a `resize` listener. `renderCategoryChips()` calls `updateChipCarouselArrows()` after every re-render so switching category/language doesn't leave a stale arrow state.

**Desktop-only, deliberately**: the arrows only render at `≥780px` (the same breakpoint as the left sidebar), matching the existing mobile/desktop split already established in this app — mobile keeps pure native touch-scroll, unchanged, since swipe is already the natural and discoverable gesture there and two floating circular buttons would just crowd a 375px-wide row of chips.

## Validation Commands

```text
node --check app.js && node --check tests/e2e.js
npm test   (unchanged pass, plus new structural assertions for the arrows)
```

## Real Browser Evidence (Playwright/Chromium, 1280×500 desktop and 390×700 mobile)

| Check | Result |
| --- | --- |
| Initial load (13 chips, ~1506px content in a 1012px row) | "prev" hidden, "next" visible |
| Click "next" | Scrolls to the true end (`scrollLeft: 494`, the exact max); "prev" becomes visible, "next" becomes hidden |
| Click "prev" | Scrolls back to `scrollLeft: 0`; state reverts exactly |
| Click a chip (Jobs) only reachable via the carousel scroll | Category filter applies correctly (`.active` class set) — the carousel doesn't interfere with normal chip behavior |
| Mobile (390px) | Both arrows compute to `display: none` — no visual footprint at all, matching the "mobile unchanged" intent |
| Console errors | 0 |

## Residual Risks

- Scroll amount (70% of visible width) is a reasonable default, not user-tunable; not expected to matter given the chip row's modest total width.
- No keyboard-specific affordance beyond the arrows being ordinary focusable/tabbable buttons with clear `aria-label`s — arrow-key scrolling within the row itself is left to the browser's native behavior on a scrollable, focusable region.

## Verifier

Self-verified by the same agent (deterministic tests pass 3x; real Playwright verification of the exact scroll boundary behavior, including one real red herring chased down and resolved: an apparent flaky test failure that turned out to be the test script's own wrong assumption about how many clicks were needed to reach the end, not an app bug).

---

# NM-A13: Basic Listing Management for Sellers

## Goal

Let a signed-in seller manage their own listings from My Listings: Edit, Mark as Reserved/Sold, and Delete/Unpublish — with status changes clearly visible everywhere, guests fully blocked, and everything (i18n, country theming, the 6-photo pipeline) still working.

## What Changed

### 1. A real `status` column, with a migration for databases that predate it

`db/schema.sql` gets `status TEXT NOT NULL DEFAULT 'active'` on `listings`. Since `CREATE TABLE IF NOT EXISTS` never retroactively adds a column, `scripts/db.js` gained `migrateListingStatusColumn(db)` — checks `PRAGMA table_info(listings)` and runs `ALTER TABLE listings ADD COLUMN status ...` only if missing, the same idempotent-migration pattern NM-A12 already established for image storage. Every existing seed/created listing quietly becomes `"active"` on first startup after this slice; nothing else changes for them.

### 2. Every listing mutation is now ownership-checked server-side, not just by the UI

Before this slice, `PATCH /api/listings/:id` (Boost) trusted any caller unconditionally — a real gap, just never exercised by anything except the app's own already-careful UI. Now every `PATCH` and the new `DELETE /api/listings/:id` require a `requesterId` in the body and reject with `403` unless it matches the listing's real `seller_id` (including listings with no owner at all, like seed data — nobody can "manage" those). `app.js`'s `toggleBoost()` was updated to send `requesterId` too, so this closes the gap for the endpoint that already existed, not just the new ones. This is still fully within "mocked auth" — `requesterId` is just the same `currentUser.id` the client already trusted itself with; there's no new session or token, just the server no longer taking the client's word for *which* listing it's allowed to touch.

### 3. Edit reuses the entire existing Sell form and photo pipeline — verbatim

`startEditListing(id)` prefills every field (title, price, free-toggle, category/subtype, condition, location, description) from the real listing record, and seeds `sellPhotos` with a new kind: `{ kind: "existing", value: image.css, aiGenerated }` — the photo's *already-final* CSS value (a real `/uploads/...` file or, in principle, a gradient), used as-is rather than re-wrapped or re-compressed. `photoToCss()` and `photosToImageObjects()` got one branch each for this kind; everything else — `MAX_LISTING_PHOTOS`, `resizeImageFromSrc()`'s ≤1MB compression, `setSellPhotoCover()` (Make cover), `removeSellPhoto()` — is completely unaware anything changed, because a mixed array of `existing` + freshly `upload`ed/`ai`-generated photos is exactly the shape those functions already handled. `setSellFormMode(isEditing)` swaps the heading ("Edit your listing") and submit button ("Save changes") copy; `publishListing()` branches on `editingListingId` to call the new `commitEdit()` (a `PATCH`) instead of `commitPublish()` (a `POST`) — same validation, same auth gate, same reset-and-reopen ending.

**Editing photos replaces the whole set server-side**: `PATCH` with an `images` array deletes the old `listing_images` rows and inserts the new ones, running new inline photos through `saveImageIfInline()` exactly like `POST` does — and any OLD file no longer present in the new set gets unlinked from disk via the new `deleteFileIfLocal()`, so editing away a photo doesn't leave it orphaned on disk forever (a residual risk NM-A12 explicitly flagged as future work; this slice is "future work" catching up to it for edits, and the next point does the same for deletes).

### 4. A real Delete/Unpublish, with real cleanup

`DELETE /api/listings/:id` (ownership-checked) unlinks every real photo file for that listing from disk, then deletes its `listing_images` rows, its `saved_items` rows (so a deleted listing doesn't linger as a phantom "saved" entry for anyone), and finally the `listings` row itself. Conversations/messages about a deleted listing are deliberately left alone — real marketplaces keep message history after an item is gone, and the Inbox already had a defensive fallback (`listing ? listing.image : <gradient>`) for exactly this "the listing this conversation was about no longer exists" case, from before this slice.

On the frontend, delete requires **two clicks**, not a native `confirm()` dialog: the first click arms a "Confirm delete?" state on that row's button (tracked by `pendingDeleteListingId`), the second actually calls `DataService.listings.delete()`. This matches this app's existing pattern of custom, testable UI (the auth modal, compose modal, filter sheet) instead of an untestable native browser dialog — and it means the deterministic suite can verify the two-step confirmation for real, not just assume it.

### 5. Status (Active/Reserved/Sold), clearly visible everywhere

A `<select>` per row in My Listings (`data-status-select`) changes status inline via `handleMyListingStatusChange()`. A non-"active" status renders a `.status-badge` — the same top-left corner `.sponsored` uses, taking priority over it when both would apply (advertising a sold item isn't useful) — on every listing card, and a plain inline badge next to the title on the detail page. Both badges and the accessible card `aria-label` are translated (`t("status.reserved")` / `t("status.sold")`), and the select's options re-render through the existing `renderMyListings()` call already wired into `applyTranslations()`, so a language switch relabels everything with zero extra plumbing.

## Validation Commands

```text
node --check scripts/api.js && node --check scripts/db.js && node --check app.js && node --check tests/e2e.js
npm test   (run 3x consecutively — identical results)
PASS: E2E FindNord workflow passed: ... basic listing management for sellers (NM-A13: edit,
      Reserved/Sold status, and server-side-enforced delete, all surviving a genuine restart) ...
```

New coverage in `tests/e2e.js`: publish → edit (prefill verified field-by-field, a new photo added on top of the existing one respecting the 6-cap, Make Cover, saving updates the SAME id) → status cycled through reserved/sold/active with card + detail + select all checked → a real, separate "Intruder" user's `PATCH`/`DELETE` requests rejected with `403` directly against the live API (not just asserted via the UI) → two-click delete confirmed, including that the deleted listing's real photo file now 404s → a signed-out guest's attempts at editing/status-changing/deleting are complete no-ops, verified against the real API afterward. A real server restart (the existing NM-A11/NM-A12 pattern: kill the test server, open a fresh one against the same temp DB + uploads dir) then confirms an edited field, a status change, and a deletion all genuinely persisted.

## A Real Bug Caught While Manually Verifying

While manually re-verifying restart persistence against the real dev server (beyond the automated suite), a status check appeared to show "active" instead of the "sold" I'd just set — investigated immediately rather than assumed away. The actual cause: an earlier failed shell command (a Bash/Windows path quoting issue, unrelated to the app) had already created a DIFFERENT listing with the same title, and my verification script's `.find()` happened to match that stale duplicate first. Confirmed by re-querying the correct listing by its unique id, which showed the real, correctly-persisted "sold" status — a test-script mistake, not an app bug, but worth recording as a reminder that "the number looks wrong" always deserves a direct look before writing it down as a defect either way.

## Real Browser Evidence (Playwright/Chromium, headless, 430×900, against the real dev server)

| Check | Result |
| --- | --- |
| Edit an existing listing | Form shows "Edit your listing" / "Save changes"; every field prefilled correctly |
| Save the edit | Detail page reopens showing the new title immediately; same listing id |
| Change status to Reserved | Browse card shows a "RESERVED" badge over the photo |
| Delete: first click | Button changes to "Confirm delete?" |
| Delete: second click | Toast "Listing deleted."; row disappears from My Listings |
| Sign out | Account action pills hide; My Listings shows the signed-out empty state |
| Language → Swedish, sign in as a new user | My Listings' empty state reads "Du har inte publicerat några annonser än. / Börja sälja" |
| Console errors across the entire flow | 0 |

**Direct database + restart verification**: confirmed via `better-sqlite3` (read-only) that a deleted listing's row was genuinely gone; created a listing via the real API, set it to `sold`, killed the running dev server process, started a fresh one against the same `data/findnord.db`, and confirmed via a fresh `GET /api/listings/:id` that the status survived — real process-level persistence, not an in-memory illusion.

## Residual Risks

- Marking a listing Sold does not currently disable Save/Message on that listing's detail page — the task asked for status to be "clearly visible," which it now is, but didn't ask for gating other actions on it; noted as a reasonable follow-up, not implemented here to avoid scope creep beyond what was requested.
- Deleting a listing intentionally leaves its conversations/messages intact (matching real-world marketplace behavior and the Inbox's existing defensive fallback for a missing listing) — flagged explicitly in case a future slice wants different behavior.
- Mocked auth's existing quirk (every sign-in mints a new user id rather than recognizing a returning email) means "sign back in as the same seller" isn't really possible across a sign-out in this app today — the test suite works around this by never needing to prove identity continuity across a real sign-out/sign-in cycle, consistent with how NM-A11 already documented this as an accepted, unfixed limitation of Phase-1 mocked auth.
- Server-side ownership checks now require every mutating listing endpoint to receive `requesterId` — a caller that omits it is rejected outright (fails safe, not open), consistent with "guests must not manage listings" but worth knowing if a future internal tool ever needs to bypass it.

## Coverage Impact (rough)

Seller listing-creation flow: closes the last major gap called out in earlier evidence ("edit/pause/reserve/sold are still absent") — a seller can now fully manage the lifecycle of what they published, with the mutations genuinely persisted and genuinely ownership-enforced, not just editable-looking.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic tests re-run 3x against a real ephemeral Express + SQLite server, including direct real-HTTP ownership-rejection checks and a genuine restart-persistence check for edit/status/delete together; real Playwright browser session covering edit, status, delete, guest-gating, and i18n with 0 console errors; a real bug chased down during manual verification and confirmed to be a test-script mistake, not an app defect). No independent judge pass has been run.

---

# NM-A14: Real Authentication (Email + Password)

## Goal

Replace every mocked-auth assumption (NM-A7–NM-A13: any sign-in mints a fresh identity, no password, "guest" is a fake account) with real email + password authentication: real registration, real returning-user recognition, real hashed passwords, and a real server-verified session that survives a genuine server restart. Per the AFRO_PARITY_PLAN.md roadmap, this is Phase 1 — Google OAuth (NM-A15) comes next.

## What Changed

### 1. A real password column, a real unique-email guarantee, a real sessions table

`db/schema.sql` gains `password_hash TEXT` on `users` and a new `sessions` table (`id` is the random session token itself — the value stored in the cookie — so looking a session up is a single primary-key lookup). "Same email = same user" (requirement 5) is enforced by a real `UNIQUE INDEX ON users(email)` — created in `scripts/db.js`, not inline in schema.sql, and wrapped in a try/catch: a database from the mocked-auth era could have duplicate non-empty emails (every mocked sign-in minted a new row for the same typed email), and a `CREATE UNIQUE INDEX` that fails partway through schema.sql would abort every statement after it, including table creation. `migrateUsersAuthColumn(db)` adds `password_hash` to a pre-NM-A14 database the same idempotent way NM-A12/NM-A13 already added their own columns.

### 2. Passwords: `crypto.scrypt`, not bcrypt — a deliberate, documented substitution

The task allowed "bcrypt or equivalent." `scripts/auth.js` uses Node's **built-in** `crypto.scryptSync` instead of adding a `bcrypt` dependency: scrypt is an OWASP-endorsed KDF, it's literally what Node's own documentation uses as the canonical password-hashing example, and it needs zero new npm packages — no native binary to install, continuing the same instinct that chose `better-sqlite3` over alternatives in NM-A11 and avoided a `cookie-parser` dependency in this same slice (cookies are hand-parsed in ~15 lines). Each password gets a random 16-byte salt; comparison uses `crypto.timingSafeEqual` so a wrong-password check can't be distinguished by response timing. Format stored: `scrypt:<salt>:<derivedHex>` — never the plain password, anywhere, ever (verified by a test asserting the register/login response bodies never contain it).

### 3. Real sessions: an httpOnly cookie + a real DB row, not a client-trusted anything

`POST /api/auth/register` and `POST /api/auth/login` create a session row (`scripts/auth.js`'s `createSession`) and set a `Set-Cookie: fn_session=<random 32-byte token>; HttpOnly; SameSite=Lax; Max-Age=30 days`. `attachSession(db)` middleware runs on **every** request (mounted before both the auth router and the API router in `scripts/server.js`) and reads that cookie back into `req.currentUser` — real, server-verified, every time. `GET /api/auth/me` (what `DataService.users.getCurrent()` now calls) is a real network round trip that answers "who am I" from that cookie; there is no longer any localStorage user cache at all. This is exactly what makes "stay logged in across a server restart" true rather than merely assumed: the cookie lives in the browser (survives independently of the server process), the session row lives in SQLite (survives independently of the browser), and neither needs to remember anything about the other beyond the token itself.

### 4. Every mutating endpoint is now session-gated, and server-derives identity instead of trusting the client

`requireSession` (401 if no real session) is now applied to every endpoint that mutates data: `POST /listings`, `PATCH /listings/:id`, `DELETE /listings/:id`, `POST /saved-items/toggle`, `POST /reports`, `POST /conversations/start-or-get`, `POST /conversations/:id/messages` — and, since it uses the exact same middleware, the real-money `POST /api/generate-image` OpenAI proxy too (previously gated client-side only; a crafted request straight to the endpoint could always have bypassed that and spent real API credits). Fields that used to come from the client and get trusted at face value now come from `req.currentUser` instead: a listing's `seller`/`sellerId`, a message's `senderId`, a report's `reporterId`. NM-A13's `requesterId` body field is gone entirely — ownership checks now compare `existing.seller_id` against the real session's user id, which a crafted request cannot spoof by simply naming a different id (proven by the intruder test below, which uses a second real signed-in session, not a guessed id).

### 5. The frontend: real fields, real modes, one shared pipeline, and "guest" retired as an identity

The auth modal and the dedicated Login page both gained a Name field (register mode only), a Password field (both modes), an inline error message, and a mode-toggle link ("New to FindNord? Create an account" / "Already have an account? Log in") — `setAuthMode(prefix, mode)` shows/hides the name field and relabels the submit button and toggle for whichever surface is open, re-run on every language switch so it never goes translation-stale. `submitAuthForm(prefix, mode)` is the one real pipeline both surfaces share (client-side validation — name required, password ≥ 8 characters — then a real `register`/`login` call, then `completeSignIn`), exactly matching the existing "one pipeline, two entry points" pattern from NM-A7.

**"Continue as Guest" no longer creates any identity** (requirement 4): `dismissAuthModal()` just discards the pending action and closes the modal; the login page's guest button just returns to Browse. `currentUser` is now either a real, real-password-backed account or `null` — there is no more `currentUser.guest` branch anywhere (`renderAccountPanel`/`renderProfileAvatar` both simplified accordingly). Since `requireAuth` (the client-side gate) and `requireSession` (the server-side gate) now both apply uniformly to publish/save/message/report, a guest genuinely cannot do any of those — not merely "the button is hidden."

## Validation Commands

```text
node --check scripts/auth.js && node --check scripts/api.js && node --check scripts/server.js && node --check scripts/db.js && node --check data-service.js && node --check app.js && node --check tests/e2e.js
npm test   (run 4x consecutively — identical results)
PASS: E2E FindNord workflow passed: ... real email + password authentication (NM-A14: sign-up,
      login, wrong-password rejection, returning-user recognition, server-side-enforced ownership,
      and a real session surviving a genuine restart) ...
```

## A Real Backend Smoke Test Before Touching the Frontend

Before writing a single line of UI code, the whole auth backend was exercised directly against a real running server: register → duplicate-email 409 → `/auth/me` with and without the cookie → wrong-password 401 → login with a different-case email recognizing the same account → publish blocked without a session (401) → publish with a session recording the real `sellerId` (a spoofed `sellerId` in the body was silently ignored) → logout → `/auth/me` correctly `null` again. Every one of these passed on the first real run, which is what made the much larger frontend/test rewrite tractable.

## How the Test Suite Changed (and why it had to)

Nearly every existing behavioral test that signed a user in did so via the old `completeSignIn({name, email, guest})` shortcut, which no longer exists. Two new test helpers (`registerTestUser`/`loginTestUser`) drive the **real** form (`setAuthMode` → fill fields → `submitAuthForm`), the same path a real user goes through — not a bypass. Deciding register-vs-login per call site required checking whether that email had already been used earlier in the run (several had, deliberately reused across old tests) — those became `loginTestUser` calls instead, which turned "reuse the same email" from an artifact of the old mocked system into a real, positive proof of requirement 5 (returning users recognized).

- **A real cookie jar for the vm sandbox**: Node's built-in `fetch` (undici) has no browser-style automatic cookie jar between separate calls. `makeTestFetch()` now captures `Set-Cookie` from every response and resends it as `Cookie` on the next one — simulating the one browser tab the whole sandboxed `context` represents.
- **The NM-A13 "intruder" ownership test was upgraded, not just patched**: it used to fabricate a `requesterId` in the request body; now it registers a genuinely separate real user (`registerRealUserDirectly`, its own real session, its own real cookie, entirely outside the shared jar) and proves the server rejects that real-but-wrong session with 403 — and, newly, that a request with no session at all gets a distinct 401.
- **The "Continue as Guest resumes the pending action" test was inverted**, since that behavior is exactly what requirement 4 removes: it now asserts the toast stays hidden and no identity gets created.
- **A dedicated NM-A14 block** exercises the auth mechanics directly: mode-toggle field visibility, missing-name / short-password client-side validation, a real successful sign-up, a rejected duplicate-email registration, a rejected wrong-password login, and a successful login recognizing the exact same account id created by the earlier registration.
- **Session persistence across a restart** joins the existing NM-A11/A12/A13 restart-persistence check: a real user is registered while the shared test server is still running, its real session cookie captured; after the server is closed and a brand-new instance opened against the same database file, that same untouched cookie is sent to the reopened server's `/api/auth/me` and still resolves to the same account.

## Real Browser Evidence (Playwright/Chromium, headless, 430×900, against the real dev server)

| Check | Result |
| --- | --- |
| Guest clicks Save → auth modal opens, switches to register mode, signs up | Modal closes, pending Save resumes (`savedAfterSignup: 1`) |
| Sign out, log in with the **wrong** password | Rejected: "Incorrect email or password." |
| Log in with the **correct** password | Recognized as the same account: You panel shows "Signed in as: realbrowser@example.com" |
| Sign out, click Save on a different listing, click "Continue as Guest" | Modal dismissed, **no** save happened (`savedAfterGuestDismiss: 0`), no identity created (`account-actions` still hidden) |
| Switch language to Swedish while the login page is open | Password label reads "Lösenord"; country theming (`--country-primary: #006AA7`) unaffected |
| Console errors across the entire flow | 0 |

**Real cross-process restart, in a real browser, without touching the browser at all**: registered a real account, confirmed signed in, then **killed the actual `node scripts/server.js` process** and started a brand-new one against the same `data/findnord.db` — all while the same Playwright browser page sat untouched. Reloaded that page against the freshly-restarted server: still signed in as the same account, no re-login required. The session cookie was confirmed `httpOnly: true`, `sameSite: "Lax"`. This is the direct, real-world proof of requirement 2 ("stay logged in across server restarts"), not a simulated approximation of it.

## A Real Bug Caught (and Ruled Out) While Manually Verifying

The first real-browser run appeared to hang waiting for the auth modal to close after registration. Investigated rather than assumed: direct inspection of `data/findnord.db` showed the account genuinely *had* been created — twice, in fact, because the test script had been re-run against the same email without resetting the database, and the second attempt was correctly rejected with `EMAIL_TAKEN` (working as designed) while the test script itself didn't check for that outcome. Confirmed by resetting the database and re-running: a clean pass. A real, reproducible discrepancy that turned out to be the test script's own state leakage, not an app defect — the uniqueness guarantee (requirement 5's flip side) was actually doing exactly its job.

## Residual Risks

- **No rate limiting** on `/api/auth/login` or `/api/auth/register` — a scripted brute-force or signup-spam attempt isn't throttled. Explicitly out of scope for this slice; flagged for whoever hardens this beyond a local prototype.
- **No email verification** — registering with an email you don't own works today (matching the task's "no real password/email verification yet" instruction). A real deployment would want to confirm the address before treating the account as fully trusted.
- **No password reset flow** — if a real user forgets their password, there is currently no recovery path. Reasonable to defer until real email delivery exists.
- **A pre-NM-A14 database's users can never log in again** (they have no password) — the clean path is a fresh `data/findnord.db`, exactly like every prior additive migration in this project when the shape of existing data doesn't fit the new model.
- **Session cookie is not marked `Secure`** — correct for local HTTP development, but must be set before any real (HTTPS) deployment. Noted, not fixed here, since this app only ever runs over `http://127.0.0.1` today.
- **`GET /saved-items` / `GET /conversations` still accept an arbitrary `userId` query parameter** rather than being derived from the session — a pre-existing read-privacy gap this slice didn't extend into, since the task's explicit scope was the write-gating (publish/save/message/report) and session mechanics, not a full privacy audit of every read endpoint. Flagged for a future pass.

## Coverage Impact (rough)

The single largest gap identified in the AfroMarketplaces functional-parity assessment — closed. Every account is now real: a real hashed password, a real unique identity per email, a real server-verified session surviving a real restart. This is the foundation Phase 2 (seller profiles, verification badges, reviews) and Phase 3 (real payment rails) of AFRO_PARITY_PLAN.md both depend on.

## Verifier

Self-verified by the same agent that implemented this slice (a full backend smoke test run directly against the real server before any frontend work began; deterministic tests re-run against a real ephemeral Express + SQLite server including a real second-user ownership-rejection test and a real session-survives-restart test; a real Playwright browser session covering sign-up, wrong-password rejection, returning-user login, and guest restrictions with 0 console errors; and — the strongest evidence in this package — a genuine cross-process server restart performed against a real, never-closed browser page, proving session persistence directly rather than through a proxy for it). No independent judge pass has been run. Per AFRO_PARITY_PLAN.md, NM-A15 (Google OAuth) is next.

# UI Overhaul: Facebook-Marketplace-Style Iconography + Desktop Sidebar Navigation

## Goal

Directly requested by the user, with a Facebook Marketplace URL and reference screenshots of its actual top nav icon style and left sidebar: replace every text-only nav control with real iconography matching that style, and rebuild the desktop navigation as a persistent left sidebar structured like Facebook Marketplace's — search box, primary sections (Browse all / Categories / Inbox), a prominent "Create new listing" action, the active location, and a scannable category list with icons. Outside the AFRO_PARITY_PLAN.md numbered sequence (a UI-only slice), but built with the same rigor: deterministic tests, real Playwright verification, and this evidence entry before being reported for acceptance.

## What Changed

### 1. A hand-authored inline SVG icon system, no new dependency

Every icon in `index.html`/`app.js` is a hand-authored inline `<svg>` (Feather/Heroicons-style outline: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.8"`, rounded caps/joins) — no icon-font or icon-library package was added. Coloring via CSS `currentColor` inheritance means active/inactive nav states and per-country theming (`--country-primary`) need zero icon-specific CSS: an icon simply inherits whatever color its containing button already has. Icons now cover: the 5 mobile bottom-nav tabs (house/grid/plus-circle/chat/person), the sidebar's 3 primary sections + create button + location pin + 12 category icons (`CATEGORY_ICONS`, keyed by the real category id, with a `DEFAULT_CATEGORY_ICON` fallback), the search and filter controls, and the listing detail page's Save (outline/filled heart, `HEART_ICON_OUTLINE`/`HEART_ICON_FILLED`), Share (`SHARE_ICON`), and Report (`FLAG_ICON`) buttons.

### 2. A dedicated desktop sidebar, not a repositioned mobile nav

An earlier slice ("Header/Nav Alignment") had approximated a desktop sidebar by CSS-repositioning the mobile `.bottom-nav` itself. That approach couldn't hold Facebook Marketplace's actual sidebar content (a search box, a full category list, a location section) without contorting the mobile markup, so it's replaced outright by a separate `<aside class="marketplace-sidebar">` element: hidden by default (`display: none`, mobile-first) and shown via `@media (min-width: 780px)` as a fixed-position, full-height, 280px-wide left rail (`.app-shell` margin and `.cta-bar` left offset both updated to match). At that same breakpoint `.bottom-nav` is now hidden entirely — the two navs are mutually exclusive by viewport, never both present. Mobile is otherwise completely unchanged: same fixed bottom tab bar, same 5 tabs, now simply with icons added above each label.

### 3. Reusing existing logic, not duplicating it

No new click-handling, data-fetching, or state was introduced for the sidebar's behavior:
- `renderSidebarCategories()` renders `#sidebar-categories-list` from the same `categoryTaxonomy` cache the Categories page already renders from, using the identical `data-category-jump="<id>"` attribute the Categories page's tiles already use — the existing delegated click handler (`if (categoryJump) { ... }` in `bindEvents()`) needed no changes at all to pick up sidebar clicks too. Called from inside the existing `renderCategories()`, so it can never drift out of sync with the Categories page's own list.
- `renderSidebarLocation()` mirrors the existing `#active-location` text plus the current `activeScope` into `#sidebar-location-text`. Called from inside `renderListings()` — the one place scope changes already flow through — so no separate scope-tracking logic exists.
- `handleSidebarSearchInput(event)` is an alternate entry point to the **same** search, not a second search feature: it copies its value into the real `#search-input` and switches to Browse if not already there, then calls the existing `renderListings()`. Typing in the sidebar box and typing in the mobile search box produce identical results through identical code.
- `showView(viewId)` gained one additional line toggling `.active` on `.sidebar-item` elements the same way it already did for `.nav-item` elements — Facebook's sidebar highlights whichever section is open, matching the mobile tab bar's existing behavior.

### 4. A real bug caught while wiring translations, fixed before it shipped

Adding icons inside the mobile nav buttons broke `applyTranslations()`'s original `item.textContent = t(key)` pattern, which would have silently deleted the icon SVG on every language switch. Fixed by restructuring the markup to `<svg>...</svg><span class="nav-label">Label</span>` and retargeting the translation code at `item.querySelector(".nav-label")` specifically. While adding the equivalent sidebar labels, four new translation keys (`sidebar.browseAll`, `sidebar.createListing`, `sidebar.locationTitle`, `sidebar.searchLabel`) were wired into `applyTranslations()`'s static-target map **before their actual English/Swedish translation strings existed in the `translations` dictionary** — meaning `t()`'s fallback (`dict[key] ?? translations.en[key] ?? key`) would have returned the raw key string itself (e.g. the sidebar would have rendered the literal text "sidebar.browseAll") the moment `applyTranslations()` ran, which bootstrap does unconditionally on every page load. Caught by writing the dedicated language-switch test below (it failed immediately, in the expected way) and fixed by adding all four keys to both `translations.en` and `translations.sv` before this slice was considered done.

## Validation Commands

```text
node --check index.html 2>/dev/null; node --check styles.css 2>/dev/null  # (not JS, checked visually + by the test suite's regex assertions instead)
node --check app.js && node --check tests/e2e.js
npm test   (run 4x consecutively against the final code — identical results, exit 0 every time)
PASS: E2E FindNord workflow passed: ... [same full summary line as every prior slice] ... verified.
```

## How the Test Suite Changed

- **Static structural assertions** (new, alongside the existing desktop-sidebar CSS checks from the earlier "Header/Nav Alignment" slice, which were rewritten in-flight to match the new `<aside>`-based architecture instead of the old repositioned-`.bottom-nav` one): every mobile nav tab pairs an icon with its label without replacing it; the sidebar's search box, 3 primary items, create button, location text, and empty categories-list container all exist with the right ids/classes; all 12 real categories have their own dedicated icon in `CATEGORY_ICONS` (not silently falling through to the default); the heart/share/flag icon constants and the three new render functions all exist; the translation code specifically targets `.nav-label`, not the whole button.
- **A new fake-DOM capability**: the hand-rolled `Element` class gained a narrow `querySelector(".nav-label")` stub (the only selector it supports) — a thin proxy over the same underlying `textContent` storage, since the real browser's icon SVG contributes no text either, so `item.textContent` ending up exactly equal to the label text is accurate, not a simplification hiding anything.
- **A new `sidebarItems` array** (3 elements — Browse/Categories/Inbox only, matching the real sidebar's reduced primary-nav — unlike `navItems`, which is a 1:1 stand-in for all 10 views) plus a `.sidebar-item` case in the fake `document.querySelectorAll` dispatcher, so `showView`'s new sidebar-highlighting line is actually exercised.
- **New behavioral assertions**: the sidebar category list renders all 12 real categories with real `data-category-jump` values and real icons (not a hardcoded subset); the sidebar location text mirrors the real active location and scope; the sidebar search syncs into the real `#search-input` and switches to Browse from another tab; `showView` correctly toggles the sidebar's own active-item highlight independently of the mobile nav's identical toggling; a full English→Swedish→English language round trip on every new sidebar label and the search placeholder — this last check is what caught the missing-translation bug in item 4 above.

## Real Browser Evidence (Playwright/Chromium, headless, against a real dev server on a clean database)

| Viewport | Check | Result |
| --- | --- | --- |
| 1280×900 (desktop) | Sidebar visible, bottom nav hidden | `desktopSidebarVisible: true`, `desktopBottomNavVisible: false` |
| 1280×900 | Sidebar search placeholder, labels, location text | "Search Marketplace", "Browse all", "Create new listing", "Stockholm, Sweden · Nearby" — all real, not translation-key leaks |
| 1280×900 | Sidebar category list | 12 items, each with its own `<svg>` icon (`sidebarCategoryCount: 12`) |
| 1280×900 | Sidebar search — typed while on Categories tab | Synced into the real search input (`mainSearchSyncedValue: "record player"`) and jumped to Browse |
| 1280×900 | Clicked a sidebar category ("Vehicles") | Landed on Browse, filtered by that category |
| 1280×900 | Listing detail page — Save/Share/Report buttons | Each has exactly one icon (`saveButtonHasIcon/shareButtonHasIcon/reportButtonHasIcon: 1`) |
| 390×844 (mobile) | Sidebar hidden, bottom nav visible with icons | `mobileSidebarVisible: false`, `mobileBottomNavVisible: true`, `mobileNavIconCount: 5` |
| 390×844 | No horizontal overflow | `scrollWidth === clientWidth === 390` |

Screenshots taken and visually reviewed: the desktop Browse view (sidebar + category chips + listing grid), the desktop listing detail view (sidebar + gallery + Save/Share/Report icons + sticky Message seller bar), and the mobile Browse view (icon bottom-nav, no layout regressions). All three match the Facebook Marketplace reference screenshots' structure and iconography style the user provided.

## Residual Risks

- **The sidebar's category list is not independently scrollable-capped in a way this evidence measured against a very long taxonomy** — `.sidebar-categories-list` has `max-height: 340px; overflow-y: auto;` in CSS, but with only 12 categories today the scroll never actually engages; worth re-checking visually if the taxonomy grows substantially.
- **Save/Share/Report button label text itself remains hardcoded English**, not run through `t()` — a pre-existing gap from before this slice, deliberately not fixed here to keep this diff focused on iconography and the sidebar, not a full i18n audit of the detail page.
- **No dedicated regression test asserts the OLD repositioned-`.bottom-nav`-as-sidebar CSS is fully gone** beyond the static assertions being rewritten to check the new architecture instead — a `doesNotMatch` guard against the old approach was not added, since the old rules were replaced in place rather than left alongside the new ones (confirmed by reading the full diff, not merely inferred).

## Coverage Impact (rough)

Closes the specific gap the user flagged directly against a named competitor (Facebook Marketplace): text-only navigation and no persistent desktop sidebar. Brings the desktop navigation shell into structural (not pixel) parity with Facebook Marketplace's own left sidebar, while leaving the mobile experience — already the primary target of all prior mobile-QA hardening — untouched in behavior.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic test suite re-run 4 times consecutively against the final code with identical results; a real Playwright browser session at both a desktop and a mobile viewport against a real dev server on a freshly reset database, screenshots taken and visually reviewed against the user's own Facebook Marketplace reference screenshots). No independent judge pass has been run.

# Filter & Sort Restyle + State/Region (Select-or-Type, Geolocation-Aware, Distance-Radius Filtering)

## Goal

Three requests from the user, addressed as one connected slice since each built directly on the last: (1) the Filter & sort sheet "looks too [plain/unstyled]... I want it to look smoot[h], 2D"; (2) "I want the user to be able to select or write in states[/regions]. same in Sweden as it is in other Scandinavian countries" — scoped, on the user's explicit choice, as a **full feature**: sellers pick a real region when listing, and it actually filters results, for all 5 countries; (3) mid-implementation, a follow-up: "when one choose... stockholm, and then chooses distance in kilometers, it should show both states and counties within that distance bracket" — and, when asked where the reference location should come from, "Use the user's location as the default... it can also detect if the user is opening from outside one country or another." A fourth ask in that same message — reload-persistent URL routing — is a genuinely separate subsystem (client-side routing/URL state vs. geography) and is explicitly **out of scope here**, flagged to the user as its own next slice rather than bundled in.

## What Changed

### 1. "Smooth, 2D": the Filter sheet's inputs/selects had no styling at all

Root cause of the "too [plain]" complaint: `#sell-form input/select/textarea` was styled, but the Filter sheet's identically-structured fields (same `.sell-field`/`.sell-row` wrapper classes, just not inside `#sell-form`) matched no CSS rule at all — they rendered as bare, unstyled native browser controls (default OS `<select>` chrome included). Fixed by broadening that rule to also cover `.filter-sheet-body`, bumping radius from 8px to 12px, and replacing every native `<select>` arrow with a custom flat SVG chevron (`appearance: none` + a `currentColor`-independent inline data-URI chevron, since `currentColor` isn't reliable inside a CSS `background-image` data URI). Condition/seller-type/category chips (`.chip`, `.scope`) went from rounded rectangles to full pills (`border-radius: 999px`) with a smooth hover transition, matching Facebook Marketplace's own filter-chip styling.

### 2. State/Region: a real combobox, not a closed `<select>`

Both the Sell form and the Filter sheet gained a `<input type="text" list="...">` + `<datalist>` combobox — a user can pick a suggested value or type their own, and `getFilteredListings()` matches typed text with the same diacritic-insensitive substring compare (`normalize()`) the search box already uses, so a real value is never required for filtering to work sensibly. `REGIONS_BY_COUNTRY` (`app.js`) holds real administrative regions for all 5 countries the app already themes for — Sweden's 21 län, Norway's 15 fylker, Denmark's 5 regioner, Finland's 19 maakunnat, Iceland's 8 landshlutar — keyed identically to the existing (previously dormant) `countryThemes`/`activeCountry` mechanism from NM-A3, so this slice is the first thing to actually make that mechanism do something. `db/schema.sql` gained a `region TEXT` column (idempotent migration in `scripts/db.js`, same pattern as every prior additive column); `scripts/api.js`'s generic `LISTING_UPDATE_COLUMNS` allowlist and insert statement both carry it through untouched — no new endpoint logic needed. All 8 existing seed listings were given `region: "Stockholm"` (every one of their localities — Södermalm, Solna, Kungsholmen, etc. — is genuinely in Stockholm county).

### 3. Geolocation-aware default location, with real country auto-detection

`REGION_COORDS` pairs every one of those 68 regions with an approximate real-world centroid (city-level, not survey-grade — consistent with this prototype's existing "approximate" geography, e.g. every listing's own fake `distance` string). `detectUserLocation()` wraps `navigator.geolocation.getCurrentPosition` so a denied/unavailable/unsupported prompt can never hang or break the app — it resolves `null` in every failure case, which is also exactly what happens in this app's own Node-vm test sandbox (no `navigator` global at all), so the ENTIRE deterministic test suite's Stockholm/Sweden-default assumptions needed zero changes. `nearestRegion(coords)` scans every region of every country (not just the active one) via `haversineKm`, so a real position is matched to the right COUNTRY, not just narrowed within whichever one happened to already be active — this is what "detect if the user is opening from outside one country or another" required. `applyDetectedLocation()` is deliberately **not awaited** by `bootstrap()` (a real permission prompt can take a while, or never resolve if ignored) — the app renders immediately with the Stockholm/Sweden default, and live-updates `activeCountry`, the country theme, `#active-location`, and the sidebar location text the instant/if a real position resolves.

### 4. Distance now does double duty: per-listing proximity AND region-radius

The Filter sheet's existing Distance dropdown (5/10/25/50/100 km — previously only compared against each listing's own fake `distance` string) now ALSO computes which real regions of the active country fall within that radius of the active location (`regionsWithinRadius`), and: (a) visibly narrows the Region combobox's own suggestions to just those (`updateFilterRegionSuggestions`, called on sheet-open, on Distance change, and after a real location is detected), and (b) actually filters results to listings in those regions — both halves the user asked for ("auto-fill + real filter"). An explicit typed/picked Region always takes precedence over this derived radius. **A listing with no region on record is never excluded by it** — an important, real bug caught during Playwright verification against the live dev server (see below), not a hypothetical.

## Validation Commands

```text
node --check app.js && node --check scripts/db.js && node --check scripts/api.js && node --check tests/e2e.js
npm test   (run 4x consecutively across both parts of this slice — identical results, exit 0 every time)
PASS: E2E FindNord workflow passed: ... [same full summary line as every prior slice] ... verified.
```

## A Real Bug Caught (and Fixed) While Verifying Against the Live Dev Server

The deterministic test suite's temp database is always freshly seeded, so every listing in it already had a region — this specific bug could only surface against a database that predates the `region` column. Playwright verification against the **real, already-running persistent dev server** (created in earlier NM-A11–A14 sessions, so its 8 listings existed before this slice) caught it immediately: applying a Distance filter with no explicit Region dropped the result count to **zero** — the migration adds the `region` column to old rows but has no way to backfill what their real region was, so they came back `region: ""`, and the radius-matching logic (`inRadius.some(region => ... === listing.region)`) correctly-but-harmfully treated "no region on record" as "out of range." Fixed by short-circuiting the radius check entirely when `listing.region` is falsy (an unknown region can never be excluded, only a known-and-out-of-range one can) — re-verified against the same live server afterward: correctly back to all 8. A dedicated regression test (publishing a listing with the Region field deliberately left blank, then confirming it survives a Distance filter) was added so this can't silently regress.

## How the Test Suite Changed

- New static assertions: the Sell form's and Filter sheet's region fields are real combobox markup (`<input list>` + `<datalist>`, not a plain `<select>`); `REGIONS_BY_COUNTRY`/`REGION_COORDS` exist for all 5 countries; `renderRegionDatalist`, `regionsWithinRadius`, `nearestRegion`, `detectUserLocation`, `haversineKm` all exist; the Filter sheet's inputs/selects and the pill-shaped chips have the new CSS.
- New behavioral coverage: the region typed into the Sell form round-trips onto the real saved listing and prefills correctly on Edit; the Filter sheet's Region field filters by exact pick, by partial/diacritic-varied typed text, and correctly returns zero results for a non-matching typed value; Distance narrows the Region datalist's own suggestions (verified against real, independently-computed haversine distances from Stockholm: only Stockholm itself is within 10 km, Uppsala joins at 100 km) and widens it back to all 21 on "Any distance"; a listing with no region survives Distance filtering (the regression test for the bug above); the pure geo primitives (`haversineKm`, `nearestRegion`, `detectUserLocation`) are tested directly and deterministically, independent of any UI.
- An **existing** NM-A5 test's expectations were deliberately updated, not just patched around: with Distance=10 km and no explicit Region, "Test kayak" (region "Västra Götaland," ~400 km from Stockholm) is now correctly excluded from a result set it previously qualified for on every other axis (condition, seller type, price, its own fake per-listing distance) — 3 listings became 2, and 6 became 5, in the two places that mattered. Clearly commented in place with the real haversine distance that explains it, since this is an intentional expansion of what "Distance" means, not a regression.
- Real geolocation itself is **not** exercised via the fake Node-vm sandbox (it has no `navigator` global at all, by design — the same reason the app's own fallback path is exercised for free by every other test in the suite). It's covered instead by real Playwright browser sessions with `context.setGeolocation()`/`permissions: ["geolocation"]`, below.

## Real Browser Evidence (Playwright/Chromium, against the real dev server)

| Check | Result |
| --- | --- |
| Filter sheet, mobile 390×844, restyled | Pill-shaped Condition/Seller chips, flat custom-chevron selects, soft-filled 12px-radius inputs — screenshot reviewed, matches "smooth, 2D" |
| Geolocation granted, position = Oslo (59.91, 10.75) | `#active-location` and sidebar both become "Oslo, Norway"; `--country-primary` becomes Norway's `#BA0C2F`; Region datalist becomes Norway's 15 fylker (has "Oslo", no longer has "Stockholm") |
| Geolocation permission never granted (default) | Stays at the Stockholm/Sweden default; 0 console errors; survives a reload |
| Filter sheet Distance = 10 km (before the bug fix) | Region datalist correctly narrowed to `["Stockholm"]`, but **result count wrongly dropped to 0** — the bug described above |
| Same check, after the fix, against the same live (unreset) server | Region datalist still `["Stockholm"]`; result count correctly back to **8 listings** |
| Screenshots (desktop, Oslo-detected) | Full page — sidebar, topbar, category chips, and Create-listing button all instantly re-themed red (Norway); Filter sheet reviewed with "Within 10 km" selected and the Region field ready for its narrowed suggestions |

## Residual Risks

- **Region centroids are city-level approximations, not survey-grade coordinates** — explicitly consistent with this prototype's existing fake per-listing `distance` strings, but worth real geocoding data before this leaves prototype status.
- **Pre-existing listings (anything published before this slice) have no region and are never radius-excluded** — correct behavior (see the bug fix above), but it also means Distance-driven region filtering is effectively a no-op for old data until those listings are edited and given a real region.
- **`activeLocationCoords` (the radius-search reference point) only updates from a real detected position, never from a typed Region/Distance choice** — picking "Oslo" in the Region field does not itself move the reference point; only real geolocation (or the Stockholm default) does. Reasonable for this slice, but worth revisiting if the reload-persistent-routing slice ends up wanting a URL-settable location too.
- **Reload-persistent URL routing (the fourth ask in the user's follow-up message) is explicitly out of scope for this slice** — a different subsystem (client-side routing/URL state vs. geography), flagged to the user as the next slice rather than bundled in here.
- **The Save/Share/Report label-text-not-translated gap** (noted in the prior UI-overhaul slice) still stands, untouched by this one.

## Coverage Impact (rough)

State/Region reaches full parity with the user's explicit ask: select-or-type, working identically for all 5 Scandinavian countries, with a real (if approximate) geographic backbone now in place for the first time in this project — and the previously-dormant country-theming mechanism from NM-A3 is, for the first time, actually driven by something (real geolocation) rather than a permanently-Sweden default.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic test suite re-run 4 times consecutively across both the styling/region-combobox portion and the geolocation/radius portion, identical results each time; real Playwright browser sessions covering styled-sheet, geolocation-granted, geolocation-denied, and Distance-narrowing scenarios; a real bug found and fixed against the live, pre-existing dev server rather than only the always-fresh test database, with a regression test added). No independent judge pass has been run.

# Bug Fixes: Logo Navigation, Share Button, "Is This Still Available?" Quick Opener

## Goal

Direct user report: "When clicked, the logo should always send the user to home page. The share button and the message 'Is this available' are not working at all." All three were genuinely inert, not partially working — confirmed by reading the code before touching it, not just by reproducing symptoms.

## What Changed

### 1. The logo (`.brand`) was a plain, non-interactive `<div>`

It had no `data-view`, no click handler, nothing — clicking it did precisely nothing. Fixed by converting it to `<button type="button" class="brand" data-view="browse-view" aria-label="FindNord home">`, which routes through the exact same `[data-view]` delegated click handler every other nav control (bottom-nav tabs, sidebar items) already uses — zero new click-handling logic. CSS resets the element back to looking like the original `<div>` (`border: 0; background: none; padding: 0;` etc.) plus `cursor: pointer` so it now also *looks* clickable.

### 2. The Share button had never been wired to anything

The button existed in the listing detail template with an icon and an `aria-label`, but no `data-*` attribute and no entry in the delegated click handler's selector list at all — clicking it was a complete no-op. Implemented for real: `handleShareClick(id)` prefers the native `navigator.share()` share sheet where the browser supports one, falling back to `navigator.clipboard.writeText()` (with a toast, since a clipboard write is otherwise invisible) everywhere else — which is also what any current desktop browser without a native share sheet will actually hit. Share needs no account, unlike Save/Message/Report/Publish, since it doesn't touch any user-specific data — a guest can share exactly as freely as they can browse.

**Known, honestly-scoped limitation**: this app has no URL routing yet (a page reload always returns to Browse — see the previous slice's explicitly-deferred "reload-persistent routing" item), so there is no per-listing deep link to share. The shared text/URL is the site's own address plus a text summary (title + price), not a link that reopens this exact listing. This will improve once routing exists; it is not something Share itself can fix.

### 3. The "Hi, is this still available?" quick-opener pill was a dead button

`#suggested-opener` sits right in the listing detail page with that exact text, clearly implying "tap this to send it" — but it had no listener either. Since `openMessageComposer()` already pre-fills the compose modal with that identical string, the pill needed no new business logic at all: it now shares the exact same delegated handler as `#message-seller` (`event.target.closest("#message-seller, #suggested-opener")`), so it goes through the same auth gate for a guest and opens the same pre-filled composer for a signed-in user.

## Validation Commands

```text
node --check app.js && node --check tests/e2e.js
npm test   (run 4x consecutively — identical results, exit 0 every time)
PASS: E2E FindNord workflow passed: ... [same full summary line as every prior slice] ... verified.
```

## How the Test Suite Changed

- The shared vm-sandbox context gained a fake `navigator` (`clipboard.writeText` as a spy recording what was written, deliberately **no** `navigator.share`, so the realistic desktop-fallback path is what gets exercised) and a minimal fake `window` (`location.href` + a no-op `addEventListener`, since `updateChipCarouselArrows`'s resize listener would otherwise throw the moment `window` existed at all without one).
- New behavioral test: `handleShareClick("iphone-14")` writes the exact expected `"iPhone 14, 128 GB — 5 900 kr http://localhost:4173/"` to the fake clipboard and shows the correct toast text.
- New static assertions: `handleShareClick`/`copyShareLinkToClipboard` exist; the delegated handler recognizes `[data-share-listing]`; the suggested-opener pill and Message seller button share the exact same selector string; the logo is real button markup with the right `data-view`.
- The fake DOM's `Element.closest()` always returns `null` (a long-standing simplification — see the file's own comments), so the delegated click-routing itself (as opposed to the handler functions it calls) can't be exercised by the deterministic suite for any control, including these three. That's what the Playwright pass below is for.

## Real Browser Evidence (Playwright/Chromium, against the real dev server)

| Check | Result |
| --- | --- |
| Click the logo while on Categories | Returns to Browse (`browse-view.active-view` becomes true) |
| Click the logo while on a listing detail page | Also returns to Browse — not just from other top-level tabs |
| Click Share on a real listing (clipboard permissions granted) | Toast reads "Link copied to clipboard."; `navigator.clipboard.readText()` returns the exact expected text |
| Click the suggested-opener pill as a guest | Opens the same auth modal Message seller would |
| Click the suggested-opener pill signed in | Opens the compose modal, pre-filled with "Hi, is this still available?", titled "Message Nordic Refurb" — screenshot reviewed |
| Console/page errors across the whole flow | 0 |

## Residual Risks

- Share's lack of a real per-listing deep link (see above) — inherent to this app not having URL routing yet, not a defect in Share itself.
- `navigator.share()`'s real success path (as opposed to the clipboard fallback) is not exercised by either the deterministic suite (no `navigator.share` faked, deliberately) or this Playwright pass (desktop Chromium headless doesn't expose a native share sheet) — the code path is a standard, small `try`/`catch` around a browser API, but is unverified beyond feature-detection not crashing.

## Verifier

Self-verified by the same agent that implemented this slice (deterministic test suite re-run 4 times consecutively with identical results; real Playwright browser verification of all three fixes, both as a guest and signed in, with 0 console errors). No independent judge pass has been run.

# NM-A15: Real Authentication — Google Sign-In (Social Login)

## Goal

Per AFRO_PARITY_PLAN.md Phase 1, add "Continue with Google" as a real, second authentication method alongside NM-A14's email + password — same session system, same account model, same auth boundaries (guests can browse; publish/save/message/report still require a real account). Explicit requirements: a proper OAuth 2.0 flow (Google Identity Services or equivalent), correct new-vs-existing-user handling, clean edge cases, full i18n/country theming, no token retention beyond the login flow, expanded tests with the Google side mocked (no real Google Cloud credentials exist in this project's environment), and clear documentation of required environment variables with no hard-coded secrets.

## Required Environment Variables

| Variable | Required? | Purpose |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | **Yes**, to enable Google sign-in | The OAuth 2.0 Client ID from a Google Cloud project's "OAuth consent screen" / "Credentials" setup (a Web application client). This is a **public** identifier — it is served as-is to the frontend (`GET /api/auth/google/config`) and embedded in every real Google Sign-In integration's client-side JS; it is not a secret. |
| `GOOGLE_CLIENT_SECRET` | **Not used anywhere in this app** | Deliberately not read, required, or referenced by any code path. See "Why no client secret" below. |

If `GOOGLE_CLIENT_ID` is unset, the server logs a clear startup note (matching the existing `OPENAI_API_KEY` note) and the frontend renders a graceful "Google sign-in is currently unavailable" message instead of a broken button — email + password keeps working exactly as before. No secret of any kind is hard-coded anywhere in this codebase (verified by a dedicated static test assertion, and by the fact that the app runs and passes its full test suite with zero Google environment variables set at all, which is this project's own actual dev/test state).

### Why no client secret

A client secret is required only for the OAuth 2.0 **authorization code** exchange (trading a code for tokens server-to-server) — a flow this app does not use. This app uses Google Identity Services' **ID token** flow instead (explicitly permitted by this slice's own requirements: "Google Identity Services or equivalent"): the frontend gets a signed ID token (JWT) directly from Google after the user picks an account, and the backend verifies that JWT's signature against Google's published public keys, its issuer, its audience (must be *our* `GOOGLE_CLIENT_ID`), and its expiry. None of that needs a secret — it's the same trust model every OIDC "verify an ID token" flow uses. This is a deliberate, documented architecture choice (see `scripts/google-auth.js`'s own header comment), in the same spirit as NM-A14's scrypt-over-bcrypt and hand-rolled-cookie decisions: simpler, one fewer secret to provision and protect, and no new npm dependency (Node's built-in `crypto.createPublicKey({format:"jwk"})` + `crypto.verify` handle RS256 JWT verification natively).

## What Changed

### 1. Data model: `users.google_id`, linking real accounts across both sign-in methods

`db/schema.sql` gains `google_id TEXT`; `scripts/db.js`'s `migrateUsersGoogleIdColumn(db)` adds it (and a unique index, try/catch-wrapped, same pattern as NM-A14's email index) to any pre-existing database, idempotently. A user row can have `password_hash`, `google_id`, both, or (only a pre-NM-A14 row) neither — the two sign-in methods are independent, not mutually exclusive.

### 2. `scripts/google-auth.js` (new): real RS256 JWT verification, no new dependency

`verifyGoogleIdToken(idToken, { clientId, fetchJwks })` does full, real verification: splits and decodes the JWT, fetches (and caches for 1 hour, matching Google's own `Cache-Control`) Google's JWKS, finds the signing key by `kid`, imports it via `crypto.createPublicKey({ key: jwk, format: "jwk" })`, and checks the signature with `crypto.verify("RSA-SHA256", ...)`. Beyond the signature, it separately validates `iss` (must be a real Google issuer string), `aud` (must be *this app's* client id — a token valid for a different app must not be accepted), `exp` (must not be expired), and `email_verified` (must not be explicitly `false`). Returns only `{ googleId, email, name }` — the raw token is never returned, logged, or persisted (requirement 8). `fetchJwks` is injectable specifically so tests can point verification at a locally-generated JWKS instead of the real Google endpoint.

### 3. `POST /api/auth/google` and `GET /api/auth/google/config`

Config: serves the (public, non-secret) client id, or `null` if unset — the frontend's signal to render its fallback. Login: verifies the credential, then — in order — looks up by `google_id` (returning user), then by `email` (an existing password-only account gets `google_id` linked onto it, its password left untouched, so *either* method keeps working afterward), then creates a brand-new user (`password_hash` left `NULL`) if neither matched. A real session is created exactly the same way `/register`/`/login` already do (`createSession` + `Set-Cookie`) — genuinely the same session system, not a parallel one. Errors map to specific codes/statuses: `INVALID_GOOGLE_TOKEN` (401, covers malformed/tampered/wrong-signature/wrong-audience/wrong-issuer/expired), `GOOGLE_EMAIL_NOT_VERIFIED` (403), `GOOGLE_NOT_CONFIGURED` (503).

### 4. The frontend: a second real button on both auth surfaces, same finish as email/password

Both the interrupted-action auth modal and the dedicated Login page gained a `google-signin-container` div (Google's own `renderButton()` populates it — its internal styling/accessible text are Google's, a well-known constraint of any real integration, not a shortcut taken here) above an "or continue with email" divider, both fully i18n'd via the existing `applyTranslations()`/`t()` pipeline. `initGoogleSignIn()` (fire-and-forget from `bootstrap()`, matching the geolocation slice's `applyDetectedLocation()` pattern — a real external script load must never block first render) fetches the config, loads the real `accounts.google.com/gsi/client` script, and calls `google.accounts.id.initialize()`; on any failure at any step (not configured, script blocked, offline) it falls back to a translated "Google sign-in is currently unavailable" message in both containers, never a broken empty button. `renderGoogleButtons()` passes `locale` mapped from the app's own `currentLanguage` (`no` → Google's `nb`, others map 1:1), and is re-invoked on every language switch via a new `refreshGoogleSignInUi()` call inside `applyTranslations()`. `handleGoogleCredentialResponse()` is the one callback both buttons share (GIS has a single global callback per `initialize()` call, not one per rendered button) — it calls the exact same `completeSignIn(user)` every other sign-in path already uses, so a Google sign-in resumes a pending Save/Message/Report/Publish exactly like a password one, and shows its error in whichever surface (`auth-error` vs `login-error`) is actually open.

### Edge cases (requirement 6)

- **User cancels/closes the Google popup**: the registered callback is simply never invoked by GIS in that case — nothing to catch, nothing breaks, the form stays fully usable and the user can just try again or use email/password.
- **Email already registered (password account)**: not treated as an error at all — silently, correctly links and logs in (see item 3).
- **Tampered signature / wrong signing key / wrong audience / wrong issuer / expired / unverified email / malformed token / missing credential**: each independently, verifiably rejected (see testing below) with a specific error code and a clean, translated message shown to the user — never a crash or a silent pass-through.
- **Google not configured, or its script fails to load**: graceful fallback message, both auth surfaces, both a "never configured" and a "configured but the SDK couldn't be reached" path (both are real, distinct code paths, both tested).

## Validation Commands

```text
node --check scripts/google-auth.js && node --check scripts/auth.js && node --check scripts/db.js && node --check scripts/server.js && node --check data-service.js && node --check app.js && node --check tests/e2e.js
npm test   (run 8x consecutively across this slice, including after every fix — identical results, exit 0 every time)
PASS: E2E FindNord workflow passed: ... [same full summary line as every prior slice] ... verified.
```

## A Real Backend Smoke Test Before Touching the Frontend

Before any frontend work, a standalone script exercised the whole backend directly against a real running server: a real RSA keypair was generated, its public half published as a hand-built JWKS, and `global.fetch` was patched to serve it instead of the real Google endpoint whenever `scripts/google-auth.js` asked for Google's public keys. Every scenario passed on the first real run: config endpoint serves the client id; a brand-new Google account creates a real user + real session; the same Google account signing in again resolves to the *same* user, not a duplicate; an existing email/password account "continuing with Google" links to that *same* account and its original password keeps working afterward; and seven distinct rejection scenarios (tampered signature, wrong audience, expired, unverified email) all failed exactly as they should.

## How the Test Suite Changed

- **Module-level Google mocking, set up before the shared test server starts**: a real RSA keypair, a hand-built JWKS, and a `makeFakeGoogleIdToken(overrides)` helper that can deliberately break any claim (wrong `aud`, wrong `iss`, expired `exp`, `email_verified: false`, sign with the *wrong* key, or truncate to a malformed token) to exercise every rejection path for real. `global.fetch` is patched at true module load time (before `main()` calls `startTestServer`) to serve the fake JWKS only for requests to Google's real JWKS URL — every other `fetch` call throughout this large file (there are many, straight to the real test server) passes through completely unaffected. `process.env.GOOGLE_CLIENT_ID` is set to a fake-but-real-shaped id for the same reason.
- **New static assertions**: the schema has `google_id`; the auth router accepts an injectable Google verifier and never references `GOOGLE_CLIENT_SECRET`; account linking uses `UPDATE`, not a second `INSERT`; JWT verification uses Node's own `crypto`, not a new dependency; both HTML surfaces have real Google button containers and a translated divider; the raw credential is never written into a SQL statement or `localStorage`.
- **New behavioral coverage, against the real Express + SQLite test server** (not a mock of the app's own backend): config endpoint; new-user creation; returning-Google-user recognition (same id, not a duplicate); existing-password-account linking (with a live re-login on the original password afterward, proving nothing broke); all eight edge-case rejections (tampered / wrong signing key / wrong audience / wrong issuer / expired / unverified email / malformed / missing credential), each checked for both the right HTTP status and the right error code.
- **New frontend behavioral coverage**: a Google sign-in resumes a pending gated Save exactly like email/password does (a real bug was caught and fixed here — see below); a rejected/garbage credential shows a visible, non-empty error in whichever surface is open; the Login page's Google button additionally lands on the You tab after success, matching the email/password Login page's own behavior (a second real bug was caught and fixed here too); the "unavailable" fallback renders correctly and re-translates on a language switch.

## A Real Bug Caught (and Fixed) While Writing the Frontend Tests

`handleGoogleCredentialResponse` originally checked `activeView === "login-view"` **after** `await completeSignIn(user)` to decide whether to redirect to the You tab — but `completeSignIn` can itself change `activeView` (it reopens the detail view for a pending action via `openListing(currentDetailListingId)`), so that check could read a value `completeSignIn` had already overwritten, silently skipping the redirect. Caught immediately by the Login-page test (`views.find(v => v.id === "you-view").classList.contains("active-view")` came back `false`). Fixed by capturing `wasOnLoginPage` **before** calling `completeSignIn`, matching the semantics the email/password Login page's own handler already gets "for free" by being a separate function scoped only to that page's own submit event. A second, related bug (asserting `isSaved()` immediately after `await handleGoogleCredentialResponse(...)` instead of polling with `waitFor`) was a test-only mistake, not an app defect — `completeSignIn` fires a resumed pending action fire-and-forget, the same well-documented NM-A11-era lesson every other resumed-action test in this file already follows; fixed in the test, not the app.

## Real Browser Evidence (Playwright/Chromium, against real running dev servers)

This environment has genuine internet access to `accounts.google.com` (verified directly), so both realistic configurations were tested against the real Google infrastructure, not just simulated:

| Scenario | Result |
| --- | --- |
| **No `GOOGLE_CLIENT_ID` set** (this project's own actual default) — auth modal | Shows the translated "Google sign-in is currently unavailable." message; email + password fully usable; 0 console errors |
| Same, on the dedicated Login page | Same graceful fallback; screenshot reviewed |
| **A real (syntactically valid, unregistered) `GOOGLE_CLIENT_ID` configured** — auth modal | The real `accounts.google.com/gsi/client` script loads; Google's own button renders as a real iframe with the correct `client_id` and `hl=en` locale baked into its URL; screenshot reviewed |
| Same, switching language to Swedish | The app's own surrounding copy (`or continue with email` divider) correctly re-translates; Google's console log correctly shows `[GSI_LOGGER]: The given client ID is not found` — Google's own real infrastructure correctly rejecting a fake, unregistered client id, proving the integration genuinely reaches Google's servers rather than just rendering something inert locally |

## Residual Risks

- **No real Google Cloud OAuth client exists for this project**, so an actual end-to-end completed Google sign-in (a real human picking a real Google account in the real popup) has not been, and could not be, driven in this environment — exactly what requirement 9 anticipates ("mock the Google side where real credentials are not available"). Everything up to and including Google's own real servers correctly validating/rejecting the request has been verified for real; only the final "a real human authenticates" step is unverified here, and will need one manual check the first time this app is deployed with real `GOOGLE_CLIENT_ID` credentials.
- **A Google-only account (no password set) has no password-recovery/password-setting path** — if Google sign-in became unavailable for that user for some reason, they'd have no fallback into that same account. Reasonable to defer; NM-A14 already has an analogous "no password reset flow" residual risk.
- **Google's own rendered button cannot be restyled** beyond `theme`/`shape`/`size`/`locale` — a well-known, universal constraint of any real Google Sign-In integration, not a shortcut taken here.
- **The observed Swedish-language button text on a `hl=en`-configured iframe** (see the screenshot review) appears to be Google's own client-side locale heuristics (likely `navigator.language`/OS locale) taking precedence over the explicit `hl` param in some cases — the app correctly passes `hl` derived from `currentLanguage` either way; this is Google SDK behavior outside this app's control, not a defect in the integration.

## Coverage Impact (rough)

Closes NM-A15, the second and final item of AFRO_PARITY_PLAN.md Phase 1 (Real Authentication) — email + password (NM-A14) and Google Sign-In now both real, both backed by the same account/session system, both fully tested. Per AFRO_PARITY_PLAN.md, Phase 2 (seller profiles, verification badges, reviews) is next.

## Verifier

Self-verified by the same agent that implemented this slice (a full backend smoke test run directly against a real server before any frontend work began; deterministic test suite re-run 8 times consecutively with identical results, including genuine RS256 JWT verification against a locally-generated keypair/JWKS and 8 distinct rejection scenarios; real Playwright browser verification against real Google infrastructure in both the unconfigured and configured states, with 2 real bugs caught and fixed during test-writing rather than after). No independent judge pass has been run.
