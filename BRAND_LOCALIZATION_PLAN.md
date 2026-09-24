# FindNord Brand, UI, and Localization Plan

Date: 2026-09-22

## Brand Direction

FindNord should feel Scandinavian first, not like a blue Facebook clone.

- Primary palette: Swedish flag blue `#006AA7`.
- Accent palette: Swedish flag yellow `#FECC02`.
- Supporting colors should stay quiet: white, off-white, soft borders, muted text, and restrained trust/safety colors.
- Use Facebook Marketplace as an interaction inspiration: immediate browse, simple cards, familiar navigation, seller contact, and low friction.
- Use Jiji.ng as a classifieds-depth inspiration: structured filters, seller history, professional/private seller distinction, listing management, and serious buyer tools.
- Do not copy either product visually. The final feel should be calmer, more local, and more privacy-conscious.

## Verified Completed Work

### Brand and responsive UI

- Desktop/tablet: full `FindNord` wordmark with the logo mark.
- Small screens: compact `FN` wordmark with the same logo mark.
- The compact mark prevents cramped or irregular lettering in narrow headers.
- The default theme uses Swedish blue `#006AA7` and yellow `#FECC02`.
- Reduced oversized button heights and horizontal padding across header, filters, secondary actions, nav, modals, and publish buttons.
- Preserved reasonable mobile tap targets for primary actions.

### Localization foundation

- English, Swedish, Norwegian Bokmål, Danish, Finnish, and Icelandic UI-chrome dictionaries are populated and coverage-tested. Norwegian, Danish, Finnish, and Icelandic are not general UI-chrome fallback stubs.
- Navigation, browse, detail, auth, sell, filters, inbox, errors, account actions, and the signed-out topbar use the translation system. Language changes re-render the signed-out topbar label and accessible name.
- Listing counts use locale-aware plural rules.
- Listing currency is fixed by listing country and formatted as SEK, NOK, DKK, EUR, or ISK with `Intl.NumberFormat`.
- Listing dates and relative time are locale-aware.
- Country color configuration exists for Sweden, Denmark, Norway, Finland, and Iceland.
- Region lists and location-detection groundwork exist.

Mission: FindNord should feel native across Scandinavia and the wider Nordic region. The remaining work below is intentionally separated from verified implementation.

## Remaining VAD Atoms

### BL-A02 — Localize long-form static pages

- Scope: translate `STATIC_PAGES` content for Swedish, Norwegian Bokmål, Danish, Finnish, and Icelandic while retaining English.
- Success: every supported language renders native page titles and bodies; internal static-page links still navigate correctly; legal and safety pages never silently fall back to English.
- Dependencies: approved source copy and BL-A03 native review for legal, privacy, safety, and transaction language.

### BL-A03 — Native-language copy review

- Scope: professional review of moderation, safety, authentication, seller, transaction, and long-form legal copy in all six languages.
- Success: reviewer decisions are recorded, approved wording is applied, and terminology is consistent across UI chrome and static pages.
- Dependencies: BL-A02 draft translations; access to qualified native reviewers and legal review where required.

### BL-A04 — Local category names and search synonyms

- Scope: define locale-specific category labels and synonyms without changing canonical stored category identifiers.
- Success: each category has an approved label in all six languages; localized synonyms resolve to the intended canonical category; tests cover representative terms per locale.
- Dependencies: native terminology decisions from BL-A03.

### BL-A05 — Localized and de-accented search

- Scope: normalize accents and connect approved local-language variants to browse search.
- Success: accented and de-accented forms return equivalent relevant results, localized category synonyms are searchable, and normalization does not corrupt Nordic letters or stored listing text.
- Dependencies: BL-A04 synonym map.

### BL-A06 — Saved home-location semantics

- Scope: separate browsing-country changes from the user's saved home location.
- Success: switching country changes browse scope only; the saved home location changes only after an explicit user action; reload and locale tests prove both behaviors.
- Dependencies: a product decision on the explicit home-location control and persistence model.

### BL-A07 — Mobile screenshot QA

- Scope: capture and review browse/header/filter states at 320, 375, 390, and 430 px.
- Success: screenshots show mark + `FN`, readable controls, no horizontal overflow, usable tap targets, and at least one real listing visible above the fold; defects become bounded follow-up atoms.
- Dependencies: a runnable browser viewport harness and stable representative listing data.

### BL-A08 — Final logo and favicon assets

- Scope: replace the temporary inline mark after logo approval and add light/dark favicon variants.
- Success: approved vector assets render sharply in full and compact headers, favicon variants work on light/dark browser chrome, and no temporary asset remains.
- Dependencies: final logo approval and delivered source vectors.

### BL-A09 — Button-role audit

- Scope: audit primary, secondary, destructive, chip, navigation, and icon buttons.
- Success: each role has consistent dimensions and emphasis; utility actions stay quieter than primary actions; listing content remains visually dominant.
- Dependencies: BL-A07 screenshots.

## Product Work Still Needed

- Filter and sort polish inspired by Jiji.ng depth, but progressively disclosed.
- Stronger listing creation UX with better photo handling.
- Saved searches and alerts.
- Analytics events from the PRD.
- Country-by-country launch configuration.

## Acceptance Criteria Evidence

- **Verified:** no `NordicMarket` copy remains in shipped markup; the regression suite guards this.
- **Verified in source/tests:** the small-screen header provides mark + `FN`, while the full wordmark remains for larger screens.
- **Verified in source/tests:** the default color system is Swedish blue/yellow.
- **Implemented, pending visual sign-off:** button sizing was reduced and tap targets retained; BL-A09 completes the role-by-role audit.
- **Not yet visually verified:** mobile browse keeps a real listing above the fold at every target width; BL-A07 owns the screenshot evidence.
- **Verified by this plan:** known localization and brand gaps are tracked as bounded VAD atoms with success criteria and dependencies.
