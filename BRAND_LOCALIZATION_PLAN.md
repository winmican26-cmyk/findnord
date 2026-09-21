# FindNord Brand, UI, and Localization Plan

Date: 2026-09-21

## Brand Direction

FindNord should feel Scandinavian first, not like a blue Facebook clone.

- Primary palette: Swedish flag blue `#006AA7`.
- Accent palette: Swedish flag yellow `#FECC02`.
- Supporting colors should stay quiet: white, off-white, soft borders, muted text, and restrained trust/safety colors.
- Use Facebook Marketplace as an interaction inspiration: immediate browse, simple cards, familiar navigation, seller contact, and low friction.
- Use Jiji.ng as a classifieds-depth inspiration: structured filters, seller history, professional/private seller distinction, listing management, and serious buyer tools.
- Do not copy either product visually. The final feel should be calmer, more local, and more privacy-conscious.

## Logo Responsiveness

Implemented now:

- Desktop/tablet: full `FindNord` wordmark with the logo mark.
- Small screens: compact `FN` wordmark with the same logo mark.
- The compact mark prevents cramped or irregular lettering in narrow headers.

Next:

- Replace the inline temporary mark with a finalized vector asset once the logo is approved.
- Add light/dark favicon variants.
- Test at 320, 375, 390, and 430 px widths with screenshots.

## Button Sizing

Implemented now:

- Reduced oversized button heights and horizontal padding across header, filters, secondary actions, nav, modals, and publish buttons.
- Preserved reasonable mobile tap targets for primary actions.

Next:

- Audit all buttons by role: primary, secondary, destructive, chip, nav, icon.
- Keep primary actions visually strong, but make utility actions quieter.
- Avoid oversized pill rows that compete with listings.

## Localization Plan

Mission: FindNord should feel native across Scandinavia and the wider Nordic region.

Current state:

- English and Swedish are wired in the app.
- Norwegian, Danish, Finnish, and Icelandic currently fall back to English in places.
- Country color configuration exists for Sweden, Denmark, Norway, Finland, and Iceland.
- Region lists and location detection groundwork exist.

Required localization work:

1. Complete UI copy for Swedish, Norwegian, Danish, Finnish, Icelandic, and English.
2. Move every remaining hard-coded string into the translation dictionary.
3. Add pluralization rules for counts like `1 listing` vs `6 listings`.
4. Format currency by listing country: SEK, NOK, DKK, EUR, ISK.
5. Format dates and relative time by locale.
6. Add local category names and synonyms.
7. Add de-accented and local-language search variants.
8. Professionally review moderation, safety, auth, seller, and transaction copy.
9. Add locale tests for navigation, browse, detail, auth, sell, filters, inbox, and errors.
10. Ensure changing country does not silently overwrite the saved home location.

## Product Work Still Needed

- Real mobile screenshot QA.
- Filter and sort polish inspired by Jiji.ng depth, but progressively disclosed.
- Stronger listing creation UX with better photo handling.
- Report/block and moderation queue.
- Saved searches and alerts.
- Seller profiles with trust signals that do not overclaim.
- Analytics events from the PRD.
- Country-by-country launch configuration.

## Acceptance Criteria For Next Brand Pass

- No `NordicMarket` copy remains in shipped UI.
- Small-screen header shows mark + `FN`, not the full word.
- Default color system is Swedish blue/yellow.
- Primary buttons are not oversized and do not dominate browse cards.
- Mobile browse keeps real listings visible above the fold.
- Localization gaps are listed and tracked as explicit VAD atoms.
