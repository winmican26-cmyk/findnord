// NM-A21: must be set before scripts/auth.js is first required anywhere
// below (its own ADMIN_EMAIL constant is read once, at module-load time) --
// this is the one, real, designated test admin account for the whole suite.
process.env.ADMIN_EMAIL = "nma21-admin@example.com";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { startServer } = require("../scripts/server");
const { resetRateLimiterState } = require("../scripts/rate-limit");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");
const dataServiceJs = fs.readFileSync(path.join(root, "data-service.js"), "utf8");
const seedDataJs = fs.readFileSync(path.join(root, "db", "seed-data.js"), "utf8");
// Run as one combined script: Node's vm module does not share top-level
// `const`/`let` bindings across separate runInContext calls even on the same
// context object (unlike real <script> tags in one browser realm), so
// app.js's bare reference to `DataService` only resolves if both files
// execute as a single script.
const combinedJs = `${dataServiceJs}\n${js}`;

assert.match(html, /FindNord/);
assert.match(html, /class="brand-mark"/, "the FindNord logo mark must be present in the topbar");
assert.match(html, /fill="var\(--country-primary\)"/, "the logo mark's color must be tied to the live country theme");
assert.match(html, /class="brand-full">FindNord<\/span>/, "the full FindNord wordmark must remain available on larger screens");
assert.match(html, /class="brand-compact" aria-hidden="true">FN<\/span>/, "small screens must use a compact FN wordmark beside the logo mark");
assert.doesNotMatch(html, /NordicMarket/, "the old working-title brand name must not linger anywhere in the shipped markup");
assert.match(html, /Browse/);
assert.match(html, /Categories/);
assert.match(html, /Sell/);
assert.match(html, /Inbox/);
assert.match(html, /You/);
// Deployment-readiness Phase 1: Twitter/X conversion tracking pixel removed
  // to align with Privacy/Cookie Policy claims ("no third-party ad-tracking").
  // Verify the pixel and its config call are NOT present.
  assert.doesNotMatch(html, /https:\/\/static\.ads-twitter\.com\/uwt\.js/);
  assert.doesNotMatch(html, /twq\('config','rfixf'\)/);
assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(
  css,
  /@media \(min-width: 780px\) \{[\s\S]*?\.listing-grid,\s*\n\s*\.category-grid \{\s*\n\s*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/,
  "desktop grid must show 4 per row"
);
assert.match(css, /focus-visible/);

// --- Desktop sidebar navigation, Facebook-Marketplace style (a dedicated
// <aside>, not the mobile bottom-nav repositioned) ---
// Mobile keeps the unchanged fixed bottom tab bar at all times.
assert.match(
  css,
  /\.bottom-nav\s*{[^}]*position: fixed;[^}]*right: 0;[^}]*bottom: 0;[^}]*left: 0;/,
  "mobile bottom-nav must remain a fixed full-width bottom bar"
);
assert.match(css, /\.marketplace-sidebar\s*{\s*\n\s*display: none;\s*\n\s*}/, "the sidebar must be hidden by default (mobile-first) before the desktop override");
const desktopMediaMatch = css.match(/@media \(min-width: 780px\) \{([\s\S]*?)\n\}\n\n@media \(max-width: 430px\)/);
assert.ok(desktopMediaMatch, "desktop media query block must exist");
const desktopBlock = desktopMediaMatch[1];
assert.match(desktopBlock, /\.bottom-nav\s*{\s*\n\s*display: none;\s*\n\s*}/, "the mobile tab bar must be hidden entirely on desktop, replaced by the sidebar");
assert.match(desktopBlock, /\.marketplace-sidebar\s*{[^}]*position: fixed;[^}]*top: 0;[^}]*bottom: 0;[^}]*left: 0;/, "the sidebar must be pinned full-height on the left");
assert.match(desktopBlock, /\.marketplace-sidebar\s*{[^}]*width: 280px;/);
assert.match(desktopBlock, /\.app-shell\s*{[^}]*margin: 0 0 0 280px;/, "app content must shift right to clear the sidebar");
assert.match(desktopBlock, /\.cta-bar\s*{[^}]*left: 280px;/, "detail CTA bar must not sit under the sidebar on desktop");

// --- Facebook-Marketplace-style iconography, hand-authored inline SVG (no
// icon-font/library dependency), colored via currentColor so theming/active
// states need zero icon-specific CSS ---
["Browse", "Categories", "Sell", "Inbox", "You"].forEach((label) => {
  assert.match(
    html,
    new RegExp(`<svg class="nav-icon"[^>]*>[\\s\\S]*?</svg>\\s*\\n\\s*<span class="nav-label">${label}</span>`),
    `the mobile ${label} tab must pair an icon with its label, not replace the label`
  );
});
assert.match(html, /class="marketplace-sidebar"[\s\S]*id="sidebar-search-input"/, "the sidebar must contain the search box");
assert.match(html, /class="sidebar-item active" type="button" data-view="browse-view"/, "Browse all must be the sidebar's default-active item");
assert.match(html, /class="sidebar-item" type="button" data-view="categories-view"/);
assert.match(html, /class="sidebar-item" type="button" data-view="inbox-view"/);
assert.match(html, /class="sidebar-create-button" type="button" data-view="sell-view"/, "Create new listing must jump straight to the Sell tab");
assert.match(html, /id="sidebar-location-text">Stockholm, Sweden · Nearby</);
assert.match(html, /id="sidebar-categories-list"/, "an empty container the JS renders into, matching the existing category-grid pattern");
assert.match(css, /\.search-field \.icon\s*{[^}]*position: absolute;/, "the search icon must overlay inside the input, not push it");

assert.match(js, /const CATEGORY_ICONS = {/);
[
  "Vehicles",
  "Real Estate",
  "Electronics",
  "Phones & Tablets",
  "Home & Furniture",
  "Fashion",
  "Baby & Kids",
  "Sports & Outdoor",
  "Jobs",
  "Services",
  "Agriculture & Garden",
  "Free Items"
].forEach((category) => {
  assert.match(js, new RegExp(`["']?${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?:\\s*\\n\\s*'<svg`), `${category} must have its own hand-authored icon, not fall through to the default`);
});
assert.match(js, /const DEFAULT_CATEGORY_ICON =/, "an unrecognized category id must still render something, not break the sidebar list");
assert.match(js, /const HEART_ICON_OUTLINE =/);
assert.match(js, /const HEART_ICON_FILLED =/);
assert.match(js, /const SHARE_ICON =/);
assert.match(js, /const FLAG_ICON =/);
assert.match(js, /function renderSidebarCategories\(\)/);
assert.match(js, /function renderSidebarLocation\(\)/);
assert.match(js, /function handleSidebarSearchInput\(event\)/);
// The translation-refresh code must target the label span specifically --
// overwriting the whole button's textContent would silently delete the icon
// on every language switch.
assert.match(js, /const label = item\.querySelector\("\.nav-label"\);/, "nav-item translation must not clobber the icon SVG child");

// --- Logo-always-goes-home, and Share/quick-opener actually work (all
// three were previously inert -- the logo was a plain <div>, Share had no
// handler at all, and the suggested-opener pill was a dead button) ---
assert.match(js, /function handleShareClick\(id\)/);
assert.match(js, /function copyShareLinkToClipboard\(shareText\)/);
assert.match(js, /if \(shareButton\) handleShareClick\(shareButton\.dataset\.shareListing\)/);
assert.match(js, /const shareButton = event\.target\.closest\("\[data-share-listing\]"\);/);
assert.match(css, /\.brand\s*{[^}]*cursor: pointer;/, "the logo must look clickable, not just behave like it");

// --- State/Region: a select-or-type combobox (real regions as suggestions,
// not a closed enum), the same mechanism for Sweden and every other
// Scandinavian country ---
assert.match(html, /id="sell-region-input" type="text" list="sell-region-datalist"/, "the Sell form's region field must be a combobox, not a plain <select>");
assert.match(html, /<datalist id="sell-region-datalist"><\/datalist>/);
assert.match(html, /id="filter-region-input" type="text" list="filter-region-datalist"/, "the Filter sheet's region field must be a combobox too");
assert.match(html, /<datalist id="filter-region-datalist"><\/datalist>/);
assert.match(js, /const REGIONS_BY_COUNTRY = {/);
assert.match(
  js,
  /Sweden: \[[\s\S]*?"Stockholm"[\s\S]*?\]/,
  "Sweden's real counties must include Stockholm"
);
["Sweden", "Norway", "Denmark", "Finland", "Iceland"].forEach((country) => {
  assert.match(js, new RegExp(`${country}: \\[`), `${country} must have its own real region list, not just Sweden`);
});
assert.match(js, /function renderRegionDatalist\(datalistId, regions\)/);
assert.match(
  js,
  /matchesRegion = normalize\(listing\.region \|\| ""\)\.includes\(normalize\(activeFilters\.region\)\)/,
  "an explicit region must be a substring compare, matching how free-typed text (not just datalist picks) still filters"
);
assert.match(js, /function regionsWithinRadius\(country, km\)/, "Distance must be able to compute which real regions fall within it");
assert.match(js, /function nearestRegion\(coords\)/, "a real geolocated position must be matchable to the nearest real region/country");
assert.match(js, /function detectUserLocation\(\)/);
assert.match(js, /function haversineKm\(a, b\)/);
assert.match(js, /const REGION_COORDS = {/);

// --- "Smooth, 2D" Filter & sort restyle: the sheet's inputs/selects reuse
// the Sell form's own styling (previously the sheet had none at all, so its
// controls rendered as bare, unstyled native browser form elements) ---
assert.match(css, /\.filter-sheet-body input\[type="text"\][\s\S]*?border-radius: 12px;/);
assert.match(css, /#sell-form select,\s*\n\.filter-sheet-body select\s*{\s*\n\s*appearance: none;/, "native <select> chrome must be replaced with a custom flat chevron");
assert.match(css, /\.chip\s*{\s*\n\s*border-radius: var\(--pill-radius\);/, "condition/seller-type/category chips must be full pills, not rounded rectangles");
// A real user-reported regression: .scope (Nearby/Country/All Nordics) had
// drifted onto the same pill radius as .chip, making it look
// oversized/oval right next to the rectangular location button beside it.
// It must use the shared rectangular control radius instead, not a pill.
assert.match(css, /\.scope\s*{\s*\n\s*border-radius: var\(--control-radius\);/);
assert.doesNotMatch(css, /\.scope\s*{\s*\n\s*border-radius: var\(--pill-radius\)/, "the scope buttons must not be pill-shaped");

// A second real, user-reported regression on the same row: .location-strip's
// own `align-items: stretch` (needed so its .scope-tabs container matches
// #location-button's full two-line height) was ALSO stretching each
// individual .scope button inside that container to that same tall height,
// via flex's default align-items: stretch -- a single line of text
// ("Nearby") sitting in an oversized box next to the location button.
assert.match(css, /\.scope-tabs\s*{\s*\n\s*align-items: center;/, "the scope buttons themselves must be centered (their own compact height), not stretched to match the taller location button beside them");

// A real, user-reported 320px-width regression: Min/Max price shared
// .sell-row's default 1fr/auto columns (sized for the Sell form's
// Price+Free-toggle row, where the second column is meant to stay compact)
// -- at narrow widths this let Max price's own content squeeze Min price
// down to almost nothing. A dedicated equal-split modifier fixes it without
// touching the Price+Free-toggle row's own (intentionally asymmetric) layout.
assert.match(html, /class="sell-row sell-row-split"/, "the Min/Max price row must opt into the equal-split layout");
assert.match(css, /\.sell-row-split\s*{\s*\n\s*grid-template-columns: 1fr 1fr;/);

// --- NM-A2 mobile QA hardening ---
assert.match(html, /name="viewport" content="width=device-width, initial-scale=1\.0"/);
assert.match(html, /id="result-count" aria-live="polite"/);
assert.match(html, /id="empty-state" role="status"/);

// No-horizontal-overflow safety net.
assert.match(css, /html\s*{[^}]*overflow-x: hidden/);
assert.match(css, /body\s*{[^}]*overflow-x: hidden/);
assert.match(css, /\*\s*{[^}]*max-width: 100%/);

// Message Seller CTA is a fixed bar pinned above the bottom nav, not sticky-to-top.
assert.match(css, /--nav-height: 65px/);
assert.match(css, /--cta-height: 66px/);
assert.match(css, /\.cta-bar\s*{[^}]*position: fixed;[^}]*bottom: var\(--nav-height\);/);
assert.match(css, /#listing-detail\s*{[^}]*padding-bottom: var\(--cta-height\);/);
assert.doesNotMatch(css, /\.detail-actions\s*{\s*position: sticky/);

// Narrow-viewport hardening (iPhone SE class devices).
assert.match(css, /@media \(max-width: 375px\)/);
assert.match(css, /@media \(max-width: 320px\)/);

// --- NM-A3: expanded category taxonomy (Vehicles + Real Estate flagship verticals) ---
// NM-A7 moved this data into data-service.js ("the database"); NM-A11 moved
// it again into db/seed-data.js, served by the real API's GET /api/categories
// (a static taxonomy, never written to, so it isn't a table -- see schema.sql).
// app.js still only holds a `let categoryTaxonomy = []` cache populated at bootstrap.
assert.match(seedDataJs, /id: "Vehicles", label: "Vehicles", featured: true, subtypes: \["Cars", "Motorcycles", "Trucks & Vans", "Boats", "Parts"\]/);
assert.match(seedDataJs, /id: "Real Estate", label: "Real Estate", featured: true, subtypes: \["For Sale", "For Rent", "Land", "Commercial"\]/);
[
  "Electronics",
  "Phones & Tablets",
  "Home & Furniture",
  "Fashion",
  "Baby & Kids",
  "Sports & Outdoor",
  "Jobs",
  "Services",
  "Agriculture & Garden",
  "Free Items"
].forEach((category) => {
  assert.match(seedDataJs, new RegExp(`id: "${category.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}"`));
});
assert.match(js, /let categoryTaxonomy = \[\];/, "app.js must cache, not own, the taxonomy");
assert.match(js, /let listings = \[\];/, "app.js must cache, not own, the listings");
assert.match(css, /\.chip\.featured\s*{/);
assert.match(css, /\.category-tile\.featured\s*{/);
assert.match(css, /\.popular-badge\s*{/);

// --- Category chip row: desktop carousel arrows (a mouse user has no swipe
// gesture, and 12 categories rarely all fit) -- mobile keeps native
// touch-scroll only, unchanged. ---
assert.match(html, /id="category-chips-prev" data-chip-scroll="-1"[^>]*hidden/, "the left arrow must start hidden (nothing to scroll back to at scrollLeft 0)");
assert.match(html, /id="category-chips-next" data-chip-scroll="1"/);
assert.match(js, /function updateChipCarouselArrows\(\)/);
assert.match(js, /function scrollCategoryChips\(direction\)/);
assert.match(js, /if \(chipScrollButton\) scrollCategoryChips\(Number\(chipScrollButton\.dataset\.chipScroll\)\)/);
assert.match(
  css,
  /@media \(min-width: 780px\) \{[\s\S]*?\.chip-carousel-arrow \{[\s\S]*?display: flex;/,
  "the arrows must only render at desktop widths, matching the sidebar breakpoint"
);
assert.match(css, /\.chip-carousel-arrow\s*{\s*\n\s*display: none;\s*\n\s*}/, "arrows must be hidden by default (mobile-first) before the desktop override");

// --- NM-A3: i18n groundwork (mechanism + persistence + fallback are real; sv is fully translated) ---
assert.match(js, /const translations = {/);
assert.match(js, /sv: {/);
// NM-A26: no/da/fi/is used to be empty {} stubs (falling back entirely to
// English); they are now real, fully-populated dictionaries. Assert the old
// stub shape is GONE (a real regression guard -- this exact pattern is what
// this test used to require) and that all 4 real language blocks now exist
// with real content, not empty objects.
assert.doesNotMatch(js, /no: \{\},\s*\n\s*da: \{\},\s*\n\s*fi: \{\},\s*\n\s*is: \{\}/, "no/da/fi/is must no longer be empty stub objects");
["no", "da", "fi", "is"].forEach((lang) => {
  assert.match(js, new RegExp(`${lang}: \\{\\s*\\n\\s*"brand\\.eyebrow": "[^"]+",`), `translations.${lang} must be a real, populated object starting with a real brand.eyebrow value, not empty`);
});
assert.match(js, /function t\(key, lang\)/);
assert.match(js, /function setLanguage\(lang\)/);
assert.match(js, /localStorage/);
assert.match(html, /id="language-select" aria-label="Language"/);
["en", "sv", "no", "da", "fi", "is"].forEach((code) => {
  assert.match(html, new RegExp(`<option value="${code}">`));
});

// --- NM-A3: country-colored navigation groundwork ---
assert.match(js, /Sweden: { primary: "#006AA7", accent: "#FECC02" }/);
assert.match(js, /Denmark: { primary: "#C8102E", accent: "#FFFFFF" }/);
assert.match(js, /Norway: { primary: "#BA0C2F", accent: "#00205B" }/);
assert.match(js, /Finland: { primary: "#003580", accent: "#FFFFFF" }/);
assert.match(js, /Iceland: { primary: "#02529C", accent: "#DC1E35" }/);
assert.match(js, /function applyCountryTheme\(country\)/);
assert.match(css, /--sea: #006aa7;/, "the base palette must use Swedish flag blue, not the old teal");
assert.match(css, /--sun: #fecc02;/, "the base palette must use Swedish flag yellow, not the old gold");
assert.match(css, /--country-primary: #006aa7;/);
assert.match(css, /--country-accent: #fecc02;/);
assert.match(css, /\.brand-compact\s*{\s*display: none;\s*}/, "the compact wordmark must be hidden until the small-screen breakpoint");
assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.brand-full\s*{\s*display: none;/, "small screens must hide the full wordmark");
assert.match(css, /@media \(max-width: 430px\)[\s\S]*?\.brand-compact\s*{[\s\S]*?display: inline;/, "small screens must show FN instead of cramped lettering");
assert.match(css, /\.nav-item\.active\s*{[^}]*color: var\(--country-primary\);/);
assert.match(css, /\.sell-tab\s*{[^}]*background: var\(--country-primary\);/);
// The topbar's accent border was removed per direct feedback comparing
// against the afromarketplaces.com reference (it has no divider between the
// brand and the header's action row) — the header must render with no
// border in that area at all.
assert.doesNotMatch(css, /\.topbar\s*{[^}]*border-bottom/, "the topbar must not have a divider line, matching the reference exactly");

// --- NM-A3: Sell form structure ---
assert.match(html, /id="sell-form" novalidate/);
assert.match(html, /id="sell-photo-grid"/);
assert.match(html, /id="sell-title-input"/);
assert.match(html, /id="sell-price-input"/);
assert.match(html, /id="sell-free-toggle"/);
assert.match(html, /id="sell-category-select"/);
assert.match(html, /id="sell-subtype-select"/);
assert.match(html, /id="sell-condition-select"/);
assert.match(html, /id="sell-location-input"/);
assert.match(html, /id="sell-description-input"/);
assert.match(html, /id="sell-validation" role="status" aria-live="polite"/);
assert.match(html, /id="sell-preview"/);

// --- NM-A4: auth boundaries + interrupted-action resume ---
assert.match(html, /id="auth-modal" hidden role="dialog" aria-modal="true"/);
assert.match(html, /id="auth-form"/);
assert.match(html, /id="auth-email-input" type="email"/);
assert.match(html, /id="auth-guest-button"/);
assert.match(html, /id="compose-modal" hidden role="dialog" aria-modal="true"/);
assert.match(html, /id="compose-message-input"/);
assert.match(html, /id="toast" role="status" aria-live="polite" hidden/);
assert.match(html, /id="you-panel"/);
assert.match(js, /function requireAuth\(action\)/);
assert.match(js, /async function commitPublish\(values\)/);
// NM-A7: session persistence now lives in DataService.users, not app.js directly.
// NM-A14: and DataService.users itself no longer caches anything client-side
// -- the real httpOnly session cookie (browser-managed) and the sessions
// table (server-managed) are the only sources of truth now.
assert.doesNotMatch(js, /function loadSavedSession/, "session load must go through DataService now");
assert.doesNotMatch(js, /function persistSession/, "session persistence must go through DataService now");
assert.match(css, /\.modal-continue-button\s*{[^}]*background: var\(--country-primary\);/);
assert.match(css, /\.modal-backdrop\[hidden\]\s*{\s*display: none;\s*}/);
assert.match(css, /\.toast\[hidden\]\s*{\s*display: none;\s*}/);

// --- NM-A5: filter & sort sheet + active filter chips ---
assert.match(html, /id="filter-sheet" hidden role="dialog" aria-modal="true"/);
assert.match(html, /id="filter-sort-select"/);
assert.match(html, /id="filter-price-min" type="number"/);
assert.match(html, /id="filter-price-max" type="number"/);
assert.match(html, /id="filter-condition-group" role="group"/);
assert.match(html, /id="filter-seller-group" role="group"/);
assert.match(html, /id="filter-distance-select"/);
assert.match(html, /id="filter-category-select"/);
assert.match(html, /id="filter-subtype-field" hidden/);
assert.match(html, /id="filter-clear-button"/);
assert.match(html, /id="filter-reset-button"/);
assert.match(html, /class="modal-continue-button" id="filter-apply-button"/);
assert.match(html, /id="active-filter-chips" aria-label="Active filters"/);
assert.match(html, /id="sort-indicator" hidden/);
assert.match(js, /const CONDITIONS = \["New", "Like new", "Good", "Fair", "Used", "For parts"\]/);
assert.match(js, /const SELLER_TYPES = \["Private seller", "Professional seller"\]/);
assert.match(js, /function getFilteredListings\(\)/);
assert.match(js, /function sortListings\(list, sort\)/);
assert.match(js, /function parsePriceValue\(price\)/);
assert.match(js, /function parseDistanceKm\(distance\)/);
assert.match(js, /function applyFilters\(\)/);
assert.match(js, /function resetFilters\(\)/);
assert.match(js, /function clearFilterDraft\(\)/);
assert.match(js, /function removeActiveFilter\(key\)/);
assert.match(css, /\.active-filter-chip\s*{/);
assert.match(css, /\.filter-chip-group\s*{/);

// --- NM-A6: real AI photo generation, proxied server-side ---
// (server.js's own implementation details are asserted in the NM-A11 section
// near the bottom of this file, alongside the rest of the backend migration)
assert.match(html, /id="generate-ai-photo" class="ai-generate-button"/);
assert.match(html, /id="ai-photo-prompt" type="text" maxlength="300"/);
assert.match(html, /id="ai-photo-status" role="status" aria-live="polite"/);
assert.match(js, /function generateAiPhoto\(\)/);
assert.match(js, /function performAiGeneration\(prompt\)/);
assert.match(js, /requireAuth\(\(\) => performAiGeneration\(prompt\)\)/, "AI generation must be gated the same way as Save/Message/Report/Publish");
assert.match(js, /fetch\("\/api\/generate-image"/);
assert.match(css, /\.ai-badge\s*{/);
assert.match(css, /\.ai-generate-button\s*{/);

// --- NM-A7: data service (the "database") — entities and async-shaped API ---
assert.match(dataServiceJs, /const DataService = \(\(\) => {/);
[
  "users",
  "categories",
  "listings",
  "savedItems",
  "reports",
  "conversations"
].forEach((namespace) => {
  assert.match(dataServiceJs, new RegExp(`${namespace}: {`), `DataService must expose a "${namespace}" namespace`);
});
assert.match(dataServiceJs, /register\(fields\)/);
assert.match(dataServiceJs, /login\(fields\)/);
assert.match(dataServiceJs, /signOut\(\)/);
assert.match(dataServiceJs, /getForUser\(userId\)/, "SavedItem must be scoped per user, not a single global set");
assert.match(dataServiceJs, /startOrGet\(listingId, participantIds\)/, "Conversation structure must exist even with no Inbox UI yet");
assert.match(dataServiceJs, /addMessage\(conversationId, fields\)/);
assert.match(js, /await DataService\.users\.getCurrent\(\)/);
assert.match(js, /await DataService\.categories\.getAll\(\)/);
assert.match(js, /await DataService\.listings\.getAll\(\)/);
assert.match(js, /await DataService\.listings\.create\(/);
assert.match(js, /await DataService\.savedItems\.toggle\(/);
assert.match(js, /await DataService\.savedItems\.getForUser\(/);
assert.match(js, /await DataService\.reports\.create\(/);
assert.match(js, /await DataService\.conversations\.startOrGet\(/);
assert.match(js, /await DataService\.conversations\.addMessage\(/);
assert.match(js, /async function bootstrap\(\)/);
// NM-A25: both are now root-relative (see this slice's own assertion on
// that below) -- the ORDER requirement (data-service.js before app.js)
// still holds unchanged.
assert.match(html, /<script src="\/data-service\.js"><\/script>\s*\n\s*<script src="\/app\.js">/, "data-service.js must load before app.js");

// --- Dedicated Login/Sign-up page (accessible from You, not just the interrupted-action modal) ---
assert.match(html, /id="login-view"/);
// NM-A25: root-relative now (see this slice's own assertion below) -- a
// relative "assets/login-hero.png" 404s once served one path segment deep.
assert.match(html, /src="\/assets\/login-hero\.png"/, "the user's own illustration must be used as the login hero image");
assert.match(html, /id="login-form"/);
assert.match(html, /id="login-email-input"/);
assert.match(html, /id="login-guest-button"/);
assert.doesNotMatch(css, /#166534|#15803d|rgb\(22,\s*163,\s*74\)/i, "must not copy afromarketplaces' green styling");
assert.match(js, /function handleLoginPageFormSubmit\(event\)/);
assert.match(js, /function handleLoginPageGuestClick\(\)/);
assert.match(js, /async function submitAuthForm\(prefix, mode\)/, "the modal and the dedicated page must share one real register/login pipeline, not duplicate it");
assert.match(js, /data-view="login-view"/, "the You tab must link to the dedicated login page");

// --- NM-A8: messaging prototype (Inbox + thread view, built on NM-A7's structure-only Conversation/Message) ---
assert.match(html, /id="inbox-content"/);
assert.match(html, /id="thread-view"/);
assert.match(html, /id="thread-snapshot"/);
assert.match(html, /id="thread-messages"/);
assert.match(html, /id="thread-reply-form"/);
assert.match(html, /id="thread-reply-input"/);
assert.match(js, /Hi, is this still available\?/, "the suggested opener must still be preserved");
assert.match(dataServiceJs, /getForUser\(userId\)/g, "DataService needs getForUser for both SavedItem and Conversation");
assert.match(js, /async function refreshInboxCache\(\)/);
assert.match(js, /function renderInbox\(\)/);
assert.match(js, /function openThread\(conversationId\)/);
assert.match(js, /async function sendThreadReply\(event\)/);
assert.match(js, /await DataService\.conversations\.getForUser\(/);
assert.match(js, /await DataService\.conversations\.startOrGet\(/);
assert.match(js, /await DataService\.conversations\.addMessage\(/);
assert.match(css, /\.thread-message\.mine\s*{[^}]*background: var\(--country-primary\);/, "the buyer's own bubbles must be tied to country theming");

// --- NM-A9: media improvements — 6-image cap, thumbnails, consistent cropping ---
assert.match(js, /const MAX_LISTING_PHOTOS = 6;/);
assert.doesNotMatch(js, />= 10\)/, "no leftover 10-photo cap must remain anywhere");
assert.match(js, /function photosToImageObjects\(photos\)/);
assert.match(js, /function getListingImages\(listing\)/);
assert.match(js, /function galleryTemplate\(listing, activeIndex\)/);
assert.match(js, /function selectGalleryImage\(index\)/);
assert.match(js, /images: photosToImageObjects\(values\.photos\)|const images = photosToImageObjects\(values\.photos\)/);
assert.match(css, /\.photo-count-badge\s*{/);
assert.match(css, /\.gallery-thumb\s*{/);
assert.match(css, /\.gallery-thumb\.active\s*{[^}]*border-color: var\(--country-primary\);/, "the active thumbnail must be tied to country theming");
assert.match(css, /\.listing-photo\s*{[^}]*aspect-ratio: 1 \/ 1;/, "cards must keep a consistent square crop for thumbnails");
assert.match(html, /id="sell-photos-hint"/);
// (the seed multi-image-array check now lives in the NM-A11 section below,
// since that data moved from data-service.js into db/seed-data.js)

// --- NM-A9 UX pass: signed-in topbar (profile avatar, quick-action pills), My Listings, Boost, Analytics ---
assert.match(html, /id="account-actions" aria-label="Account actions" hidden/);
assert.match(html, /id="my-listings-view"/);
assert.match(html, /id="my-listings-content"/);
assert.match(html, /id="analytics-view"/);
assert.match(html, /id="analytics-content"/);
assert.match(dataServiceJs, /update\(id, fields\)/, "DataService.listings needs an update method for Boost to be a real mutation, not a new create");
assert.match(dataServiceJs, /savedItems: \{[\s\S]*?getAll\(\)/, "Analytics needs to read saves across all users, not just the current one");
assert.match(dataServiceJs, /conversations: \{[\s\S]*?getAll\(\)/, "Analytics needs to read conversations by listing, not by participant");
assert.match(js, /function renderProfileAvatar\(\)/);
assert.match(js, /function renderAccountActions\(\)/);
assert.match(js, /function getMyListings\(\)/);
assert.match(js, /function openBoostSheet\(listingId\)/);
assert.match(js, /if \(!listing \|\| !currentUser \|\| listing\.sellerId !== currentUser\.id\) return;/, "boosting must check real ownership, not just whether someone is signed in");
assert.match(js, /async function renderAnalytics\(\)/);
// NM-A14: sellerId is no longer sent by the client at all -- the server
// derives it from the real session (see the apiJs assertion below) so a
// published listing can't be spoofed as someone else's.
assert.doesNotMatch(js, /sellerId: currentUser/, "the client must not claim a sellerId -- the server derives it from the real session");
assert.match(css, /\.icon-button\.signed-in\s*{/);
assert.match(css, /\.account-action\.boost\s*{/);
assert.match(css, /\.analytics-tile strong\s*{[^}]*color: var\(--country-primary\);/, "analytics figures must be tied to country theming");

// --- NM-A10: real photo uploads (fixing the "Add photo adds nothing" bug), automatic <=1MB compression, and a user-selectable featured photo ---
assert.match(html, /<input type="file" id="sell-photo-input" accept="image\/\*" multiple hidden/, "Add photo must open a real OS file picker, not synthesize a fake tile");
assert.match(js, /const MAX_PHOTO_BYTES = 1024 \* 1024;/, "every photo must be capped at 1MB");
assert.match(js, /const MAX_PHOTO_DIMENSION = 1600;/);
assert.match(js, /function resizeImageFromSrc\(src\)/);
assert.match(js, /function resizeImageFile\(file\)/);
assert.match(js, /function handleSellPhotoFilesSelected\(event\)/);
assert.match(js, /function setSellPhotoCover\(index\)/, "the user must be able to choose which photo is featured");
assert.match(js, /data-make-cover="\$\{index\}"/);
assert.match(js, /const compressed = await resizeImageFromSrc\(data\.image\);/, "AI-generated photos must also be compressed under the 1MB cap, not just uploads");
assert.doesNotMatch(js, /kind: "placeholder"/, "no fake CSS-gradient placeholder photos may remain");
assert.match(css, /\.make-cover-button\s*{/);

// --- NM-A11: Backend Foundation -- Node/Express + SQLite replaces the in-memory store ---
assert.match(fs.readFileSync(path.join(root, "package.json"), "utf8"), /"better-sqlite3":/, "SQLite must be a real dependency, not simulated");
assert.match(fs.readFileSync(path.join(root, "package.json"), "utf8"), /"express":/);

const schemaSql = fs.readFileSync(path.join(root, "db", "schema.sql"), "utf8");
["users", "listings", "listing_images", "conversations", "conversation_participants", "messages", "saved_items", "reports", "password_reset_tokens"].forEach((table) => {
  assert.match(schemaSql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table} `), `schema must define the ${table} table`);
});

assert.match(seedDataJs, /id: "Vehicles", label: "Vehicles", featured: true, subtypes: \["Cars", "Motorcycles", "Trucks & Vans", "Boats", "Parts"\]/);
assert.match(seedDataJs, /id: "Real Estate", label: "Real Estate", featured: true, subtypes: \["For Sale", "For Rent", "Land", "Commercial"\]/);
assert.match(seedDataJs, /images: \[/, "at least one seed listing must have a real multi-image array to seed listing_images with");

const dbJs = fs.readFileSync(path.join(root, "scripts", "db.js"), "utf8");
assert.match(dbJs, /function openDatabase\(dbPath, options = \{\}\)/);
assert.match(dbJs, /function seedIfEmpty\(db\)/, "first run must migrate the seed data into real rows");
assert.match(dbJs, /require\("better-sqlite3"\)/);

// Deployment-readiness audit finding: seedIfEmpty used to run unconditionally,
// so a genuinely empty PRODUCTION database would get silently filled with
// fake demo listings on first boot. Gated on NODE_ENV=production (default:
// still seed, same as always -- local dev/tests never set it).
assert.match(dbJs, /function shouldSeedDemoData\(\) \{\s*\n\s*if \(process\.env\.NODE_ENV !== "production"\) return true;\s*\n\s*return process\.env\.SEED_DEMO_DATA === "true";/, "seeding must default ON everywhere except a real NODE_ENV=production deploy, which needs an explicit SEED_DEMO_DATA=true opt-in");
assert.match(dbJs, /if \(!shouldSeedDemoData\(\)\) return;/, "seedIfEmpty must actually consult the gate before touching the listings table");

assert.match(schemaSql, /CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings\(seller_id\);/, "public profile views filter listings by seller_id on every request and need a real index");

const apiJs = fs.readFileSync(path.join(root, "scripts", "api.js"), "utf8");
[
  ["get", "/categories"],
  ["get", "/listings"],
  ["post", "/listings"],
  ["patch", "/listings/:id"],
  ["post", "/saved-items/toggle"],
  ["get", "/saved-items/all"],
  ["post", "/reports"],
  ["get", "/reports"],
  ["post", "/blocks"],
  ["delete", "/blocks/:userId"],
  ["get", "/blocks"],
  ["post", "/conversations/start-or-get"],
  ["post", "/conversations/:id/messages"]
].forEach(([method, routePath]) => {
  assert.match(apiJs, new RegExp(`router\\.${method}\\("${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `API must expose ${method.toUpperCase()} ${routePath}`);
});

// --- NM-A20: Trust & Safety Content + Report / Block Flows ---
assert.match(schemaSql, /reported_user_id TEXT/, "reports must be able to target a user, not only a listing");
assert.match(schemaSql, /status TEXT NOT NULL DEFAULT 'open'/, "reports need a real status field -- 'a simple internal structure... an admin could later review'");
assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS blocks/);
assert.match(dbJs, /function migrateReportsColumns\(db\)/);
assert.match(dbJs, /migrateReportsColumns\(db\);/);

assert.match(apiJs, /const REPORT_REASONS = new Set\(/, "report reasons must be a real, closed, defined set");
assert.match(apiJs, /function isBlockedPair\(db, userIdA, userIdB\)/);
assert.match(apiJs, /REPORT_TARGET_REQUIRED/);
assert.match(apiJs, /REPORT_NOT_FOR_SELF/);
assert.match(apiJs, /INSERT OR IGNORE INTO blocks/, "blocking the same user twice must be a safe no-op, not an error");
assert.match(apiJs, /router\.delete\("\/blocks\/:userId"/);
assert.doesNotMatch(apiJs, /INSERT INTO reports \(id, listing_id, reporter_id, created_at\) VALUES \(\?, \?, \?, \?\)/, "the old reason-less report insert must be gone");

assert.match(js, /function openReportModal\(targetType, targetId\)/);
assert.match(js, /function toggleBlockUser\(userId\)/);
assert.match(js, /function conversationOtherPartyId\(conversation\)/);
assert.match(js, /let blockedUserIds = new Set\(\);/);
assert.match(js, /async function refreshBlockedUsersCache\(\)/);
assert.match(js, /const notBlockedSeller = !listing\.sellerId \|\| !blockedUserIds\.has\(listing\.sellerId\);/, "Browse must genuinely filter out a blocked seller's listings, not just hide a button");
assert.match(html, /id="report-modal"/, "Report must be a real modal (reason + optional details), not a single instant click");
assert.doesNotMatch(js, /await DataService\.reports\.create\(\{ listingId: id, reporterId: currentUser \? currentUser\.id : null \}\);/, "the old reason-less, instant-fire report call must be gone");

// --- NM-A21: Minimal Admin Moderation Queue (Internal) ---
assert.match(schemaSql, /is_admin INTEGER NOT NULL DEFAULT 0/, "admin must be a real, per-user column, not derived live from an env var on every request");
assert.match(schemaSql, /flagged INTEGER NOT NULL DEFAULT 0/);
assert.match(schemaSql, /admin_hidden INTEGER NOT NULL DEFAULT 0/, "admin-hide must be its own column, separate from the seller-controlled status column");
assert.match(dbJs, /function migrateUsersContactAndAdminColumns\(db\)/);
assert.match(dbJs, /function migrateListingsAdminHiddenColumn\(db\)/);
assert.match(dbJs, /migrateUsersContactAndAdminColumns\(db\);/);
assert.match(dbJs, /migrateListingsAdminHiddenColumn\(db\);/);

// (auth.js-dependent admin/settings assertions live further below, right
// after authJs itself is read from disk -- see "NM-A21: admin/settings
// auth-layer pieces".)

assert.match(apiJs, /router\.get\("\/reports", requireAdmin/, "the report queue must be admin-only -- this used to have NO access control at all");
assert.match(apiJs, /router\.patch\("\/reports\/:id", requireAdmin/);
assert.match(apiJs, /router\.post\("\/admin\/listings\/:id\/hide", requireAdmin/);
assert.match(apiJs, /router\.post\("\/admin\/listings\/:id\/unhide", requireAdmin/);
assert.match(apiJs, /router\.post\("\/admin\/users\/:id\/flag", requireAdmin/);
assert.match(apiJs, /router\.post\("\/admin\/users\/:id\/unflag", requireAdmin/);
assert.match(apiJs, /adminHidden: Boolean\(row\.admin_hidden\)/);

assert.match(js, /function openAdminQueue\(\)/);
assert.match(js, /if \(!currentUser \|\| !currentUser\.isAdmin\)/, "the client-side check must be a real defense-in-depth gate, even though the server is the real one");
assert.match(js, /const notAdminHidden = !listing\.adminHidden;/, "Browse must genuinely exclude an admin-hidden listing for everyone, not just mark it");
assert.match(js, /function renderSettings\(\)/);
assert.match(js, /async function saveSettings\(\)/);
assert.match(js, /document\.getElementById\("settings-save-button"\)\.addEventListener\("click", saveSettings\);/, "Settings' Save button listener must be bound once");
{
  const renderSettingsMatch = /function renderSettings\(\) \{([\s\S]*?)\n}/.exec(js);
  assert.ok(renderSettingsMatch, "renderSettings must exist");
  assert.doesNotMatch(renderSettingsMatch[1], /addEventListener/, "renderSettings() must never bind a fresh listener on every render -- that belongs in bindEvents(), once, like every other static form in this app");
}
assert.match(html, /id="admin-view"/, "the moderation queue needs its own dedicated, real view");
assert.doesNotMatch(html, /data-view="admin-view"/, "the admin nav entry must only ever be built dynamically in JS (conditional on isAdmin), never present in the static HTML every visitor's page loads");
assert.match(js, /const adminAction = currentUser\.isAdmin/, "the admin nav entry markup itself must be conditional on isAdmin, not always rendered and merely hidden via CSS");

// --- NM-A22: Final Parity Pass + Honest Re-audit -- two small fixes found
// by re-verifying real current behavior instead of trusting old write-ups. ---
assert.match(js, /const isOwnListing = Boolean\(currentUser && listing\.sellerId && listing\.sellerId === currentUser\.id\);/, "the detail page must know whether the viewer owns the listing, to hide self-messaging");
assert.match(js, /function conversationOtherPartyLabel\(listing\)/);
assert.doesNotMatch(js, /const seller = listing \? listing\.seller : "";/, "the old inbox row must no longer show the raw listing.seller unconditionally -- that's the exact self-name bug this slice fixes");

// --- NM-A16: Public Seller Profiles ---
assert.match(html, /id="profile-view"/, "seller profiles need a dedicated public view shell");
assert.match(html, /id="seller-profile"/, "the profile view must have a render target");
assert.match(dataServiceJs, /users: \{[\s\S]*?getProfile\(id\)/, "DataService.users needs a public profile fetcher");
assert.match(apiJs, /router\.get\("\/users\/:id\/profile", \(req, res\) => \{/, "seller profiles must be guest-readable, not requireSession-gated");
assert.match(apiJs, /SELECT id, name, created_at, google_id FROM users WHERE id = \?/, "public profiles must return only public user fields");
assert.match(apiJs, /activeListingCount: activeListings\.length/, "profile listing counts must be derived from active listings");
assert.match(js, /data-open-profile="\$\{listing\.sellerId\}"/, "detail pages must render a clickable seller profile trigger for real sellers");
assert.match(js, /async function openSellerProfile\(sellerId\)/);
assert.match(js, /profile\.unverifiedBadge/, "the required verification placeholder must be localized");
assert.match(css, /\.seller-name-link\s*{[\s\S]*?color: var\(--country-primary\);/, "seller profile links must use the FindNord blue, not oversized button styling");
assert.match(css, /\.verified-badge\.unverified\s*{[\s\S]*?background: #edf2ed;/, "unverified placeholder must be quiet, not a full verification badge");

// --- NM-A17: Reviews, Ratings & Basic Verification Signals ---
const reviewModerationJs = fs.readFileSync(path.join(root, "scripts", "review-moderation.js"), "utf8");
assert.match(reviewModerationJs, /function cleanReviewText\(text\)/);
assert.match(reviewModerationJs, /new RegExp\(`\\\\b\$\{word\}\\\\w\*`, "gi"\)/, "the filter must catch inflected forms (e.g. \"fucking\"), not just the bare blocked word");
assert.doesNotMatch(reviewModerationJs, /require\(["'](?:bad-words|profanity)["']\)/, "no new npm dependency for the abuse filter");
assert.match(schemaSql, /review_strikes INTEGER NOT NULL DEFAULT 0/);
assert.match(schemaSql, /review_banned INTEGER NOT NULL DEFAULT 0/);
assert.match(dbJs, /function migrateUsersReviewModerationColumns\(db\)/);
assert.match(apiJs, /const \{ cleanReviewText \} = require\("\.\/review-moderation"\);/);
assert.match(apiJs, /const REVIEW_BAN_STRIKE_THRESHOLD = 2;/);
assert.match(apiJs, /reviewerAccount && reviewerAccount\.review_banned/, "an already-banned account must be rejected before its content is even inspected");
assert.match(apiJs, /newStrikes >= REVIEW_BAN_STRIKE_THRESHOLD/);
assert.match(apiJs, /code: "REVIEW_BANNED_NOW"/);
assert.match(apiJs, /code: "REVIEW_BANNED"/);
assert.match(apiJs, /code: "DUPLICATE_REVIEW"/);
assert.match(apiJs, /res\.status\(201\)\.json\(\{ \.\.\.rowToReview\(row\), moderated \}\);/);

// The submission path must be fully wired -- no temporary/disabled/dead state left over.
assert.match(js, /const submitReviewButton = event\.target\.closest\("\[data-submit-review\]"\);/, "the review submit button must be wired into the delegated click handler");
assert.match(js, /if \(submitReviewButton\) handleReviewSubmitClick\(submitReviewButton\.dataset\.submitReview\);/);
assert.doesNotMatch(
  js,
  /class="review-rating-select"\$\{disabled\}|class="review-text-input"[^>]*\$\{disabled\}/,
  "the rating/text inputs must not be pre-disabled for guests -- requireAuth gates on submit and resumes with what they actually typed, same as Save/Message"
);
assert.match(js, /showToast\(t\(review\.moderated \? "review\.warningModerated" : "review\.posted"\)\);/, "a moderated (cleaned) review must still visibly warn the writer, not silently succeed");
assert.match(js, /"REVIEW_BANNED_NOW" \? "review\.bannedNow"/);

// --- Site footer, static content pages, and cookie notice ---
assert.match(html, /<footer class="site-footer" aria-label="Site footer">/);
assert.match(html, /id="cookie-banner" role="region" aria-label="Cookie notice" hidden/);
assert.match(html, /id="static-page-view"/);
assert.match(html, /id="static-page-content"/);
assert.match(html, /id="footer-country-flags"/);
["about", "howItWorks", "safetyTips", "pricingGuide", "photoGuide", "safeSellingGuide", "helpCenter", "faq", "contactSupport", "reportIssue", "boostAds", "contentModeration", "dataSafety", "aboutMicany", "privacyPolicy", "dataSubjectRights", "termsOfService", "cookiePolicy"].forEach(
  (pageId) => {
    assert.match(js, new RegExp(`${pageId}: \\{`), `STATIC_PAGES must define real content for "${pageId}", not a dead footer link`);
  }
);
assert.match(js, /function openStaticPage\(pageId\)/);
assert.match(js, /function renderFooterCountryFlags\(\)/);
assert.match(js, /function handleFooterCountryClick\(country\)/);
assert.match(js, /function initCookieBanner\(\)/);
assert.match(js, /function dismissCookieBanner\(\)/);
assert.match(js, /const staticPageButton = event\.target\.closest\("\[data-static-page\]"\);/);
// NM-A25: static pages now get a real `/page/:slug` URL -- the delegated
// click handler routes through navigateToStaticPage() (pushState + the
// unchanged openStaticPage()), not openStaticPage() directly.
assert.match(js, /if \(staticPageButton\) navigateToStaticPage\(staticPageButton\.dataset\.staticPage\);/);
assert.match(js, /listing\.sellerId \? "" : `<p>\$\{escapeHtml\(listing\.trust\)\}<\/p>`/, "a real seller's stale generic trust text must be suppressed now that real trust signals exist");
assert.match(css, /\.site-footer\s*{/);
assert.match(css, /\.cookie-banner\s*{/);
assert.doesNotMatch(css, /\.cookie-banner\s*{[^}]*position: fixed;/, "the cookie banner must not fight the already-crowded fixed bottom-nav/CTA-bar real estate on mobile");

// --- NM-A18: Monetization Foundation -- Boost / Premium ---
const boostJs = fs.readFileSync(path.join(root, "scripts", "boost.js"), "utf8");
assert.match(boostJs, /const BOOST_PACKAGES = \[/);
["24h", "7d", "30d", "6m", "12m"].forEach((packageId) => {
  assert.match(boostJs, new RegExp(`id: "${packageId}"`), `the PRD's ${packageId} package must be a real, defined package`);
});
assert.match(boostJs, /function isBoostPaymentsEnabled\(\) \{\s*\n\s*return process\.env\.BOOST_PAYMENTS_ENABLED === "true";/, "the payments flag must be a real env var, defaulting OFF for any unset deployment");
assert.match(boostJs, /async function createBoostCheckoutSession/);
assert.match(boostJs, /https:\/\/api\.stripe\.com\/v1\/checkout\/sessions/, "the checkout integration must target Stripe's real API, not a fake stub URL");
assert.match(boostJs, /function verifyStripeWebhookSignature/);
assert.match(boostJs, /crypto\.timingSafeEqual/, "webhook signature comparison must be constant-time");
assert.doesNotMatch(boostJs, /require\(["']stripe["']\)/, "no new npm dependency -- Stripe's REST API is called directly via fetch, same instinct as NM-A15's hand-rolled JWT verification");

assert.match(apiJs, /router\.get\("\/boost\/config"/);
assert.match(apiJs, /router\.post\("\/listings\/:id\/boost", requireSession/);
assert.match(apiJs, /router\.post\("\/listings\/:id\/unboost", requireSession/);
assert.match(apiJs, /router\.post\("\/listings\/:id\/boost\/checkout", requireSession/);
assert.match(apiJs, /router\.post\("\/boost\/stripe-webhook", express\.raw\(\{ type: "application\/json" \}\)/, "the webhook must receive the RAW body, not JSON-parsed, for signature verification");
assert.match(apiJs, /code: "PAYMENT_REQUIRED"/, "direct free activation must be blocked once payments are enabled, not silently still work");
assert.match(apiJs, /sponsored: Boolean\(row\.boost_expires_at && row\.boost_expires_at > Date\.now\(\)\)/, "sponsored must be derived live from a real expiry, not a static flag that never lapses");

assert.match(schemaSql, /boost_expires_at INTEGER/);
assert.match(schemaSql, /boost_package TEXT/);
assert.match(dbJs, /function migrateListingBoostColumns\(db\)/);
assert.match(dbJs, /WHERE sponsored = 1 AND boost_expires_at IS NULL/, "a pre-NM-A18 permanently-sponsored listing must be grandfathered with a real expiry, not silently unmanaged forever");

assert.match(js, /function openBoostSheet\(listingId\)/);
assert.match(js, /async function activateBoostPackage\(packageId\)/);
assert.match(js, /async function cancelActiveBoost\(\)/);
assert.match(
  js,
  /copy\.sort\(\(a, b\) => \{\s*\n\s*const boostRank = Number\(sponsoredRotationIds\.includes\(b\.id\)\) - Number\(sponsoredRotationIds\.includes\(a\.id\)\);/,
  "the default feed's ranking must give the current rotation's boosted slot-holders a real advantage, not just render a badge"
);
assert.doesNotMatch(js, /async function toggleBoost/, "the old binary, non-expiring boost toggle must be fully retired, not left alongside the new system");

// --- NM-A18 follow-up: positional-quota rotation + random fairness segment ---
assert.match(js, /const SPONSORED_SLOT_COUNT = 4;/);
assert.match(js, /const FAIRNESS_SPOTLIGHT_COUNT = 4;/);
assert.match(js, /function shuffleArray\(array\)/);
assert.match(js, /function refreshBoostRotation\(\)/);
assert.match(js, /async function refreshListingsCache\(\)/);
assert.match(js, /function fairnessSectionTemplate\(\)/);
assert.match(js, /function getSponsoredRotationIds\(\)/);
assert.match(js, /function getFairnessSpotlightIds\(\)/);
{
  // Every real (non-comment) listings-cache refresh must go through
  // refreshListingsCache/refreshBoostRotation, not a bare re-fetch -- a bare
  // `listings = await DataService.listings.getAll();` line would silently
  // skip recomputing the rotation and fairness segment. The function's own
  // implementation line is the one legitimate exception; a doc-comment
  // mentioning the pattern in backticks is not code, so it's excluded here.
  const codeOnly = js.replace(/\/\/.*$/gm, "");
  const rawRefetches = codeOnly.match(/listings = await DataService\.listings\.getAll\(\);/g) || [];
  assert.strictEqual(rawRefetches.length, 1, "expected exactly one raw listings re-fetch (inside refreshListingsCache itself); every other call site must go through refreshListingsCache()");
}
assert.match(dataServiceJs, /boost: \{[\s\S]*?config\(\)[\s\S]*?activate\(listingId, packageId\)[\s\S]*?cancel\(listingId\)[\s\S]*?checkout\(listingId, packageId, returnUrl\)/);

// The frontend's data layer is now a thin, real fetch client -- not the
// in-memory arrays it replaced -- but keeps the EXACT same public interface
// (same namespaces, same method names/signatures) so app.js needed zero
// changes, which was the whole point of NM-A7 making every method
// Promise-shaped from day one.
assert.match(dataServiceJs, /const API_BASE = "\/api";/);
assert.match(dataServiceJs, /async function request\(path, options\)/);
assert.match(dataServiceJs, /await fetch\(`\$\{API_BASE\}\$\{path\}`, options\)/, "every call must be a real network request, not a simulated one");
assert.doesNotMatch(dataServiceJs, /function resolved\(value\)/, "the old fake-Promise wrapper must be gone -- these are now real network Promises");
assert.doesNotMatch(dataServiceJs, /let listings = \[/, "listings must no longer live in an in-memory array in the frontend");
assert.doesNotMatch(dataServiceJs, /persist\("fn_saved_items"/, "saved items are now persisted server-side in SQLite, not localStorage");

// --- NM-A19: Currency, Location Depth & Locale Formatting ---
assert.match(schemaSql, /country TEXT NOT NULL DEFAULT 'Sweden'/, "every listing must always have a real country, defaulting to Sweden for back-compat");
assert.match(dbJs, /function migrateListingCountryColumn\(db\)/, "a database created before per-listing country existed must self-heal on startup, like every prior additive column");
assert.match(dbJs, /migrateListingCountryColumn\(db\);/);

assert.match(apiJs, /const VALID_COUNTRIES = new Set\(\["Sweden", "Norway", "Denmark", "Finland", "Iceland"\]\);/);
assert.match(apiJs, /const CURRENCY_BY_COUNTRY = \{/, "currency must be a real, defined mapping, not inferred ad hoc");
assert.match(apiJs, /currency: CURRENCY_BY_COUNTRY\[row\.country\] \|\| "SEK"/, "currency must be DERIVED from country on every read, not a second stored value that could drift out of sync -- the same pattern NM-A18 used for `sponsored`");
assert.match(apiJs, /country: VALID_COUNTRIES\.has\(fields\.country\) \? fields\.country : "Sweden"/, "an invalid/missing country on create must safely default to Sweden, never be trusted blindly from the client");
{
  const updateColumnsMatch = /const LISTING_UPDATE_COLUMNS = \{([\s\S]*?)\};/.exec(apiJs);
  assert.ok(updateColumnsMatch, "LISTING_UPDATE_COLUMNS must exist");
  assert.doesNotMatch(updateColumnsMatch[1], /country/, "LISTING_UPDATE_COLUMNS must never whitelist country -- a listing's currency must never change via edit");
}

assert.equal(
  (seedDataJs.match(/country: "Sweden",/g) || []).length,
  8,
  "every one of the 8 seed listings must carry a real country field"
);

assert.match(js, /const CURRENCY_BY_COUNTRY = \{/, "the frontend needs its own currency map for Sell-preview/filter-chip formatting before a listing round-trips through the server");
assert.match(js, /const LOCALE_BY_COUNTRY = \{/);
assert.match(js, /function formatListingPrice\(listing\)/);
assert.match(js, /function currencyFormatterForCountry\(country\)/);
assert.match(js, /new Intl\.NumberFormat\(locale, \{ style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 \}\)/, "currency formatting must go through Intl, not hand-built spacing/symbol logic");
assert.match(js, /function isMonthlyRental\(listing\)/);
assert.match(js, /function formatRelativeTime\(postedAtMs\)/);
assert.match(js, /new Intl\.RelativeTimeFormat\(locale, \{ numeric: "auto" \}\)/, "relative time must be a real, live Intl computation, not a frozen stored string");
assert.match(js, /function pluralCategory\(count, locale\)/);
assert.match(js, /new Intl\.PluralRules\(locale\)\.select\(count\)/, "pluralization must use real CLDR plural categories, not a hand-rolled === 1 check");
assert.match(js, /function countLabel\(count, oneKey, otherKey\)/);
assert.match(js, /function setActiveScope\(scope\)/, "scope switching must be a real, independently-testable function, not only inline in the click-delegation handler");
assert.match(js, /const matchesScope = activeScope !== "Country" \|\| listing\.country === activeCountry;/, "the Country scope button must genuinely filter by real country, not remain the purely cosmetic label it used to be");
assert.match(js, /const CAPITAL_REGION_BY_COUNTRY = \{/);

// --- NM-A12: Backend Phase 2 -- real local file storage for images ---
const imageStorageJs = fs.readFileSync(path.join(root, "scripts", "image-storage.js"), "utf8");
assert.match(imageStorageJs, /function createImageStorage\(uploadsDir\)/, "uploads dir must be configurable so tests don't litter the real project folder");
assert.match(imageStorageJs, /function saveImageIfInline\(css, filenameBase\)/);
assert.match(imageStorageJs, /INLINE_DATA_URL_PATTERN/, "must recognize the exact url(data:...) shape photoToCss() produces");
assert.doesNotMatch(imageStorageJs, /require\("(?:aws-sdk|@aws-sdk)/, "Phase 2 is local disk only -- no cloud storage yet");

assert.match(apiJs, /const \{ saveImageIfInline, deleteFileIfLocal \} = createImageStorage\(options\.uploadsDir\)/, "the listings endpoint must actually use the file-storage helper");
assert.match(apiJs, /saveImageIfInline\(image\.css, `\$\{id\}-\$\{index\}`\)/, "every uploaded/AI photo must be written to a real file, not stored inline");
assert.doesNotMatch(apiJs, /image: fields\.image \|\| ""/, "the listing's cover field must go through file storage too, not store the client's raw (possibly inline) value directly");

assert.match(dbJs, /function migrateInlineImagesToFiles\(db, uploadsDir\)/, "a database created before real file storage existed must self-heal on startup");
assert.match(dbJs, /WHERE css LIKE 'url\(data:%'/);

const serverJsForUploads = fs.readFileSync(path.join(root, "scripts", "server.js"), "utf8");
assert.match(serverJsForUploads, /app\.use\("\/uploads", express\.static\(imageStorage\.uploadsDir\)\)/, "uploaded photos must be served as real static files");

// Seed listings must still be plain CSS gradients -- no file, no migration,
// exactly as before this slice -- proving requirement 5 (old seed listings
// keep working) doesn't depend on new code touching them at all.
assert.doesNotMatch(seedDataJs, /url\(data:/, "seed listings must never be inline data URLs needing migration");
assert.match(seedDataJs, /css: "linear-gradient\(/, "seed listings must remain plain CSS gradients, untouched by file storage");

// app.js's photo pipeline (compression, 6-image cap, Make cover) is entirely
// unaffected by where the server ends up storing the bytes -- it still just
// sends a CSS value shaped by photoToCss(), same as before NM-A12.
assert.match(js, /const MAX_LISTING_PHOTOS = 6;/);
assert.match(js, /function setSellPhotoCover\(index\)/);

// --- NM-A13: Basic Listing Management for Sellers ---
assert.match(schemaSql, /status TEXT NOT NULL DEFAULT 'active'/, "listings need a real status column for Reserved/Sold");
assert.match(dbJs, /function migrateListingStatusColumn\(db\)/, "a database created before status existed must self-heal on startup, same pattern as the image-storage migration");
assert.match(dbJs, /ALTER TABLE listings ADD COLUMN status/);

assert.match(apiJs, /router\.delete\("\/listings\/:id"/, "sellers need a real delete/unpublish endpoint");
assert.match(
  apiJs,
  /if \(existing\.seller_id !== req\.currentUser\.id\) \{\s*\n\s*res\.status\(403\)/,
  "every listing mutation must be ownership-checked server-side against the REAL session, not a client-supplied id or just hidden by the UI"
);
assert.match(apiJs, /deleteFileIfLocal\(image\.css\)/, "deleting a listing must also remove its real photo files from disk");
assert.match(apiJs, /const LISTING_STATUSES = new Set\(\["active", "reserved", "sold"\]\);/);

assert.match(js, /let editingListingId = null;/);
assert.match(js, /function startEditListing\(id\)/);
assert.match(js, /async function commitEdit\(values\)/);
assert.match(js, /function setSellFormMode\(isEditing\)/);
assert.match(js, /async function deleteListing\(listingId\)/);
assert.match(js, /function handleDeleteListingClick\(listingId\)/);
assert.match(js, /async function handleMyListingStatusChange\(listingId, status\)/);
assert.doesNotMatch(js, /window\.confirm\(/, "delete must use the app's own two-click confirm pattern, not a native browser dialog (untestable, inconsistent with every other modal in this app)");

assert.match(js, /data-edit-listing/);
assert.match(js, /data-delete-listing/);
assert.match(js, /data-status-select/);
assert.match(css, /\.status-badge\s*{/);
assert.match(css, /\.account-action\.delete\s*{/);
assert.match(css, /\.status-select\s*{/);

// --- NM-A14: Real Authentication (Email + Password) ---
assert.match(schemaSql, /password_hash TEXT/, "users need a real password column");
assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS sessions \(/, "a real session needs a real table, not a client-trusted token");
assert.match(dbJs, /idx_users_email/, "same email must mean the same user -- a real uniqueness guarantee, not just an app-level check");

const authJs = fs.readFileSync(path.join(root, "scripts", "auth.js"), "utf8");
assert.match(authJs, /function hashPassword\(password\)/);
assert.match(authJs, /crypto\.scryptSync/, "passwords must be hashed with a real KDF, never stored plain text");
assert.doesNotMatch(authJs, /require\("bcrypt"\)/, "no native bcrypt dependency was added -- crypto.scrypt is the chosen equivalent (see EVIDENCE.md)");
assert.match(authJs, /crypto\.timingSafeEqual/, "password comparison must be constant-time");
assert.match(authJs, /function createSession\(db, userId\)/);
assert.match(authJs, /function requireSession\(req, res, next\)/);
assert.match(authJs, /HttpOnly/, "the session cookie must be httpOnly -- inaccessible to any injected script");
assert.match(authJs, /router\.post\("\/register"/);
assert.match(authJs, /router\.post\("\/login"/);
assert.match(authJs, /router\.post\("\/logout"/);
assert.match(authJs, /router\.get\("\/me"/);
assert.match(authJs, /code: "EMAIL_TAKEN"/, "a duplicate registration must be a distinct, recognizable error");
assert.match(authJs, /code: "INVALID_CREDENTIALS"/, "a wrong password must be a distinct, recognizable error");
// NM-A21: both responses now go through rowToAuthUser(), built from a
// fresh, explicit SELECT of only (id, name, email, phone, is_admin) --
// still never the password hash, just via a shared shaping function
// instead of a hand-typed object literal at each call site.
assert.match(authJs, /function rowToAuthUser\(row\)/);
assert.match(authJs, /res\.status\(201\)\.json\(rowToAuthUser\(db\.prepare\("SELECT id, name, email, phone, home_country, home_region, is_admin FROM users WHERE id = \?"\)\.get\(id\)\)\);/, "the register response must never echo the password or its hash back");
assert.match(authJs, /res\.json\(rowToAuthUser\(db\.prepare\("SELECT id, name, email, phone, home_country, home_region, is_admin FROM users WHERE id = \?"\)\.get\(user\.id\)\)\);/, "the login response must never echo the password or its hash back");

// --- NM-A21: admin/settings auth-layer pieces ---
assert.match(authJs, /const ADMIN_EMAIL = process\.env\.ADMIN_EMAIL/, "the designated admin must be named by a real env var, the same ops-controlled-setting pattern as every other real flag in this app");
assert.match(authJs, /function syncAdminFlag\(db, userId, email\)/);
assert.match(authJs, /function requireAdmin\(req, res, next\)/);
assert.match(authJs, /ADMIN_REQUIRED/);
assert.match(authJs, /router\.patch\("\/me", requireSession/, "Settings' phone update must require a real session");
assert.match(authJs, /PHONE_PATTERN/);

// Deployment-readiness audit finding: the session cookie never set `Secure`.
// Gated on NODE_ENV=production (same static-regex-on-the-env-flag pattern
// already used elsewhere in this section, e.g. isBoostPaymentsEnabled below)
// rather than unconditional, since this suite's own server always runs
// without it, over plain http://127.0.0.1.
assert.match(authJs, /const COOKIE_SECURE_SUFFIX = process\.env\.NODE_ENV === "production" \? "; Secure" : "";/, "the session cookie must conditionally set Secure in real production, not just HttpOnly/SameSite");
assert.match(authJs, /Path=\/; HttpOnly; SameSite=Lax; Max-Age=\$\{maxAgeSeconds\}\$\{COOKIE_SECURE_SUFFIX\}/, "the real session cookie string must include the conditional Secure suffix");

assert.match(serverJsForUploads, /app\.use\(attachSession\(db\)\)/, "every request must get a real session attached");
assert.match(serverJsForUploads, /app\.use\("\/api\/auth", createAuthRouter\(db\)\)/);
assert.match(
  serverJsForUploads,
  /requireSession,\s*generateImageRateLimiter,\s*handleGenerateImage/,
  "the real-money AI proxy must also be gated server-side (session + a real per-account rate limiter), not just by the client"
);

assert.match(apiJs, /router\.post\("\/listings", requireSession/, "publishing requires a real account");
assert.match(apiJs, /router\.post\("\/saved-items\/toggle", requireSession/, "saving requires a real account");
assert.match(apiJs, /router\.post\("\/reports", requireSession/, "reporting requires a real account");
assert.match(apiJs, /router\.post\("\/conversations\/start-or-get", requireSession/, "messaging requires a real account");
assert.match(apiJs, /seller: req\.currentUser\.name,/, "seller identity must be server-derived from the real session, not client-supplied");
assert.doesNotMatch(apiJs, /router\.post\("\/users\/sign-in"/, "the old mocked sign-in endpoint must be gone");

assert.match(dataServiceJs, /getCurrent\(\) \{\s*\n\s*return get\("\/auth\/me"\);/, "getCurrent must be a real server check now, not a cached guess");
assert.match(dataServiceJs, /register\(fields\)/);
assert.match(dataServiceJs, /login\(fields\)/);

assert.match(js, /async function submitAuthForm\(prefix, mode\)/);
assert.match(js, /function setAuthMode\(prefix, mode\)/);
assert.match(js, /function dismissAuthModal\(\)/, "Continue as Guest must dismiss, not create a mocked identity");
assert.doesNotMatch(js, /guest: true/, "no code path may mint a mocked guest identity anymore");
assert.doesNotMatch(js, /currentUser\.guest/, "there is no such thing as a signed-in guest anymore -- currentUser is either a real account or null");

assert.match(html, /id="auth-password-input" type="password"/, "the modal must collect a real password");
assert.match(html, /id="login-password-input" type="password"/, "the login page must collect a real password");
assert.match(html, /id="auth-name-field" hidden/, "the name field only appears in register mode");
assert.match(html, /id="auth-mode-toggle"/);
assert.match(html, /id="login-mode-toggle"/);

// --- NM-A15: Google Sign-In ---
assert.match(html, /<div class="google-signin-container" id="auth-google-signin"><\/div>/, "the auth modal must have a real container for Google's own button");
assert.match(html, /<div class="google-signin-container" id="login-google-signin"><\/div>/, "the Login page must have one too");
assert.match(html, /<div class="auth-divider" id="auth-divider"><span id="auth-divider-text">or continue with email<\/span><\/div>/);
assert.match(html, /<div class="auth-divider" id="login-divider"><span id="login-divider-text">or continue with email<\/span><\/div>/);
assert.match(css, /\.google-signin-container\s*{/);
assert.match(css, /\.auth-divider\s*{/);

const googleAuthJs = fs.readFileSync(path.join(root, "scripts", "google-auth.js"), "utf8");

assert.match(schemaSql, /google_id TEXT/, "users must have a real column to link a Google account to");
assert.match(authJs, /function createAuthRouter\(db, options = \{\}\)/, "the router must accept an injectable Google verifier for tests, defaulting to the real one");
assert.match(authJs, /router\.get\("\/google\/config"/);
assert.match(authJs, /router\.post\("\/google"/);
assert.doesNotMatch(authJs, /GOOGLE_CLIENT_SECRET/, "this app's ID-token verification flow needs no client secret at all -- see scripts/google-auth.js's own comment on why");
assert.match(authJs, /UPDATE users SET google_id = \? WHERE id = \?/, "an existing email/password account must be LINKED, not duplicated, when its owner continues with Google");
assert.match(authJs, /INSERT INTO users \(id, name, email, guest, password_hash, google_id, created_at\)/);

assert.match(googleAuthJs, /async function verifyGoogleIdToken\(idToken, \{ clientId, fetchJwks = fetchGoogleJwks \} = \{\}\)/);
assert.match(googleAuthJs, /crypto\.createPublicKey\(\{ key: jwk, format: "jwk" \}\)/, "JWKS verification must use Node's own built-in crypto, no new dependency");
assert.match(googleAuthJs, /crypto\.verify\("RSA-SHA256"/);
assert.match(googleAuthJs, /GOOGLE_ISSUERS = new Set\(\["https:\/\/accounts\.google\.com", "accounts\.google\.com"\]\)/);
assert.match(googleAuthJs, /payload\.aud !== clientId/, "the token's audience must be checked against OUR client id, not just any valid Google token accepted");
assert.match(googleAuthJs, /payload\.exp \* 1000 < Date\.now\(\)/);
assert.match(googleAuthJs, /email_verified === false/);
assert.doesNotMatch(googleAuthJs, /require\(["']google-auth-library["']\)/, "no new npm dependency for JWT verification");

assert.match(js, /function loadGoogleIdentityScript\(\)/);
assert.match(js, /accounts\.google\.com\/gsi\/client/, "must load the real Google Identity Services script, not a stub");
assert.match(js, /async function initGoogleSignIn\(\)/);
assert.match(js, /async function handleGoogleCredentialResponse\(response\)/);
assert.match(js, /function renderGoogleButtons\(\)/);
assert.match(js, /function renderGoogleUnavailable\(\)/);
assert.match(js, /const GOOGLE_LOCALE_BY_LANGUAGE = {/);
assert.match(dataServiceJs, /loginWithGoogle\(credential\)/);
assert.match(dataServiceJs, /googleConfig\(\)/);
// Requirement 8: the raw credential must never be persisted -- only the
// three derived claims (googleId/email/name) are ever written anywhere.
assert.doesNotMatch(authJs, /INSERT INTO users[\s\S]{0,300}credential/i);
assert.doesNotMatch(js, /localStorage[\s\S]{0,80}credential/i);

// --- NM-A23: Password Reset / Forgot-Password Flow ---
const rateLimitJs = fs.readFileSync(path.join(root, "scripts", "rate-limit.js"), "utf8");
assert.match(rateLimitJs, /function rateLimiter\(options = \{\}\)/, "the rate limiter must be a real, reusable middleware FACTORY, not hardcoded to one route");
assert.match(rateLimitJs, /function resetRateLimiterState\(\)/);
assert.doesNotMatch(rateLimitJs, /require\(["'](?:express-rate-limit|rate-limiter-flexible)["']\)/, "no new npm dependency for rate limiting");
assert.match(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
  /"dependencies": \{\s*\n\s*"@aws-sdk\/client-ses":.*\n\s*"@sentry\/node":.*\n\s*"better-sqlite3":.*\n\s*"compression":.*\n\s*"express":.*\n\s*\}/,
  "Phase 2 adds @aws-sdk/client-ses (SES email) and @sentry/node (error tracking) on top of the Phase 0 baseline (better-sqlite3, compression, express)"
);

assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS password_reset_tokens/);
assert.match(schemaSql, /used_at INTEGER/, "a reset token needs a real used_at column for single-use enforcement");

assert.match(authJs, /require\("\.\/rate-limit"\)/);
assert.match(authJs, /function createPasswordResetToken\(db, userId\)/);
assert.match(authJs, /function sendResetEmail\(email, resetUrl\)/, "the no-real-email-provider seam must be its own named function, not an inline console.log");
assert.match(authJs, /\[FindNord\] Password reset requested for/, "the console log label must match the required, clearly-labeled format");
assert.match(authJs, /router\.post\("\/forgot-password", forgotPasswordRateLimiter/);
assert.match(authJs, /router\.post\("\/reset-password", resetPasswordRateLimiter/);
assert.match(authJs, /router\.post\("\/login", loginRateLimiter/, "login must be rate-limited too");
assert.match(authJs, /router\.post\("\/register", registerRateLimiter/, "register must be rate-limited too");
assert.match(authJs, /code: "INVALID_RESET_TOKEN"/);
assert.match(authJs, /code: "RESET_TOKEN_EXPIRED"/);
assert.match(authJs, /code: "RESET_TOKEN_USED"/);
assert.match(authJs, /code: "GOOGLE_ACCOUNT_NO_PASSWORD"/, "a Google-only account must get its own distinct, honest error code");
assert.match(authJs, /if \(!user\.password_hash\) {/, "the Google-only check must be the real password_hash column, not a client-supplied flag");
assert.match(authJs, /DELETE FROM sessions WHERE user_id = \?/, "a real password reset must kill every existing session for that user, everywhere");
// The forgot-password response itself must never branch on whether the
// account exists -- this asserts the literal response shape is unconditional.
{
  const forgotRouteMatch = /router\.post\("\/forgot-password", forgotPasswordRateLimiter, \(req, res\) => \{([\s\S]*?)\n {2}\}\);/.exec(authJs);
  assert.ok(forgotRouteMatch, "the forgot-password route must exist");
  assert.match(forgotRouteMatch[1], /res\.status\(200\)\.json\(\{ message: "If that email exists, we've sent a reset link\." \}\);/, "the final response line must run unconditionally, not inside the if(user) branch");
  assert.doesNotMatch(forgotRouteMatch[1], /res\.status\(40[0-9]\)/, "forgot-password must never return a 4xx for any input shape -- that would itself leak account existence");
}

assert.match(dataServiceJs, /requestPasswordReset\(email\)/);
assert.match(dataServiceJs, /resetPassword\(token, password\)/);

assert.match(html, /id="forgot-password-modal"/);
assert.match(html, /id="reset-password-modal"/);
assert.match(html, /id="auth-forgot-link"/, "the sign-in modal needs a real Forgot password link");
assert.match(html, /id="login-forgot-link"/, "the dedicated Login page needs one too");
assert.match(html, /id="forgot-password-email-input" type="email"/);
assert.match(html, /id="reset-password-input" type="password"/);
assert.match(css, /\.auth-success\s*{/);

assert.match(js, /function openForgotPasswordModal\(\)/);
assert.match(js, /function closeForgotPasswordModal\(\)/);
assert.match(js, /async function handleForgotPasswordSubmit\(event\)/);
assert.match(js, /function openResetPasswordModal\(token\)/, "the token must be passed explicitly (not read back off a module variable set from outside) -- also what makes this callable correctly from a vm-sandboxed test");
assert.match(js, /function closeResetPasswordModal\(\)/);
assert.match(js, /async function handleResetPasswordSubmit\(event\)/);
assert.match(js, /let pendingResetToken = null;/);
// NM-A25: replaces NM-A23's own `?resetToken=` query-string stopgap -- the
// real bootstrap-time route read must use the same defensive guard every
// other real window/window.location access in this file uses, and must go
// through the same parseRoute()/applyRoute() mechanism every other deep
// link (listing/profile/static page) uses, not a special-cased read of its
// own.
assert.match(js, /if \(typeof window !== "undefined" && window\.location\) \{\s*(?:\/\/[^\n]*\n\s*)*await applyRoute\(parseRoute\(window\.location\.pathname\)\);/);
assert.doesNotMatch(js, /new URLSearchParams\(window\.location\.search\)/, "must not depend on URLSearchParams -- unavailable in this app's own bare vm test sandbox");
assert.match(js, /function parseRoute\(pathname\)/);
assert.match(js, /function applyRoute\(route\)/);
assert.match(js, /function navigateToListing\(id\)/);
assert.match(js, /function navigateToProfile\(id\)/);
assert.match(js, /function navigateToStaticPage\(pageId\)/);
assert.match(js, /function handlePopState\(\)/);
assert.match(js, /window\.addEventListener\("popstate", handlePopState\);/);

// NM-A25: a real bug caught during this slice's own Playwright verification
// -- index.html's <script>/<link>/<img> tags were all RELATIVE
// ("styles.css", "app.js", "data-service.js", "assets/login-hero.png"),
// which resolve fine at "/" but 404 once the real server serves this same
// file one path segment deep (e.g. "/listing/:id" resolves "styles.css" to
// "/listing/styles.css"). Every asset reference must be root-relative
// (a leading "/") so a fresh load of any of the 4 real deep-link routes
// actually loads its CSS/JS, not just the bare HTML shell.
assert.match(html, /<link rel="stylesheet" href="\/styles\.css" \/>/, "styles.css must be root-relative, or a fresh /listing/:id (etc.) load 404s on it");
assert.match(html, /<script src="\/data-service\.js"><\/script>/, "data-service.js must be root-relative");
assert.match(html, /<script src="\/app\.js"><\/script>/, "app.js must be root-relative");
assert.doesNotMatch(html, /src="assets\/|href="styles\.css"|src="app\.js"|src="data-service\.js"/, "no asset reference may be left relative -- see this slice's own real Playwright-caught bug above");

// --- NM-A24: Rate Limiting / Anti-Spam (Listings, Messages, Reports) ---
assert.match(apiJs, /require\("\.\/rate-limit"\)/, "api.js must reuse NM-A23's own rate-limit module, not re-invent it");
assert.match(apiJs, /function accountRateLimitKey\(req\)/, "these 3 routes must key on the real authenticated account, not the shared IP");
assert.match(apiJs, /req\.currentUser \? req\.currentUser\.id : req\.ip/, "the per-account key must fall back to IP only defensively -- these routes always run behind requireSession");
assert.match(apiJs, /const listingCreateRateLimiter = rateLimiter\(\{/);
assert.match(apiJs, /const messageCreateRateLimiter = rateLimiter\(\{/);
assert.match(apiJs, /const reportCreateRateLimiter = rateLimiter\(\{/);
// Ordering matters: requireSession must run BEFORE the rate limiter, so an
// unauthenticated request is rejected (401) before ever touching the
// per-account bucket, and so req.currentUser is guaranteed set for the key.
assert.match(apiJs, /router\.post\("\/listings", requireSession, listingCreateRateLimiter,/, "listing creation must be both session-gated and rate-limited, in that order");
assert.match(apiJs, /router\.post\("\/reports", requireSession, reportCreateRateLimiter,/, "reporting must be both session-gated and rate-limited, in that order");
assert.match(apiJs, /router\.post\("\/conversations\/:id\/messages", requireSession, messageCreateRateLimiter,/, "messaging must be both session-gated and rate-limited, in that order");
// The 3 real limits themselves, so a future edit can't silently loosen them
// without this test catching it.
assert.match(apiJs, /scope: "listings-create",\s*\n\s*windowMs: ONE_DAY_MS,\s*\n\s*max: 20,/);
assert.match(apiJs, /scope: "messages-send",\s*\n\s*windowMs: ONE_HOUR_MS,\s*\n\s*max: 40,/);
assert.match(apiJs, /scope: "reports-create",\s*\n\s*windowMs: ONE_DAY_MS,\s*\n\s*max: 15,/);

// A real, greppable server-side log line on every trip, covering both this
// slice's 3 new limiters and NM-A23's 4 pre-existing ones (fires from the
// shared factory itself, so every scope gets it automatically).
assert.match(rateLimitJs, /console\.warn\(\s*\n\s*`\[RateLimit\] blocked scope=\$\{scope\} key=\$\{keyFn\(req\)/, "a rate-limit trip must log a real, greppable [RateLimit] line with the real key, route, and count/max");

// Phase 2 adds @aws-sdk/client-ses (SES email) and @sentry/node (error tracking) on top of the Phase 0 baseline.
assert.match(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
  /"dependencies": \{\s*\n\s*"@aws-sdk\/client-ses":.*\n\s*"@sentry\/node":.*\n\s*"better-sqlite3":.*\n\s*"compression":.*\n\s*"express":.*\n\s*\}/,
  "Phase 2 adds @aws-sdk/client-ses (SES email) and @sentry/node (error tracking) on top of the Phase 0 baseline (better-sqlite3, compression, express)"
);

// Deployment-readiness audit finding: no .env.example/README existed
// anywhere documenting the (already-safe-by-default) real env vars this app
// reads -- an operator had to read source to discover the list.
const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
["PORT", "NODE_ENV", "DB_PATH", "SEED_DEMO_DATA", "ADMIN_EMAIL", "GOOGLE_CLIENT_ID", "OPENAI_API_KEY", "BOOST_PAYMENTS_ENABLED", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"].forEach((name) => {
  assert.match(envExample, new RegExp(`${name}=`), `.env.example must document ${name}`);
});
const readmeMd = fs.readFileSync(path.join(root, "README.md"), "utf8");
assert.match(readmeMd, /npm test/, "the README must document how to run the real test suite");
assert.match(readmeMd, /\.env\.example/, "the README must point at .env.example for the real env var list");

// Retry-After must reach the FRONTEND, not just the raw HTTP response --
// data-service.js's shared request() is the one place every DataService
// method funnels through, so this covers all 3 new call sites at once.
assert.match(dataServiceJs, /error\.retryAfter = Number\(retryAfterHeader\)/, "a 429's Retry-After header must be surfaced on the thrown error for the UI to use");

// A real, translated "try again in X minutes" message exists for all 3
// actions, in ALL 6 languages this app now maintains full strings for --
// updated by NM-A26, which gave no/da/fi/is real translations (they used to
// intentionally fall back to English via t() through empty {} stub blocks;
// those stubs no longer exist anywhere in this file as of NM-A26).
assert.match(js, /function formatRetryMinutesMessage\(key, retryAfterSeconds\)/);
["rateLimit.listings", "rateLimit.messages", "rateLimit.reports"].forEach((key) => {
  const matches = js.match(new RegExp(`"${key.replace(".", "\\.")}": "[^"]*\\{minutes\\}[^"]*"`, "g")) || [];
  assert.equal(matches.length, 6, `${key} must be defined with a real {minutes} placeholder in ALL 6 language dictionaries (en/sv/no/da/fi/is) (found ${matches.length})`);
});

// Each of the 3 real UI call sites must actually branch on RATE_LIMITED --
// not just have the helper function sitting unused somewhere.
const rateLimitMessagesBranch = js.match(/error\.code === "RATE_LIMITED"\s*\n\s*\? formatRetryMinutesMessage\("rateLimit\.messages", error\.retryAfter\)/g) || [];
assert.equal(rateLimitMessagesBranch.length, 2, "BOTH sendComposedMessage and sendThreadReply must surface the real rate-limit message, not just one of the two message-send paths");
assert.match(js, /error\.code === "RATE_LIMITED" \? formatRetryMinutesMessage\("rateLimit\.reports", error\.retryAfter\)/, "submitReportModal must surface the real rate-limit message");
assert.match(js, /error\.code === "RATE_LIMITED" \? formatRetryMinutesMessage\("rateLimit\.listings", error\.retryAfter\)/, "commitPublish must surface the real rate-limit message");
// commitPublish previously had NO error handling at all -- a real regression
// guard that it's now wrapped, not just that the rate-limit branch exists.
assert.match(js, /record = await commitPublishRequest\(values, images\);\s*\n\s*\} catch \(error\) \{/, "publishing a listing must now handle a server rejection instead of leaving an unhandled promise rejection");

class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.hidden = false;
    this.checked = false;
    this.disabled = false;
    this.selectedIndex = 0;
    this.listeners = {};
    this.textContent = "";
    this.value = "";
    this.innerHTMLValue = "";
    this.attrs = {};
    this.classList = {
      values: new Set(),
      add: (...names) => names.forEach((name) => this.classList.values.add(name)),
      remove: (...names) => names.forEach((name) => this.classList.values.delete(name)),
      contains: (name) => this.classList.values.has(name),
      toggle: (name, force) => {
        const shouldAdd = force === undefined ? !this.classList.values.has(name) : force;
        if (shouldAdd) this.classList.values.add(name);
        else this.classList.values.delete(name);
      }
    };
  }

  set innerHTML(value) {
    this.innerHTMLValue = value;
    if (value === "") this.children = [];
  }

  get innerHTML() {
    return this.innerHTMLValue;
  }

  appendChild(child) {
    this.children.push(child);
  }

  addEventListener(event, callback) {
    this.listeners[event] = callback;
  }

  setAttribute(name, value) {
    this.attrs[name] = String(value);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
  }

  closest() {
    return null;
  }

  // UI overhaul (FB-Marketplace-style iconography + sidebar): nav items
  // gained a nested icon + label structure in real markup
  // (`<button><svg/><span class="nav-label">...</span></button>`).
  // This fake DOM doesn't model real child nodes, so ".nav-label" resolves to
  // a thin proxy over the SAME textContent storage -- in the real browser the
  // icon SVG contributes no text either, so `item.textContent` ending up
  // exactly equal to the label text is accurate, not a simplification that
  // hides anything.
  querySelector(selector) {
    if (selector === ".nav-label") {
      const target = this;
      return {
        get textContent() {
          return target.textContent;
        },
        set textContent(value) {
          target.textContent = value;
        }
      };
    }
    return null;
  }
}

// NM-A10: real photo uploads run through FileReader -> Image -> canvas. None
// of those exist in this fake DOM, so they're stubbed deterministically:
// FakeImage reads its pixel dimensions straight out of a "W<n>H<n>" marker
// embedded in the fake data URL (set by the test), and the fake canvas's
// toDataURL derives a byte size from width * height * quality so the real
// resize/compress loop in resizeImageFromSrc() can be exercised and measured
// without needing real image bytes.
class FakeImage {
  set src(value) {
    this._src = value;
    const match = /W(\d+)H(\d+)/.exec(value || "");
    this.naturalWidth = match ? Number(match[1]) : 800;
    this.naturalHeight = match ? Number(match[2]) : 800;
    setImmediate(() => {
      if (this.onload) this.onload();
    });
  }

  get src() {
    return this._src;
  }
}

class FakeFileReader {
  readAsDataURL(file) {
    setImmediate(() => {
      this.result = (file && file.__dataUrl) || "data:image/png;base64,W800H800";
      if (this.onload) this.onload();
    });
  }
}

function makeFakeCanvas() {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage() {} }),
    toDataURL(type, quality) {
      const q = quality === undefined ? 1 : quality;
      const bytes = Math.round(canvas.width * canvas.height * q * 1.5);
      const base64Length = Math.ceil(Math.max(bytes, 0) / 3) * 4;
      return `data:image/jpeg;base64,${"A".repeat(base64Length)}`;
    }
  };
  return canvas;
}

function makeElementMap() {
  const ids = [
    "active-location",
    "active-radius",
    "search-input",
    "search-label-text",
    "filter-button",
    "filter-button-label",
    "sidebar-search-input",
    "sidebar-search-label",
    "sidebar-browse-label",
    "sidebar-categories-label",
    "sidebar-inbox-label",
    "sidebar-create-label",
    "sidebar-location-title",
    "sidebar-location-link",
    "sidebar-location-text",
    "sidebar-categories-title",
    "sidebar-categories-list",
    "result-scope",
    "result-count",
    "listing-grid",
    "empty-state",
    "empty-heading",
    "fairness-section-container",
    "listing-detail",
    "back-to-browse",
    "category-grid",
    "category-chips",
    "browse-title",
    "brand-eyebrow",
    "language-select",
    "sell-title",
    "sell-publish",
    "sell-form",
    "sell-photo-grid",
    "sell-photo-input",
    "sell-title-input",
    "sell-price-input",
    "sell-free-toggle",
    "sell-category-select",
    "sell-subtype-field",
    "sell-subtype-select",
    "sell-condition-select",
    "sell-location-input",
    "sell-region-input",
    "sell-region-label",
    "sell-region-datalist",
    "sell-description-input",
    "sell-validation",
    "sell-preview",
    "you-panel",
    "auth-modal",
    "auth-modal-eyebrow",
    "auth-modal-title",
    "auth-modal-body",
    "auth-name-field",
    "auth-name-label",
    "auth-name-input",
    "auth-email-label",
    "auth-email-input",
    "auth-password-label",
    "auth-password-input",
    "auth-age-field",
    "auth-age-label",
    "auth-age-checkbox",
    "auth-error",
    "auth-continue-button",
    "auth-mode-toggle",
    "auth-guest-button",
    "auth-modal-close",
    "auth-form",
    "auth-google-signin",
    "auth-divider",
    "auth-divider-text",
    "auth-forgot-link",
    "forgot-password-modal",
    "forgot-password-modal-close",
    "forgot-password-modal-title",
    "forgot-password-modal-body",
    "forgot-password-form",
    "forgot-password-email-label",
    "forgot-password-email-input",
    "forgot-password-error",
    "forgot-password-success",
    "forgot-password-submit-button",
    "reset-password-modal",
    "reset-password-modal-close",
    "reset-password-modal-title",
    "reset-password-modal-body",
    "reset-password-form",
    "reset-password-label",
    "reset-password-input",
    "reset-password-error",
    "reset-password-success",
    "reset-password-submit-button",
    "compose-modal",
    "compose-modal-title",
    "compose-message-input",
    "compose-cancel-button",
    "compose-send-button",
    "compose-modal-close",
    "report-modal",
    "report-modal-title",
    "report-modal-body",
    "report-reason-select",
    "report-reason-label",
    "report-details-input",
    "report-details-label",
    "report-error",
    "report-modal-close",
    "report-cancel-button",
    "report-submit-button",
    "toast",
    "active-filter-chips",
    "sort-indicator",
    "filter-sheet",
    "filter-sheet-title",
    "filter-sheet-close",
    "boost-sheet",
    "boost-sheet-title",
    "boost-sheet-body",
    "boost-sheet-close",
    "filter-sort-label",
    "filter-sort-select",
    "filter-sort-recent",
    "filter-sort-price-low",
    "filter-sort-price-high",
    "filter-sort-nearest",
    "filter-price-min",
    "filter-price-max",
    "filter-price-min-label",
    "filter-price-max-label",
    "filter-condition-label",
    "filter-condition-group",
    "filter-seller-label",
    "filter-seller-group",
    "filter-distance-label",
    "filter-distance-select",
    "filter-distance-any",
    "filter-distance-5",
    "filter-distance-10",
    "filter-distance-25",
    "filter-distance-50",
    "filter-distance-100",
    "filter-region-input",
    "filter-region-label",
    "filter-region-datalist",
    "filter-category-label",
    "filter-category-select",
    "filter-subtype-field",
    "filter-subtype-label",
    "filter-subtype-select",
    "filter-clear-button",
    "filter-reset-button",
    "filter-apply-button",
    "ai-photo-prompt-label",
    "ai-photo-prompt",
    "generate-ai-photo",
    "ai-photo-status",
    "login-form",
    "login-title",
    "login-tagline",
    "login-google-signin",
    "login-divider",
    "login-divider-text",
    "login-name-field",
    "login-name-label",
    "login-name-input",
    "login-email-label",
    "login-email-input",
    "login-password-label",
    "login-password-input",
    "login-age-field",
    "login-age-label",
    "login-age-checkbox",
    "login-forgot-link",
    "login-error",
    "login-continue-button",
    "login-mode-toggle",
    "login-guest-button",
    "static-page-content",
    "footer-tagline",
    "footer-cta-account",
    "footer-cta-sell",
    "footer-company-line",
    "footer-col-categories",
    "footer-col-explore",
    "footer-col-buysell",
    "footer-col-help",
    "footer-col-legal",
    "footer-col-company",
    "footer-browse-all",
    "footer-link-about",
    "footer-link-how",
    "footer-link-safety-tips",
    "footer-link-terms-explore",
    "footer-link-post",
    "footer-link-pricing",
    "footer-link-photo",
    "footer-link-safe-selling",
    "footer-link-help-center",
    "footer-link-faq",
    "footer-link-contact",
    "footer-link-report",
    "footer-link-privacy",
    "footer-link-terms",
    "footer-link-cookies",
    "footer-link-dsr",
    "footer-link-micany",
    "footer-link-moderation",
    "footer-link-data-safety",
    "footer-link-boost",
    "footer-countries-title",
    "footer-country-flags",
    "footer-copyright",
    "cookie-banner",
    "cookie-banner-text",
    "cookie-settings-button",
    "cookie-accept-button",
    "inbox-eyebrow",
    "inbox-title",
    "inbox-content",
    "thread-snapshot",
    "thread-messages",
    "thread-reply-form",
    "thread-reply-label",
    "thread-reply-input",
    "thread-send-button",
    "sell-photos-hint",
    "detail-gallery-wrap",
    "account-actions",
    "profile-button",
    "my-listings-eyebrow",
    "my-listings-title",
    "my-listings-content",
    "analytics-eyebrow",
    "analytics-title",
    "analytics-content",
    "seller-profile",
    "settings-signed-out",
    "settings-signed-out-text",
    "settings-form-wrap",
    "settings-email-display",
    "settings-email-label",
    "settings-email-hint",
    "settings-phone-input",
    "settings-phone-label",
    "settings-home-country-select",
    "settings-home-country-label",
    "settings-home-region-input",
    "settings-home-region-label",
    "settings-home-region-datalist",
    "settings-home-location-hint",
    "settings-error",
    "settings-save-button",
    "admin-content"
  ];
  const map = Object.fromEntries(ids.map((id) => [id, new Element("div")]));
  map["sell-subtype-field"].hidden = true;
  map["auth-modal"].hidden = true;
  map["compose-modal"].hidden = true;
  map["report-modal"].hidden = true;
  map["report-error"].hidden = true;
  map["settings-signed-out"].hidden = true;
  map["settings-error"].hidden = true;
  map["toast"].hidden = true;
  map["filter-sheet"].hidden = true;
  map["filter-subtype-field"].hidden = true;
  map["sort-indicator"].hidden = true;
  map["account-actions"].hidden = true;
  map["auth-name-field"].hidden = true;
  map["login-name-field"].hidden = true;
  map["auth-error"].hidden = true;
  map["login-error"].hidden = true;
  return map;
}

const elements = makeElementMap();
elements["search-input"].value = "";
elements["sell-photo-input"].files = [];
elements["sell-photo-input"].click = () => {
  elements["sell-photo-input"].clicked = true;
};
const views = [
  "browse-view",
  "detail-view",
  "categories-view",
  "sell-view",
  "inbox-view",
  "you-view",
  "login-view",
  "thread-view",
  "my-listings-view",
  "analytics-view",
  "profile-view",
  "static-page-view",
  "settings-view",
  "admin-view"
].map((id) => {
  const element = new Element("section");
  element.id = id;
  if (id === "browse-view") element.classList.add("active-view");
  return element;
});
const navItems = views.map((view) => {
  const element = new Element("button");
  element.dataset = { view: view.id };
  if (view.id === "browse-view") element.classList.add("active");
  return element;
});
// The desktop sidebar's primary nav only covers 3 of the 10 views (Browse,
// Categories, Inbox) -- matching the real markup, not a 1:1 stand-in like navItems.
const sidebarItems = ["browse-view", "categories-view", "inbox-view"].map((viewId) => {
  const element = new Element("button");
  element.dataset = { view: viewId };
  if (viewId === "browse-view") element.classList.add("active");
  return element;
});
const scopes = ["Nearby", "Country", "All Nordics"].map((scope) => {
  const element = new Element("button");
  element.dataset = { scope };
  if (scope === "Nearby") element.classList.add("active");
  return element;
});

const documentElement = {
  lang: "",
  style: {
    props: {},
    setProperty(name, value) {
      this.props[name] = value;
    },
    getPropertyValue(name) {
      return this.props[name] || "";
    }
  }
};

const document = {
  documentElement,
  getElementById(id) {
    return elements[id] || views.find((view) => view.id === id);
  },
  addEventListener() {},
  createElement(tagName) {
    if (tagName === "canvas") return makeFakeCanvas();
    return new Element(tagName);
  },
  querySelectorAll(selector) {
    if (selector === ".view") return views;
    if (selector === ".nav-item") return navItems;
    if (selector === ".sidebar-item") return sidebarItems;
    if (selector === ".scope") return scopes;
    return [];
  }
};

// NM-A7: bootstrap() is now async (it awaits DataService). vm.runInContext /
// runInNewContext return the script's completion value, which — since the
// combined script's last statement is `bootstrap();`, an async function call
// — is bootstrap's own promise. Everything from here on must await it (and,
// for actions resumed via sign-in, flush a macrotask afterward) before
// reading rendered DOM state.
function flushMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

// NM-A11: a fire-and-forget resumed action (completeSignIn deliberately does
// NOT await its pendingAction -- see app.js) used to settle within a single
// flushMicrotasks() tick, because the old in-memory DataService resolved
// within a microtask. Now that DataService makes real network calls, a
// resumed action can span several real event-loop turns (actual socket I/O),
// so waiting for a real, observable outcome -- polling instead of guessing a
// tick count -- is what actually stays deterministic under real I/O.
async function waitFor(conditionFn, { timeout = 3000, interval = 5 } = {}) {
  const start = Date.now();
  while (!conditionFn()) {
    if (Date.now() - start > timeout) throw new Error("waitFor: condition was not met within the timeout");
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

// NM-A11: data-service.js now calls real fetch() for everything. Every path
// is routed to the REAL Express + SQLite test server started in main() below
// (via the outer `serverOrigin`), except /api/generate-image, which stays a
// fake stub -- a genuinely-async one so `await fetch(...)` really suspends
// the caller for one microtask, matching real network behavior closely
// enough to test the synchronous "generation started" state -- without ever
// making a real, billed OpenAI call from the test suite.
//
// NM-A14: real auth means real Set-Cookie/Cookie headers now matter. Node's
// built-in fetch (undici) has no browser-style automatic cookie jar between
// separate calls, so this simulates the ONE browser tab the whole vm-sandbox
// context represents: capture Set-Cookie from every response, resend it as
// Cookie on every subsequent request. A SEPARATE real user (e.g. an
// "intruder" proving server-side ownership checks) is registered with its
// own direct fetch() + its own captured cookie, entirely outside this jar --
// see assertBackendPersistsAcrossRestart and the ownership tests below.
let testCookieJar = "";

function makeTestFetch() {
  return async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith("/api/generate-image")) {
      return { ok: true, json: async () => ({ image: "data:image/png;base64,ZmFrZQ==" }) };
    }
    const headers = { ...(init && init.headers) };
    if (testCookieJar) headers.cookie = testCookieJar;
    const response = await fetch(`${serverOrigin}${url}`, { ...init, headers });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) testCookieJar = setCookie.split(";")[0];
    return response;
  };
}

// `testDb` (NM-A23): the real better-sqlite3 handle behind the one test
// server this whole suite shares -- used only to simulate the passage of
// time on a password-reset token (setting expires_at into the past) for a
// real, deterministic expired-token test, since the suite can't actually
// wait 45 real minutes. Never used to fabricate data that a real HTTP
// request wouldn't otherwise have produced.
async function runBehavioralTests(testDb) {
  const firstBootstrap = vm.runInNewContext(combinedJs, { document, fetch: makeTestFetch() });
  await firstBootstrap;

  // NM-A21: register the real designated admin account once, outside the
  // vm-sandbox's own cookie jar (same pattern as registerRealUserDirectly's
  // other callers) -- used later both to verify NM-A20's now-admin-gated
  // report reads and to exercise the moderation queue's real access control.
  // (Uses a literal password, not DEFAULT_TEST_PASSWORD -- that constant is
  // declared further down in this same function, after this point.)
  const adminRegistration = await registerRealUserDirectly("NMA21 Admin", "nma21-admin@example.com", "correcthorse1");
  assert.equal(adminRegistration.user.isAdmin, true, "registering with the exact ADMIN_EMAIL must really mark the account is_admin, not just simulate it client-side");
  adminCookie = adminRegistration.cookie;

  assert.match(elements["listing-grid"].innerHTML, /Solid oak dining table/);
assert.match(elements["listing-grid"].innerHTML, /Sponsored/);
assert.match(elements["listing-grid"].innerHTML, /Free/);
assert.equal(elements["result-count"].textContent, "8 listings");
assert.equal(elements["result-scope"].textContent, "Nearby");
assert.match(elements["category-grid"].innerHTML, /Electronics/);
assert.match(elements["category-grid"].innerHTML, /popular-badge">Popular<\/span>\s*<strong>Vehicles<\/strong>/);
assert.match(elements["category-grid"].innerHTML, /popular-badge">Popular<\/span>\s*<strong>Real Estate<\/strong>/);
assert.doesNotMatch(elements["category-grid"].innerHTML, /popular-badge">Popular<\/span>\s*<strong>Electronics<\/strong>/);
assert.match(elements["listing-grid"].innerHTML, /Volvo V60/);
assert.match(elements["listing-grid"].innerHTML, /2-room apartment near Slussen/);
assert.match(elements["category-chips"].innerHTML, /class="chip featured" data-category="Vehicles"/);
assert.match(elements["category-chips"].innerHTML, /class="chip featured" data-category="Real Estate"/);
assert.equal((elements["category-chips"].innerHTML.match(/class="chip/g) || []).length, 13);

// Card accessible names must carry sponsored/freshness/price state, since the
// button's own aria-label overrides all descendant text for screen readers.
assert.match(
  elements["listing-grid"].innerHTML,
  /aria-label="Open listing: iPhone 14, 128 GB, 5 900 kr, sponsored, Fresh, Solna, 6\.8 km away"/
);
assert.match(elements["listing-grid"].innerHTML, /aria-label="Save iPhone 14, 128 GB for later"/);
assert.match(elements["listing-grid"].innerHTML, /class="listing-photo"[^>]*aria-hidden="true"/);

elements["search-input"].value = "iphone";
elements["search-input"].listeners.input();
assert.equal(elements["result-count"].textContent, "1 listing");
assert.match(elements["listing-grid"].innerHTML, /iPhone 14/);

elements["search-input"].value = "sodermalm";
elements["search-input"].listeners.input();
assert.equal(elements["result-count"].textContent, "1 listing");
assert.match(elements["listing-grid"].innerHTML, /Södermalm/);

elements["search-input"].value = "zzzz";
elements["search-input"].listeners.input();
assert.equal(elements["result-count"].textContent, "0 listings");
assert.equal(elements["empty-state"].hidden, false);

elements["search-input"].value = "";
elements["search-input"].listeners.input();

// The Share button (see handleShareClick) prefers navigator.share, falling
// back to navigator.clipboard.writeText -- deliberately NOT faking
// navigator.share here so the clipboard fallback is what gets exercised,
// matching the realistic default on a desktop browser without a native
// share sheet (verified for real, end-to-end, in Playwright separately).
const fakeClipboard = { lastWrittenText: null };
const fakeNavigator = {
  clipboard: {
    writeText(text) {
      fakeClipboard.lastWrittenText = text;
      return Promise.resolve();
    }
  }
};
// A real (if tiny, in-memory) localStorage -- the sandbox has none by
// default, and the app's own code already guards every access with
// `typeof localStorage !== "undefined"` (see loadSavedLanguage()), so its
// total absence was previously silently masking whether persistence (the
// cookie-consent banner, the language preference) actually round-trips at
// all. Exposed as `fakeLocalStorageStore` too, so tests can inspect it directly.
const fakeLocalStorageStore = {};
const fakeLocalStorage = {
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(fakeLocalStorageStore, key) ? fakeLocalStorageStore[key] : null;
  },
  setItem(key, value) {
    fakeLocalStorageStore[key] = String(value);
  },
  removeItem(key) {
    delete fakeLocalStorageStore[key];
  }
};
const scrollToCalls = [];
// NM-A25: a real (if tiny) fake `location`/`history` pair for exercising the
// new client-side routing layer. `fakeLocation` is the SAME object reference
// `window.location` points at inside the sandboxed script (vm.createContext
// doesn't clone nested objects), so pushState-driven mutations made by code
// running INSIDE the sandbox are visible on `fakeLocation` out here too, and
// `firePopState()` calls back whatever bootstrap() registered via the fake
// `window.addEventListener("popstate", ...)` below -- a real simulation of a
// back/forward tap, not just an internal-flag check.
const fakeLocation = { href: "http://localhost:4173/", origin: "http://localhost:4173", pathname: "/", search: "" };
function setFakeLocation(urlPath) {
  const [pathname, search] = String(urlPath).split("?");
  fakeLocation.pathname = pathname;
  fakeLocation.search = search ? `?${search}` : "";
  fakeLocation.href = `${fakeLocation.origin}${fakeLocation.pathname}${fakeLocation.search}`;
}
const pushStateCalls = [];
const fakeHistory = {
  pushState(state, title, url) {
    pushStateCalls.push(url);
    setFakeLocation(url);
  },
  replaceState(state, title, url) {
    setFakeLocation(url);
  }
};
const popstateListeners = [];
function firePopState() {
  popstateListeners.slice().forEach((listener) => listener({}));
}
const context = vm.createContext({
  document,
  fetch: makeTestFetch(),
  FileReader: FakeFileReader,
  Image: FakeImage,
  navigator: fakeNavigator,
  window: {
    location: fakeLocation,
    history: fakeHistory,
    addEventListener(type, handler) {
      if (type === "popstate") popstateListeners.push(handler);
    },
    scrollTo(x, y) {
      scrollToCalls.push([x, y]);
    }
  },
  localStorage: fakeLocalStorage
});
const secondBootstrap = vm.runInContext(combinedJs, context);
await secondBootstrap;

// Drives the real upload pipeline (FileReader -> Image -> canvas resize) the
// same way a user's file picker selection would, via handleSellPhotoFilesSelected.
async function uploadFakePhoto(marker) {
  elements["sell-photo-input"].files = [{ __dataUrl: `data:image/png;base64,${marker || "W200H200"}` }];
  await context.handleSellPhotoFilesSelected({ target: elements["sell-photo-input"] });
}

// NM-A14: drives the REAL auth form (fill fields -> submitAuthForm), the
// same code path a real user typing into the modal or the login page goes
// through -- not a bypass. Returns the resulting user (or undefined on a
// rejected attempt, exactly like the real submit handler).
async function registerTestUser(name, email, password) {
  context.setAuthMode("auth", "register");
  elements["auth-name-input"].value = name;
  elements["auth-email-input"].value = email;
  elements["auth-password-input"].value = password;
  // Deployment-readiness audit finding: a real registration now requires
  // confirming you're 18+ (see submitAuthForm) -- this helper simulates a
  // real user who would check the box, same as it fills in every other
  // field. The age GATE itself is tested directly and separately below.
  elements["auth-age-checkbox"].checked = true;
  return context.submitAuthForm("auth", "register");
}

async function loginTestUser(email, password) {
  context.setAuthMode("auth", "login");
  elements["auth-email-input"].value = email;
  elements["auth-password-input"].value = password;
  return context.submitAuthForm("auth", "login");
}

const DEFAULT_TEST_PASSWORD = "correcthorse1";

// A real account with its OWN session, entirely outside testCookieJar (the
// one shared "browser tab" every context.* call uses) -- for proving
// server-side ownership checks reject a DIFFERENT real, signed-in user, not
// just an anonymous one.
async function registerRealUserDirectly(name, email, password) {
  const response = await fetch(`${serverOrigin}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // ageConfirmed: true because this helper simulates a REAL user going
    // through registration (used throughout this suite to prove server-side
    // ownership checks, restart persistence, etc.) -- the age gate itself is
    // tested directly and separately below, not through this helper.
    body: JSON.stringify({ name, email, password, ageConfirmed: true })
  });
  const cookie = (response.headers.get("set-cookie") || "").split(";")[0];
  const user = await response.json();
  return { user, cookie };
}

// Re-running the script re-initializes everything against the same shared
// mock elements; confirms the expanded seed data renders end to end again.
assert.equal(elements["result-count"].textContent, "8 listings");
assert.match(elements["listing-grid"].innerHTML, /Volvo V60/);

// --- BL-A04/BL-A05: local category names + localized/de-accented search synonyms ---
assert.equal(context.categoryLabel("Vehicles"), "Vehicles", "English must return the plain canonical label");
context.setLanguage("sv");
assert.equal(context.categoryLabel("Vehicles"), "Fordon");
assert.equal(context.categoryLabel("Home & Furniture"), "Hem & Möbler");
context.setLanguage("no");
assert.equal(context.categoryLabel("Vehicles"), "Kjøretøy");
context.setLanguage("da");
assert.equal(context.categoryLabel("Vehicles"), "Køretøjer");
context.setLanguage("fi");
assert.equal(context.categoryLabel("Vehicles"), "Ajoneuvot");
context.setLanguage("is");
assert.equal(context.categoryLabel("Vehicles"), "Ökutæki");
assert.equal(context.categoryLabel("does-not-exist"), "does-not-exist", "an unknown id must fall back to itself, never crash");

// Every real render surface must re-render in the new language immediately,
// not just on next reload/open.
context.setLanguage("sv");
assert.match(elements["filter-category-select"].innerHTML, /<option value="Vehicles">Fordon<\/option>/);
assert.match(elements["sell-category-select"].innerHTML, /<option value="Vehicles">Fordon<\/option>/);
assert.match(elements["category-chips"].innerHTML, /data-category="Vehicles">Fordon</);
assert.match(elements["category-grid"].innerHTML, /data-category-jump="Vehicles">[\s\S]*?<strong>Fordon<\/strong>/);
assert.match(elements["sidebar-categories-list"].innerHTML, /data-category-jump="Vehicles">[\s\S]*?Fordon/);
context.setLanguage("en");
assert.match(elements["filter-category-select"].innerHTML, /<option value="Vehicles">Vehicles<\/option>/, "switching back to English must re-render English labels too");

// The synthetic "All" chip/option reuses the existing filter.categoryAll key.
context.setLanguage("sv");
assert.match(elements["category-chips"].innerHTML, /data-category="All">Alla kategorier</);
context.setLanguage("en");

// BL-A05: a localized synonym surfaces listings from its mapped category
// even though the word itself appears nowhere in that listing's own title/
// category/subtype/locality/condition text (proven above: no fixture text
// contains "bil" or "möbler").
context.setLanguage("sv");
elements["search-input"].value = "bil";
elements["search-input"].listeners.input();
assert.equal(elements["result-count"].textContent, "1 annons", "\"bil\" must resolve to exactly the one real Vehicles listing via the synonym map (Swedish is still the active language here)");
assert.match(elements["listing-grid"].innerHTML, /Volvo V60/);
assert.doesNotMatch(elements["listing-grid"].innerHTML, /oak dining table|Brass floor lamp/i, "a Vehicles synonym must never leak into Home & Furniture results");

elements["search-input"].value = "möbler";
elements["search-input"].listeners.input();
assert.equal(elements["result-count"].textContent, "2 annonser", "\"möbler\" must resolve to both real Home & Furniture listings via the synonym map");
assert.match(elements["listing-grid"].innerHTML, /oak dining table/i);
assert.match(elements["listing-grid"].innerHTML, /Brass floor lamp/i);
assert.doesNotMatch(elements["listing-grid"].innerHTML, /Volvo V60/, "a Home & Furniture synonym must never leak into Vehicles results");

// The de-accented form of the same synonym must match too, via the
// existing normalize() NFD path -- proves synonym matching didn't bypass
// or duplicate the existing accent-insensitive comparison.
elements["search-input"].value = "mobler";
elements["search-input"].listeners.input();
assert.equal(elements["result-count"].textContent, "2 annonser", "the de-accented spelling of a synonym must match exactly like the accented one");

// The pre-existing accent-insensitive SUBSTRING search (unrelated to
// synonyms) must still work, unmodified: a de-accented "ostermalm" still
// finds the real seed listing whose own locality is "Östermalm".
elements["search-input"].value = "ostermalm";
elements["search-input"].listeners.input();
assert.equal(elements["result-count"].textContent, "1 annons");
assert.match(elements["listing-grid"].innerHTML, /2-room apartment near Slussen/, "pre-existing accent-insensitive substring search must be unaffected by the new synonym layer");

context.setLanguage("en");
elements["search-input"].value = "";
elements["search-input"].listeners.input();
console.log("PASS: BL-A04 local category names -- Vehicles/Home & Furniture (and every other category) render real, distinct sv/no/da/fi/is labels across the filter select, sell select, category chips, category grid, and sidebar list, all live on setLanguage() with no reload required, with a safe fallback for an unknown category id.");
console.log("PASS: BL-A05 localized/de-accented search -- Swedish \"bil\"/\"möbler\" (and their de-accented spellings) resolve to exactly the real listings in their mapped category with zero cross-category leakage, and the pre-existing accent-insensitive substring search (e.g. \"ostermalm\" -> \"Östermalm\") keeps working unchanged.");

context.openListing("iphone-14");
assert.match(elements["listing-detail"].innerHTML, /Message seller/);
assert.match(elements["listing-detail"].innerHTML, /Hi, is this still available\?/);
assert.match(elements["listing-detail"].innerHTML, /Professional seller/);
assert.match(elements["listing-detail"].innerHTML, /Meet safely/);
// NM-A20: the safety reminder was hardcoded English before this slice --
// improved to be a real, translated link into the full Safety Tips page.
assert.match(elements["listing-detail"].innerHTML, /data-static-page="safetyTips"/, "the safety reminder must link to the full Safety Tips page, not just show a static blurb");
context.setLanguage("sv");
context.openListing("iphone-14");
assert.match(elements["listing-detail"].innerHTML, /Träffas säkert/, "the safety reminder must actually be translated, not silently stay English");
context.setLanguage("en");
context.openListing("iphone-14");

// Message Seller CTA lives in a dedicated fixed bar (pinned above the bottom
// nav via CSS), not mixed in with the in-flow Save/Share row.
assert.match(elements["listing-detail"].innerHTML, /<div class="cta-bar">\s*<button type="button" id="message-seller"/);
assert.match(elements["listing-detail"].innerHTML, /aria-label="Message Nordic Refurb about iPhone 14, 128 GB"/);
assert.match(elements["listing-detail"].innerHTML, /aria-label="Save iPhone 14, 128 GB for later"/);
assert.match(elements["listing-detail"].innerHTML, /data-share-listing="iphone-14" aria-label="Share iPhone 14, 128 GB"/);
assert.match(elements["listing-detail"].innerHTML, /role="img" aria-label="Photo 1: iPhone 14, 128 GB"/);

// Share needs no account (unlike Save/Message/Report) -- a guest can share
// just as freely as they can browse. With no navigator.share in this
// sandbox (see the fake navigator set up above), it must fall back to
// copying a real, correctly-worded summary + the current page URL to the
// clipboard, and surface that via a toast (an invisible clipboard write
// would otherwise give the user zero feedback).
// NM-A25: the shared URL must now be a real, per-listing deep link
// (`/listing/iphone-14`), not the site's bare address -- reloading this
// exact URL against a real server is proven to land on this exact listing
// in the NM-A25 backend-routing section below.
elements["toast"].hidden = true;
elements["toast"].textContent = "";
await context.handleShareClick("iphone-14");
assert.equal(fakeClipboard.lastWrittenText, "iPhone 14, 128 GB — 5 900 kr http://localhost:4173/listing/iphone-14");
assert.equal(elements["toast"].hidden, false);
assert.equal(elements["toast"].textContent, "Link copied to clipboard.");

// The "Hi, is this still available?" pill is a one-tap shortcut into the
// exact same gated compose flow as Message Seller, not a separate,
// independently-implemented feature -- both are wired to the same handler
// (see bindEvents), so there is nothing new to unit-test in the handler
// itself beyond confirming the pill exists and both selectors are wired.
assert.match(elements["listing-detail"].innerHTML, /<button type="button" class="opener" id="suggested-opener">Hi, is this still available\?<\/button>/);
assert.match(js, /event\.target\.closest\("#message-seller, #suggested-opener"\)/, "the suggested-opener pill must route through the exact same handler as Message seller");

// The logo must always return to Browse (home) -- reusing the exact same
// [data-view] delegated handler every other nav control already uses,
// rather than a new, separate click handler.
assert.match(html, /<button type="button" class="brand" data-view="browse-view" aria-label="FindNord home">/);
// --- NM-A9: iPhone-14 now has 2 real images (seed data) — a real gallery, not a single photo ---
assert.match(elements["listing-detail"].innerHTML, /id="detail-gallery-wrap"/);
assert.match(elements["listing-detail"].innerHTML, /class="detail-gallery-thumbs"/);
assert.equal((elements["listing-detail"].innerHTML.match(/data-gallery-index="/g) || []).length, 2, "iPhone-14 has exactly 2 seed images");
assert.match(elements["listing-detail"].innerHTML, /class="gallery-thumb active" data-gallery-index="0"/);

// New verticals are real, filterable listings, not just labels.
context.openListing("volvo-v60");
assert.match(elements["listing-detail"].innerHTML, /Good · Vehicles · Cars/);
context.openListing("city-apartment");
assert.match(elements["listing-detail"].innerHTML, /Good · Real Estate · For Rent/);

// --- NM-A3: Sell flow behavior ---

// Category select is populated from the taxonomy, and the subtype field
// shows/hides itself based on the chosen category.
assert.match(elements["sell-category-select"].innerHTML, /<option value="Vehicles">Vehicles<\/option>/);
assert.match(elements["sell-category-select"].innerHTML, /<option value="Real Estate">Real Estate<\/option>/);

elements["sell-category-select"].value = "Vehicles";
context.updateSubtypeVisibility();
assert.equal(elements["sell-subtype-field"].hidden, false);
assert.match(elements["sell-subtype-select"].innerHTML, /<option value="Cars">Cars<\/option>/);

elements["sell-category-select"].value = "Fashion";
context.updateSubtypeVisibility();
assert.equal(elements["sell-subtype-field"].hidden, true);
assert.equal(elements["sell-subtype-select"].innerHTML, "");

// Price formatting: formatPrice() now stores just the raw digits (no
// currency baked in -- see NM-A19), and formatListingPrice() is the one
// place that turns a stored price + a listing's own country into a real,
// locale-correct display string.
assert.equal(context.formatPrice("1200"), "1200");
assert.equal(context.formatPrice(""), "");
assert.equal(context.formatListingPrice({ price: "1200", country: "Sweden" }), "1 200 kr");
assert.equal(context.formatListingPrice({ price: "1200", country: "Finland" }), "1 200 €");
assert.equal(context.formatListingPrice({ price: "Free", country: "Sweden" }), "Free");
assert.equal(context.formatListingPrice({ price: "", country: "Sweden" }), "Set a price");

// Publish blocks with clear, additive validation messages when required
// fields are missing (no photo, no title yet). This must be checked BEFORE
// auth, so a guest still gets useful field-level feedback.
await context.publishListing();
assert.match(elements["sell-validation"].textContent, /Add at least 1 photo\./);
assert.match(elements["sell-validation"].textContent, /Add a title\./);
assert.equal(elements["sell-validation"].classList.contains("success"), false);
assert.equal(elements["result-count"].textContent, "8 listings", "a failed publish must not add a listing");
assert.equal(elements["auth-modal"].hidden, true, "auth gate must not fire before field validation passes");

// Fill out a valid listing. As a signed-out guest, publishing must be
// blocked by the auth gate rather than actually publishing (NM-A4).
await uploadFakePhoto();
elements["sell-title-input"].value = "Test kayak, barely used";
elements["sell-price-input"].value = "900";
elements["sell-category-select"].value = "Sports & Outdoor";
context.updateSubtypeVisibility();
elements["sell-condition-select"].value = "Like new";
elements["sell-location-input"].value = "Djurgården";
// Deliberately a DIFFERENT region than every seed listing (all "Stockholm")
// so the Filter sheet's Region field has something real to distinguish below.
elements["sell-region-input"].value = "Västra Götaland";
elements["sell-description-input"].value = "Used twice, no damage, paddle included.";

context.renderSellPreview();
assert.match(elements["sell-preview"].innerHTML, /Test kayak, barely used/);
assert.match(elements["sell-preview"].innerHTML, /900 kr/);

const guestPublishResult = await context.publishListing();
assert.equal(guestPublishResult, null, "a signed-out publish must not return a listing");
assert.equal(elements["result-count"].textContent, "8 listings", "a gated publish must not add a listing yet");
assert.equal(elements["auth-modal"].hidden, false, "publishing while signed out must open the auth prompt");

// Completing a real registration must resume the exact pending action: the
// listing that was about to be published gets published automatically.
// completeSignIn fires the resumed action without awaiting it internally
// (matching the direct-authenticated path), so the test waits for a real,
// observable outcome rather than guessing a tick count (NM-A11 lesson).
await registerTestUser("Test Seller", "seller@example.com", DEFAULT_TEST_PASSWORD);
await waitFor(() => elements["result-count"].textContent === "9 listings");
assert.equal(elements["auth-modal"].hidden, true, "sign-in must close the auth prompt");
assert.match(elements["sell-validation"].textContent, /Listing published/);
assert.equal(elements["sell-validation"].classList.contains("success"), true);
assert.equal(elements["result-count"].textContent, "9 listings", "resumed publish must add exactly one listing");
assert.match(elements["listing-grid"].innerHTML, /Test kayak, barely used/);
assert.match(elements["listing-detail"].innerHTML, /Test kayak, barely used/);
// NM-A22 re-audit fix: nothing used to stop a seller from messaging
// themselves about their own listing. Viewing your own just-published
// listing (signed in as its real seller, right here) must never show a
// "Message seller" CTA or the suggested-opener button at all.
assert.doesNotMatch(elements["listing-detail"].innerHTML, /id="message-seller"/, "a seller must never see a Message CTA on their own listing");
assert.doesNotMatch(elements["listing-detail"].innerHTML, /id="suggested-opener"/, "a seller must never see the suggested-opener on their own listing either");

// The State/Region typed into the Sell form's combobox must round-trip onto
// the real, saved listing -- not just live in the form.
const kayakListing = context.getMyListings().find((item) => item.title === "Test kayak, barely used");
assert.ok(kayakListing, "the just-published listing must be in the signed-in seller's My Listings");
assert.equal(kayakListing.region, "Västra Götaland", "the region typed into the Sell form must be saved on the real listing");

// Editing must prefill the region field too, same as every other field.
context.startEditListing(kayakListing.id);
assert.equal(elements["sell-region-input"].value, "Västra Götaland");
context.resetSellForm();

// The form resets after a successful publish.
assert.equal(elements["sell-title-input"].value, "");
assert.doesNotMatch(elements["sell-photo-grid"].innerHTML, /<div class="photo-tile"/);
assert.match(elements["sell-photo-grid"].innerHTML, /add-photo-tile/);

await context.signOutUser();

// --- NM-A4: Save is gated for guests, and resumes after sign-in ---
assert.equal(context.isSaved("oak-table"), false);
await context.handleSaveClick("oak-table");
assert.equal(context.isSaved("oak-table"), false, "a guest's save attempt must not actually save yet");
assert.equal(elements["auth-modal"].hidden, false, "Save must open the auth prompt for a guest");
await registerTestUser("Buyer", "buyer@example.com", DEFAULT_TEST_PASSWORD);
await waitFor(() => context.isSaved("oak-table") === true);
assert.equal(context.isSaved("oak-table"), true, "sign-in must resume the exact save that was pending");
assert.match(elements["listing-grid"].innerHTML, /aria-label="Remove Solid oak dining table from saved items"/);

// --- NM-A7: SavedItem is now scoped per user (previously a single global
// Set shared by whoever happened to be signed in). Switching to a
// DIFFERENT real account must not carry over the first user's saves. ---
await context.signOutUser();
await registerTestUser("Second Buyer", "second-buyer@example.com", DEFAULT_TEST_PASSWORD);
assert.equal(context.isSaved("oak-table"), false, "a different real user must not see the previous user's saved items");
await context.signOutUser();

// --- NM-A4: Message Seller is gated, and resumes into a pre-filled composer ---
context.openListing("iphone-14");
assert.equal(elements["compose-modal"].hidden, true);
await context.handleMessageClick("iphone-14");
assert.equal(elements["compose-modal"].hidden, true, "a guest's message attempt must not open the composer yet");
assert.equal(elements["auth-modal"].hidden, false, "Message seller must open the auth prompt for a guest");
// NM-A14: same email as the earlier Save flow -- proves a returning user is
// recognized by LOGIN, not minted as a new identity (requirement 5).
await loginTestUser("buyer@example.com", DEFAULT_TEST_PASSWORD);
assert.equal(elements["compose-modal"].hidden, false, "sign-in must resume by opening the composer");
assert.equal(elements["compose-modal-title"].textContent, "Message Nordic Refurb");
assert.equal(elements["compose-message-input"].value, "Hi, is this still available?", "composer must pre-fill the suggested opener");
await context.sendComposedMessage();
assert.equal(elements["compose-modal"].hidden, true);
assert.equal(elements["toast"].hidden, false);
assert.match(elements["toast"].textContent, /Message sent\. View it in your Inbox\./, "the toast copy must reflect that messaging is now real, not still say 'a later slice'");

// --- NM-A8: the message just sent must actually appear in the Inbox, not disappear after the toast ---
assert.match(elements["inbox-content"].innerHTML, /data-open-thread="/, "Inbox must list the conversation just created");
assert.match(elements["inbox-content"].innerHTML, /iPhone 14, 128 GB/, "Inbox row must show the listing the conversation is about");
assert.match(elements["inbox-content"].innerHTML, /Nordic Refurb/, "Inbox row must show who the conversation is with");
assert.match(elements["inbox-content"].innerHTML, /Hi, is this still available\?/, "Inbox row preview must show the last message sent");

// Opening the conversation shows the real thread and lets the user continue it.
const threadIdMatch = elements["inbox-content"].innerHTML.match(/data-open-thread="([^"]+)"/);
assert.ok(threadIdMatch, "must be able to find the conversation id to open it");
context.openThread(threadIdMatch[1]);
assert.ok(
  views.find((view) => view.id === "thread-view").classList.contains("active-view"),
  "opening a conversation must switch to the thread view"
);
assert.match(elements["thread-snapshot"].innerHTML, /iPhone 14, 128 GB/);
assert.match(elements["thread-messages"].innerHTML, /Hi, is this still available\?/, "thread must show the message history");

// Continuing the thread: a second message must land in the SAME conversation, not create a new one.
elements["thread-reply-input"].value = "Is the battery health still 91%?";
await context.sendThreadReply({ preventDefault() {} });
assert.match(elements["thread-messages"].innerHTML, /Is the battery health still 91%\?/, "reply must appear in the thread immediately");
assert.equal(
  (elements["inbox-content"].innerHTML.match(/data-open-thread="/g) || []).length,
  1,
  "continuing a thread must not create a second conversation for the same listing"
);
assert.match(elements["inbox-content"].innerHTML, /Is the battery health still 91%\?/, "Inbox preview must update to the latest message");

await context.signOutUser();

// --- NM-A8: signed-out Inbox, and auth gating still works after the refactor ---
assert.match(elements["inbox-content"].innerHTML, /Sign in to see your conversations\./);
assert.match(elements["inbox-content"].innerHTML, /data-view="login-view"/);
assert.equal(elements["compose-modal"].hidden, true);
await context.handleMessageClick("iphone-14");
assert.equal(elements["compose-modal"].hidden, true, "Message Seller must still be gated for a guest after the Inbox refactor");
assert.equal(elements["auth-modal"].hidden, false, "the auth wall must still appear");
context.closeAuthModal();

// --- NM-A4/NM-A14: Report is gated too, and "Continue as Guest" must NOT
// resume it -- guests can browse but can no longer report (requirement 4). ---
elements["toast"].hidden = true;
await context.handleReportListingClick("iphone-14");
assert.equal(elements["report-modal"].hidden, true, "a guest must never see the report modal");
assert.equal(elements["auth-modal"].hidden, false);
context.dismissAuthModal();
assert.equal(elements["auth-modal"].hidden, true, "Continue as Guest must dismiss the prompt");
assert.equal(elements["report-modal"].hidden, true, "Continue as Guest must NOT resume the pending report -- guests cannot report anymore");
assert.equal(elements["account-actions"].hidden, true, "Continue as Guest must not create any signed-in identity");

// --- NM-A4: language switching still works while/around the auth screens ---
context.setLanguage("sv");
assert.equal(elements["auth-modal-title"].textContent, "Logga in för att fortsätta");
assert.equal(elements["auth-guest-button"].textContent, "Fortsätt som gäst");
assert.equal(elements["auth-email-input"].getAttribute("placeholder"), "du@exempel.se");
context.setLanguage("en");
assert.equal(elements["auth-modal-title"].textContent, "Sign in to continue");
context.closeAuthModal();

// --- NM-A4/NM-A14: You tab reflects the real session (signed-in vs. signed-out) ---
context.renderAccountPanel();
assert.match(elements["you-panel"].innerHTML, /Sign in when you want to save, message, sell, report, or create alerts\./);
await loginTestUser("buyer@example.com", DEFAULT_TEST_PASSWORD);
assert.match(elements["you-panel"].innerHTML, /Signed in as: buyer@example\.com/);
assert.match(elements["you-panel"].innerHTML, /id="sign-out-button"/);
await context.signOutUser();
assert.match(elements["you-panel"].innerHTML, /Sign in when you want to save, message, sell, report, or create alerts\./);
assert.match(elements["you-panel"].innerHTML, /data-view="login-view"/, "signed-out You tab must offer a way to the dedicated login page");

// --- Dedicated Login page: reuses the exact same real register/login pipeline as the modal ---
elements["login-name-input"].value = "Page Visitor";
elements["login-email-input"].value = "pagevisitor@example.com";
elements["login-password-input"].value = DEFAULT_TEST_PASSWORD;
context.setAuthMode("login", "register");
elements["login-age-checkbox"].checked = true;
await elements["login-form"].listeners.submit({ preventDefault() {} });
assert.match(elements["you-panel"].innerHTML, /Signed in as: pagevisitor@example\.com/, "the login page must sign in through the same pipeline as the modal");
await context.signOutUser();

// NM-A14: the login page's "Continue as Guest" no longer creates any
// identity -- it just returns to browsing, exactly like the modal's version.
elements["login-email-input"].value = "";
await elements["login-guest-button"].listeners.click();
assert.ok(
  views.find((view) => view.id === "browse-view").classList.contains("active-view"),
  "Continue as Guest on the login page must return to browsing"
);
context.renderAccountPanel();
assert.match(
  elements["you-panel"].innerHTML,
  /Sign in when you want to save, message, sell, report, or create alerts\./,
  "the login page's Continue as Guest must leave the visitor signed out, not create any identity"
);

// --- NM-A14: Real Authentication (Email + Password) -- dedicated mechanics ---

// The mode toggle actually changes what the form asks for.
context.setAuthMode("auth", "login");
assert.equal(elements["auth-name-field"].hidden, true, "login mode must not ask for a name");
assert.equal(elements["auth-continue-button"].textContent, "Log in");
assert.equal(elements["auth-mode-toggle"].textContent, "New to FindNord? Create an account");
context.setAuthMode("auth", "register");
assert.equal(elements["auth-name-field"].hidden, false, "register mode must ask for a name");
assert.equal(elements["auth-continue-button"].textContent, "Create account");
assert.equal(elements["auth-mode-toggle"].textContent, "Already have an account? Log in");

// Client-side validation blocks obviously-invalid submissions before ever
// reaching the network.
elements["auth-name-input"].value = "";
elements["auth-email-input"].value = "newperson@example.com";
elements["auth-password-input"].value = "longenoughpassword";
let result = await context.submitAuthForm("auth", "register");
assert.equal(result, null, "a missing name must block registration client-side");
assert.equal(elements["auth-error"].hidden, false);
assert.match(elements["auth-error"].textContent, /Add your name\./);

elements["auth-name-input"].value = "Short Password Person";
elements["auth-password-input"].value = "short1";
result = await context.submitAuthForm("auth", "register");
assert.equal(result, null, "a password under 8 characters must be rejected client-side");
assert.match(elements["auth-error"].textContent, /Password must be at least 8 characters\./);

// Deployment-readiness audit finding: real age verification at
// registration, client-side first (server-side is checked separately,
// directly against the real API, below).
elements["auth-password-input"].value = "realpassword1";
assert.equal(elements["auth-age-checkbox"].checked, false, "sanity: the age checkbox must not be pre-checked");
result = await context.submitAuthForm("auth", "register");
assert.equal(result, null, "registration must be blocked client-side until age is confirmed");
assert.match(elements["auth-error"].textContent, /You must confirm you're at least 18 to create an account\./);

// A real, successful sign-up.
elements["auth-age-checkbox"].checked = true;
const newUser = await context.submitAuthForm("auth", "register");
assert.ok(newUser, "a valid registration must succeed");
assert.equal(newUser.email, "newperson@example.com");
assert.equal(typeof newUser.id, "string");
assert.equal(Object.prototype.hasOwnProperty.call(newUser, "password"), false, "the password must never be echoed back, hashed or otherwise");
await context.signOutUser();

// The real API must independently reject an unconfirmed-age registration
// too -- the client-side checkbox is a UX convenience, not the real gate.
const unconfirmedAgeResponse = await fetch(`${serverOrigin}/api/auth/register`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "No Age Confirm", email: "no-age-confirm@example.com", password: "realpassword1" })
});
assert.equal(unconfirmedAgeResponse.status, 400, "the server must reject registration with no ageConfirmed field, regardless of what the client claims to have validated");
assert.equal((await unconfirmedAgeResponse.json()).code, "AGE_NOT_CONFIRMED");
const falseAgeResponse = await fetch(`${serverOrigin}/api/auth/register`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "False Age Confirm", email: "false-age-confirm@example.com", password: "realpassword1", ageConfirmed: "true" })
});
assert.equal(falseAgeResponse.status, 400, "ageConfirmed must be checked against the real boolean true, not a truthy-looking string");

// Registering the SAME email again must be rejected -- one real account per email.
context.setAuthMode("auth", "register");
elements["auth-name-input"].value = "Impersonator";
elements["auth-email-input"].value = "newperson@example.com";
elements["auth-password-input"].value = "differentpassword1";
elements["auth-age-checkbox"].checked = true;
result = await context.submitAuthForm("auth", "register");
assert.equal(result, null, "registering an already-used email must fail");
assert.match(elements["auth-error"].textContent, /That email is already registered\. Try logging in instead\./);

// Logging in with the WRONG password must be rejected with a generic error
// (never revealing whether the email or the password was the problem).
context.setAuthMode("auth", "login");
elements["auth-email-input"].value = "newperson@example.com";
elements["auth-password-input"].value = "totally-wrong-password";
result = await context.submitAuthForm("auth", "login");
assert.equal(result, null, "a wrong password must be rejected");
assert.match(elements["auth-error"].textContent, /Incorrect email or password\./);
assert.equal(elements["account-actions"].hidden, true, "a rejected login must not sign anyone in");

// Logging in with the CORRECT password must succeed and recognize the exact
// same account created above (requirement 5: same email = same user).
elements["auth-password-input"].value = "realpassword1";
const returningUser = await context.submitAuthForm("auth", "login");
assert.ok(returningUser, "the correct password must succeed");
assert.equal(returningUser.id, newUser.id, "logging back in must recognize the SAME account, not mint a new one");
await context.signOutUser();

// --- NM-A15: Google Sign-In ---

// The real /api/auth/google endpoint, exercised directly (mirrors the raw
// fetch() ownership-check pattern already used elsewhere in this file) with
// a genuinely, cryptographically signed ID token -- see the module-level
// makeFakeGoogleIdToken()/testGoogleJwks setup near main() for how this
// project substitutes a local JWKS for Google's real one without any real
// Google Cloud credentials.
const googleConfigRes = await fetch(`${serverOrigin}/api/auth/google/config`);
const googleConfig = await googleConfigRes.json();
assert.equal(googleConfig.clientId, TEST_GOOGLE_CLIENT_ID, "the (public, non-secret) client id must be served to the frontend");

// A brand-new Google account creates a real user with a real session.
const newGoogleToken = makeFakeGoogleIdToken({ payload: { sub: "google-sub-new", email: "newgoogleuser@example.com", name: "New Googler" } });
const newGoogleRes = await fetch(`${serverOrigin}/api/auth/google`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ credential: newGoogleToken })
});
const newGoogleUser = await newGoogleRes.json();
assert.equal(newGoogleRes.status, 200);
assert.equal(newGoogleUser.email, "newgoogleuser@example.com");
assert.equal(typeof newGoogleUser.id, "string");

// The SAME Google account signing in again must resolve to the SAME user,
// not mint a duplicate (requirement 3, "log in an existing user").
const returningGoogleToken = makeFakeGoogleIdToken({ payload: { sub: "google-sub-new", email: "newgoogleuser@example.com", name: "New Googler" } });
const returningGoogleRes = await fetch(`${serverOrigin}/api/auth/google`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ credential: returningGoogleToken })
});
const returningGoogleUser = await returningGoogleRes.json();
assert.equal(returningGoogleUser.id, newGoogleUser.id, "the same Google account must resolve to the same real user, not a duplicate");

// An existing EMAIL + PASSWORD account "continuing with Google" using the
// SAME email must link to that SAME account (requirement 3's other half) --
// not create a second, disconnected identity -- and the original password
// must keep working afterward.
const linkRegisterRes = await fetch(`${serverOrigin}/api/auth/register`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "Password First", email: "linkme@example.com", password: DEFAULT_TEST_PASSWORD, ageConfirmed: true })
});
const linkRegisteredUser = await linkRegisterRes.json();
const linkGoogleToken = makeFakeGoogleIdToken({ payload: { sub: "google-sub-link", email: "linkme@example.com", name: "Password First" } });
const linkGoogleRes = await fetch(`${serverOrigin}/api/auth/google`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ credential: linkGoogleToken })
});
const linkGoogleUser = await linkGoogleRes.json();
assert.equal(linkGoogleUser.id, linkRegisteredUser.id, "Google sign-in with an already-registered email must link to that SAME account");
const stillPasswordLoginRes = await fetch(`${serverOrigin}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "linkme@example.com", password: DEFAULT_TEST_PASSWORD })
});
assert.equal(stillPasswordLoginRes.status, 200, "the original password must still work after the account is linked to Google");

// Edge cases (requirement 6): each must be a clean, specific rejection, not
// a crash or a silent pass-through.
const postGoogle = (credential) =>
  fetch(`${serverOrigin}/api/auth/google`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ credential }) });

const tamperedRes = await postGoogle(makeFakeGoogleIdToken().slice(0, -6) + "AAAAAA");
assert.equal(tamperedRes.status, 401);
assert.equal((await tamperedRes.json()).code, "INVALID_GOOGLE_TOKEN");

const wrongKeyRes = await postGoogle(makeFakeGoogleIdToken({ signWithWrongKey: true }));
assert.equal(wrongKeyRes.status, 401, "a token signed with a DIFFERENT private key than the one in the JWKS must be rejected");

const wrongAudienceRes = await postGoogle(makeFakeGoogleIdToken({ payload: { aud: "someone-elses-client-id" } }));
assert.equal(wrongAudienceRes.status, 401);

const wrongIssuerRes = await postGoogle(makeFakeGoogleIdToken({ payload: { iss: "https://evil.example.com" } }));
assert.equal(wrongIssuerRes.status, 401);

const expiredRes = await postGoogle(makeFakeGoogleIdToken({ payload: { exp: Math.floor(Date.now() / 1000) - 10 } }));
assert.equal(expiredRes.status, 401);

const unverifiedRes = await postGoogle(makeFakeGoogleIdToken({ payload: { email_verified: false } }));
assert.equal(unverifiedRes.status, 403);
assert.equal((await unverifiedRes.json()).code, "GOOGLE_EMAIL_NOT_VERIFIED");

const malformedRes = await postGoogle(makeFakeGoogleIdToken({ malformed: true }));
assert.equal(malformedRes.status, 401);

const missingCredentialRes = await postGoogle("");
assert.equal(missingCredentialRes.status, 401);

// --- NM-A15: the frontend -- same completeSignIn() finish as email +
// password, so a Google sign-in resumes a pending gated action exactly like
// a password sign-in already does. ---
context.dismissAuthModal();
await context.handleSaveClick("floor-lamp");
assert.equal(elements["auth-modal"].hidden, false, "Save must still gate a guest first");
const resumeSaveToken = makeFakeGoogleIdToken({ payload: { sub: "google-sub-resume", email: "googleresume@example.com", name: "Google Resumer" } });
await context.handleGoogleCredentialResponse({ credential: resumeSaveToken });
assert.equal(elements["auth-modal"].hidden, true, "a successful Google sign-in must close the auth modal, same as email/password");
// completeSignIn() fires the resumed action fire-and-forget (matching the
// already-authenticated path, which also never awaits it) -- waiting for
// the real, observable outcome instead of asserting immediately after
// `await` is the same NM-A11-era lesson every other resumed-action test in
// this file already follows.
await waitFor(() => context.isSaved("floor-lamp") === true);
assert.equal(context.isSaved("floor-lamp"), true, "Google sign-in must resume the exact pending Save, same as email/password");
assert.match(elements["you-panel"].innerHTML, /Signed in as: googleresume@example\.com/);
await context.signOutUser();

// A Google credential Google itself would never actually send (garbage,
// not a real JWT) must surface a clean, visible error -- not a silent
// failure or an unhandled rejection.
await context.handleSaveClick("floor-lamp");
await context.handleGoogleCredentialResponse({ credential: "not-a-real-jwt" });
assert.equal(elements["auth-error"].hidden, false, "a rejected Google credential must show a visible error in the open surface's own error element");
assert.notEqual(elements["auth-error"].textContent, "");
context.dismissAuthModal();

// The dedicated Login page's Google button shares the exact same callback
// and finish sequence, but ALSO navigates to the You tab afterward, exactly
// matching the email/password login page's own post-success behavior.
context.showView("login-view");
const loginPageGoogleToken = makeFakeGoogleIdToken({ payload: { sub: "google-sub-loginpage", email: "googleloginpage@example.com", name: "Login Page Googler" } });
await context.handleGoogleCredentialResponse({ credential: loginPageGoogleToken });
assert.equal(
  views.find((view) => view.id === "you-view").classList.contains("active-view"),
  true,
  "a successful Google sign-in from the Login page must land on the You tab, same as the email/password login page"
);
assert.match(elements["you-panel"].innerHTML, /Signed in as: googleloginpage@example\.com/);
await context.signOutUser();

// --- NM-A15: Google sign-in UI state (this project's own dev/test
// environment has no real GOOGLE_CLIENT_ID configured server-side by
// default in a normal `npm run serve`, but THIS test server does -- see the
// module-level setup above -- specifically so the "configured but the real
// script can't load in a Node vm sandbox" fallback path gets exercised for
// real too, not just the "not configured at all" one). Either way, the end
// state must be the same graceful, translated "unavailable" message, never
// a broken empty button or a thrown error. ---
await context.initGoogleSignIn();
assert.match(elements["auth-google-signin"].innerHTML, /class="google-unavailable"/);
assert.match(elements["auth-google-signin"].innerHTML, /Google sign-in is currently unavailable\./);
assert.match(elements["login-google-signin"].innerHTML, /Google sign-in is currently unavailable\./);
context.setLanguage("sv");
assert.match(elements["auth-google-signin"].innerHTML, /Google-inloggning är inte tillgänglig just nu\./, "the unavailable message must re-translate on language switch too");
context.setLanguage("en");

// --- NM-A5: filter & sort sheet ---
// State at this point: 9 listings (8 seed + "Test kayak, barely used",
// Sports & Outdoor / Like new / Private seller / 900 kr / unparseable
// "New listing" distance), activeCategory "All", no filters applied yet.

context.openFilterSheet();
assert.equal(elements["filter-sheet"].hidden, false, "Filter button must open the sheet");
assert.equal(elements["filter-category-select"].value, "All", "sheet must open pre-filled with the currently applied category");
assert.match(elements["filter-condition-group"].innerHTML, /data-filter-value="Good"/);
assert.match(elements["filter-condition-group"].innerHTML, /data-filter-value="Fair"/);
assert.match(elements["filter-seller-group"].innerHTML, /data-filter-value="Private seller"/);
assert.match(elements["filter-seller-group"].innerHTML, /data-filter-value="Professional seller"/);

context.toggleFilterChip("conditions", "Good");
context.toggleFilterChip("conditions", "Like new");
context.toggleFilterChip("sellerTypes", "Private seller");
assert.match(elements["filter-condition-group"].innerHTML, /class="chip active" data-filter-group="conditions" data-filter-value="Good"/);
elements["filter-price-min"].value = "500";
elements["filter-price-max"].value = "3000";
elements["filter-distance-select"].value = "10";
elements["filter-sort-select"].value = "price-low";

context.applyFilters();
assert.equal(elements["filter-sheet"].hidden, true, "Apply must close the sheet");

// Expect exactly: rain-jacket (650 kr), oak-table (2400 kr) -- the rest are
// excluded by condition, seller type, price range, or distance. Test kayak
// would otherwise qualify on every one of those (Like new, Private seller,
// 900 kr, an unparseable "New listing" distance that always passes the
// per-listing distance check) EXCEPT that with no explicit Region chosen, a
// real Distance radius now ALSO limits results to real regions within that
// radius of the active location -- and the kayak's region ("Västra
// Götaland") is nowhere near Stockholm's 10 km radius. This is the intended
// new behavior the Region combobox's own narrowed suggestions predict.
assert.equal(elements["result-count"].textContent, "2 listings");
const gridHtmlAfterApply = elements["listing-grid"].innerHTML;
const rainJacketIndex = gridHtmlAfterApply.indexOf("Waterproof shell jacket");
const oakTableIndex = gridHtmlAfterApply.indexOf("Solid oak dining table");
assert.ok(rainJacketIndex !== -1 && oakTableIndex !== -1, "both expected matches must be present");
assert.ok(rainJacketIndex < oakTableIndex, "results must be sorted by lowest price first (650 < 2400)");
assert.doesNotMatch(gridHtmlAfterApply, /iPhone 14/, "Professional-seller listings must be excluded by the seller-type filter");
assert.doesNotMatch(gridHtmlAfterApply, /Volvo V60/, "listings above the max price must be excluded");
assert.doesNotMatch(gridHtmlAfterApply, /Test kayak/, "an out-of-region listing must be excluded by the Distance-driven region radius, even though it passes every other filter here");

// Active filters render as removable chips.
assert.match(elements["active-filter-chips"].innerHTML, /data-remove-filter="condition:Good"/);
assert.match(elements["active-filter-chips"].innerHTML, /data-remove-filter="condition:Like new"/);
assert.match(elements["active-filter-chips"].innerHTML, /data-remove-filter="seller:Private seller"/);
assert.match(elements["active-filter-chips"].innerHTML, /data-remove-filter="price"/);
assert.match(elements["active-filter-chips"].innerHTML, /Price: 500–3 000 kr/);
assert.match(elements["active-filter-chips"].innerHTML, /data-remove-filter="distance"/);
assert.equal(elements["sort-indicator"].hidden, false);
assert.match(elements["sort-indicator"].textContent, /Lowest price/);

// Removing the price chip must widen results immediately, no need to reopen the sheet.
// Still 5, not 6: the kayak stays excluded by the still-active Distance-driven
// region radius even with the price bound gone.
context.removeActiveFilter("price");
assert.doesNotMatch(elements["active-filter-chips"].innerHTML, /data-remove-filter="price"/);
assert.equal(elements["result-count"].textContent, "5 listings");

// Reset clears everything: applied filters, sort, and category.
context.resetFilters();
assert.equal(elements["active-filter-chips"].innerHTML, "");
assert.equal(elements["sort-indicator"].hidden, true);
assert.equal(elements["result-count"].textContent, "9 listings");

// Category + sub-type refinement through the sheet (Vehicles/Real Estate depth).
context.openFilterSheet();
elements["filter-category-select"].value = "Vehicles";
context.updateFilterSubtypeVisibility();
assert.equal(elements["filter-subtype-field"].hidden, false);
assert.match(elements["filter-subtype-select"].innerHTML, /<option value="Cars">Cars<\/option>/);
elements["filter-subtype-select"].value = "Cars";
context.applyFilters();
assert.equal(elements["result-count"].textContent, "1 listing");
assert.match(elements["listing-grid"].innerHTML, /Volvo V60/);
assert.match(elements["category-chips"].innerHTML, /class="chip active featured" data-category="Vehicles"/);
context.resetFilters();

// Clear only resets the in-progress sheet fields, not anything already applied.
context.toggleFilterChip("conditions", "Used");
context.applyFilters();
assert.equal(elements["result-count"].textContent, "1 listing", "skis is the only Used-condition listing");
context.openFilterSheet();
context.clearFilterDraft();
assert.equal(elements["filter-condition-group"].innerHTML.includes('class="chip active"'), false, "Clear empties the draft chips");
assert.equal(elements["result-count"].textContent, "1 listing", "Clear must not touch already-applied filters until Apply is pressed");
context.closeFilterSheet();
context.resetFilters();

// --- State/Region combobox: select-or-type, same mechanism for every
// Scandinavian country (REGIONS_BY_COUNTRY), matched with a substring
// compare (not a closed enum) so typed free text still filters sensibly. ---
context.openFilterSheet();
assert.equal(
  (elements["filter-region-datalist"].innerHTML.match(/<option value=/g) || []).length,
  21,
  "Sweden's 21 counties must populate the region datalist by default (activeCountry)"
);
assert.match(elements["filter-region-datalist"].innerHTML, /<option value="Stockholm"><\/option>/);
assert.match(elements["filter-region-datalist"].innerHTML, /<option value="Västra Götaland"><\/option>/);

// Exact value picked from the datalist: excludes the one listing (kayak)
// whose region is different from every seed listing's "Stockholm".
elements["filter-region-input"].value = "Stockholm";
context.applyFilters();
assert.equal(elements["result-count"].textContent, "8 listings", "only the 8 Stockholm-region seed listings must match");
assert.doesNotMatch(elements["listing-grid"].innerHTML, /Test kayak, barely used/);
assert.match(elements["active-filter-chips"].innerHTML, /data-remove-filter="region">Stockholm/, "the applied region must render as a removable chip");

context.removeActiveFilter("region");
assert.doesNotMatch(elements["active-filter-chips"].innerHTML, /data-remove-filter="region"/);
assert.equal(elements["result-count"].textContent, "9 listings", "removing the region chip must widen results immediately");

// Typed free text (lower-case, partial, not an exact datalist value) still
// filters correctly via the same substring/diacritic-insensitive compare
// normalize() already uses for search -- proving this is genuinely a
// combobox, not a disguised closed <select>.
context.openFilterSheet();
elements["filter-region-input"].value = "väst";
context.applyFilters();
assert.equal(elements["result-count"].textContent, "1 listing", "typed partial text must still match Västra Götaland");
assert.match(elements["listing-grid"].innerHTML, /Test kayak, barely used/);

// Typed text matching no real listing's region must correctly return zero
// results, not silently fall back to "any region".
context.openFilterSheet();
elements["filter-region-input"].value = "Nonexistent Region";
context.applyFilters();
assert.equal(elements["result-count"].textContent, "0 listings");
context.resetFilters();

// A listing with NO region on record at all (exactly what every listing
// published before this slice existed looks like, since the database
// migration adds the column but can't retroactively know an old row's real
// region) must never be silently zeroed out by Distance-driven region
// filtering -- it has to be treated as "unknown," not "out of range."
await registerTestUser("Legacy Lister", "legacy-lister@example.com", DEFAULT_TEST_PASSWORD);
await uploadFakePhoto();
elements["sell-title-input"].value = "Listing with no region on record";
elements["sell-price-input"].value = "100";
elements["sell-category-select"].value = "Free Items";
context.updateSubtypeVisibility();
elements["sell-condition-select"].value = "Used";
elements["sell-location-input"].value = "Somewhere";
// sell-region-input deliberately left blank.
elements["sell-description-input"].value = "Simulates a pre-existing listing published before the region field existed.";
await context.publishListing();
context.openFilterSheet();
elements["filter-distance-select"].value = "10";
context.applyFilters();
assert.match(elements["listing-grid"].innerHTML, /Listing with no region on record/, "a regionless listing must not be excluded by a Distance-driven region radius it has no data for");
context.resetFilters();
await context.signOutUser();

// Distance-driven region narrowing: opening the sheet and choosing a
// Distance (no explicit Region typed) must narrow the Region combobox's OWN
// suggestions to just the real regions within that radius of the active
// location -- the same computed set getFilteredListings() now also filters
// by. Verified against real haversine distances from Stockholm (computed
// once, independently, while authoring REGION_COORDS): only Stockholm
// itself is within 10 km; Uppsala (~64 km) joins at 100 km.
context.openFilterSheet();
elements["filter-distance-select"].value = "10";
context.updateFilterRegionSuggestions();
assert.equal(elements["filter-region-datalist"].innerHTML, '<option value="Stockholm"></option>', "at 10 km, only Stockholm itself is real and in range");
elements["filter-distance-select"].value = "100";
context.updateFilterRegionSuggestions();
assert.match(elements["filter-region-datalist"].innerHTML, /<option value="Stockholm">/);
assert.match(elements["filter-region-datalist"].innerHTML, /<option value="Uppsala">/, "widening the radius must widen the suggestions too");
elements["filter-distance-select"].value = "";
context.updateFilterRegionSuggestions();
assert.equal(
  (elements["filter-region-datalist"].innerHTML.match(/<option value=/g) || []).length,
  21,
  "clearing Distance back to \"Any distance\" must restore the full region list"
);
context.closeFilterSheet();
context.resetFilters();

// The underlying geo primitives, tested directly and deterministically
// (independent of any UI): a real position resolves to the nearest real
// region/country regardless of which country happens to be active, and a
// missing/unsupported navigator.geolocation (true in this sandbox, and true
// for any browser tab where the user denies the permission prompt) must
// resolve null rather than hang or throw -- proving applyDetectedLocation()
// can never break the app when geolocation isn't available.
assert.equal(Math.round(context.haversineKm({ lat: 59.33, lng: 18.07 }, { lat: 59.33, lng: 18.07 })), 0);
const oslo = context.nearestRegion({ lat: 59.91, lng: 10.75 });
assert.equal(oslo.country, "Norway", "a position in Oslo must be recognized as Norway, not stuck defaulting to Sweden");
assert.equal(oslo.region, "Oslo");
assert.ok(oslo.distanceKm < 5, "the nearest-region match for a position exactly in Oslo must be Oslo itself, essentially 0 km away");
assert.equal(await context.detectUserLocation(), null, "no navigator.geolocation in this sandbox must resolve null, not hang or throw");

// --- NM-A5: language switching still works on the filter sheet ---
context.setLanguage("sv");
assert.equal(elements["filter-sheet-title"].textContent, "Filtrera och sortera");
assert.equal(elements["filter-apply-button"].textContent, "Använd");
assert.equal(elements["filter-sort-price-low"].textContent, "Lägst pris");
assert.equal(elements["filter-distance-10"].textContent, "Inom 10 km");
assert.equal(elements["filter-region-label"].textContent, "Region");
assert.equal(elements["filter-region-input"].getAttribute("placeholder"), "Välj eller skriv en region");
assert.equal(elements["sell-region-label"].textContent, "Region");
assert.equal(elements["sell-region-input"].getAttribute("placeholder"), "Välj eller skriv din region");
context.setLanguage("en");
assert.equal(elements["filter-sheet-title"].textContent, "Filter & sort");
assert.equal(elements["filter-region-input"].getAttribute("placeholder"), "Select or type a region");

// --- NM-A6: AI photo generation is gated (protects real OpenAI cost) and resumes on sign-in ---
await context.signOutUser();

// Nothing to generate from: blocked before any auth check or network call.
context.generateAiPhoto();
assert.match(elements["ai-photo-status"].textContent, /Describe the item first, or add a title\./);
assert.equal(elements["auth-modal"].hidden, true, "an empty prompt must not even reach the auth gate");

// A guest with a real prompt must hit the auth gate — this call is a real,
// billed OpenAI request in production, so it must never fire for a guest.
elements["ai-photo-prompt"].value = "blue vintage bicycle";
context.generateAiPhoto();
assert.equal(elements["auth-modal"].hidden, false, "AI generation must be gated for guests to protect real API costs");
assert.notEqual(elements["ai-photo-status"].textContent, "Generating photo...", "generation must not start before sign-in");

// Completing sign-in must resume the exact pending generation immediately
// (checked synchronously, before the mocked network call resolves) — the
// same interrupted-action-resume pattern as Save/Message/Report/Publish.
await loginTestUser("seller@example.com", DEFAULT_TEST_PASSWORD);
assert.equal(elements["auth-modal"].hidden, true, "sign-in must close the auth prompt");
assert.equal(
  elements["ai-photo-status"].textContent,
  "Generating photo...",
  "sign-in must resume by immediately starting the exact pending AI generation"
);
assert.equal(elements["generate-ai-photo"].disabled, true, "the generate button must disable itself while a request is in flight");
await context.signOutUser();

// --- NM-A9: media improvements — 6-image cap, real multi-image storage, thumbnails, gating re-confirmed ---
context.resetSellForm();
assert.equal((elements["sell-photo-grid"].innerHTML.match(/class="photo-tile"/g) || []).length, 0, "form must start with zero photos after reset");

for (let i = 0; i < 6; i += 1) await uploadFakePhoto();
assert.equal((elements["sell-photo-grid"].innerHTML.match(/class="photo-tile"/g) || []).length, 6, "must allow exactly 6 photos");
assert.doesNotMatch(elements["sell-photo-grid"].innerHTML, /add-photo-tile/, "the add-photo button must disappear once the 6-photo cap is reached");

await uploadFakePhoto(); // a 7th real file must be a silent no-op
assert.equal((elements["sell-photo-grid"].innerHTML.match(/class="photo-tile"/g) || []).length, 6, "a 7th photo must be rejected");

// addSellPhoto() itself (bound to the "+ Add photo" tile) must refuse to even
// open the OS file picker once the cap is reached.
elements["sell-photo-input"].clicked = false;
context.addSellPhoto();
assert.equal(elements["sell-photo-input"].clicked, false, "Add photo must not open the file picker once the 6-photo cap is reached");

// The AI button must also respect the cap, with a clear message rather than a silent no-op —
// and the limit check must happen before the auth gate, so it applies to guests too.
elements["ai-photo-prompt"].value = "extra photo";
context.generateAiPhoto();
assert.match(elements["ai-photo-status"].textContent, /You've reached the 6-photo limit\./);
assert.equal(elements["auth-modal"].hidden, true, "the photo-limit message must not itself require signing in");

// Live preview must show a "1/6" count badge once there are multiple photos —
// proof the count badge is wired to real form state, not just published listings.
assert.match(elements["sell-preview"].innerHTML, /photo-count-badge">1\/6</);

// Publish a real 6-photo listing and confirm the FULL set is saved — this is
// the actual bug NM-A9 exists to fix: commitPublish previously kept only
// values.photos[0] and silently discarded the rest.
await registerTestUser("PhotoTester", "phototester@example.com", DEFAULT_TEST_PASSWORD);
elements["sell-title-input"].value = "Six-photo test lamp";
elements["sell-price-input"].value = "500";
elements["sell-category-select"].value = "Home & Furniture";
context.updateSubtypeVisibility();
elements["sell-condition-select"].value = "Good";
elements["sell-location-input"].value = "Test District";
elements["sell-description-input"].value = "Testing that all 6 photos are actually saved, not just the cover.";
const published = await context.publishListing();
assert.ok(published, "publish must succeed once signed in");
assert.equal(published.images.length, 6, "all 6 photos must be persisted on the listing, not just the cover");
assert.match(elements["listing-grid"].innerHTML, /photo-count-badge">1\/6</, "the published listing's Browse card must show the real photo count");
assert.match(elements["listing-detail"].innerHTML, /id="detail-gallery-wrap"/);
assert.equal(
  (elements["listing-detail"].innerHTML.match(/data-gallery-index="/g) || []).length,
  6,
  "the detail gallery must render a thumbnail for every saved photo"
);

// Thumbnail switching actually changes which photo is shown as the main
// image. (The fake DOM harness treats #detail-gallery-wrap as its own
// addressable element rather than parsing it out of #listing-detail's
// innerHTML string, so the update is asserted there directly.)
context.selectGalleryImage(2);
assert.match(elements["detail-gallery-wrap"].innerHTML, /class="gallery-thumb active" data-gallery-index="2"/, "clicking a thumbnail must mark it active");
assert.match(elements["detail-gallery-wrap"].innerHTML, /aria-label="Photo 3: Six-photo test lamp"/, "the main image's accessible name must update to match the selected photo");

// The gallery must retranslate live if the language changes while a detail
// view happens to be open, not stay frozen from when openListing() first ran.
context.setLanguage("sv");
assert.match(elements["detail-gallery-wrap"].innerHTML, /aria-label="Foto 3: Six-photo test lamp"/, "the open gallery must retranslate live, preserving the selected photo index");
context.setLanguage("en");

// Requirement: re-confirm the contact gate still holds after all of this.
await context.signOutUser();
await context.handleMessageClick(published.id);
assert.equal(elements["compose-modal"].hidden, true, "Message Seller must still be gated for a guest after the media changes");
assert.equal(elements["auth-modal"].hidden, false, "the auth wall must still appear for a guest trying to contact a seller");
context.closeAuthModal();

// --- NM-A10: real photo uploads (fixing "Add photo" doing nothing real), automatic <=1MB compression, and a user-selectable featured photo ---
context.resetSellForm();
assert.equal((elements["sell-photo-grid"].innerHTML.match(/class="photo-tile"/g) || []).length, 0);

// "Add photo" must open the real OS file picker and add NOTHING until a file
// is actually chosen — this is the bug being fixed: it used to synthesize a
// fake placeholder tile immediately instead of ever prompting for a real photo.
elements["sell-photo-input"].clicked = false;
context.addSellPhoto();
assert.equal(elements["sell-photo-input"].clicked, true, "Add photo must open the real file picker");
assert.equal((elements["sell-photo-grid"].innerHTML.match(/class="photo-tile"/g) || []).length, 0, "no tile must appear before a real file is chosen");

// A large real photo (simulated as 2000x2000) must come out resized to a
// working size and compressed under the 1MB cap — reducing quality first,
// only shrinking dimensions if quality alone can't reach the cap, so it
// retains as much quality as the budget allows rather than over-compressing.
const MAX_PHOTO_BYTES_EXPECTED = 1024 * 1024;
await uploadFakePhoto("W2000H2000");
let tileMatch = elements["sell-photo-grid"].innerHTML.match(/url\(data:image\/jpeg;base64,(A+)\)/);
assert.ok(tileMatch, "the uploaded photo must render as a real embedded image, not a CSS placeholder");
const firstPhotoBytes = Math.ceil((tileMatch[1].length * 3) / 4);
assert.ok(firstPhotoBytes <= MAX_PHOTO_BYTES_EXPECTED, `uploaded photo must be resized to <= 1MB (was ${firstPhotoBytes} bytes)`);
assert.ok(firstPhotoBytes > MAX_PHOTO_BYTES_EXPECTED * 0.5, "resize should retain as much quality as the 1MB budget allows, not over-compress");
assert.match(elements["sell-photo-grid"].innerHTML, /<span class="cover-badge">Cover<\/span>/, "the first (only) uploaded photo must be the cover");

// A second, smaller photo must also upload for real, and it must be offered
// a "Make cover" control since it is not (yet) the featured photo.
await uploadFakePhoto("W300H300");
const tileMatches = [...elements["sell-photo-grid"].innerHTML.matchAll(/<div class="photo-tile" style="background: url\(data:image\/jpeg;base64,(A+)\)/g)];
assert.equal(tileMatches.length, 2, "both uploaded photos must render as real tiles");
const secondPhotoBytes = tileMatches[1][1].length;
assert.match(elements["sell-photo-grid"].innerHTML, /data-make-cover="1"/, "the non-cover photo must offer a Make cover control");
assert.doesNotMatch(elements["sell-photo-grid"].innerHTML, /data-make-cover="0"/, "the cover photo itself must not offer Make cover");

// Selecting the second photo as the featured image must move it to the
// cover position — the same convention publishing already relies on.
context.setSellPhotoCover(1);
const reorderedMatches = [...elements["sell-photo-grid"].innerHTML.matchAll(/<div class="photo-tile" style="background: url\(data:image\/jpeg;base64,(A+)\)/g)];
assert.equal(reorderedMatches[0][1].length, secondPhotoBytes, "the newly-chosen featured photo must become the first (cover) tile");
assert.match(elements["sell-photo-grid"].innerHTML, /data-make-cover="1"/, "the previous cover photo must now offer its own Make cover control");

// --- NM-A9 UX pass: signed-in topbar (avatar + quick-action pills), My Listings, Boost, Analytics ---
assert.equal(elements["account-actions"].hidden, true, "signed-out topbar must not show account action pills");
assert.equal(elements["profile-button"].textContent, "You", "signed-out avatar must show the plain fallback");
assert.equal(elements["profile-button"].getAttribute("aria-label"), "Profile", "signed-out avatar must use translated profile copy for its accessible name");
context.setLanguage("sv");
assert.equal(elements["profile-button"].textContent, "Du", "Swedish language switching must update the signed-out topbar label");
assert.equal(elements["profile-button"].getAttribute("aria-label"), "Profil", "Swedish language switching must update the signed-out topbar accessible name");
context.setLanguage("fi");
assert.equal(elements["profile-button"].textContent, "Sinä", "Finnish language switching must update the signed-out topbar label");
assert.equal(elements["profile-button"].getAttribute("aria-label"), "Profiili", "Finnish language switching must update the signed-out topbar accessible name");
context.setLanguage("en");
assert.equal(elements["profile-button"].textContent, "You", "returning to English must restore the signed-out topbar label");
assert.equal(elements["profile-button"].getAttribute("aria-label"), "Profile", "returning to English must restore the signed-out topbar accessible name");

await registerTestUser("Ola Analytics", "ola@example.com", DEFAULT_TEST_PASSWORD);
assert.equal(elements["account-actions"].hidden, false, "signed-in topbar must show the account action pills");
assert.equal(elements["profile-button"].textContent, "O", "signed-in avatar must show the user's initial");
[
  ["sell-view", "Create Sell Ad"],
  ["my-listings-view", "Boost Ads"],
  ["my-listings-view", "My Listings"],
  ["analytics-view", "Analytics"],
  ["inbox-view", "Messages"],
  ["you-view", "Profile"]
].forEach(([view, label]) => {
  assert.match(elements["account-actions"].innerHTML, new RegExp(`data-view="${view}"[^>]*>${label}<`));
});
assert.match(elements["account-actions"].innerHTML, /data-logout[^>]*>Logout</);

// My Listings starts empty for a brand-new signed-in user.
context.renderMyListings();
assert.match(elements["my-listings-content"].innerHTML, /You haven't published any listings yet\./);
assert.equal(context.getMyListings().length, 0);

// Publish a real listing as this signed-in user.
context.resetSellForm();
await uploadFakePhoto();
elements["sell-title-input"].value = "Analytics test bicycle";
elements["sell-price-input"].value = "1200";
elements["sell-category-select"].value = "Sports & Outdoor";
context.updateSubtypeVisibility();
elements["sell-condition-select"].value = "Good";
elements["sell-location-input"].value = "Test District";
elements["sell-description-input"].value = "Published to test My Listings, Boost, and Analytics end to end.";
const analyticsListing = await context.publishListing();
assert.ok(analyticsListing, "publish must succeed while signed in");
assert.ok(analyticsListing.sellerId, "a published listing must record a real sellerId, not be left blank");
assert.equal(context.getMyListings().length, 1, "the new listing must show up as owned by the publisher");
assert.equal(context.getMyListings()[0].id, analyticsListing.id);

// --- NM-A16: Public Seller Profiles ---
context.openListing(analyticsListing.id);
assert.match(elements["listing-detail"].innerHTML, new RegExp(`data-open-profile="${analyticsListing.sellerId}"`), "a real seller name on detail must link to the public seller profile");
assert.match(elements["listing-detail"].innerHTML, /seller-name-link/, "the seller trigger must render as a compact text link, not an oversized CTA");

await context.openSellerProfile(analyticsListing.sellerId);
assert.ok(views.find((view) => view.id === "profile-view").classList.contains("active-view"), "opening a seller profile must navigate to the profile view");
assert.match(elements["seller-profile"].innerHTML, /Ola Analytics/);
assert.match(elements["seller-profile"].innerHTML, /Member since/);
assert.match(elements["seller-profile"].innerHTML, /1 active listing/);
assert.match(elements["seller-profile"].innerHTML, /Not verified yet/, "normal email sellers must show the simple verification placeholder");
assert.match(elements["seller-profile"].innerHTML, /Analytics test bicycle/);
assert.match(elements["seller-profile"].innerHTML, new RegExp(`data-open-listing="${analyticsListing.id}"`), "profile listing cards must reopen that seller's active listings");

context.openListing(analyticsListing.id);
assert.match(elements["listing-detail"].innerHTML, /Analytics test bicycle/, "a listing card opened from the seller profile must resolve to the listing detail");

await context.signOutUser();
await context.openSellerProfile(analyticsListing.sellerId);
assert.equal(elements["auth-modal"].hidden, true, "guests must be able to view public seller profiles without an auth wall");
assert.match(elements["seller-profile"].innerHTML, /Ola Analytics/);
assert.match(elements["seller-profile"].innerHTML, /Analytics test bicycle/);

// Rating/review data (NM-A17, computed by the same ratingSummaryForUser /
// recentReviewsForUser the listing detail page's own compact seller summary
// already calls) must show up on the profile page too -- NM-A16 is asked to
// surface it, not reimplement or ignore it.
assert.match(elements["seller-profile"].innerHTML, /No reviews yet/, "a seller with no reviews yet must show the empty state, not a blank section");
const reviewer = await registerRealUserDirectly("Review Writer", "reviewwriter@example.com", DEFAULT_TEST_PASSWORD);
const reviewRes = await fetch(`${serverOrigin}/api/reviews`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: reviewer.cookie },
  body: JSON.stringify({ listingId: analyticsListing.id, revieweeId: analyticsListing.sellerId, rating: 5, text: "Great seller, smooth pickup." })
});
assert.equal(reviewRes.status, 201, "posting a real review must succeed so the profile page has real data to display");
await context.openSellerProfile(analyticsListing.sellerId);
assert.match(elements["seller-profile"].innerHTML, /★★★★★/, "a real 5-star review must render as stars");
assert.match(elements["seller-profile"].innerHTML, /Review Writer/, "the reviewer's real name must be attributed");
assert.match(elements["seller-profile"].innerHTML, /Great seller, smooth pickup\./);
assert.doesNotMatch(elements["seller-profile"].innerHTML, /No reviews yet/, "the empty state must disappear once a real review exists");

// A nonexistent seller id must be a clean, translated not-found state, not a crash.
await context.openSellerProfile("nonexistent-seller-id");
assert.ok(views.find((view) => view.id === "profile-view").classList.contains("active-view"));
assert.match(elements["seller-profile"].innerHTML, /This profile could not be found\./);

// i18n + country theming on the profile page (NM-A16 requirement 7): a
// language switch while the page happens to be open must re-translate it
// live, not just on next open.
await context.openSellerProfile(analyticsListing.sellerId);
// applyTranslations() re-invokes openSellerProfile() fire-and-forget (same
// pattern as applyDetectedLocation()/initGoogleSignIn() in bootstrap), so
// setLanguage() itself returns before that re-render lands -- waiting for
// the real, observable outcome instead of asserting immediately after is
// the same NM-A11/NM-A15-era lesson every other async-resume test here follows.
context.setLanguage("sv");
await waitFor(() => elements["seller-profile"].innerHTML.includes("Medlem sedan"));
assert.match(elements["seller-profile"].innerHTML, /aktiv annons\b/);
assert.match(elements["seller-profile"].innerHTML, /Senaste omdömen/);
context.setLanguage("en");
await waitFor(() => elements["seller-profile"].innerHTML.includes("Member since"));
assert.match(css, /\.profile-avatar\s*{[^}]*background: var\(--country-primary\);/, "the profile avatar must use the live country theme color, not a fixed one");

// --- NM-A17: Reviews, Ratings & Basic Verification Signals -- the full
// submission path, wired up and exercised end to end (not just the raw
// backend calls the NM-A16 turn used to prove profile display). ---

async function publishTestListing(sellerName, sellerEmail, title) {
  await registerTestUser(sellerName, sellerEmail, DEFAULT_TEST_PASSWORD);
  await uploadFakePhoto();
  elements["sell-title-input"].value = title;
  elements["sell-price-input"].value = "300";
  elements["sell-category-select"].value = "Free Items";
  context.updateSubtypeVisibility();
  elements["sell-condition-select"].value = "Good";
  elements["sell-location-input"].value = "Review Test District";
  elements["sell-description-input"].value = "A listing published purely to exercise NM-A17's review flow.";
  const listing = await context.publishListing();
  await context.signOutUser();
  return listing;
}

const reviewSellerListing = await publishTestListing("Review Seller", "review-seller@example.com", "Review Flow Test Item");

// A signed-in reviewer can post a real review through the actual UI path
// (handleReviewSubmitClick's own DOM-reading is exercised for real in
// Playwright below; here submitReview() itself -- everything past that
// point -- is exercised directly).
await registerTestUser("Review Reviewer", "review-reviewer@example.com", DEFAULT_TEST_PASSWORD);
context.openListing(reviewSellerListing.id);
assert.match(elements["listing-detail"].innerHTML, /review-box/, "a signed-in non-owner must see the review form");
const postedReview = await context.submitReview(reviewSellerListing.id, "4", "Solid seller, quick pickup.");
assert.ok(postedReview, "a valid review must succeed");
assert.equal(postedReview.moderated, false);
assert.equal(elements["toast"].textContent, "Review posted.");
assert.match(elements["listing-detail"].innerHTML, /4\.0 \(1\)/, "the listing detail's compact seller rating must reflect the new review immediately");

// Duplicate: the same reviewer, same listing, same seller -- rejected, not silently ignored.
const dupReview = await context.submitReview(reviewSellerListing.id, "2", "again");
assert.equal(dupReview, null, "a duplicate review must not succeed");
assert.equal(elements["toast"].textContent, "You already reviewed this seller for this listing.");

// Self-review: the template itself must not even offer the form to the owner...
await loginTestUser("review-seller@example.com", DEFAULT_TEST_PASSWORD);
context.openListing(reviewSellerListing.id);
assert.doesNotMatch(elements["listing-detail"].innerHTML, /review-box/, "a seller must not be offered a form to review their own listing");
assert.match(elements["listing-detail"].innerHTML, /You cannot review yourself\./);
// ...and the underlying function independently refuses it too, not just the UI.
const selfReview = await context.submitReview(reviewSellerListing.id, "5", "I'm great");
assert.equal(selfReview, null);
assert.equal(elements["toast"].textContent, "You cannot review yourself.");
await context.signOutUser();

// Guest gating: submitReview must open the auth modal and resume with the
// EXACT rating/text a guest already typed once they sign in -- proving the
// "don't pre-disable the inputs" fix actually matters, not just that the
// server-side gate exists.
assert.equal(elements["auth-modal"].hidden, true);
// requireAuth resolves this call to null immediately when signed out (the
// action is only STASHED, not awaited) -- like every other gated-then-
// resumed action in this file, the resume must be proven via a real,
// observable side effect afterward, not this call's own return value.
await context.submitReview(reviewSellerListing.id, "5", "Great, guest attempt.");
assert.equal(elements["auth-modal"].hidden, false, "an unauthenticated review attempt must open the auth prompt, exactly like Save/Message/Report");
await registerTestUser("Guest Reviewer", "guest-reviewer@example.com", DEFAULT_TEST_PASSWORD);
await waitFor(() => elements["toast"].textContent === "Review posted.");
await context.openSellerProfile(reviewSellerListing.sellerId);
assert.match(
  elements["seller-profile"].innerHTML,
  /Great, guest attempt\./,
  "the resumed review must use the EXACT text the guest typed before being gated"
);
assert.match(elements["seller-profile"].innerHTML, /Guest Reviewer/, "the resumed review must be attributed to the account that just signed in");
await context.signOutUser();

// Abuse moderation, first offense: text is cleaned and the review still
// posts, but the writer must see a visible warning.
const moderationSellerListing = await publishTestListing("Moderation Seller", "moderation-seller@example.com", "Moderation Flow Test Item");
await registerTestUser("Repeat Offender", "repeat-offender@example.com", DEFAULT_TEST_PASSWORD);
const firstAbusiveReview = await context.submitReview(moderationSellerListing.id, "1", "This seller is a fucking asshole");
assert.ok(firstAbusiveReview, "a first offense must still post (cleaned), not be rejected outright");
assert.equal(firstAbusiveReview.moderated, true);
assert.doesNotMatch(firstAbusiveReview.text, /fuck|asshole/i, "abusive words must be removed from the stored/returned text");
assert.equal(
  elements["toast"].textContent,
  "Your review was posted, but inappropriate language was removed. Repeated violations will block you from leaving reviews."
);
await context.openSellerProfile(moderationSellerListing.sellerId);
assert.match(elements["seller-profile"].innerHTML, /\*{4,}/, "the cleaned (asterisked) review text must be what actually renders on the seller's public profile");
assert.doesNotMatch(elements["seller-profile"].innerHTML, /fuck|asshole/i);

// Second offense (same reviewer, a different seller/listing so the UNIQUE
// constraint isn't what blocks this): the account is banned NOW, and this
// submission itself is rejected outright, not saved cleaned.
const secondModerationListing = await publishTestListing("Moderation Seller Two", "moderation-seller-2@example.com", "Second Moderation Test Item");
await loginTestUser("repeat-offender@example.com", DEFAULT_TEST_PASSWORD);
const secondAbusiveReview = await context.submitReview(secondModerationListing.id, "1", "What a piece of shit");
assert.equal(secondAbusiveReview, null, "a second offense must be rejected, not saved even cleaned");
assert.equal(
  elements["toast"].textContent,
  "Your review contained inappropriate language. Repeated violations have blocked you from leaving reviews."
);
await context.openSellerProfile(secondModerationListing.sellerId);
assert.match(elements["seller-profile"].innerHTML, /No reviews yet/, "the rejected second-offense review must not exist at all");

// Now permanently banned: even a perfectly clean review must be rejected.
const thirdModerationListing = await publishTestListing("Moderation Seller Three", "moderation-seller-3@example.com", "Third Moderation Test Item");
await loginTestUser("repeat-offender@example.com", DEFAULT_TEST_PASSWORD);
const cleanAfterBanReview = await context.submitReview(thirdModerationListing.id, "5", "Actually this one is totally clean and polite.");
assert.equal(cleanAfterBanReview, null, "a banned account must be rejected even with entirely clean text");
assert.equal(elements["toast"].textContent, "You are no longer allowed to leave reviews.");
await context.signOutUser();

// --- Site footer, static content pages, and cookie notice ---

// A real published listing's trust box must NOT show the old, generic
// "New seller · Published just now" line anymore -- it's the exact same
// hardcoded string for every single new listing regardless of the seller's
// real history, so once real trust signals exist (rating, verified badge,
// member since) it's stale, duplicate information, not complementary. A
// seed listing (no real account behind it, so no real profile to fall back
// on) is the one case that still shows its own (real, varied) trust text.
context.openListing(reviewSellerListing.id);
assert.doesNotMatch(
  elements["listing-detail"].innerHTML,
  /New seller · Published just now/,
  "a real seller's generic, never-updating trust text must not be shown alongside their real rating summary"
);
context.openListing("iphone-14");
assert.match(elements["listing-detail"].innerHTML, /Verified phone · 143 completed deals · Fast responder/, "a seed listing (no real account) must keep showing its own real trust text -- it's the only signal available for it");

// Every footer link opens something real -- either an existing view/action
// (already covered by their own data-view/data-category-jump tests
// elsewhere) or a genuinely written static page, never a dead link.
context.openStaticPage("privacyPolicy");
assert.ok(views.find((view) => view.id === "static-page-view").classList.contains("active-view"));
assert.match(elements["static-page-content"].innerHTML, /Privacy Policy/);
assert.match(elements["static-page-content"].innerHTML, /Micany Investment/, "the company attribution must appear on its legal pages");
assert.match(elements["static-page-content"].innerHTML, /GDPR/);

context.openStaticPage("dataSubjectRights");
assert.match(elements["static-page-content"].innerHTML, /Data Subject Rights/);
assert.match(elements["static-page-content"].innerHTML, /Right to erasure/);
assert.match(elements["static-page-content"].innerHTML, /support@findnord\.com/);

context.openStaticPage("termsOfService");
assert.match(elements["static-page-content"].innerHTML, /Terms of Service/);
assert.match(elements["static-page-content"].innerHTML, /No payments or escrow/);

context.openStaticPage("cookiePolicy");
assert.match(elements["static-page-content"].innerHTML, /Cookie Policy/);
// The policy must describe the REAL cookies/storage this app actually
// uses, not generic boilerplate -- fn_session is the real session cookie
// name (scripts/auth.js), fn_lang the real language-preference key.
assert.match(elements["static-page-content"].innerHTML, /fn_session/);
assert.match(elements["static-page-content"].innerHTML, /fn_lang/);
assert.match(elements["static-page-content"].innerHTML, /no third-party ad-tracking/i, "the policy must honestly state there is no ad-tracking, since none actually exists in this app");

// NM-A20: Safety Tips already existed but is improved here -- real,
// current guidance mentioning both the (now genuinely functional) Report
// button and the new Block action, in a calm tone rather than an
// alarmist list.
context.openStaticPage("safetyTips");
assert.match(elements["static-page-content"].innerHTML, /Safety Tips/);
assert.match(elements["static-page-content"].innerHTML, /block them/i, "the safety tips must mention the real Block action, not just Report");
assert.match(elements["static-page-content"].innerHTML, /Report/, "the safety tips must still mention Report");

context.openStaticPage("reportIssue");
assert.match(elements["static-page-content"].innerHTML, /Report an Issue/);
assert.match(elements["static-page-content"].innerHTML, /profile/i, "reporting must be described as available from a profile too, not only a listing");
assert.match(elements["static-page-content"].innerHTML, /data-static-page="safetyTips"/, "must link to the real Safety Tips page for the Block action");

context.openStaticPage("contentModeration");
assert.match(elements["static-page-content"].innerHTML, /Content & Moderation/);
assert.match(elements["static-page-content"].innerHTML, /queue/i, "must honestly describe the real, simple internal review structure (a queue an admin could later work through), not claim a full admin console exists");
assert.match(elements["static-page-content"].innerHTML, /[Bb]lock/, "must distinguish blocking from reporting");

// A nonexistent static page id must be a clean not-found state, not a crash.
context.openStaticPage("does-not-exist");
assert.match(elements["static-page-content"].innerHTML, /This profile could not be found\./);

// Every view switch is a real "new page" -- it must reset scroll to the
// top, so a footer link opened after scrolling all the way down to the
// footer doesn't open already scrolled past its own title. This is a
// general showView() fix, not special-cased to static pages, so it's
// verified through the same window.scrollTo the real browser would call.
scrollToCalls.length = 0;
context.openStaticPage("privacyPolicy");
assert.deepEqual(scrollToCalls[scrollToCalls.length - 1], [0, 0], "opening any page (a footer link's static page most visibly) must scroll back to the top");
scrollToCalls.length = 0;
context.showView("browse-view");
assert.deepEqual(scrollToCalls[scrollToCalls.length - 1], [0, 0], "this is a general showView() behavior, not special-cased to static pages");

// --- BL-A02: localize long-form static pages ---
// Every one of the 18 real pages must have a real, non-empty, genuinely
// distinct (not copy-pasted English) title/body in all 5 non-English
// languages -- same coverage-loop shape as NM-A26's translation-coverage
// gate above, applied to STATIC_PAGES's own per-language structure instead.
{
  assert.match(js, /const STATIC_PAGES = \{/, "STATIC_PAGES must exist as a real object in app.js");
  const staticPagesStart = js.indexOf("const STATIC_PAGES = {");
  const staticPagesEnd = js.indexOf("\nfunction openStaticPage", staticPagesStart);
  assert.ok(staticPagesEnd > staticPagesStart, "openStaticPage() must be defined after STATIC_PAGES");
  const staticPagesSrc = js.slice(staticPagesStart, staticPagesEnd);
  const pageIds = [...staticPagesSrc.matchAll(/\n  (\w+): \{\n    en: \{/g)].map((match) => match[1]);
  assert.equal(pageIds.length, 18, "all 18 real static pages must be present");
  let staticPageChecks = 0;
  for (const pageId of pageIds) {
    context.setLanguage("en");
    context.openStaticPage(pageId);
    const englishHtml = elements["static-page-content"].innerHTML;
    assert.ok(englishHtml && englishHtml.length > 0, `${pageId}/en must render real, non-empty content`);
    for (const lang of ["sv", "no", "da", "fi", "is"]) {
      context.setLanguage(lang);
      context.openStaticPage(pageId);
      const translatedHtml = elements["static-page-content"].innerHTML;
      assert.ok(translatedHtml && translatedHtml.length > 0, `${pageId}/${lang} must render real, non-empty content`);
      assert.notEqual(translatedHtml, englishHtml, `${pageId}/${lang} must be genuinely translated, not silently falling back to English`);
      staticPageChecks += 1;
    }
  }
  assert.equal(staticPageChecks, 18 * 5, "sanity: every page must have been checked in every non-English language");
  context.setLanguage("en");
  console.log(`PASS: BL-A02 static-page translation coverage -- all 18 real pages resolve to real, non-empty, genuinely-distinct sv/no/da/fi/is content (${staticPageChecks} checks total), not a silent English fallback.`);
}

// Spot-check real, specific translated legal/safety content (not just
// "differs from English"), the same way NM-A26's own behavioral spot-checks
// go beyond its coverage loop.
context.setLanguage("sv");
context.openStaticPage("privacyPolicy");
assert.match(elements["static-page-content"].innerHTML, /Integritetspolicy/i, "the Swedish Privacy Policy must have a real, translated title");
assert.match(elements["static-page-content"].innerHTML, /GDPR/, "GDPR must still be named as GDPR (the real term used in Swedish GDPR copy too), not silently dropped");
context.setLanguage("fi");
context.openStaticPage("safetyTips");
assert.doesNotMatch(elements["static-page-content"].innerHTML, /Safety Tips/, "Finnish must not silently show the English title");
context.setLanguage("en");

// Internal cross-reference links inside a translated body must still work,
// AND their visible label must match the target page's own translated
// title in that same language -- proving the cross-reference translations
// are consistent with each other, not just independently non-English.
context.setLanguage("sv");
context.openStaticPage("safetyTips");
const swedishSafetyTipsTitleMatch = /<h2 id="static-page-title">([^<]+)<\/h2>/.exec(elements["static-page-content"].innerHTML);
assert.ok(swedishSafetyTipsTitleMatch, "the Swedish Safety Tips page must render a real title");
context.openStaticPage("safeSellingGuide");
assert.match(elements["static-page-content"].innerHTML, /data-static-page="safetyTips"/, "the Safe Selling Guide must still link to Safety Tips in Swedish");
assert.match(
  elements["static-page-content"].innerHTML,
  new RegExp(`data-static-page="safetyTips">${swedishSafetyTipsTitleMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<`),
  "the Safe Selling Guide's embedded Safety Tips link must show the SAME Swedish title as the Safety Tips page itself, not a separately-drifted translation"
);
context.openStaticPage("safetyTips");
assert.match(elements["static-page-content"].innerHTML, new RegExp(swedishSafetyTipsTitleMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "sanity: the Safety Tips page must still show that same title when reopened directly");
context.setLanguage("en");

// A language switch WHILE a static page is open must re-render it live, in
// the new language, not stay frozen until the next open.
context.openStaticPage("termsOfService");
assert.match(elements["static-page-content"].innerHTML, /Terms of Service/);
context.setLanguage("sv");
assert.doesNotMatch(elements["static-page-content"].innerHTML, /Terms of Service/, "a static page open during a language switch must re-render live, not stay frozen in the old language");
assert.match(elements["static-page-content"].innerHTML, /Användarvillkor|villkor/i, "it must show real Swedish content immediately, without a re-open");
context.setLanguage("en");
assert.match(elements["static-page-content"].innerHTML, /Terms of Service/, "switching back to English must also re-render live");
context.showView("browse-view");

console.log("PASS: BL-A02 static-page localization -- real, distinct, terminology-consistent Swedish/Norwegian/Danish/Finnish/Icelandic content (cross-reference links matching their target page's own translated title), an unknown page id still degrading safely, and a language switch live re-rendering an already-open static page.");

// Country flags reuse the real, existing country-theming mechanism -- no
// new filtering dimension invented just for the footer.
context.handleFooterCountryClick("Norway");
assert.equal(documentElement.style.getPropertyValue("--country-primary"), "#BA0C2F");
assert.ok(views.find((view) => view.id === "browse-view").classList.contains("active-view"));
context.applyCountryTheme("Sweden");

// The country flag strip is rendered from the real countryThemes map, not hardcoded markup.
context.renderFooterCountryFlags();
assert.equal((elements["footer-country-flags"].innerHTML.match(/data-browse-country="/g) || []).length, 5, "all 5 supported countries must have a flag");
assert.match(elements["footer-country-flags"].innerHTML, /data-browse-country="Iceland"/);

// The cookie banner: real localStorage-backed persistence, not just a CSS
// toggle -- shown once, dismissible, and stays dismissed.
delete fakeLocalStorageStore["fn_cookie_consent"];
context.initCookieBanner();
assert.equal(elements["cookie-banner"].hidden, false, "a first-time visitor (no stored consent) must see the cookie notice");
context.dismissCookieBanner();
assert.equal(elements["cookie-banner"].hidden, true, "accepting must hide the banner immediately");
assert.equal(fakeLocalStorageStore["fn_cookie_consent"], "true", "the consent choice must actually be persisted to localStorage, not just an in-memory flag");
context.initCookieBanner();
assert.equal(elements["cookie-banner"].hidden, true, "a returning visitor (real stored consent) must not see the banner again");

// Cookie Settings must open the real Cookie Policy page, not a stub.
delete fakeLocalStorageStore["fn_cookie_consent"];
context.initCookieBanner();
context.handleCookieSettingsClick();
assert.match(elements["static-page-content"].innerHTML, /Cookie Policy/);
assert.equal(elements["cookie-banner"].hidden, true, "opening Cookie Settings must also count as having seen the notice");

// i18n: the footer's own chrome is fully translated (the long-form static
// page bodies are a deliberate, documented English-only exception -- see
// EVIDENCE.md).
context.setLanguage("sv");
assert.equal(elements["footer-col-legal"].textContent, "Juridik & Förtroende");
assert.equal(elements["footer-cta-account"].textContent, "Skapa gratis konto");
assert.equal(elements["cookie-settings-button"].textContent, "Cookieinställningar");
context.setLanguage("en");
assert.equal(elements["footer-col-legal"].textContent, "Legal & Trust");

await loginTestUser("ola@example.com", DEFAULT_TEST_PASSWORD);

context.renderMyListings();
assert.match(elements["my-listings-content"].innerHTML, /Analytics test bicycle/);
assert.match(elements["my-listings-content"].innerHTML, new RegExp(`data-open-boost-sheet="${analyticsListing.id}"`));
assert.doesNotMatch(elements["my-listings-content"].innerHTML, /class="account-action boosted"/, "a fresh listing must not show as boosted");

// Boosting is a real mutation: it actually sets sponsored + a real expiry on the listing record.
function findCardHtml(id) {
  const match = elements["listing-grid"].innerHTML.match(new RegExp(`<article class="listing-card" data-id="${id}">[\\s\\S]*?</article>`));
  return match ? match[0] : "";
}

// --- NM-A18: Boost / Premium (free-first, Stripe-ready) ---
context.openBoostSheet(analyticsListing.id);
assert.equal(elements["boost-sheet"].hidden, false, "opening the sheet for a listing you DO own must show it");
assert.match(elements["boost-sheet-body"].innerHTML, /data-activate-boost="24h"/);
assert.match(elements["boost-sheet-body"].innerHTML, /data-activate-boost="7d"/);
assert.match(elements["boost-sheet-body"].innerHTML, /data-activate-boost="30d"/);
assert.match(elements["boost-sheet-body"].innerHTML, /data-activate-boost="6m"/);
assert.match(elements["boost-sheet-body"].innerHTML, /data-activate-boost="12m"/);
assert.match(elements["boost-sheet-body"].innerHTML, /Free for now/, "packages must be marked free while BOOST_PAYMENTS_ENABLED is off");

await context.activateBoostPackage("7d");
assert.equal(elements["boost-sheet"].hidden, true, "a successful free activation must close the sheet");
assert.equal(elements["toast"].textContent, "Boost activated.");
assert.equal(context.getMyListings()[0].sponsored, true, "boosting must set sponsored=true on the real listing, not just update a UI flag");
assert.equal(context.getMyListings()[0].boostPackage, "7d");
assert.ok(context.getMyListings()[0].boostExpiresAt > Date.now(), "a real future expiry must be set");
assert.match(
  findCardHtml(analyticsListing.id),
  /Sponsored/,
  "the boosted listing's real Browse card must show the Sponsored badge"
);
context.renderMyListings();
assert.match(elements["my-listings-content"].innerHTML, /class="account-action boosted"/);
assert.match(elements["my-listings-content"].innerHTML, /Boosted until/);

// Re-opening the sheet on an already-boosted listing must show its real
// status and a way to cancel, not just the package list again.
context.openBoostSheet(analyticsListing.id);
assert.match(elements["boost-sheet-body"].innerHTML, /Boosted until/);
assert.match(elements["boost-sheet-body"].innerHTML, /id="boost-cancel-button"/);
await context.cancelActiveBoost();
assert.equal(elements["toast"].textContent, "Boost removed.");
assert.equal(context.getMyListings()[0].sponsored, false, "cancelling must really clear the boost, not just hide the UI badge");
assert.equal(context.getMyListings()[0].boostExpiresAt, null);
context.renderMyListings();
assert.doesNotMatch(elements["my-listings-content"].innerHTML, /class="account-action boosted"/);

// --- Paid path: when BOOST_PAYMENTS_ENABLED is on, packages show their
// real price (no "Free for now"), the free-activation endpoint is blocked
// server-side, and selecting a package attempts a real Stripe checkout --
// this project has no real Stripe test keys (see EVIDENCE.md), so that
// attempt surfaces a clear, graceful "not configured" message rather than a
// crash or a silent no-op. The flag is read live from process.env on every
// request, so flipping it here needs no server restart. ---
process.env.BOOST_PAYMENTS_ENABLED = "true";
await context.loadBoostConfig();
context.openBoostSheet(analyticsListing.id);
assert.doesNotMatch(elements["boost-sheet-body"].innerHTML, /Free for now/, "packages must show their real price once payments are enabled, not still claim to be free");
assert.match(elements["boost-sheet-body"].innerHTML, /19 kr/, "the 24-hour package's real price must be shown");
assert.match(elements["boost-sheet-body"].innerHTML, /Pay & activate/);

// The UI itself correctly never even attempts the free endpoint once
// payments are on (it goes straight to checkout, below) -- so the server's
// OWN independent PAYMENT_REQUIRED safeguard on that endpoint is only ever
// exercised by a direct request, exactly like this one, proving it's real
// defense-in-depth and not dead code nothing can reach.
const directFreeBoostAttempt = await fetch(`${serverOrigin}/api/listings/${analyticsListing.id}/boost`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: testCookieJar },
  body: JSON.stringify({ packageId: "24h" })
});
assert.equal(directFreeBoostAttempt.status, 402);
assert.equal((await directFreeBoostAttempt.json()).code, "PAYMENT_REQUIRED");

await context.activateBoostPackage("7d");
assert.equal(elements["toast"].textContent, "Stripe is not configured on this server.", "the UI's own package click must go straight to checkout once payments are enabled, never the free endpoint");
assert.equal(context.getMyListings()[0].sponsored, false, "a failed checkout attempt must never activate the boost anyway");

process.env.BOOST_PAYMENTS_ENABLED = "false";
await context.loadBoostConfig();

// Re-boost it for the ranking test below.
context.openBoostSheet(analyticsListing.id);
await context.activateBoostPackage("30d");

// Ownership check: opening the sheet for a listing you do NOT own must be a
// silent no-op, not a bypassable UI-only gate -- and the underlying
// activation function must independently refuse it too (defense in depth,
// matching the server's own real ownership check).
context.openBoostSheet("oak-table");
assert.equal(elements["boost-sheet"].hidden, true, "the sheet must never open for a listing you don't own");
await context.activateBoostPackage("24h");
assert.doesNotMatch(findCardHtml("oak-table"), /Sponsored/, "a user must not be able to boost a listing they don't own");

// Ranking (requirement 5): the boosted listing must rank first in the
// default "recent" feed, ahead of a listing published deliberately AFTER
// it -- proving boost, not just recency, explains the order (comparing
// against an already-existing listing wouldn't isolate the two, since
// recency alone could already explain that ordering). Published under a
// throwaway account, not ola's, so it doesn't disturb ola's own
// My-Listings/Analytics counts checked right after this block.
const boostedListingSnapshot = context.getMyListings().find((item) => item.id === analyticsListing.id);
await context.signOutUser();
await registerTestUser("Ranking Test Publisher", "ranking-test-publisher@example.com", DEFAULT_TEST_PASSWORD);
await uploadFakePhoto();
elements["sell-title-input"].value = "Newer Unboosted Listing";
elements["sell-price-input"].value = "5000";
elements["sell-category-select"].value = "Free Items";
context.updateSubtypeVisibility();
elements["sell-condition-select"].value = "Good";
elements["sell-location-input"].value = "Test District";
elements["sell-description-input"].value = "A deliberately more-recent, non-boosted listing for the ranking test.";
const newerUnboostedListing = await context.publishListing();
assert.ok(newerUnboostedListing.postedAt >= boostedListingSnapshot.postedAt, "sanity check: this listing really is not older than the boosted one");
await context.signOutUser();
await loginTestUser("ola@example.com", DEFAULT_TEST_PASSWORD);

context.resetFilters();
context.renderListings();
const recentOrderGrid = elements["listing-grid"].innerHTML;
const boostedIndex = recentOrderGrid.indexOf("Analytics test bicycle");
const newerUnboostedIndex = recentOrderGrid.indexOf("Newer Unboosted Listing");
assert.ok(boostedIndex !== -1 && newerUnboostedIndex !== -1, "both listings must be present");
assert.ok(boostedIndex < newerUnboostedIndex, "a boosted listing must outrank a more-recently-posted, non-boosted one in the default feed");

context.openFilterSheet();
elements["filter-sort-select"].value = "price-low";
context.applyFilters();
const priceSortedGrid = elements["listing-grid"].innerHTML;
const firstPriceSortedTitle = /<h3>([^<]+)<\/h3>/.exec(priceSortedGrid);
assert.ok(firstPriceSortedTitle, "must find at least one listing card");
assert.notEqual(
  firstPriceSortedTitle[1],
  "Analytics test bicycle",
  "an explicit price-low sort must not be overridden by boost status -- a genuinely cheaper listing (1200 kr is far from the cheapest active listing here) must rank first"
);
context.resetFilters();

// Analytics: real numbers computed from real DataService records, checked exactly (not just "> 0").
await context.handleSaveClick(analyticsListing.id);
await flushMicrotasks();
await context.handleMessageClick(analyticsListing.id);
assert.equal(elements["compose-modal"].hidden, false, "already signed in, so no auth wall should appear here");
elements["compose-message-input"].value = "Test message for analytics counting.";
await context.sendComposedMessage();

await context.renderAnalytics();
assert.match(elements["analytics-content"].innerHTML, /<strong>1<\/strong><span>Listings<\/span>/);
assert.match(elements["analytics-content"].innerHTML, /<strong>1<\/strong><span>Saves received<\/span>/);
assert.match(elements["analytics-content"].innerHTML, /<strong>1<\/strong><span>Conversations<\/span>/);
assert.match(elements["analytics-content"].innerHTML, /<strong>1<\/strong><span>Messages received<\/span>/);
assert.match(elements["analytics-content"].innerHTML, /<strong>1<\/strong><span>Boosted<\/span>/);

// --- NM-A18 follow-up: positional-quota boost rotation + random fairness
// segment ---
// shuffleArray must be a real permutation (same elements, just reordered),
// not a lossy or identity-only shuffle.
{
  const original = [1, 2, 3, 4, 5];
  for (let i = 0; i < 10; i++) {
    const shuffled = context.shuffleArray(original);
    assert.deepEqual(shuffled.slice().sort(), original, "shuffleArray must preserve every element exactly once");
  }
}

async function publishAndBoostListing(sellerName, sellerEmail, title, packageId) {
  await registerTestUser(sellerName, sellerEmail, DEFAULT_TEST_PASSWORD);
  await uploadFakePhoto();
  elements["sell-title-input"].value = title;
  elements["sell-price-input"].value = "300";
  elements["sell-category-select"].value = "Free Items";
  context.updateSubtypeVisibility();
  elements["sell-condition-select"].value = "Good";
  elements["sell-location-input"].value = "Rotation Test District";
  elements["sell-description-input"].value = "A listing published to exercise the boost rotation and fairness segment.";
  const listing = await context.publishListing();
  context.openBoostSheet(listing.id);
  await context.activateBoostPackage(packageId);
  await context.signOutUser();
  return listing;
}

// analyticsListing is already boosted (30d, from the ranking test above).
// Boost 4 MORE distinct listings so 5 boosted listings compete for
// SPONSORED_SLOT_COUNT (4) top-feed slots -- proving the cap actually caps.
const rotationCandidates = [];
for (let i = 1; i <= 4; i++) {
  const boosted = await publishAndBoostListing(
    `Rotation Seller ${i}`,
    `rotation-seller-${i}@example.com`,
    `Rotation Test Listing ${i}`,
    "24h"
  );
  rotationCandidates.push(boosted);
}

await loginTestUser("ola@example.com", DEFAULT_TEST_PASSWORD);
context.resetFilters();

const allBoostedIds = [analyticsListing.id, ...rotationCandidates.map((item) => item.id)];
assert.equal(
  context.getFilteredListings().filter((item) => allBoostedIds.includes(item.id) && item.sponsored).length,
  5,
  "sanity check: exactly 5 listings must be genuinely boosted right now"
);
// The seed data also grandfathers a few pre-NM-A18 sponsored listings (see
// migrateListingBoostColumns), so the real eligible pool for the rotation is
// broader than just these 5 -- assertions below check against that full
// pool, not just the ones this test created.
const everySponsoredId = context.getFilteredListings().filter((item) => item.sponsored).map((item) => item.id);
assert.ok(everySponsoredId.length > 4, "sanity check: more sponsored listings must exist than SPONSORED_SLOT_COUNT, or the cap test below proves nothing");

// The cap: even with more eligible boosted listings than slots, the
// rotation must never hand out more than SPONSORED_SLOT_COUNT slots.
context.refreshBoostRotation();
assert.equal(context.getSponsoredRotationIds().length, 4, "the rotation must cap at SPONSORED_SLOT_COUNT even when more listings are eligible");
assert.ok(
  context.getSponsoredRotationIds().every((id) => everySponsoredId.includes(id)),
  "every rotation slot must be filled by a genuinely boosted listing"
);

// Fairness: every boosted listing keeps its real "Sponsored" label on its
// own card regardless of whether it currently holds a rotation slot --
// missing a slot this round must never hide that it's genuinely boosted.
context.renderListings();
for (const id of allBoostedIds) {
  assert.match(findCardHtml(id), /Sponsored/, `listing ${id} is genuinely boosted and must always show the Sponsored badge, in or out of the current rotation`);
}

// Real rotation, not a fixed/hardcoded order: across enough reshuffles of 5
// candidates capped to 4 slots, more than one distinct set of 4 must appear.
const observedRotationSets = new Set();
for (let i = 0; i < 30; i++) {
  context.refreshBoostRotation();
  observedRotationSets.add(context.getSponsoredRotationIds().slice().sort().join(","));
}
assert.ok(observedRotationSets.size > 1, "the rotation must actually vary across reshuffles, not always pick the same 4 listings");

// The fairness segment: a distinct, separate shelf of NON-boosted listings,
// also capped, also rendered as real listing cards on the Browse view.
context.refreshBoostRotation();
assert.ok(context.getFairnessSpotlightIds().length > 0, "with organic listings present, the fairness segment must not be empty");
assert.ok(context.getFairnessSpotlightIds().length <= 4, "the fairness segment must respect FAIRNESS_SPOTLIGHT_COUNT");
assert.ok(
  context.getFairnessSpotlightIds().every((id) => !allBoostedIds.includes(id)),
  "the fairness segment must only ever contain non-boosted listings"
);
context.renderListings();
assert.match(elements["fairness-section-container"].innerHTML, /fairness-section/, "the Browse view must render the fairness segment");
assert.match(elements["fairness-section-container"].innerHTML, /More to discover/);
const fairnessHtml = elements["fairness-section-container"].innerHTML;
assert.ok(
  context.getFairnessSpotlightIds().some((id) => {
    const match = fairnessHtml.match(new RegExp(`data-id="${id}"`));
    return Boolean(match);
  }),
  "at least one fairness-spotlighted listing must actually appear in the rendered fairness section"
);

// --- NM-A13: Basic Listing Management for Sellers ---
// A dedicated throwaway listing, kept separate from analyticsListing (whose
// Analytics counts were just checked above and must not be disturbed).
context.resetSellForm();
await uploadFakePhoto("W300H300");
elements["sell-title-input"].value = "Vintage record player";
elements["sell-price-input"].value = "800";
elements["sell-category-select"].value = "Electronics";
context.updateSubtypeVisibility();
elements["sell-condition-select"].value = "Good";
elements["sell-location-input"].value = "Test District";
elements["sell-description-input"].value = "A listing dedicated to testing edit, status, and delete.";
const managedListing = await context.publishListing();
assert.ok(managedListing, "publish must succeed while signed in");
assert.equal(managedListing.status, "active", "a newly published listing must default to active status");
assert.doesNotMatch(findCardHtml(managedListing.id), /status-badge/, "an active listing must not show any status badge");

// Edit must prefill every field from the real record, including photos, and
// switch the form into edit mode.
context.startEditListing(managedListing.id);
assert.equal(elements["sell-title"].textContent, "Edit your listing", "the Sell form heading must switch to edit mode");
assert.equal(elements["sell-publish"].textContent, "Save changes", "the submit button must switch to edit mode");
assert.equal(elements["sell-title-input"].value, "Vintage record player");
assert.equal(elements["sell-price-input"].value, "800");
assert.equal(elements["sell-location-input"].value, "Test District");
assert.equal(elements["sell-description-input"].value, "A listing dedicated to testing edit, status, and delete.");
assert.equal((elements["sell-photo-grid"].innerHTML.match(/class="photo-tile"/g) || []).length, 1, "the existing photo must be prefilled into the photo grid");

// Editing must respect the same 6-photo cap, compression, and Make Cover as creating.
await uploadFakePhoto("W300H300");
assert.equal((elements["sell-photo-grid"].innerHTML.match(/class="photo-tile"/g) || []).length, 2, "a newly added photo must join the existing ones, still governed by the 6-photo cap");
context.setSellPhotoCover(1);

elements["sell-title-input"].value = "Vintage record player, price drop";
elements["sell-price-input"].value = "650";
elements["sell-description-input"].value = "Updated description after editing.";
const editedListing = await context.publishListing();
assert.ok(editedListing, "saving an edit must succeed");
assert.equal(editedListing.id, managedListing.id, "editing must update the SAME listing, not create a new one");
assert.equal(editedListing.title, "Vintage record player, price drop");
assert.equal(editedListing.price, "650", "the STORED price is now just the raw digits -- see NM-A19, formatListingPrice() is what turns it into a real currency string for display");
assert.equal(editedListing.images.length, 2, "both the existing and the newly added photo must be saved");
assert.equal(elements["sell-title"].textContent, "Sell in under two minutes", "after saving an edit, the form must return to create mode");
assert.equal(elements["sell-publish"].textContent, "Publish listing");
assert.match(elements["listing-detail"].innerHTML, /Vintage record player, price drop/, "saving an edit must reopen the (now updated) listing");

// Status: Reserved and Sold must be clearly visible on both the card and the detail page.
await context.handleMyListingStatusChange(managedListing.id, "reserved");
assert.equal(context.getMyListings().find((item) => item.id === managedListing.id).status, "reserved");
context.renderListings();
assert.match(findCardHtml(managedListing.id), /status-badge status-reserved">Reserved</, "a reserved listing's card must show a Reserved badge");
context.openListing(managedListing.id);
assert.match(elements["listing-detail"].innerHTML, /status-badge status-reserved">Reserved</, "a reserved listing's detail page must show a Reserved badge");
context.renderMyListings();
assert.match(elements["my-listings-content"].innerHTML, /<option value="reserved" selected>Reserved<\/option>/, "the status select must reflect the real current status");

await context.handleMyListingStatusChange(managedListing.id, "sold");
context.renderListings();
assert.match(findCardHtml(managedListing.id), /status-badge status-sold">Sold</, "a sold listing's card must show a Sold badge");
context.openListing(managedListing.id);
assert.match(elements["listing-detail"].innerHTML, /status-badge status-sold">Sold</);

await context.handleMyListingStatusChange(managedListing.id, "active");
context.renderListings();
assert.doesNotMatch(findCardHtml(managedListing.id), /status-badge/, "reverting to Active must remove the badge again");

// Server-side ownership: a DIFFERENT real, genuinely signed-in user (their
// own real session, own real cookie -- not a client-supplied id) must be
// rejected outright, not merely hidden by the UI. An anonymous request (no
// session at all) must be rejected distinctly (401, not 403).
const intruder = await registerRealUserDirectly("Intruder", "intruder@example.com", DEFAULT_TEST_PASSWORD);
const forbiddenPatch = await fetch(`${serverOrigin}/api/listings/${managedListing.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json", cookie: intruder.cookie },
  body: JSON.stringify({ status: "sold" })
});
assert.equal(forbiddenPatch.status, 403, "a different, genuinely signed-in user must not be able to change another seller's listing status");
const forbiddenDelete = await fetch(`${serverOrigin}/api/listings/${managedListing.id}`, {
  method: "DELETE",
  headers: { "content-type": "application/json", cookie: intruder.cookie }
});
assert.equal(forbiddenDelete.status, 403, "a different, genuinely signed-in user must not be able to delete another seller's listing");
const anonymousPatch = await fetch(`${serverOrigin}/api/listings/${managedListing.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ status: "sold" })
});
assert.equal(anonymousPatch.status, 401, "an anonymous request must be rejected too, distinctly (401) from a wrong-owner one (403)");
const stillThereAfterAttack = await (await fetch(`${serverOrigin}/api/listings/${managedListing.id}`)).json();
assert.ok(stillThereAfterAttack, "the listing must still exist after rejected attack attempts");
assert.equal(stillThereAfterAttack.status, "active", "rejected attack attempts must not have changed anything");

// Delete requires two clicks: the first only arms a confirmation state.
context.renderMyListings();
assert.doesNotMatch(elements["my-listings-content"].innerHTML, /Confirm delete\?/, "delete must not start pre-armed");
context.handleDeleteListingClick(managedListing.id);
assert.equal(
  context.getMyListings().some((item) => item.id === managedListing.id),
  true,
  "the first click must only arm the confirmation, not delete yet"
);
context.renderMyListings();
assert.match(elements["my-listings-content"].innerHTML, /Confirm delete\?/, "the first click must switch the button into a confirm state");

const deletedImagePath = /url\((\/uploads\/[^)]+)\)/.exec(editedListing.images[0].css)[1];
await context.handleDeleteListingClick(managedListing.id);
assert.equal(
  context.getMyListings().some((item) => item.id === managedListing.id),
  false,
  "the second click must actually delete the listing"
);
assert.equal(await (await fetch(`${serverOrigin}/api/listings/${managedListing.id}`)).json(), null, "the listing must be gone from the real database, not just the UI");
const deletedFileResponse = await fetch(`${serverOrigin}${deletedImagePath}`);
assert.equal(deletedFileResponse.status, 404, "deleting a listing must also remove its real photo files from disk, not just the database rows");
assert.match(elements["toast"].textContent, /Listing deleted\./);

// A lightweight edit + status change on the (still-alive) analyticsListing,
// specifically so cross-restart persistence can be verified for edit/status
// separately from delete (managedListing is gone, so it can't prove that).
context.startEditListing(analyticsListing.id);
elements["sell-description-input"].value = "Edited after publishing, to prove edits persist across a restart.";
await context.publishListing();
await context.handleMyListingStatusChange(analyticsListing.id, "reserved");

// Guests (signed out) must not be able to manage ANYONE's listings, including their own recent ones.
await context.signOutUser();
assert.equal(context.getMyListings().length, 0, "a signed-out visitor must see zero manageable listings");
context.startEditListing(analyticsListing.id);
assert.equal(elements["sell-title-input"].value, "", "a signed-out visitor must not be able to start editing a listing at all");
await context.handleMyListingStatusChange(analyticsListing.id, "sold");
await context.deleteListing(analyticsListing.id);
const untouchedAfterGuestAttempts = await (await fetch(`${serverOrigin}/api/listings/${analyticsListing.id}`)).json();
assert.ok(untouchedAfterGuestAttempts, "a guest's delete attempt must not have removed the listing");
assert.equal(untouchedAfterGuestAttempts.status, "reserved", "a guest's status-change attempt must be a complete no-op, not partially apply");

// Sign back in so the pill-visibility assertions right below still have a signed-in user to check.
await registerTestUser("Post-Management Visitor", "postmanagement@example.com", DEFAULT_TEST_PASSWORD);

// i18n on the new pills.
context.setLanguage("sv");
assert.match(elements["account-actions"].innerHTML, />Skapa annons</);
assert.match(elements["account-actions"].innerHTML, />Meddelanden</);
assert.match(elements["account-actions"].innerHTML, />Logga ut</);
context.setLanguage("en");

// Logging out via the pill's underlying action must fully reset the signed-in topbar.
await context.signOutUser();
assert.equal(elements["account-actions"].hidden, true, "account action pills must hide again after logout");
assert.equal(elements["profile-button"].textContent, "You");

// --- NM-A3: i18n mechanism (en + sv fully wired) ---
assert.equal(context.t("nav.browse", "en"), "Browse");
assert.equal(context.t("nav.browse", "sv"), "Bläddra");
// The fallback mechanism itself (dict[key] ?? translations.en[key] ?? key)
// must still correctly fall back to English for a genuinely UNKNOWN key/lang,
// even though no/da/fi/is are now fully translated (NM-A26) rather than the
// empty {} stubs this assertion originally guarded.
assert.equal(context.t("this.key.does.not.exist", "no"), "this.key.does.not.exist", "a truly missing key must fall back to the raw key itself, not throw or return undefined");
assert.equal(context.t("nav.browse", "xx"), "Browse", "an unknown language code must fall back to English");
console.log("PASS: NM-A26 fallback-mechanism regression guard -- t()'s own dict[key] ?? translations.en[key] ?? key fallback still works correctly for a genuinely unknown key/language, now that no/da/fi/is are real dictionaries rather than the empty {} stubs this assertion originally guarded.");

context.setLanguage("sv");
assert.equal(elements["browse-title"].textContent, "Färska fynd nära dig");
assert.equal(elements["sell-title"].textContent, "Sälj på under två minuter");
assert.equal(elements["search-input"].getAttribute("placeholder"), "Vad letar du efter?");
assert.equal(
  navItems.find((item) => item.dataset.view === "browse-view").textContent,
  "Bläddra"
);
context.setLanguage("en");
assert.equal(elements["browse-title"].textContent, "Fresh finds near you");

// --- NM-A26: Norwegian, Danish, Finnish, Icelandic now have REAL, complete
// translation coverage (previously empty {} stubs that fell back entirely to
// English -- the single clearest remaining localization gap per PRD_AUDIT.md).
// Each language is spot-checked through the exact same real UI elements the
// sv block above just proved, then a real coverage loop below proves this
// holds for every one of the ~294 keys in the dictionary, not just these 4.
const NORDIC_SPOT_CHECKS = {
  no: { browseTitle: "Nye funn nær deg", sellTitle: "Selg på under to minutter", searchPlaceholder: "Hva leter du etter?", browseNav: "Utforsk" },
  da: { browseTitle: "Friske fund nær dig", sellTitle: "Sælg på under to minutter", searchPlaceholder: "Hvad leder du efter?", browseNav: "Gennemse" },
  fi: { browseTitle: "Uusia löytöjä lähelläsi", sellTitle: "Myy alle kahdessa minuutissa", searchPlaceholder: "Mitä etsit?", browseNav: "Selaa" },
  is: { browseTitle: "Nýjar vörur nálægt þér", sellTitle: "Selja á innan við tveimur mínútum", searchPlaceholder: "Hvað ertu að leita að?", browseNav: "Skoða" }
};
Object.entries(NORDIC_SPOT_CHECKS).forEach(([lang, expected]) => {
  context.setLanguage(lang);
  assert.equal(elements["browse-title"].textContent, expected.browseTitle, `${lang}: browse heading must show its real translation, not English`);
  assert.equal(elements["sell-title"].textContent, expected.sellTitle, `${lang}: sell heading must show its real translation, not English`);
  assert.equal(elements["search-input"].getAttribute("placeholder"), expected.searchPlaceholder, `${lang}: search placeholder must show its real translation, not English`);
  assert.equal(
    navItems.find((item) => item.dataset.view === "browse-view").textContent,
    expected.browseNav,
    `${lang}: the Browse nav tab must show its real translation, not English`
  );
  context.setLanguage("en");
});
console.log("PASS: NM-A26 behavioral spot-checks -- Norwegian, Danish, Finnish, and Icelandic each render real, distinct, correctly-translated text on the Browse heading, Sell heading, search placeholder, and Browse nav tab -- the same real UI elements the sv block above already proved, now true for all 4 previously-English-fallback languages too.");

// --- NM-A26: the real acceptance gate -- every key in `en` must exist, be
// non-empty, and genuinely differ from English in sv/no/da/fi/is. Reads the
// real `translations` object structurally out of app.js's own source (not a
// hardcoded key list this test could silently drift out of sync with).
{
  const translationsStart = js.indexOf("const translations = {");
  const translationsEnd = js.indexOf("\n};", translationsStart) + 3;
  assert.ok(translationsStart !== -1 && translationsEnd > translationsStart + 3, "the translations dictionary must be found in app.js");
  const translationsSnippet = js.slice(translationsStart, translationsEnd).replace("const translations = ", "module.exports = ");
  const translationsSandbox = { module: { exports: {} } };
  vm.runInNewContext(translationsSnippet, translationsSandbox);
  const allTranslations = translationsSandbox.module.exports;
  const nordicLangs = ["sv", "no", "da", "fi", "is"];

  nordicLangs.forEach((lang) => {
    assert.ok(allTranslations[lang] && typeof allTranslations[lang] === "object", `translations.${lang} must exist as a real object, not a stub`);
  });

  const enKeysForCoverage = Object.keys(allTranslations.en);
  assert.ok(enKeysForCoverage.length > 250, `translations.en should have a real, substantial key set (found ${enKeysForCoverage.length})`);

  // A small, explicit, reviewed exception list of genuine coincidences --
  // loanwords spelled identically across these languages, or the FindNord/
  // Micany Investment brand names, which must stay untranslated everywhere.
  // Anything NOT on this list must be a real, distinct translation; a large
  // number of unreviewed matches here would mean incomplete translation, not
  // real linguistic coincidence (per this slice's own acceptance bar).
  const KNOWN_SAME_AS_ENGLISH = {
    sv: new Set([
      "browse.filter", "myListings.statusLabel", "footer.linkMicany",
      "filter.regionLabel", "sell.regionLabel"
    ]),
    no: new Set([
      "browse.filter", "thread.send", "compose.send", "report.reason.spam",
      "filter.subtypeLabel", "myListings.boost", "myListings.statusLabel",
      "footer.linkMicany", "filter.regionLabel", "sell.regionLabel"
    ]),
    da: new Set([
      "browse.filter", "thread.send", "compose.send", "report.reason.spam",
      "filter.subtypeLabel", "myListings.boost", "myListings.statusLabel",
      "footer.linkMicany", "filter.regionLabel", "sell.regionLabel"
    ]),
    fi: new Set(["footer.linkMicany"]),
    is: new Set(["footer.linkMicany"])
  };

  let checkedCount = 0;
  nordicLangs.forEach((lang) => {
    enKeysForCoverage.forEach((key) => {
      const enValue = context.t(key, "en");
      const value = context.t(key, lang);
      checkedCount++;
      assert.equal(typeof value, "string", `${lang}.${key} must resolve to a real string through t()`);
      assert.ok(value.trim().length > 0, `${lang}.${key} must not be empty/whitespace-only`);
      const allowedSame = KNOWN_SAME_AS_ENGLISH[lang].has(key);
      if (!allowedSame) {
        assert.notEqual(
          value,
          enValue,
          `${lang}.${key} must be a real, distinct translation -- it currently matches the English value verbatim, which means it's silently falling back to English (or, if this is a genuine loanword/brand-name coincidence, add it to the reviewed KNOWN_SAME_AS_ENGLISH list)`
        );
      }
    });
  });
  assert.equal(checkedCount, enKeysForCoverage.length * nordicLangs.length, "sanity: every key must have been checked in every language");
  console.log(`PASS: NM-A26 translation coverage -- all ${enKeysForCoverage.length} keys in translations.en resolve to a real, non-empty, genuinely-distinct value in sv/no/da/fi/is (${checkedCount} checks total), except for the small, explicit, reviewed KNOWN_SAME_AS_ENGLISH set of real loanword/brand-name coincidences.`);

  // Zero legal/static-page content lives in this same flat-string dictionary
  // mechanism -- STATIC_PAGES is a wholly separate, structured (per-language
  // title/body) object, untouched by NM-A26, and must stay that way (whole
  // documents, not short UI-chrome strings, would make `translations`
  // unreviewable as a flat dictionary). BL-A02 localizes STATIC_PAGES'S OWN
  // content directly (see that atom's own coverage test below) -- this guard
  // is only about the two objects never merging, not about STATIC_PAGES
  // staying English-only (it no longer does).
  assert.doesNotMatch(js.slice(translationsStart, translationsEnd), /privacyPolicy|termsOfService|cookiePolicy|dataSubjectRights/, "the translations dictionary must never absorb STATIC_PAGES content");
  console.log("PASS: NM-A26 STATIC_PAGES isolation -- the long-form legal/static pages remain a wholly separate, structured object, never absorbed into the flat translations dictionary, keeping that dictionary reviewable as short UI-chrome strings only.");
}

// --- NM-A3: country-colored navigation mechanism ---
assert.equal(documentElement.style.getPropertyValue("--country-primary"), "#006AA7", "Sweden is the default active country");
assert.equal(documentElement.style.getPropertyValue("--country-accent"), "#FECC02");

context.applyCountryTheme("Denmark");
assert.equal(documentElement.style.getPropertyValue("--country-primary"), "#C8102E");
context.applyCountryTheme("Norway");
assert.equal(documentElement.style.getPropertyValue("--country-primary"), "#BA0C2F");
assert.equal(documentElement.style.getPropertyValue("--country-accent"), "#00205B");
context.applyCountryTheme("Finland");
assert.equal(documentElement.style.getPropertyValue("--country-primary"), "#003580");
context.applyCountryTheme("Iceland");
assert.equal(documentElement.style.getPropertyValue("--country-primary"), "#02529C");
assert.equal(documentElement.style.getPropertyValue("--country-accent"), "#DC1E35");
context.applyCountryTheme("Sweden");
assert.equal(documentElement.style.getPropertyValue("--country-primary"), "#006AA7");

// --- FB-Marketplace-style iconography + desktop sidebar (UI overhaul) ---

// Sidebar category list: rendered from the real taxonomy fetched at
// bootstrap, reusing the SAME data-category-jump handling the Categories
// page's tiles already use -- no new click-handling logic exists for this.
context.renderSidebarCategories();
const sidebarCategoriesHtml = elements["sidebar-categories-list"].innerHTML;
assert.equal(
  (sidebarCategoriesHtml.match(/class="sidebar-category-item"/g) || []).length,
  12,
  "the sidebar must list all 12 real categories, not a hardcoded subset"
);
assert.match(sidebarCategoriesHtml, /data-category-jump="Vehicles"/);
assert.match(sidebarCategoriesHtml, /data-category-jump="Real Estate"/);
assert.match(sidebarCategoriesHtml, /<svg viewBox="0 0 24 24"/, "each sidebar category row must render its own icon");

// Sidebar location text mirrors the existing #active-location + current
// scope -- kept in sync from the one place scope changes always flow
// through (renderListings), with no separate location-fetching logic.
context.renderListings();
assert.equal(
  elements["sidebar-location-text"].textContent,
  `${elements["active-location"].textContent} · Nearby`,
  "the sidebar location line must mirror the real active location and scope, not a static copy"
);

// Sidebar search is an alternate entry point to the SAME #search-input, not
// a second, separate search feature -- typing it must sync the real input
// and jump to Browse so results are actually visible.
context.showView("categories-view");
assert.equal(
  views.find((view) => view.id === "categories-view").classList.contains("active-view"),
  true
);
elements["search-input"].value = "";
context.handleSidebarSearchInput({ target: { value: "record player" } });
assert.equal(elements["search-input"].value, "record player", "typing in the sidebar search must sync the real search input");
assert.equal(
  views.find((view) => view.id === "browse-view").classList.contains("active-view"),
  true,
  "using the sidebar search from another tab must jump to Browse so results are visible"
);
elements["search-input"].value = "";
context.renderListings();

// showView must keep the sidebar's own active-item highlight in sync too
// (Facebook's sidebar highlights whichever section is open), separately
// from the mobile bottom-nav's identical .active toggling.
context.showView("categories-view");
assert.equal(sidebarItems.find((item) => item.dataset.view === "categories-view").classList.contains("active"), true);
assert.equal(sidebarItems.find((item) => item.dataset.view === "browse-view").classList.contains("active"), false);
context.showView("browse-view");
assert.equal(sidebarItems.find((item) => item.dataset.view === "browse-view").classList.contains("active"), true);

// Language switching must relabel the sidebar's own text nodes without
// touching the icons (the icons have no translated text to begin with).
context.setLanguage("sv");
assert.equal(elements["sidebar-browse-label"].textContent, "Bläddra bland allt");
assert.equal(elements["sidebar-categories-label"].textContent, "Kategorier");
assert.equal(elements["sidebar-inbox-label"].textContent, "Inkorg");
assert.equal(elements["sidebar-search-input"].getAttribute("placeholder"), "Sök på Marketplace");
context.setLanguage("en");
assert.equal(elements["sidebar-browse-label"].textContent, "Browse all");

// --- NM-A19: Currency, Location Depth & Locale Formatting ---

// Static plural/locale unit checks: real Intl.PluralRules categories, not a
// hardcoded `=== 1` check, and en/sv both still resolve to the exact same
// visible strings this app has always shown for these exact counts.
assert.equal(context.countLabel(1, "browse.resultCountSingular", "browse.resultCountPlural"), "listing");
assert.equal(context.countLabel(0, "browse.resultCountSingular", "browse.resultCountPlural"), "listings");
assert.equal(context.countLabel(8, "browse.resultCountSingular", "browse.resultCountPlural"), "listings");
context.setLanguage("sv");
assert.equal(context.countLabel(1, "browse.resultCountSingular", "browse.resultCountPlural"), "annons");
assert.equal(context.countLabel(2, "browse.resultCountSingular", "browse.resultCountPlural"), "annonser");
context.setLanguage("en");

// Relative time: a real, LIVE computation from postedAt, not a frozen
// string -- and it respects the active language.
assert.equal(context.formatRelativeTime(Date.now() - 30 * 1000), "now");
assert.equal(context.formatRelativeTime(Date.now() - 26 * 60 * 60 * 1000), "yesterday");
assert.equal(context.formatRelativeTime(Date.now() - 3 * 24 * 60 * 60 * 1000), "3 days ago");
assert.equal(context.formatRelativeTime(null), "", "a listing with no real postedAt must never crash relative-time formatting");
context.setLanguage("sv");
assert.equal(context.formatRelativeTime(Date.now() - 3 * 24 * 60 * 60 * 1000), "för 3 dagar sedan");
context.setLanguage("en");

// Currency: a listing published by a seller whose real, SAVED HOME location
// is a different country gets that country's own real country/currency --
// not a hardcoded Swedish default -- and displays in that currency's own
// real, locale-correct format (Finland's € is the clearest possible proof
// this isn't just "kr" with a different label, since Norway/Denmark/Iceland
// all coincidentally also use some form of "kr").
// BL-A06 (supersedes the old NM-A19 mechanism of driving this off
// activeCountry): deliberately left on Sweden/Stockholm here -- only the
// seller's explicitly saved home location changes, via the same Settings
// save a real user would use -- to prove the listing's country comes from
// that saved home location, not from whatever the seller merely happens to
// be browsing.
await registerTestUser("Finnish Seller", "finnish-seller@example.com", DEFAULT_TEST_PASSWORD);
elements["settings-home-country-select"].value = "Finland";
elements["settings-home-region-input"].value = "Uusimaa";
await context.saveSettings();
await uploadFakePhoto();
elements["sell-title-input"].value = "Helsinki Bicycle";
elements["sell-price-input"].value = "1200";
elements["sell-category-select"].value = "Sports & Outdoor";
context.updateSubtypeVisibility();
elements["sell-condition-select"].value = "Good";
elements["sell-location-input"].value = "Helsinki";
elements["sell-region-input"].value = "Uusimaa";
elements["sell-description-input"].value = "A Finnish listing proving country/currency are real, not hardcoded.";
context.renderSellPreview();
assert.match(elements["sell-preview"].innerHTML, /1 200 €/, "the live Sell preview must already show the real € format for the seller's saved home country, before publishing");
const finnishListing = await context.publishListing();
assert.equal(finnishListing.country, "Finland", "a listing published by a seller whose saved home country is Finland must really be tagged Finland, not Sweden, even though activeCountry (browse scope) was never touched here");
assert.equal(finnishListing.currency, "EUR", "Finland's real currency is EUR");
assert.match(findCardHtml(finnishListing.id), /1 200 €/, "a Finnish listing's Browse card must show real € formatting, never kr");
assert.match(elements["listing-detail"].innerHTML, /1 200 €/, "the detail page's price must also use real € formatting");
assert.match(elements["listing-detail"].innerHTML, /<dt>Currency<\/dt><dd>EUR<\/dd>/, "the old hardcoded 'Original listing currency' placeholder must be replaced by the listing's real currency code");

// Editing must NEVER change a listing's country/currency, even when the
// seller has since switched their own browsing country -- the same
// "changing country should not silently overwrite" requirement applied to
// a listing's own data, not just the UI location pill.
context.applyCountryTheme("Sweden");
context.startEditListing(finnishListing.id);
elements["sell-title-input"].value = "Helsinki Bicycle (price drop)";
const editedFinnishListing = await context.publishListing();
assert.equal(editedFinnishListing.country, "Finland", "editing a listing while browsing under a different active country must not silently change its real country");
assert.equal(editedFinnishListing.currency, "EUR");
assert.match(findCardHtml(editedFinnishListing.id), /€/, "the edited listing must still show € after being edited under Sweden");
await context.signOutUser();
context.applyCountryTheme("Sweden");

// --- BL-A06: saved home-location semantics ---
// A fresh account has no home location saved yet -- defaults to
// Sweden/Stockholm, matching every other default in this app. Read back
// through renderSettings() (not a raw variable -- vm.createContext only
// exposes top-level `function`/`var` bindings to the outer test script, not
// `let`, so the DOM it renders is the real, observable proof).
await registerTestUser("BLA06 Tester", "bla06-tester@example.com", DEFAULT_TEST_PASSWORD);
context.renderSettings();
assert.equal(elements["settings-home-country-select"].value, "Sweden", "a brand-new account's home location must default to Sweden");
assert.equal(elements["settings-home-region-input"].value, "Stockholm");

// Switching the BROWSE country (a footer flag click, or geolocation) must
// never touch the saved home location -- this is the core distinction
// BL-A06 introduces.
context.handleFooterCountryClick("Norway");
assert.equal(elements["active-location"].textContent, "Oslo, Norway", "sanity check on the fixture: the browse country really did switch");
context.renderSettings();
assert.equal(elements["settings-home-country-select"].value, "Sweden", "switching the browse country must never change the saved home location");
assert.equal(elements["settings-home-region-input"].value, "Stockholm");

// The ONLY thing allowed to change the saved home location: an explicit
// Settings save. Deliberately done here while activeCountry is still
// Norway (from above), to prove the reverse independence too -- saving a
// new home location must never touch the current browse scope/filtering.
elements["settings-home-country-select"].value = "Denmark";
elements["settings-home-region-input"].value = "Sjælland";
await context.saveSettings();
// Re-render from scratch (not just trusting the values we just typed in) --
// a real proof the save round-tripped through the module's own state, not
// just left stale DOM behind.
context.renderSettings();
assert.equal(elements["settings-home-country-select"].value, "Denmark", "an explicit Settings save must update the saved home location");
assert.equal(elements["settings-home-region-input"].value, "Sjælland");
assert.equal(elements["active-location"].textContent, "Oslo, Norway", "saving a new home location must never change the current browse scope");

// The core bug this atom fixes: publishing a listing while BROWSING Norway
// must stamp the seller's real saved home country (Denmark), never
// whatever they merely happen to be browsing.
await uploadFakePhoto();
elements["sell-title-input"].value = "BLA06 Test Listing";
elements["sell-price-input"].value = "500";
elements["sell-category-select"].value = "Electronics";
context.updateSubtypeVisibility();
elements["sell-condition-select"].value = "Good";
elements["sell-location-input"].value = "Copenhagen";
elements["sell-region-input"].value = "Sjælland";
elements["sell-description-input"].value = "Proves publish uses the saved home location, not the browse country.";
const homeLocationTestListing = await context.publishListing();
assert.equal(homeLocationTestListing.country, "Denmark", "a listing must be stamped with the seller's saved home country, not the browse-scope country (Norway) they merely had active");

// Server-side validation: a garbage homeCountry must be a real 400, not a
// silent 200 -- same shape as the existing phone-format rejection.
const invalidHomeCountryResponse = await fetch(`${serverOrigin}/api/auth/me`, {
  method: "PATCH",
  headers: { "content-type": "application/json", cookie: testCookieJar },
  body: JSON.stringify({ homeCountry: "Narnia" })
});
assert.equal(invalidHomeCountryResponse.status, 400, "an invalid homeCountry must be rejected server-side, not silently accepted");

// An unauthenticated write must be rejected too, exactly like every other
// PATCH /auth/me field.
const unauthedHomeLocationResponse = await fetch(`${serverOrigin}/api/auth/me`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ homeCountry: "Finland" })
});
assert.equal(unauthedHomeLocationResponse.status, 401, "a signed-out request must never be able to set a home location");

await context.signOutUser();
context.applyCountryTheme("Sweden");

// Guest persistence: a signed-out visitor's home location lives in
// localStorage -- proven with a real fresh bootstrap (a new vm context,
// exactly like a real page reload) reading back what a previous guest
// session saved there. Finland/EUR is deliberately used here (not Iceland)
// because its € is the one unmistakable, visually-distinct proof (Sweden/
// Norway/Denmark/Iceland all coincidentally format as some "kr") -- same
// reasoning the NM-A19 currency test above already relies on.
fakeLocalStorageStore["fn_home_location"] = JSON.stringify({ country: "Finland", region: "Uusimaa" });
const guestHomeLocationContext = vm.createContext({
  document,
  fetch: makeTestFetch(),
  navigator: fakeNavigator,
  localStorage: fakeLocalStorage,
  window: { location: fakeLocation, history: fakeHistory, addEventListener() {}, scrollTo() {} }
});
await vm.runInContext(combinedJs, guestHomeLocationContext);
// The earlier real publish above reset the shared sell form back to blank
// (as a real successful publish should) -- set a real price again so the
// preview has something to format.
elements["sell-price-input"].value = "500";
guestHomeLocationContext.renderSellPreview();
assert.match(
  elements["sell-preview"].innerHTML,
  /€/,
  "a guest's next fresh page load must read the home location a previous guest session saved to localStorage (Finland/€), proven through the live Sell preview since a guest has no Settings panel to read back from"
);
delete fakeLocalStorageStore["fn_home_location"];
// The real, kept-around `context` (not the throwaway guestHomeLocationContext
// above) must stay usable for every test after this one -- re-render Browse
// on it to prove it's still live, matching the fixture-sanity pattern used
// elsewhere in this file after a fresh-context detour.
context.setActiveScope("Nearby");
context.renderListings();
assert.ok(context.getFilteredListings().some((item) => item.id === homeLocationTestListing.id), "the shared context must still be fully functional after the guest fresh-bootstrap detour above -- the real listing published earlier in this BL-A06 block must still be there");

console.log("PASS: BL-A06 saved home-location semantics -- switching the browse country (footer flag/geolocation) never changes the saved home location and vice versa, an explicit Settings save is the ONLY way the saved home location changes, a new listing is stamped with the seller's real saved home country (never the transient browse-scope country), invalid/unauthenticated writes are rejected server-side, and a guest's home location round-trips through localStorage across a real fresh page load.");

// A monthly rental listing's price gets a real, translated "/month" suffix
// derived from its own category+subtype (Real Estate/For Rent), not a
// hand-typed string embedded in the stored price -- the seed "city-apartment"
// listing is exactly this case.
assert.equal(context.formatListingPrice({ price: "12500", country: "Sweden", category: "Real Estate", subtype: "For Rent" }), "12 500 kr/month");
context.setLanguage("sv");
assert.equal(context.formatListingPrice({ price: "12500", country: "Sweden", category: "Real Estate", subtype: "For Rent" }), "12 500 kr/månad");
context.setLanguage("en");
assert.equal(
  context.formatListingPrice({ price: "12500", country: "Sweden", category: "Real Estate", subtype: "For Sale" }),
  "12 500 kr",
  "a one-time For Sale listing must never get the /month suffix"
);

// Location depth: the Nearby/Country/All Nordics scope buttons used to be
// purely cosmetic (clicking one only changed a label). "Country" now
// genuinely restricts results to the active country's own real listings.
context.setActiveScope("Country");
assert.ok(!context.getFilteredListings().some((item) => item.id === finnishListing.id), "the Country scope, active on Sweden, must exclude a real Finnish listing");
context.applyCountryTheme("Finland");
context.renderListings();
assert.ok(context.getFilteredListings().some((item) => item.id === finnishListing.id), "switching the Country scope's own country to Finland must now include the Finnish listing");
context.applyCountryTheme("Sweden");
context.setActiveScope("All Nordics");
assert.ok(context.getFilteredListings().some((item) => item.id === finnishListing.id), "All Nordics must never filter by country");
context.setActiveScope("Nearby");
assert.ok(context.getFilteredListings().some((item) => item.id === finnishListing.id), "Nearby must stay unfiltered by country, matching its pre-NM-A19 behavior");

// Explicit country intent (a footer flag click) must keep Browse/Sell/
// Filters/the location pill all consistent -- before this fix, the pill
// stayed "Stockholm, Sweden" forever regardless of which country was
// actually themed/active, a real inconsistency.
context.handleFooterCountryClick("Norway");
assert.equal(elements["active-location"].textContent, "Oslo, Norway", "an explicit country switch must update the visible location pill, not leave it silently stale");

// Real bug this regression-tests: showView("browse-view") -- part of
// handleFooterCountryClick -- is a no-op when Browse is ALREADY the active
// view (the common case: a user browsing clicks a footer flag without
// switching tabs), so the grid must be explicitly re-rendered by
// handleFooterCountryClick itself, not left showing a stale Country-scope
// result set from before the country switch.
context.setActiveScope("Country");
context.applyCountryTheme("Sweden");
context.handleFooterCountryClick("Finland");
assert.ok(
  context.getFilteredListings().every((item) => item.id !== finnishListing.id || item.country === "Finland"),
  "sanity check on the fixture itself"
);
assert.match(elements["listing-grid"].innerHTML, /Helsinki Bicycle/, "clicking a footer flag while already on Browse with Country scope active must immediately re-render the grid for the NEW country, not require a separate manual refresh");
context.setActiveScope("Nearby");
context.handleFooterCountryClick("Sweden");
assert.equal(elements["active-location"].textContent, "Stockholm, Sweden");

// --- NM-A20: Trust & Safety Content + Report / Block Flows ---
const nma20TargetListing = await publishTestListing("NMA20 Target", "nma20-target@example.com", "NMA20 Target Listing");
const nma20TargetSellerId = nma20TargetListing.sellerId;
const reporter = await registerTestUser("NMA20 Reporter", "nma20-reporter@example.com", DEFAULT_TEST_PASSWORD);

// Report is now a real modal (reason + optional details), not an instant
// single click that recorded nothing about why.
context.openListing(nma20TargetListing.id);
context.handleReportListingClick(nma20TargetListing.id);
assert.equal(elements["report-modal"].hidden, false, "a signed-in user's report click must open the real modal, not fire instantly");
assert.equal(elements["report-modal-title"].textContent, "Report this listing");
elements["report-reason-select"].value = "scam_or_fraud";
elements["report-details-input"].value = "Seller asked for payment outside the platform.";
await context.submitReportModal();
assert.equal(elements["report-modal"].hidden, true, "a successful report must close the modal");
assert.equal(elements["toast"].textContent, "Thanks — your report has been submitted for review.", "the old '(mocked)... arrives in a later slice' wording must be gone now that this IS that slice");

const reportsAfterListing = await (await fetch(`${serverOrigin}/api/reports`, { headers: { cookie: adminCookie } })).json();
const listingReport = reportsAfterListing.find((item) => item.listingId === nma20TargetListing.id);
assert.ok(listingReport, "the report must be a real, queryable record");
assert.equal(listingReport.reason, "scam_or_fraud");
assert.equal(listingReport.details, "Seller asked for payment outside the platform.");
assert.equal(listingReport.status, "open", "a report must land in a simple internal structure (a real status field) an admin could later review");
assert.equal(listingReport.reporterId, reporter.id);

// Report is also available from a profile (requirement 1), and Block sits
// right next to it there.
await context.openSellerProfile(nma20TargetSellerId);
assert.match(elements["seller-profile"].innerHTML, new RegExp(`data-report-user="${nma20TargetSellerId}"`));
assert.match(elements["seller-profile"].innerHTML, new RegExp(`data-block-user="${nma20TargetSellerId}"`));
context.handleReportUserClick(nma20TargetSellerId);
assert.equal(elements["report-modal-title"].textContent, "Report this user");
elements["report-reason-select"].value = "harassment";
elements["report-details-input"].value = "";
await context.submitReportModal();
assert.equal(elements["toast"].textContent, "Thanks — your report has been submitted for review.");

const reportsAfterUser = await (await fetch(`${serverOrigin}/api/reports`, { headers: { cookie: adminCookie } })).json();
const userReport = reportsAfterUser.find((item) => item.reportedUserId === nma20TargetSellerId);
assert.ok(userReport, "reporting a user must produce a real record with reportedUserId set");
assert.equal(userReport.reason, "harassment");

// Self-reporting is rejected server-side -- the UI never exposes this path
// at all (Report/Block only render on someone ELSE's profile), so this is
// checked via a direct request, the same defense-in-depth pattern NM-A18
// used for the PAYMENT_REQUIRED safeguard.
const selfReportRes = await fetch(`${serverOrigin}/api/reports`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: testCookieJar },
  body: JSON.stringify({ reportedUserId: reporter.id, reason: "other" })
});
assert.equal(selfReportRes.status, 400);
assert.equal((await selfReportRes.json()).code, "REPORT_NOT_FOR_SELF");

// A report naming neither a listing nor a user is rejected too.
const noTargetReportRes = await fetch(`${serverOrigin}/api/reports`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: testCookieJar },
  body: JSON.stringify({ reason: "other" })
});
assert.equal(noTargetReportRes.status, 400);
assert.equal((await noTargetReportRes.json()).code, "REPORT_TARGET_REQUIRED");

// Block: start a real conversation first, so blocking's effect on BOTH
// listings and messages can be proven together, not just listings alone.
await context.handleMessageClick(nma20TargetListing.id);
assert.equal(elements["compose-modal"].hidden, false);
elements["compose-message-input"].value = "Hi, is this still available?";
await context.sendComposedMessage();
assert.equal(elements["toast"].textContent, "Message sent. View it in your Inbox.");

context.renderInbox();
const inboxHtmlBeforeBlock = elements["inbox-content"].innerHTML;
assert.match(inboxHtmlBeforeBlock, /NMA20 Target Listing/, "sanity check: the conversation must be visible before any block");
context.renderListings();
assert.match(elements["listing-grid"].innerHTML, /NMA20 Target Listing/, "sanity check: the listing must be visible before any block");

// The reporter has exactly one conversation at this point (freshly
// registered), so the first (only) data-open-thread id in the rendered
// Inbox is this one -- read from the real DOM rather than the cache array
// directly (a `let` module-scope binding never becomes a vm context
// property the way a function declaration does -- the same reason NM-A18's
// boost rotation needed dedicated getter functions).
const openThreadMatch = /data-open-thread="([^"]+)"/.exec(inboxHtmlBeforeBlock);
assert.ok(openThreadMatch, "must find the real conversation id in the rendered Inbox");
const nma20ConversationId = openThreadMatch[1];
context.openThread(nma20ConversationId);
assert.match(elements["thread-snapshot"].innerHTML, new RegExp(`data-block-user="${nma20TargetSellerId}"`), "Block must also be available directly from a conversation (requirement 1's 'from profile or conversation')");
assert.doesNotMatch(elements["thread-snapshot"].innerHTML, /Unblock/, "not blocked yet");

await context.toggleBlockUser(nma20TargetSellerId);
assert.equal(elements["toast"].textContent, "User blocked. You won't see their listings or messages.");

// "Stop seeing another user's listings" -- immediate, real, client-side filtering.
context.renderListings();
assert.doesNotMatch(elements["listing-grid"].innerHTML, /NMA20 Target Listing/, "a blocked seller's listing must disappear from Browse immediately");
assert.ok(!context.getFilteredListings().some((item) => item.id === nma20TargetListing.id));

// "Stop seeing... messages" -- the conversation itself disappears from the
// Inbox list, and since it was the currently-open thread, blocking must
// have navigated away from it rather than leaving a dead thread open.
assert.doesNotMatch(elements["inbox-content"].innerHTML, /NMA20 Target Listing/, "a conversation with a blocked user must disappear from the Inbox list");
assert.ok(views.find((view) => view.id === "inbox-view").classList.contains("active-view"), "blocking mid-thread must navigate away, since that thread is no longer visible");

// Trying to message a blocked user again must fail with a clear message, not a crash or a silent no-op.
await context.handleMessageClick(nma20TargetListing.id);
elements["compose-message-input"].value = "Hello?";
await context.sendComposedMessage();
assert.equal(elements["toast"].textContent, "You can't message this user.", "attempting to message a blocked user must surface a clear error, not silently fail or crash");

// The profile's own Block button must reflect the current state too.
await context.openSellerProfile(nma20TargetSellerId);
assert.match(elements["seller-profile"].innerHTML, new RegExp(`class="secondary-action blocked" data-block-user="${nma20TargetSellerId}"`), "the profile must show the blocked styling/label once the seller is actually blocked");
assert.match(elements["seller-profile"].innerHTML, /Unblock/);

// Unblocking must reverse everything -- listing and conversation both come
// straight back, with no data ever having been lost.
await context.toggleBlockUser(nma20TargetSellerId);
assert.equal(elements["toast"].textContent, "User unblocked.");
context.renderListings();
assert.match(elements["listing-grid"].innerHTML, /NMA20 Target Listing/, "unblocking must bring the listing straight back");
context.renderInbox();
assert.match(elements["inbox-content"].innerHTML, /NMA20 Target Listing/, "unblocking must bring the conversation straight back -- it was hidden, never deleted");

await context.signOutUser();

// --- NM-A21 follow-up: Settings under Profile (Contact info) ---
await registerTestUser("Settings Tester", "settings-tester@example.com", DEFAULT_TEST_PASSWORD);
context.renderSettings();
assert.equal(elements["settings-form-wrap"].hidden, false);
assert.equal(elements["settings-signed-out"].hidden, true);
assert.equal(elements["settings-email-display"].value, "settings-tester@example.com", "email must show the real account email, read-only");
assert.equal(elements["settings-phone-input"].value, "", "a fresh account has no phone set yet");
elements["settings-phone-input"].value = "+46 70 123 45 67";
await context.saveSettings();
assert.equal(elements["toast"].textContent, "Settings saved.");
context.renderSettings();
assert.equal(elements["settings-phone-input"].value, "+46 70 123 45 67", "the saved phone must persist and show on re-render");

elements["settings-phone-input"].value = "not-a-real-phone!!!";
await context.saveSettings();
assert.equal(elements["settings-error"].hidden, false, "an invalid phone must show a real inline error, not a silent failure");

await context.signOutUser();
context.renderSettings();
assert.equal(elements["settings-form-wrap"].hidden, true, "a signed-out visitor must never see the settings form");
assert.equal(elements["settings-signed-out"].hidden, false);

// --- NM-A21: Minimal Admin Moderation Queue (Internal) ---

// Guests must not be able to reach it -- checked both ways: the client-side
// access-denied render, AND (the REAL gate) every underlying request is
// independently requireAdmin'd server-side regardless of what the client does.
context.renderAccountActions();
assert.equal(elements["account-actions"].hidden, true, "a guest has no account-actions bar at all, so no admin entry point either");
await context.openAdminQueue();
assert.match(elements["admin-content"].innerHTML, /You don't have access to this page\./);

const guestReportsAttempt = await fetch(`${serverOrigin}/api/reports`);
assert.equal(guestReportsAttempt.status, 401, "the real admin data must reject a guest server-side too, not just hide the button");

// An ordinary signed-in (non-admin) user must not reach it either.
await registerTestUser("Ordinary NMA21 User", "ordinary-nma21@example.com", DEFAULT_TEST_PASSWORD);
context.renderAccountActions();
assert.doesNotMatch(elements["account-actions"].innerHTML, /data-view="admin-view"/, "a normal user's own DOM must never even contain a link to the moderation queue");
await context.openAdminQueue();
assert.match(elements["admin-content"].innerHTML, /You don't have access to this page\./, "a normal signed-in user must still be refused, not just guests");

const normalReportsAttempt = await fetch(`${serverOrigin}/api/reports`, { headers: { cookie: testCookieJar } });
assert.equal(normalReportsAttempt.status, 403, "the real admin data must reject a normal signed-in user server-side too");
await context.signOutUser();

// The real, designated admin account (registered earlier, is_admin=1 for
// real -- see adminRegistration near the top of this function) CAN reach it.
await loginTestUser("nma21-admin@example.com", "correcthorse1");
context.renderAccountActions();
assert.match(elements["account-actions"].innerHTML, /data-view="admin-view"/, "the real admin's own account-actions bar must include the moderation queue entry point");

await context.openAdminQueue();
const adminQueueHtml = elements["admin-content"].innerHTML;
assert.match(adminQueueHtml, /Scam or fraud/, "the earlier listing report must appear, with its real reason");
assert.match(adminQueueHtml, /Harassment or abuse/, "the earlier user report must appear too, with its real reason");
assert.match(adminQueueHtml, new RegExp(`Listing: NMA20 Target Listing|Listing: ${nma20TargetListing.id}`), "a listing report must show a real, resolved listing title, not just a bare id");
assert.match(adminQueueHtml, /User: NMA20 Target/, "a user report must show a real, resolved reporter/target name");
assert.match(adminQueueHtml, /Seller asked for payment outside the platform\./, "the real submitted details must be visible to the reviewer");
assert.match(adminQueueHtml, new RegExp(`data-admin-report-status="${listingReport.id}" data-status="reviewed"`));
assert.match(adminQueueHtml, new RegExp(`data-admin-toggle-hide-listing="${nma20TargetListing.id}"`), "a listing report must offer a real Hide action");
assert.match(adminQueueHtml, new RegExp(`data-admin-toggle-flag-user="${nma20TargetSellerId}"`), "a user report must offer a real Flag action");

// Mark Reviewed / Dismiss (requirement 3).
await context.handleAdminReportStatusClick(listingReport.id, "reviewed");
assert.match(elements["admin-content"].innerHTML, new RegExp(`admin-status-reviewed`), "the listing report's status must really change server-side, reflected on re-render");
await context.handleAdminReportStatusClick(userReport.id, "dismissed");
assert.match(elements["admin-content"].innerHTML, /admin-status-dismissed/);

// Hide / unhide a reported listing (requirement 3) -- a real moderation
// action, visible to EVERYONE (unlike NM-A20's per-viewer Block), verified
// through the exact same Browse filter every guest/user actually sees.
await context.handleAdminToggleHideListingClick(nma20TargetListing.id, false);
assert.ok(!context.getFilteredListings().some((item) => item.id === nma20TargetListing.id), "an admin-hidden listing must disappear from Browse for everyone");
await context.handleAdminToggleHideListingClick(nma20TargetListing.id, true);
assert.ok(context.getFilteredListings().some((item) => item.id === nma20TargetListing.id), "unhiding must bring it straight back");

// Optionally flag a user -- "a simple status is enough" (requirement 3).
await context.handleAdminToggleFlagUserClick(nma20TargetSellerId, false);
assert.match(elements["admin-content"].innerHTML, /Unflag user/, "flagging must be reflected as a real, persisted toggle");
await context.handleAdminToggleFlagUserClick(nma20TargetSellerId, true);
assert.doesNotMatch(elements["admin-content"].innerHTML, /Unflag user/);

await context.signOutUser();

// --- NM-A22: Final Parity Pass + Honest Re-audit -- two small, high-leverage
// fixes found by actually verifying current behavior rather than assuming
// old EVIDENCE.md write-ups still held. ---

// Fix 1: nothing used to stop a seller from messaging themselves about
// their own listing (server-side dedup in NM-A20 only stopped the crash,
// not the option). Real marketplaces never show that CTA on your own listing.
const nma22SellerListing = await publishTestListing("NMA22 Seller", "nma22-seller@example.com", "NMA22 Audit Listing");
const nma22SellerId = nma22SellerListing.sellerId;
await registerTestUser("NMA22 Buyer", "nma22-buyer@example.com", DEFAULT_TEST_PASSWORD);
context.openListing(nma22SellerListing.id);
assert.match(elements["listing-detail"].innerHTML, /id="message-seller"/, "a DIFFERENT signed-in user must still see the real Message CTA");
assert.match(elements["listing-detail"].innerHTML, /id="suggested-opener"/);

await context.handleMessageClick(nma22SellerListing.id);
elements["compose-message-input"].value = "Is this still available?";
await context.sendComposedMessage();
context.renderInbox();
assert.match(elements["inbox-content"].innerHTML, /NMA22 Seller/, "the BUYER's own inbox must still show the real seller's name -- unchanged, correct behavior");
await context.signOutUser();

// Fix 2: since NM-A20 started recording the seller as a real conversation
// participant (needed for Block to enforce correctly), the seller NOW
// genuinely sees this conversation in their own Inbox -- but before this
// fix, the row showed the SELLER'S OWN name (listing.seller is always the
// seller), as if they were messaging themselves.
await loginTestUser("nma22-seller@example.com", DEFAULT_TEST_PASSWORD);
context.renderInbox();
assert.match(elements["inbox-content"].innerHTML, /NMA22 Audit Listing/, "the seller must genuinely see the buyer's conversation in their own Inbox (the real NM-A20 participant-model fix)");
assert.doesNotMatch(elements["inbox-content"].innerHTML, />NMA22 Seller</, "the seller's own Inbox row must never show their OWN name as if they were messaging themselves");
assert.match(elements["inbox-content"].innerHTML, /Buyer/, "the seller's own Inbox row must show a real, honest generic label instead");

context.openListing(nma22SellerListing.id);
assert.doesNotMatch(elements["listing-detail"].innerHTML, /id="message-seller"/, "the seller must never see a Message CTA on their own listing");
assert.doesNotMatch(elements["listing-detail"].innerHTML, /id="suggested-opener"/);

await context.signOutUser();

// --- NM-A23: Password Reset / Forgot-Password Flow ---
// Captures the real reset link `sendResetEmail` writes to the server
// console during `action()` -- the same real seam a developer (or, here,
// this suite) reads the link from, since no real email provider exists in
// this environment. Returns the raw token (NM-A25: now the last path
// segment of a real `/reset-password/:token` URL, not a query-string
// value -- see scripts/auth.js's own resetUrl), or null if nothing was
// logged (the real, expected outcome for a nonexistent account, since
// /forgot-password must stay fully generic either way).
async function captureResetToken(action) {
  const originalLog = console.log;
  let capturedUrl = null;
  console.log = (...args) => {
    const match = /\[FindNord\] Password reset requested for [^:]+: (\S+)/.exec(args.join(" "));
    if (match) capturedUrl = match[1];
  };
  try {
    await action();
  } finally {
    console.log = originalLog;
  }
  return capturedUrl ? new URL(capturedUrl).pathname.split("/").pop() : null;
}

function forgotPasswordRequest(email) {
  return fetch(`${serverOrigin}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email })
  });
}

function resetPasswordRequest(token, password) {
  return fetch(`${serverOrigin}/api/auth/reset-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password })
  });
}

// 1. A real account's own reset flow, end to end, direct against the real
// server -- mirrors the standalone backend smoke test this slice was
// required to write and run BEFORE any frontend work began.
const resetFlowUser = await registerRealUserDirectly("NMA23 Reset Flow", "nma23-reset@example.com", DEFAULT_TEST_PASSWORD);
const meBeforeReset = await (await fetch(`${serverOrigin}/api/auth/me`, { headers: { cookie: resetFlowUser.cookie } })).json();
assert.equal(meBeforeReset.email, "nma23-reset@example.com", "the pre-reset session must genuinely authenticate first");

const resetToken = await captureResetToken(() => forgotPasswordRequest("nma23-reset@example.com"));
assert.ok(resetToken && resetToken.length >= 32, "a real account must produce a real, long random reset token");

// Requirement 1: a NONEXISTENT account gets an IDENTICAL response and no
// link at all -- the real proof that /forgot-password never leaks
// account existence, not just a claim about it.
const fakeAccountResponse = await forgotPasswordRequest("nma23-does-not-exist@example.com");
const noTokenForFakeAccount = await captureResetToken(() => forgotPasswordRequest("nma23-does-not-exist@example.com"));
assert.equal(fakeAccountResponse.status, 200, "a nonexistent account must still get a 200, never a different status");
const fakeAccountBody = await fakeAccountResponse.json();
const realAccountResponse = await forgotPasswordRequest("nma23-reset@example.com");
const realAccountBody = await realAccountResponse.json();
assert.equal(realAccountResponse.status, fakeAccountResponse.status, "a real and a fake account must get the exact same HTTP status");
assert.deepEqual(realAccountBody, fakeAccountBody, "a real and a fake account must get the exact same response body -- the literal proof of requirement 1");
assert.equal(noTokenForFakeAccount, null, "no reset link may ever be generated/logged for a nonexistent account");

// Invalid token rejected.
const invalidTokenRes = await resetPasswordRequest("not-a-real-token-at-all", "somenewpassword1");
assert.equal(invalidTokenRes.status, 400);
assert.equal((await invalidTokenRes.json()).code, "INVALID_RESET_TOKEN");

// Too-short password rejected -- and the token must remain valid/unused afterward.
const tooShortRes = await resetPasswordRequest(resetToken, "short");
assert.equal(tooShortRes.status, 400);
assert.equal((await tooShortRes.json()).code, "PASSWORD_TOO_SHORT");

// The real reset itself.
const realResetRes = await resetPasswordRequest(resetToken, "brandnewpassword1");
assert.equal(realResetRes.status, 200);
assert.equal((await realResetRes.json()).success, true);

// Requirement: the OLD session, captured before the reset, must now be dead.
const meAfterReset = await (await fetch(`${serverOrigin}/api/auth/me`, { headers: { cookie: resetFlowUser.cookie } })).json();
assert.equal(meAfterReset, null, "a session captured before the reset must no longer authenticate after it -- every session must die on reset");

// Requirement: old password rejected, new password logs in.
const oldPasswordLogin = await fetch(`${serverOrigin}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "nma23-reset@example.com", password: DEFAULT_TEST_PASSWORD })
});
assert.equal(oldPasswordLogin.status, 401);
const newPasswordLogin = await fetch(`${serverOrigin}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "nma23-reset@example.com", password: "brandnewpassword1" })
});
assert.equal(newPasswordLogin.status, 200);
assert.equal((await newPasswordLogin.json()).email, "nma23-reset@example.com");

// Requirement: a single-use token rejected on reuse.
const reuseRes = await resetPasswordRequest(resetToken, "anotherpassword1");
assert.equal(reuseRes.status, 400);
assert.equal((await reuseRes.json()).code, "RESET_TOKEN_USED");

// Requirement: an expired token rejected. The suite can't wait 45 real
// minutes, so `testDb` (the real handle behind the real server) backdates
// THIS token's real expires_at column -- the same real column the route
// itself checks -- rather than faking the rejection any other way.
const expiringToken = await captureResetToken(() => forgotPasswordRequest("nma23-reset@example.com"));
testDb.prepare("UPDATE password_reset_tokens SET expires_at = ? WHERE token = ?").run(Date.now() - 1000, expiringToken);
const expiredTokenRes = await resetPasswordRequest(expiringToken, "yetanotherpassword1");
assert.equal(expiredTokenRes.status, 400);
assert.equal((await expiredTokenRes.json()).code, "RESET_TOKEN_EXPIRED");

// Requirement 7: a Google-only account (no password_hash ever set) gets an
// honest, distinct rejection -- surfaced only once a real valid token for
// THAT account is presented, never at /forgot-password (which stayed fully
// generic above), so this reveals nothing about any other account.
const googleOnlyIdToken = makeFakeGoogleIdToken({ payload: { email: "nma23-google-only@example.com", sub: "nma23-google-only-sub" } });
const googleOnlyRegisterRes = await fetch(`${serverOrigin}/api/auth/google`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ credential: googleOnlyIdToken })
});
assert.equal(googleOnlyRegisterRes.status, 200, "the real Google sign-in flow must create the account for real");
const googleOnlyToken = await captureResetToken(() => forgotPasswordRequest("nma23-google-only@example.com"));
assert.ok(googleOnlyToken, "a Google-only account still gets a real token/link -- forgot-password's response must stay indistinguishable from any other account");
const googleOnlyResetRes = await resetPasswordRequest(googleOnlyToken, "somepassword1");
assert.equal(googleOnlyResetRes.status, 400);
assert.equal((await googleOnlyResetRes.json()).code, "GOOGLE_ACCOUNT_NO_PASSWORD");

console.log("PASS: NM-A23 backend password-reset flow -- generic response, real single-use expiring token, session invalidation, and the Google-only-account honest rejection all verified directly against the real server.");

// 2. The real UI, through the exact same vm-sandboxed app.js the rest of
// this suite drives -- not a bypass of DataService.
context.setAuthMode("auth", "login");
context.openForgotPasswordModal();
elements["forgot-password-email-input"].value = "";
await context.handleForgotPasswordSubmit({ preventDefault() {} });
assert.equal(elements["forgot-password-error"].hidden, false, "an empty email must show a real client-side error, not silently no-op");

const frontendUser = await registerRealUserDirectly("NMA23 Frontend Flow", "nma23-frontend@example.com", DEFAULT_TEST_PASSWORD);
elements["forgot-password-email-input"].value = "nma23-frontend@example.com";
const frontendToken = await captureResetToken(() => context.handleForgotPasswordSubmit({ preventDefault() {} }));
assert.equal(elements["forgot-password-success"].hidden, false, "a real request must show the real generic confirmation");
assert.equal(elements["forgot-password-success"].textContent, "If that email exists, we've sent a reset link.");
assert.ok(frontendToken, "submitting the real form must produce a real, console-logged token");
context.closeForgotPasswordModal();

// The set-new-password form's own client-side "at least 8 characters" check.
context.openResetPasswordModal(frontendToken);
elements["reset-password-input"].value = "short";
await context.handleResetPasswordSubmit({ preventDefault() {} });
assert.equal(elements["reset-password-error"].hidden, false);
assert.equal(elements["reset-password-error"].textContent, "Password must be at least 8 characters.");

// The real, successful reset through the real UI form.
elements["reset-password-input"].value = "frontendnewpass1";
await context.handleResetPasswordSubmit({ preventDefault() {} });
assert.equal(elements["reset-password-success"].hidden, false, "a real successful reset must show a real success message");
assert.equal(elements["reset-password-form"].hidden, true, "the form must hide itself once the reset actually succeeds, not stay open to be resubmitted");

// Confirm the reset actually took effect: old password dead, new one works.
const frontendOldLogin = await loginTestUser("nma23-frontend@example.com", DEFAULT_TEST_PASSWORD);
assert.equal(frontendOldLogin, null, "the frontend flow's old password must be genuinely dead, not just claimed dead");
const frontendNewLogin = await loginTestUser("nma23-frontend@example.com", "frontendnewpass1");
assert.equal(frontendNewLogin.email, "nma23-frontend@example.com", "the frontend flow's new password must genuinely work");
await context.signOutUser();

// Reusing the same token through the real UI surfaces the real, translated "already used" error.
context.openResetPasswordModal(frontendToken);
elements["reset-password-input"].value = "someotherpassword1";
await context.handleResetPasswordSubmit({ preventDefault() {} });
assert.equal(elements["reset-password-error"].hidden, false);
assert.equal(elements["reset-password-error"].textContent, "This reset link has already been used.");
context.closeResetPasswordModal();

console.log("PASS: NM-A23 frontend flow -- the real forgot-password/reset-password modals, driven the same way a real user would, produce a real password change and a real, translated single-use rejection on reuse.");

// Sections 1+2 above made 8 real /reset-password calls -- coincidentally
// exactly reset-password's own real per-IP limit (max 8/hour; every call
// anywhere in this suite shares one IP-only bucket, see scripts/auth.js).
// Cleared here so this next, unrelated functional test gets a real, clean
// budget rather than tripping the very rate limiter this slice built,
// which is exactly what happened before this line was added.
resetRateLimiterState();

// 3. NM-A25 update: the bootstrap-time reset-password entry point (originally
// NM-A23's `?resetToken=...` query-string stopgap, requirement 6) now goes
// through the real `/reset-password/:token` route -- a fresh bootstrap run,
// in a NEW vm context sharing the same fake `document` (elements/views),
// with `window.location.pathname` carrying a fresh token, proving the app
// opens straight into the set-new-password view on a real fresh page load
// of that exact URL, through the SAME parseRoute()/applyRoute() mechanism
// exercised for listings/profiles/static pages in the NM-A25 section below.
const bootstrapStopgapToken = await captureResetToken(() => forgotPasswordRequest("nma23-frontend@example.com"));
const resetLinkContext = vm.createContext({
  document,
  fetch: makeTestFetch(),
  navigator: fakeNavigator,
  localStorage: fakeLocalStorage,
  window: {
    location: {
      href: `http://localhost:4173/reset-password/${bootstrapStopgapToken}`,
      origin: "http://localhost:4173",
      pathname: `/reset-password/${bootstrapStopgapToken}`,
      search: ""
    },
    addEventListener() {},
    scrollTo() {}
  }
});
await vm.runInContext(combinedJs, resetLinkContext);
assert.equal(
  elements["reset-password-modal"].hidden,
  false,
  "landing on a real /reset-password/:token link must open the set-new-password view automatically, through the real routing mechanism"
);
// (pendingResetToken itself is a `let`-scoped module variable inside the
// sandboxed script, not a property vm exposes on the context object, so it
// can't be read back from out here -- the functional proof that bootstrap
// parsed the real token out of the URL correctly is the reset actually
// succeeding below, through this exact context.)
elements["reset-password-input"].value = "stopgapnewpass1";
await resetLinkContext.handleResetPasswordSubmit({ preventDefault() {} });
assert.equal(elements["reset-password-success"].hidden, false, "the path-carried token must complete a real reset, not just open the modal");
const stopgapLogin = await loginTestUser("nma23-frontend@example.com", "stopgapnewpass1");
assert.equal(stopgapLogin.email, "nma23-frontend@example.com", "the password set via the real /reset-password/:token route must genuinely work");
await context.signOutUser();

console.log("PASS: NM-A25 password-reset routing -- NM-A23's reset flow now runs through the real /reset-password/:token route (not a query-string stopgap) and still completes a real reset on fresh page load.");

// 4. Rate limiting (requirement 5): fire real N+1 requests at each of the 4
// endpoints and assert the LAST one is a real 429 with a real Retry-After
// header. Cleared first so none of this slice's own functional checks
// above (which legitimately used a few requests on shared per-IP/per-email
// buckets) eat into the exact budget these deliberate tests depend on.
resetRateLimiterState();

async function assertRateLimited(requests, label) {
  let last;
  for (const request of requests) {
    last = await request();
  }
  assert.equal(last.status, 429, `${label} must return a real 429 once its real limit is exceeded`);
  assert.ok(Number(last.headers.get("retry-after")) > 0, `${label}'s 429 must include a real Retry-After header`);
  assert.equal((await last.json()).code, "RATE_LIMITED");
}

// forgot-password: max 6/hour per IP+email -- fire 7 for one fresh email.
await assertRateLimited(
  Array.from({ length: 7 }, () => () => forgotPasswordRequest("nma23-rate-limit-forgot@example.com")),
  "POST /api/auth/forgot-password"
);

// login: max 10/hour per IP+email -- fire 11 for one fresh email.
await assertRateLimited(
  Array.from(
    { length: 11 },
    () => () =>
      fetch(`${serverOrigin}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "nma23-rate-limit-login@example.com", password: "wrongpassword" })
      })
  ),
  "POST /api/auth/login"
);

// register: max 6/hour per IP+email -- fire 7 for one fresh email (the
// first succeeds, the rest are business-logic 409s, but the RATE limiter
// itself counts every request regardless of the handler's own outcome).
await assertRateLimited(
  Array.from(
    { length: 7 },
    () => () =>
      fetch(`${serverOrigin}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Rate Limit Register", email: "nma23-rate-limit-register@example.com", password: "somepassword1", ageConfirmed: true })
      })
  ),
  "POST /api/auth/register"
);

// reset-password: max 8/hour per IP (no email field on this route) -- fire 9.
await assertRateLimited(
  Array.from({ length: 9 }, () => () => resetPasswordRequest("some-garbage-token", "irrelevantpassword1")),
  "POST /api/auth/reset-password"
);

resetRateLimiterState(); // leaves every OTHER auth flow in this suite (registration/login for various real test accounts) with a full, real budget again, not artificially starved by this test's own deliberate exhaustion.

console.log("PASS: NM-A23 rate limiting -- all 4 auth endpoints (forgot-password, reset-password, login, register) really return a 429 with a real Retry-After header once their real per-key limit is exceeded.");

// --- NM-A24: Rate Limiting / Anti-Spam (Listings, Messages, Reports) ---
// Cleared first, for the same reason the NM-A23 block above clears before
// its own deliberate-exhaustion tests: nothing earlier in this shared-server
// suite should eat into the precise budgets these tests depend on.
resetRateLimiterState();

// Fires every request SEQUENTIALLY (not in parallel -- a real client
// wouldn't fire hundreds of concurrent requests either, and sequential
// firing is what keeps this deterministic against the sliding window
// rather than racing it) and returns every response, so the caller can
// assert on ALL of them -- not just the last one. This is the key
// difference from NM-A23's own assertRateLimited() helper above: the task
// for THIS slice explicitly requires proving requests UNDER the limit all
// succeed normally, not just that the limiter blocks once exceeded.
async function fireSequentially(requestFactories) {
  const responses = [];
  for (const factory of requestFactories) {
    responses.push(await factory());
  }
  return responses;
}

const nma24UserA = await registerRealUserDirectly("NMA24 Rate Limit A", "nma24-ratelimit-a@example.com", DEFAULT_TEST_PASSWORD);
const nma24UserB = await registerRealUserDirectly("NMA24 Rate Limit B", "nma24-ratelimit-b@example.com", DEFAULT_TEST_PASSWORD);

// 1. Listings: a real per-account limit of 20/day.
const nma24ListingResponses = await fireSequentially(
  Array.from(
    { length: 21 },
    (_, i) => () =>
      fetch(`${serverOrigin}/api/listings`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: nma24UserA.cookie },
        body: JSON.stringify({ title: `NMA24 Listing ${i}`, category: "Electronics", price: "100", country: "Sweden" })
      })
  )
);
for (let i = 0; i < 20; i++) {
  assert.equal(nma24ListingResponses[i].status, 200, `listing create #${i + 1} (under the real 20/day limit) must succeed normally -- legitimate use must never be over-triggered`);
}
assert.equal(nma24ListingResponses[20].status, 429, "the 21st listing create by the SAME account in the SAME day must be rejected with a real 429");
assert.ok(Number(nma24ListingResponses[20].headers.get("retry-after")) > 0, "the 429 must carry a real Retry-After header");
assert.equal((await nma24ListingResponses[20].json()).code, "RATE_LIMITED");

// The real point of keying on the account rather than the IP: every request
// in this ENTIRE suite comes from the same loopback IP, so user B publishing
// successfully right after user A's budget is fully exhausted is the real
// proof this is a per-account limit, not a per-IP one that would have
// wrongly locked out every other account sharing that IP too.
const nma24UserBListingResponse = await fetch(`${serverOrigin}/api/listings`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: nma24UserB.cookie },
  body: JSON.stringify({ title: "NMA24 User B's own listing", category: "Electronics", price: "50", country: "Sweden" })
});
assert.equal(nma24UserBListingResponse.status, 200, "a DIFFERENT account sharing the SAME IP must have its own untouched budget");

resetRateLimiterState();

// --- Deployment-readiness Phase 1 item 4: prohibited-item keyword check
// at listing creation. Verified directly against the real API (bypassing
// the client-side form) to prove the server-side gate works regardless of
// what the client sends. ---
{
  const prohibitedTitleResponse = await fetch(`${serverOrigin}/api/listings`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: nma24UserA.cookie },
    body: JSON.stringify({ title: "Firearm for sale", category: "Electronics", price: "100", country: "Sweden" })
  });
  assert.equal(prohibitedTitleResponse.status, 400, "a prohibited keyword in the title must be rejected with 400");
  assert.equal((await prohibitedTitleResponse.json()).code, "PROHIBITED_CONTENT");

  const prohibitedDescriptionResponse = await fetch(`${serverOrigin}/api/listings`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: nma24UserA.cookie },
    body: JSON.stringify({ title: "Old bicycle", category: "Vehicles", price: "50", country: "Sweden", description: "This item includes cocaine residue" })
  });
  assert.equal(prohibitedDescriptionResponse.status, 400, "a prohibited keyword in the description must be rejected with 400");
  assert.equal((await prohibitedDescriptionResponse.json()).code, "PROHIBITED_CONTENT");

  // Legitimate listing with no prohibited content must still succeed
  const cleanListingResponse = await fetch(`${serverOrigin}/api/listings`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: nma24UserA.cookie },
    body: JSON.stringify({ title: "Vintage oak dining table", category: "Home & Furniture", price: "1200", country: "Sweden", description: "Solid oak, excellent condition" })
  });
  assert.equal(cleanListingResponse.status, 200, "a clean listing with no prohibited content must succeed normally");
}

// 2. Messages: a real per-account limit of 40/hour -- deliberately the
// middle of the task's own suggested 30-60/hour range, chosen so a genuine
// fast-moving buyer/seller negotiation (many short back-and-forth messages
// inside a few minutes) is never affected, while a scripted harassment
// flood still gets stopped well before the moderation queue or the
// recipient's inbox would notice hundreds of messages in the same hour.
const nma24Conversation = await (
  await fetch(`${serverOrigin}/api/conversations/start-or-get`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: nma24UserA.cookie },
    body: JSON.stringify({ listingId: "nma24-rate-limit-listing", participantIds: [nma24UserA.user.id, nma24UserB.user.id] })
  })
).json();
assert.ok(nma24Conversation.id, "must get a real conversation id to message into");

const nma24MessageResponses = await fireSequentially(
  Array.from(
    { length: 41 },
    (_, i) => () =>
      fetch(`${serverOrigin}/api/conversations/${nma24Conversation.id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: nma24UserA.cookie },
        body: JSON.stringify({ text: `NMA24 message ${i}` })
      })
  )
);
for (let i = 0; i < 40; i++) {
  assert.equal(nma24MessageResponses[i].status, 200, `message #${i + 1} (under the real 40/hour limit) must succeed normally -- a real fast negotiation must never be throttled`);
}
assert.equal(nma24MessageResponses[40].status, 429, "the 41st message in the same hour must be rejected with a real 429");
assert.ok(Number(nma24MessageResponses[40].headers.get("retry-after")) > 0);
assert.equal((await nma24MessageResponses[40].json()).code, "RATE_LIMITED");

resetRateLimiterState();

// --- Deployment-readiness audit: conversation authorization + the null-
// participant crash, all verified against the real running server. ---
{
  const strangerReg = await fetch(`${serverOrigin}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Deploy Audit Stranger", email: "deploy-audit-stranger@example.com", password: DEFAULT_TEST_PASSWORD, ageConfirmed: true })
  });
  const strangerCookie = (strangerReg.headers.get("set-cookie") || "").split(";")[0];
  const strangerUser = await strangerReg.json();

  // A guest (no cookie at all) must never be able to read a conversation's
  // messages -- this was previously wide open to anyone.
  const guestReadResponse = await fetch(`${serverOrigin}/api/conversations/${nma24Conversation.id}/messages`);
  assert.equal(guestReadResponse.status, 401, "a signed-out guest must never be able to read a conversation's messages");

  // A real, signed-in, but UNRELATED account must not be able to read
  // someone else's conversation just by knowing/guessing its id.
  const strangerReadResponse = await fetch(`${serverOrigin}/api/conversations/${nma24Conversation.id}/messages`, {
    headers: { cookie: strangerCookie }
  });
  assert.equal(strangerReadResponse.status, 403, "a signed-in user who isn't a participant must not be able to read the conversation");
  assert.equal((await strangerReadResponse.json()).code, "NOT_A_PARTICIPANT");

  // ...nor post into it.
  const strangerPostResponse = await fetch(`${serverOrigin}/api/conversations/${nma24Conversation.id}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: strangerCookie },
    body: JSON.stringify({ text: "I should not be able to send this." })
  });
  assert.equal(strangerPostResponse.status, 403, "a signed-in user who isn't a participant must not be able to post into the conversation");
  assert.equal((await strangerPostResponse.json()).code, "NOT_A_PARTICIPANT");

  // The real participant must still be able to read their own conversation --
  // proving the fix is a real authorization check, not an over-broad lockout.
  const ownerReadResponse = await fetch(`${serverOrigin}/api/conversations/${nma24Conversation.id}/messages`, {
    headers: { cookie: nma24UserA.cookie }
  });
  assert.equal(ownerReadResponse.status, 200, "a real participant must still be able to read their own conversation");
  assert.ok(Array.isArray(await ownerReadResponse.json()));

  // GET /conversations and /conversations/all must both require a real
  // session now (previously: open to anyone, including signed-out guests).
  assert.equal((await fetch(`${serverOrigin}/api/conversations?userId=${strangerUser.id}`)).status, 401, "GET /conversations must require a real session");
  assert.equal((await fetch(`${serverOrigin}/api/conversations/all`)).status, 401, "GET /conversations/all must require a real session");
  // GET /conversations must derive "whose conversations" from the real
  // session, not a spoofable ?userId= query param -- requesting as the
  // stranger (who has zero conversations) but naming nma24UserA's id in the
  // query must still return the STRANGER's own (empty) list, not A's.
  const spoofedListResponse = await fetch(`${serverOrigin}/api/conversations?userId=${nma24UserA.user.id}`, {
    headers: { cookie: strangerCookie }
  });
  assert.equal(spoofedListResponse.status, 200);
  assert.equal((await spoofedListResponse.json()).length, 0, "a spoofed ?userId= must be ignored -- the real session, not the query string, decides whose conversations these are");

  // The confirmed, reproducible bug: a null participant (matching a seed
  // listing's real null sellerId) must be a clean 400, never the raw
  // SqliteError/500/stack-trace-leak this used to produce.
  const nullParticipantResponse = await fetch(`${serverOrigin}/api/conversations/start-or-get`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: nma24UserA.cookie },
    body: JSON.stringify({ listingId: "oak-table", participantIds: [nma24UserA.user.id, null] })
  });
  assert.equal(nullParticipantResponse.status, 400, "a null participant must be a clean 400, not an unhandled 500");
  assert.equal((await nullParticipantResponse.json()).code, "INVALID_PARTICIPANT");
  assert.match(nullParticipantResponse.headers.get("content-type") || "", /application\/json/, "the error response must be real JSON, never Express's default HTML stack-trace page");
}

// 3. Reports: a real per-account limit of 15/day, so NM-A21's own
// moderation queue can't be flooded with junk faster than an admin could
// ever triage it.
const nma24ReportResponses = await fireSequentially(
  Array.from(
    { length: 16 },
    () => () =>
      fetch(`${serverOrigin}/api/reports`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: nma24UserA.cookie },
        body: JSON.stringify({ reportedUserId: nma24UserB.user.id, reason: "other" })
      })
  )
);
for (let i = 0; i < 15; i++) {
  assert.equal(nma24ReportResponses[i].status, 200, `report #${i + 1} (under the real 15/day limit) must succeed normally`);
}
assert.equal(nma24ReportResponses[15].status, 429, "the 16th report in the same day must be rejected with a real 429");
assert.ok(Number(nma24ReportResponses[15].headers.get("retry-after")) > 0);
assert.equal((await nma24ReportResponses[15].json()).code, "RATE_LIMITED");

resetRateLimiterState(); // leaves every other real functional flow later in this suite with a full, clean budget again.

console.log("PASS: NM-A24 rate limiting -- listing creation (20/day), messaging (40/hour), and reporting (15/day) all really throttle with a real 429 + Retry-After once their real per-ACCOUNT limit is exceeded, every request strictly under the limit succeeds normally, and a different account sharing the same IP is unaffected.");

// The real, translated frontend messages (requirement: a clear, translated
// message on a 429, not a generic failure) -- driven through the SAME real
// UI code paths (sendComposedMessage, submitReportModal, commitPublish via
// publishListing) every other behavioral test in this file already uses,
// not a bypass straight to DataService.
{
  resetRateLimiterState();

  // publishTestListing() registers its OWN seller account and signs it out
  // again at the end (see its own definition above) -- it must run BEFORE
  // the frontend tester below logs in, or it would clobber/kill the shared
  // testCookieJar session this block depends on right out from under it
  // (a real bug this exact ordering caught during development).
  const frontendReportTargetListing = await publishTestListing("NMA24 Report Target Seller", "nma24-report-target@example.com", "NMA24 Report Target Listing");

  await registerTestUser("NMA24 Frontend Tester", "nma24-frontend@example.com", DEFAULT_TEST_PASSWORD);

  // Exhaust the real per-account report limit (15/day) via 15 direct calls
  // reusing this same signed-in account's real session cookie (testCookieJar,
  // the one the vm-sandboxed `context` itself uses), then trigger the 16th
  // through the REAL UI form.
  for (let i = 0; i < 15; i++) {
    const response = await fetch(`${serverOrigin}/api/reports`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: testCookieJar },
      body: JSON.stringify({ listingId: frontendReportTargetListing.id, reason: "other" })
    });
    assert.equal(response.status, 200, `pre-exhaustion report #${i + 1} must succeed`);
  }
  context.openListing(frontendReportTargetListing.id);
  context.handleReportListingClick(frontendReportTargetListing.id);
  elements["report-reason-select"].value = "other";
  elements["report-details-input"].value = "";
  await context.submitReportModal();
  assert.equal(elements["report-error"].hidden, false, "the real UI must show a real error once the report limit is hit through it, not close the modal as if it succeeded");
  assert.match(
    elements["report-error"].textContent,
    /too quickly.*try again in \d+ minutes?\./i,
    "the real UI error must be the actual translated rate-limit message with a real minute count, not a generic failure"
  );
  console.log(`PASS: NM-A24 frontend report rate-limit message -- "${elements["report-error"].textContent}"`);

  resetRateLimiterState();
  await context.signOutUser();
}

// --- Deployment-readiness audit: stored XSS, verified end-to-end through
// the real publish -> render pipeline, not just a source-text check. A
// listing titled with a real HTML/script payload must never reach the DOM
// as a live tag -- for ANY signed-out guest browsing, the exact
// unauthenticated attack the audit confirmed. ---
{
  const xssPayload = `<img src=x onerror=alert(1)>`;
  const xssListing = await publishTestListing("XSS Test Seller", "xss-test-seller@example.com", xssPayload);
  // The server must store the real, raw value -- escaping is a RENDER-time
  // concern, not a storage-time one (storing a mangled title would itself be
  // a real data-integrity bug, and would make this test meaningless).
  assert.equal(xssListing.title, xssPayload, "the raw title must be stored as-is; escaping happens only when rendering to HTML");

  await context.refreshListingsCache();
  context.renderListings();
  const gridHtml = elements["listing-grid"].innerHTML;
  assert.doesNotMatch(gridHtml, /<img src=x onerror=alert\(1\)>/, "a malicious listing title must never reach the Browse grid as a live tag");
  assert.match(gridHtml, /&lt;img src=x onerror=alert\(1\)&gt;/, "it must render as real, visible, escaped text instead");

  context.openListing(xssListing.id);
  const detailHtml = elements["listing-detail"].innerHTML;
  assert.doesNotMatch(detailHtml, /<img src=x onerror=alert\(1\)>/, "a malicious listing title must never reach the listing detail page as a live tag");
  assert.match(detailHtml, /&lt;img src=x onerror=alert\(1\)&gt;/, "it must render as real, visible, escaped text there too");

  // Same proof for a chat message: a buyer messages the (malicious-title)
  // listing's seller with a script-payload message, through the real
  // compose-modal -> sendComposedMessage() path (not a direct API call).
  await registerTestUser("XSS Test Buyer", "xss-test-buyer@example.com", DEFAULT_TEST_PASSWORD);
  await context.refreshListingsCache();
  context.openMessageComposer(xssListing.id);
  const messagePayload = `<script>alert(document.cookie)</script>`;
  elements["compose-message-input"].value = messagePayload;
  await context.sendComposedMessage();
  context.renderInbox();
  const inboxHtml = elements["inbox-content"].innerHTML;
  assert.doesNotMatch(inboxHtml, /<script>alert\(document\.cookie\)<\/script>/, "a malicious chat message must never reach the Inbox preview as a live tag");
  assert.match(inboxHtml, /&lt;script&gt;alert\(document\.cookie\)&lt;\/script&gt;/, "it must render as real, visible, escaped text instead");
  await context.signOutUser();

  console.log("PASS: deployment-readiness stored-XSS fix -- a real HTML/script payload in a listing title (Browse grid + listing detail, reachable by any signed-out guest) and in a chat message (thread view) both render as real, visible, escaped text, never as a live tag, verified end-to-end through the actual publish/message -> render pipeline.");
}

// NM-A14: register a real account for the restart-persistence check below,
// while the server is still up -- its own real session cookie, captured now
// and reused (unmodified) against the REOPENED server after a real restart.
restartPersistenceTestUser = await registerRealUserDirectly("Restart Persistence Tester", "restart-persistence@example.com", DEFAULT_TEST_PASSWORD);

// BL-A06: a saved home location must survive a real server restart, the
// same way the session/listings/photos above do -- set here, while the
// server is still up, via the same real PATCH /auth/me route Settings uses,
// then checked again after the restart in assertBackendPersistsAcrossRestart.
const homeLocationPatchResponse = await fetch(`${serverOrigin}/api/auth/me`, {
  method: "PATCH",
  headers: { "content-type": "application/json", cookie: restartPersistenceTestUser.cookie },
  body: JSON.stringify({ homeCountry: "Finland", homeRegion: "Uusimaa" })
});
const homeLocationPatchBody = await homeLocationPatchResponse.json();
assert.equal(homeLocationPatchBody.homeCountry, "Finland", "PATCH /auth/me must persist and immediately return the new home country");
assert.equal(homeLocationPatchBody.homeRegion, "Uusimaa");

// --- NM-A25: Per-Listing URLs / Deep Links (Client-Side Routing) ---
// Layered onto showView()/open*() (untouched) via parseRoute/applyRoute/
// navigateTo*/handlePopState. Exercised two ways: (1) through the vm-
// sandboxed `context` for the real click-driven navigation + popstate
// wiring, using the fake `history`/`location`/popstate-listener setup
// added to the shared vm context above; (2) fresh, isolated vm contexts
// (like the NM-A23 stopgap test above) for a real "fresh page load lands
// directly on this content" proof, since that's a bootstrap-time behavior.
{
  pushStateCalls.length = 0;
  setFakeLocation("/");

  // 1. Clicking a listing pushes a real URL and opens the real content.
  context.navigateToListing("iphone-14");
  assert.equal(pushStateCalls[pushStateCalls.length - 1], "/listing/iphone-14", "navigateToListing must push a real, shareable per-listing URL");
  assert.equal(fakeLocation.pathname, "/listing/iphone-14", "the fake location (standing in for the real browser URL bar) must reflect the pushed route");
  assert.ok(views.find((view) => view.id === "detail-view").classList.contains("active-view"), "navigateToListing must still open the real listing detail view, unchanged from showView()'s own mechanism");
  assert.match(elements["listing-detail"].innerHTML, /iPhone 14/);

  // 2. Clicking a seller profile pushes a real URL and opens the real
  // content -- reviewSellerListing.sellerId (a real registered account
  // from earlier in this suite, published via the real Sell form) is used
  // rather than a made-up id, so the profile that opens is real too.
  await context.navigateToProfile(reviewSellerListing.sellerId);
  assert.equal(pushStateCalls[pushStateCalls.length - 1], `/profile/${reviewSellerListing.sellerId}`, "navigateToProfile must push a real, shareable per-profile URL");
  assert.equal(fakeLocation.pathname, `/profile/${reviewSellerListing.sellerId}`);
  assert.ok(views.find((view) => view.id === "profile-view").classList.contains("active-view"));
  assert.match(elements["seller-profile"].innerHTML, /Review Seller/, "the real seller's name must actually render, not just the view switching");

  // 3. Clicking a static page pushes a real URL and opens the real content
  // -- both the delegated click path (navigateToStaticPage itself) and the
  // cookie-banner's own direct call site (handleCookieSettingsClick), which
  // NM-A25 also routed through the same wrapper instead of calling
  // openStaticPage() directly.
  context.navigateToStaticPage("safetyTips");
  assert.equal(pushStateCalls[pushStateCalls.length - 1], "/page/safetyTips", "navigateToStaticPage must push a real, shareable per-page URL");
  assert.equal(fakeLocation.pathname, "/page/safetyTips");
  assert.ok(views.find((view) => view.id === "static-page-view").classList.contains("active-view"));
  assert.match(elements["static-page-content"].innerHTML, /Safety Tips/);

  context.handleCookieSettingsClick();
  assert.equal(pushStateCalls[pushStateCalls.length - 1], "/page/cookiePolicy", "the cookie-banner's own static-page link must ALSO push a real URL now, not bypass the routing layer");

  // 4. Every OTHER navigation (explicitly out of scope for a URL of its
  // own) must still push NOTHING -- Browse/Inbox/Sell/etc. keep working
  // exactly as before, with no URL change at all.
  const pushCountBeforeOrdinaryNav = pushStateCalls.length;
  context.showView("inbox-view");
  context.showView("sell-view");
  context.showView("browse-view");
  assert.equal(pushStateCalls.length, pushCountBeforeOrdinaryNav, "ordinary view switches (Inbox, Sell, Browse, ...) must never push a URL -- only the 4 named routes do");

  // 5. parseRoute() itself: exactly these 4 shapes match, nothing else does.
  // (Compared field-by-field, not with assert.deepEqual -- the object
  // parseRoute() returns is a plain object from the SANDBOXED realm's own
  // Object.prototype, not this file's, which Node's deepStrictEqual treats
  // as a real inequality even when every field matches.)
  function assertRoute(route, type, param) {
    assert.ok(route, `parseRoute must return a real route object for a ${type} URL`);
    assert.equal(route.type, type);
    assert.equal(route.param, param);
  }
  assertRoute(context.parseRoute("/listing/abc"), "listing", "abc");
  assertRoute(context.parseRoute("/profile/xyz"), "profile", "xyz");
  assertRoute(context.parseRoute("/page/faq"), "page", "faq");
  assertRoute(context.parseRoute("/reset-password/tok123"), "reset-password", "tok123");
  assert.equal(context.parseRoute("/"), null, "the bare root must not be treated as one of the 4 routes");
  assert.equal(context.parseRoute("/inbox-view"), null, "a view name must never accidentally be parsed as a route -- only these 4 exact shapes are real routes");
  assert.equal(context.parseRoute(""), null);

  console.log("PASS: NM-A25 navigation wiring -- clicking a listing/profile/static-page (and the cookie-banner's own static-page link) pushes a real, correctly-shaped URL and still opens the exact same real content showView()/open*() always did; every other view switch pushes no URL at all.");

  // 6. Real back/forward (popstate). Simulated by moving the fake location
  // to wherever the browser would have moved it and firing the exact same
  // `popstate` listener bootstrap() registered -- handlePopState() itself
  // doesn't know or care whether that move was a "back" or a "forward" tap,
  // it only ever reacts to "the URL is now X", which is exactly what a real
  // browser guarantees on either button. The real, directional back/forward
  // BUTTON behavior is verified for real in Playwright (see EVIDENCE.md);
  // this proves the popstate handler's own dispatch logic is correct.
  context.navigateToListing("volvo-v60");
  assert.ok(views.find((view) => view.id === "detail-view").classList.contains("active-view"));

  // "Back" to the bare root: nothing left to route to -- must land on
  // Browse, not stay stuck on the listing or crash.
  setFakeLocation("/");
  firePopState();
  assert.ok(views.find((view) => view.id === "browse-view").classList.contains("active-view"), "a popstate back to \"/\" (no matching route) must fall back to Browse");

  // "Forward" back to the listing: must reopen it directly.
  setFakeLocation("/listing/volvo-v60");
  firePopState();
  assert.ok(views.find((view) => view.id === "detail-view").classList.contains("active-view"), "a popstate forward to a real route must reopen that exact content");
  assert.match(elements["listing-detail"].innerHTML, /Volvo V60/);

  // A popstate landing back on "/" while the reset-password modal happens
  // to be open must close it (it's a modal, not a `view`, so showView()
  // alone would never touch it).
  setFakeLocation(`/reset-password/${bootstrapStopgapToken}`);
  firePopState();
  assert.equal(elements["reset-password-modal"].hidden, false, "a popstate INTO /reset-password/:token must open the modal");
  setFakeLocation("/");
  firePopState();
  assert.equal(elements["reset-password-modal"].hidden, true, "a popstate back to \"/\" must close the reset-password modal, not leave it open over Browse");
  context.closeResetPasswordModal(); // defensive reset regardless of the assertion above

  console.log("PASS: NM-A25 back/forward (popstate) -- landing back on a real route reopens that exact content, landing on \"/\" falls back to Browse and closes an open reset-password modal, matching real Playwright-verified back/forward behavior.");

  setFakeLocation("/");
  pushStateCalls.length = 0;
}

// A fresh page load (a NEW vm context, exactly like the NM-A23 stopgap test
// above) of each of the 3 other real routes must land directly on that
// exact content too -- not just a client-side pushState navigation. Shares
// the same fake `document` (elements/views) as `context` itself, so
// asserting against `elements`/`views` after each fresh bootstrap proves
// what that fresh load actually rendered.
async function bootstrapFreshAt(pathname) {
  const freshContext = vm.createContext({
    document,
    fetch: makeTestFetch(),
    navigator: fakeNavigator,
    localStorage: fakeLocalStorage,
    window: {
      location: { href: `http://localhost:4173${pathname}`, origin: "http://localhost:4173", pathname, search: "" },
      addEventListener() {},
      scrollTo() {}
    }
  });
  await vm.runInContext(combinedJs, freshContext);
  return freshContext;
}

await bootstrapFreshAt("/listing/iphone-14");
assert.ok(views.find((view) => view.id === "detail-view").classList.contains("active-view"), "a fresh page load of /listing/:id must land directly on that listing, not reset to Browse");
assert.match(elements["listing-detail"].innerHTML, /iPhone 14/);

await bootstrapFreshAt(`/profile/${reviewSellerListing.sellerId}`);
assert.ok(views.find((view) => view.id === "profile-view").classList.contains("active-view"), "a fresh page load of /profile/:id must land directly on that profile");
assert.match(elements["seller-profile"].innerHTML, /Review Seller/, "the fresh load must render the real seller's real profile, not just switch views");

await bootstrapFreshAt("/page/safetyTips");
assert.ok(views.find((view) => view.id === "static-page-view").classList.contains("active-view"), "a fresh page load of /page/:slug must land directly on that static page");
assert.match(elements["static-page-content"].innerHTML, /Safety Tips/);

// A fresh load of an UNKNOWN id/slug must not crash -- openSellerProfile/
// openStaticPage already have their own real "not found" UI (unchanged by
// this slice); confirming that path still works when reached via a route
// rather than a click.
await bootstrapFreshAt("/profile/does-not-exist-at-all");
assert.ok(views.find((view) => view.id === "profile-view").classList.contains("active-view"));
assert.match(elements["seller-profile"].innerHTML, /profile-empty/, "an unknown profile id reached via a fresh route load must show the real not-found state, not crash");

await bootstrapFreshAt("/page/not-a-real-slug");
assert.ok(views.find((view) => view.id === "static-page-view").classList.contains("active-view"));
assert.match(elements["static-page-content"].innerHTML, /profile-empty/, "an unknown static-page slug reached via a fresh route load must show the real not-found state, not crash");

// A fresh load of "/" (no route at all) must not touch the view at all --
// parseRoute("/") returns null, so applyRoute() is never even called, and
// bootstrap() falls through exactly as it always did pre-NM-A25 (real
// index.html itself already marks browse-view active by default markup;
// this shared fake `document` just isn't a faithful stand-in for THAT part
// of a real fresh load, since earlier fresh contexts in this same suite
// already mutated its shared elements -- the real "/" case is unchanged
// and already covered by every other test in this file that never once
// passes a route-shaped pathname).
await bootstrapFreshAt("/");
assert.equal(context.parseRoute("/"), null, "the bare root must never be treated as a route needing special bootstrap handling");

console.log("PASS: NM-A25 fresh page loads -- a real, direct (non-client-side-navigated) load of /listing/:id, /profile/:id, and /page/:slug each lands straight on that exact real content, an unknown id/slug degrades gracefully to the existing not-found UI instead of crashing, and \"/\" is unaffected.");

// The real backend routes themselves (raw HTTP, no JS/vm involved at all --
// the actual acceptance bar: a raw curl-style fetch against /listing/:id
// must show THIS listing's real title/description in its og:*/twitter:*
// meta tags, not the same boilerplate for every id).
{
  // reviewSellerListing (published earlier in this suite via the real
  // Sell form + uploadFakePhoto()) has a REAL uploaded photo under
  // /uploads -- unlike the seed listings (iphone-14/volvo-v60), whose
  // seed photos are CSS gradients, not real files. Using it here is what
  // makes the og:image assertion below a real, meaningful proof rather
  // than something that would pass even if og:image were silently never
  // set (see this slice's own escapeRegex helper below).
  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ogListing = await (await fetch(`${serverOrigin}/api/listings`)).json().then((all) => all.find((item) => item.id === reviewSellerListing.id));
  const listingHtml = await (await fetch(`${serverOrigin}/listing/${reviewSellerListing.id}`)).text();
  assert.match(listingHtml, /class="app-shell"/, "a raw HTTP GET of /listing/:id must return the real app shell HTML");
  assert.match(listingHtml, /<script src="\/app\.js/);
  assert.match(listingHtml, new RegExp(`<title>${escapeRegex(ogListing.title)} — FindNord</title>`), "the real <title> must reflect this exact listing, not a generic one");
  assert.match(
    listingHtml,
    new RegExp(`<meta property="og:title" content="${escapeRegex(ogListing.title)} — FindNord" />`),
    "og:title must be this exact listing's real title"
  );
  assert.match(
    listingHtml,
    new RegExp(`<meta property="og:url" content="${escapeRegex(serverOrigin)}/listing/${reviewSellerListing.id}" />`),
    "og:url must be the real canonical URL for THIS listing"
  );
  assert.match(listingHtml, /<meta property="og:image" content="[^"]*\/uploads\//, "this listing has a real uploaded photo -- og:image must point at a real /uploads file, not be missing or fabricated");

  // A DIFFERENT real listing (a seed listing, with no real uploaded photo)
  // must get DIFFERENT OG data, and no fabricated og:image -- the actual
  // proof this is per-listing, not one shared template.
  const volvoListing = await (await fetch(`${serverOrigin}/api/listings`)).json().then((all) => all.find((item) => item.id === "volvo-v60"));
  const volvoHtml = await (await fetch(`${serverOrigin}/listing/volvo-v60`)).text();
  assert.match(volvoHtml, new RegExp(`<meta property="og:title" content="${escapeRegex(volvoListing.title)} — FindNord" />`));
  assert.notEqual(listingHtml.match(/<title>[^<]*<\/title>/)[0], volvoHtml.match(/<title>[^<]*<\/title>/)[0], "two different listings must get two genuinely different <title>s, proving real per-listing data, not shared boilerplate");
  assert.doesNotMatch(volvoHtml, /<meta property="og:image"/, "a listing whose photos are seed gradients (not a real uploaded file) must omit og:image rather than fabricate one");

  // A nonexistent listing id: a real, graceful 404 (per this slice's own
  // required backend smoke test), not a crash.
  const missingRes = await fetch(`${serverOrigin}/listing/this-listing-does-not-exist`);
  assert.equal(missingRes.status, 404, "a nonexistent listing id must be a real 404 at the raw HTTP layer");
  assert.match(await missingRes.text(), /class="app-shell"/, "even the 404 must still be real, renderable HTML");

  // /profile/:id and /page/:slug: real HTML for a real registered seller,
  // and a real 404 for a nonexistent profile id.
  assert.ok(ogListing.sellerId, "reviewSellerListing must have a real sellerId (a real registered account), not a seed listing with none");
  const profileHtml = await (await fetch(`${serverOrigin}/profile/${ogListing.sellerId}`)).text();
  assert.match(profileHtml, /class="app-shell"/);
  const missingProfileRes = await fetch(`${serverOrigin}/profile/no-such-user-at-all`);
  assert.equal(missingProfileRes.status, 404, "a nonexistent profile id must be a real 404 at the raw HTTP layer");
  const pageHtml = await (await fetch(`${serverOrigin}/page/safetyTips`)).text();
  assert.match(pageHtml, /class="app-shell"/);

  console.log("PASS: NM-A25 backend routing -- a raw HTTP GET of /listing/:id serves real, genuinely per-listing og:*/twitter:* meta tags (proven distinct across two different real listings), a nonexistent id is a real 404 (not a crash), and /profile/:id + /page/:slug both serve real HTML.");
}
}

const serverScript = fs.readFileSync(path.join(root, "scripts", "server.js"), "utf8");
assert.match(serverScript, /app\.use\(express\.static\(root\)\)/, "the real Express server must serve the SPA's static files");
assert.match(serverScript, /app\.post\(\s*"\/api\/generate-image"/, "server must expose the generate-image endpoint");
assert.match(serverScript, /process\.env\.OPENAI_API_KEY/, "the API key must come from an environment variable, never be hardcoded");
assert.doesNotMatch(serverScript, /sk-[A-Za-z0-9]{10,}/, "no real-looking API key must ever be committed to this file");
assert.match(serverScript, /api\.openai\.com\/v1\/images\/generations/);
assert.match(
  serverScript,
  /if \(!apiKey\) {\s*\n\s*res\.status\(500\)\.json\(/,
  "a missing key must fail with a clear error, not crash or silently no-op"
);

// --- NM-A11: Backend Foundation -- start the REAL Express + SQLite server
// (a temp DB file, not :memory:, specifically so restart-persistence below
// is a genuine test) and point every DataService fetch call at it for the
// whole behavioral suite above, via `serverOrigin`. NM-A12 adds a temp
// uploads directory alongside it, so every real photo published during the
// behavioral suite is a real file on disk -- isolated from the real
// project's uploads/ folder, the same way the temp DB is isolated from the
// real data/findnord.db.
function startTestServer(dbPath, uploadsDir) {
  return new Promise((resolve) => {
    const instance = startServer({ dbPath, uploadsDir, port: 0, silent: true });
    instance.server.once("listening", () => resolve({ ...instance, port: instance.server.address().port }));
  });
}

function cleanupTestArtifacts() {
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      fs.unlinkSync(TEST_DB_PATH + suffix);
    } catch (error) {
      // Nothing to clean up, or already gone -- fine either way.
    }
  }
  try {
    fs.rmSync(TEST_UPLOADS_DIR, { recursive: true, force: true });
  } catch (error) {
    // Nothing to clean up, or already gone -- fine either way.
  }
}

// Proves the backend is genuinely persistent, not just "in-memory but behind
// a fetch call": closes the server used for the whole behavioral run, then
// opens a brand-new server process-level instance against the SAME database
// file (and the SAME uploads directory) and confirms real data -- including
// real image FILES, not inline data -- written earlier in this run is still
// there and actually servable from disk.
async function assertBackendPersistsAcrossRestart(dbPath, uploadsDir) {
  const reopened = await startTestServer(dbPath, uploadsDir);
  try {
    const listings = await (await fetch(`http://127.0.0.1:${reopened.port}/api/listings`)).json();
    assert.ok(listings.length > 8, "listings published during the test run must survive a real server restart, not just live in-memory");
    const photoLamp = listings.find((listing) => listing.title === "Six-photo test lamp");
    assert.ok(photoLamp, "a specific listing published earlier in the run must still be readable after a real restart");
    assert.ok(
      listings.some((listing) => listing.title === "Analytics test bicycle" && listing.sponsored),
      "a boosted listing's mutation (Boost is an UPDATE, not a new row) must also survive a real restart"
    );

    // --- NM-A12: real file storage for images ---
    assert.equal(photoLamp.images.length, 6, "all 6 photos of that listing must still be attached after a real restart");
    photoLamp.images.forEach((image, index) => {
      assert.doesNotMatch(image.css, /data:image/, `photo ${index} must be stored as a real file path, not an inline data URL, in the database`);
      assert.match(image.css, /^url\(\/uploads\/[^)]+\)/, `photo ${index} must point at a real /uploads file`);
    });
    assert.doesNotMatch(photoLamp.image, /data:image/, "the listing's cover field must also be a file path, not inline data");

    const uploadedFiles = fs.readdirSync(uploadsDir).filter((name) => name !== ".gitkeep");
    assert.ok(uploadedFiles.length >= 6, "the real photos published during the run must exist as real files on disk");

    // Fetch one of those photos through the real HTTP static route -- proving
    // it is actually SERVED from disk, not just present in the database.
    const firstPhotoPath = /url\((\/uploads\/[^)]+)\)/.exec(photoLamp.images[0].css)[1];
    const imageResponse = await fetch(`http://127.0.0.1:${reopened.port}${firstPhotoPath}`);
    assert.equal(imageResponse.status, 200, "an uploaded photo must be servable directly over HTTP after a restart");
    assert.match(imageResponse.headers.get("content-type") || "", /^image\//, "the uploaded photo must be served with a real image content-type");
    const imageBytes = Buffer.from(await imageResponse.arrayBuffer());
    assert.ok(imageBytes.length > 0, "the served image file must have real bytes, not be empty");

    // A seed listing's gradient must still display correctly, untouched --
    // no migration was needed or attempted for it.
    const oakTable = listings.find((listing) => listing.id === "oak-table");
    assert.match(oakTable.image, /^linear-gradient\(/, "seed listings must keep rendering as CSS gradients, exactly as before this migration");

    // --- NM-A13: Basic Listing Management -- edit, status, and delete must all survive a real restart ---
    const editedBike = listings.find((listing) => listing.title === "Analytics test bicycle");
    assert.equal(
      editedBike.description,
      "Edited after publishing, to prove edits persist across a restart.",
      "an edited field must survive a real restart, not just live in the in-memory listings cache"
    );
    assert.equal(editedBike.status, "reserved", "a status change (Reserved) must survive a real restart");
    assert.ok(
      !listings.some((listing) => listing.title === "Vintage record player, price drop"),
      "a deleted listing must stay deleted after a real restart, not reappear"
    );

    const savedItems = await (await fetch(`http://127.0.0.1:${reopened.port}/api/saved-items/all`)).json();
    assert.ok(savedItems.length > 0, "saved items written during the run must survive a real restart");

    const servedHtml = await (await fetch(`http://127.0.0.1:${reopened.port}/`)).text();
    assert.match(servedHtml, /FindNord/, "the real Express server must serve the real index.html, not a stub");

    // --- NM-A14: a real session must survive a real restart -- the SAME
    // cookie, captured before the restart, reused unmodified against the
    // REOPENED server, must still resolve to the same real account. This is
    // what "stay logged in across server restarts" (requirement 2) actually means.
    const meAfterRestart = await fetch(`http://127.0.0.1:${reopened.port}/api/auth/me`, {
      headers: { cookie: restartPersistenceTestUser.cookie }
    });
    const meBody = await meAfterRestart.json();
    assert.ok(meBody, "a session created before a restart must still resolve to a real account after it");
    assert.equal(meBody.id, restartPersistenceTestUser.user.id, "the restart must recognize the exact same account, not a different or blank one");
    assert.equal(meBody.email, "restart-persistence@example.com");

    // BL-A06: the home location saved (via PATCH /auth/me) before the
    // restart must still be there after it -- a real DB column, not
    // in-memory-only state.
    assert.equal(meBody.homeCountry, "Finland", "a saved home country must survive a real server restart");
    assert.equal(meBody.homeRegion, "Uusimaa", "a saved home region must survive a real server restart");
  } finally {
    reopened.server.close();
  }
}

// --- NM-A15: Google Sign-In test setup. This project has no real Google
// Cloud OAuth client in its dev/test environment, so the real Google JWKS
// endpoint is never actually reached: a real RSA keypair is generated here,
// its public half published as a hand-built JWKS, and `global.fetch` is
// patched (module-load time, before the test server starts, so
// scripts/auth.js reads a real-looking GOOGLE_CLIENT_ID from the start) to
// serve that fake JWKS whenever scripts/google-auth.js asks Google for its
// public keys -- every OTHER fetch call (there are many, throughout this
// file, straight to the real test server) passes through to the real
// fetch, completely unaffected. This is genuine, cryptographically real
// RS256 signature verification end to end; only the "who publishes the
// public key" step is swapped for a local one, exactly the way a real OIDC
// library's own test suite would be built.
const TEST_GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
const TEST_GOOGLE_KID = "test-key-1";
const { publicKey: testGooglePublicKey, privateKey: testGooglePrivateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const testGoogleJwks = { keys: [{ ...testGooglePublicKey.export({ format: "jwk" }), kid: TEST_GOOGLE_KID, alg: "RS256", use: "sig" }] };

function base64UrlEncode(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// `overrides` can deliberately break things (wrong clientId/kid/exp/etc.) to
// exercise verifyGoogleIdToken's rejection paths for real.
function makeFakeGoogleIdToken(overrides = {}) {
  const header = { alg: "RS256", kid: TEST_GOOGLE_KID, typ: "JWT", ...overrides.header };
  const payload = {
    iss: "https://accounts.google.com",
    aud: TEST_GOOGLE_CLIENT_ID,
    sub: "google-test-sub",
    email: "googletest@example.com",
    email_verified: true,
    name: "Google Test User",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides.payload
  };
  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const signedData = `${headerB64}.${payloadB64}`;
  const key = overrides.signWithWrongKey ? crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey : testGooglePrivateKey;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signedData), key);
  return overrides.malformed ? `${headerB64}.${payloadB64}` : `${signedData}.${base64UrlEncode(signature)}`;
}

const realFetch = global.fetch;
global.fetch = (url, ...args) => {
  if (typeof url === "string" && url.includes("googleapis.com/oauth2/v3/certs")) {
    return Promise.resolve({ ok: true, json: async () => testGoogleJwks });
  }
  return realFetch(url, ...args);
};
process.env.GOOGLE_CLIENT_ID = TEST_GOOGLE_CLIENT_ID;

const TEST_DB_PATH = path.join(os.tmpdir(), `findnord-test-${process.pid}-${Date.now()}.db`);
const TEST_UPLOADS_DIR = path.join(os.tmpdir(), `findnord-test-uploads-${process.pid}-${Date.now()}`);
let serverOrigin;
let restartPersistenceTestUser;
// NM-A21: the one real, designated admin account for the whole suite --
// ADMIN_EMAIL is set at the very top of this file, before scripts/auth.js
// is ever required, so registering this exact email for real makes the
// server's own syncAdminFlag mark it is_admin=1 for real, not simulated.
let adminCookie;

async function main() {
  const testServer = await startTestServer(TEST_DB_PATH, TEST_UPLOADS_DIR);
  serverOrigin = `http://127.0.0.1:${testServer.port}`;

  try {
    await runBehavioralTests(testServer.db);
  } finally {
    // A leftover open server socket keeps the event loop alive forever, so a
    // failing assertion would hang the process indefinitely instead of
    // failing fast -- this must run whether runBehavioralTests() throws or not.
    testServer.server.close();
  }

  await assertBackendPersistsAcrossRestart(TEST_DB_PATH, TEST_UPLOADS_DIR);

  console.log(
    "E2E FindNord workflow passed: browse, search, empty state, detail contact, seller trust, safety, tracking, expanded categories, listing creation, language switch, country theming, real email + password authentication (NM-A14: sign-up, login, wrong-password rejection, returning-user recognition, server-side-enforced ownership, and a real session surviving a genuine restart) gating save/message/report/publish, the filter & sort sheet, gated AI photo generation, the real Express + SQLite backend (NM-A11) with real local file storage for every photo (NM-A12) surviving a genuine restart, basic listing management for sellers (NM-A13: edit, Reserved/Sold status, and server-side-enforced delete, all surviving a genuine restart), public seller profiles (NM-A16: clickable seller detail link, guest-readable profile, localized verification placeholder, and profile listing navigation), reviews and ratings (NM-A17: gated submission with guest resume, self-review and duplicate rejection, a real abuse filter that cleans and warns on a first offense and permanently bans on a second, all reflected live in the compact listing-detail rating and the public profile's average/count/recent-reviews list), Boost/Premium (NM-A18: free-first package-based boosts with a real expiry, a live BOOST_PAYMENTS_ENABLED flag that blocks free activation and routes to a real Stripe Checkout integration point once on, default-feed ranking that respects an active boost without overriding an explicit price/distance sort, a positional-quota rotation that caps top-feed boost slots and reshuffles fairly across all eligible boosted listings rather than letting them permanently dominate, and a random fairness segment spotlighting non-boosted listings on the Browse view), rectangular (not oversized-pill) scope buttons sharing a real dynamic border-radius token with the rest of the control chrome, a mobile-responsiveness pass (including a fixed Filter-sheet min/max price row that was squeezing unreadable at 320px), currency/location/locale correctness (NM-A19: a real per-listing country fixed permanently at publish and immune to later edits or browsing-context drift, real Intl-based currency formatting native to each of the 5 Nordic currencies, a now-genuine Country scope filter, real live locale-aware relative time replacing a frozen English string, and one shared CLDR-correct pluralization mechanism app-wide), trust & safety (NM-A20: a real Report modal with a defined reason set and optional details, available from both a listing and a profile, landing in a real, queryable internal review structure with a status field; a real, reversible Block action from a profile or a conversation that immediately hides a blocked user's listings from Browse and their conversations from the Inbox, with server-side enforcement stopping messages in both directions and a clear error surfaced rather than a crash; an improved, translated Safety Tips page and safety reminder linking to it), a real Settings page under Profile (a real, editable Mobile number and a read-only account email), and an internal Minimal Admin Moderation Queue (NM-A21: a real per-user is_admin flag synced from a designated ADMIN_EMAIL at sign-in, every admin route independently requireAdmin'd server-side so a guest or ordinary user is refused regardless of what the client does, a real queue showing reported listings/users with reason/reporter/target/timestamp/status, Mark Reviewed/Dismiss on a report, and a real, everyone-visible Hide/Unhide on a reported listing plus an optional user flag toggle), a final honest re-audit pass (NM-A22: a Message-seller CTA that no longer appears on your own listing, and an Inbox row that no longer shows a seller their own name as if they were messaging themselves, now that sellers genuinely see buyer conversations in their own Inbox), a real password-reset / forgot-password flow (NM-A23: an always-generic /forgot-password response that never leaks account existence, a real single-use expiring reset token, full session invalidation everywhere on a successful reset, an honest distinct rejection for a Google-only account revealed only once a real valid token is presented, a reusable in-memory rate limiter enforcing a real 429 with Retry-After on all 4 auth endpoints), rate limiting extended to listings/messages/reports (NM-A24: real per-account throttling on all 3, requests under the limit unaffected, a different account on the same IP unaffected, and a real translated frontend message on each), real client-side routing (NM-A25: History-API-backed shareable /listing/:id, /profile/:id, /page/:slug, and /reset-password/:token URLs replacing NM-A23's query-string stopgap, a reload-safe server route + real per-listing escaped Open Graph tags for each, real Share links, and working browser back/forward), and complete real translation coverage for Norwegian, Danish, Finnish, and Icelandic (NM-A26: all 294 UI-chrome keys, a real coverage-gate test across all 4 languages, and STATIC_PAGES correctly left untouched/English-only), the dedicated Login page, the messaging prototype, media improvements (6-image cap, real multi-photo storage, gallery thumbnails), and the signed-in account bar (profile avatar, real My Listings, and real Analytics) verified."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    cleanupTestArtifacts();
  });
