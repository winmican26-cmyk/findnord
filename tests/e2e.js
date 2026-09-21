const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { startServer } = require("../scripts/server");

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
assert.match(html, /https:\/\/static\.ads-twitter\.com\/uwt\.js/);
assert.match(html, /twq\('config','rfixf'\)/);
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
assert.match(css, /\.scope,\s*\n\.chip\s*{[^}]*border-radius: 999px;/, "condition/seller-type/category chips must be full pills, not rounded rectangles");

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
assert.match(js, /no: {},\s*\n\s*da: {},\s*\n\s*fi: {},\s*\n\s*is: {}/);
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
assert.match(html, /<script src="data-service\.js"><\/script>\s*\n\s*<script src="app\.js">/, "data-service.js must load before app.js");

// --- Dedicated Login/Sign-up page (accessible from You, not just the interrupted-action modal) ---
assert.match(html, /id="login-view"/);
assert.match(html, /src="assets\/login-hero\.png"/, "the user's own illustration must be used as the login hero image");
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
assert.match(js, /async function toggleBoost\(listingId\)/);
assert.match(js, /listing\.sellerId !== currentUser\.id/, "boosting must check real ownership, not just whether someone is signed in");
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
["users", "listings", "listing_images", "conversations", "conversation_participants", "messages", "saved_items", "reports"].forEach((table) => {
  assert.match(schemaSql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table} `), `schema must define the ${table} table`);
});

assert.match(seedDataJs, /id: "Vehicles", label: "Vehicles", featured: true, subtypes: \["Cars", "Motorcycles", "Trucks & Vans", "Boats", "Parts"\]/);
assert.match(seedDataJs, /id: "Real Estate", label: "Real Estate", featured: true, subtypes: \["For Sale", "For Rent", "Land", "Commercial"\]/);
assert.match(seedDataJs, /images: \[/, "at least one seed listing must have a real multi-image array to seed listing_images with");

const dbJs = fs.readFileSync(path.join(root, "scripts", "db.js"), "utf8");
assert.match(dbJs, /function openDatabase\(dbPath, options = \{\}\)/);
assert.match(dbJs, /function seedIfEmpty\(db\)/, "first run must migrate the seed data into real rows");
assert.match(dbJs, /require\("better-sqlite3"\)/);

const apiJs = fs.readFileSync(path.join(root, "scripts", "api.js"), "utf8");
[
  ["get", "/categories"],
  ["get", "/listings"],
  ["post", "/listings"],
  ["patch", "/listings/:id"],
  ["post", "/saved-items/toggle"],
  ["get", "/saved-items/all"],
  ["post", "/reports"],
  ["post", "/conversations/start-or-get"],
  ["post", "/conversations/:id/messages"]
].forEach(([method, routePath]) => {
  assert.match(apiJs, new RegExp(`router\\.${method}\\("${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `API must expose ${method.toUpperCase()} ${routePath}`);
});

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
assert.match(authJs, /res\.status\(201\)\.json\(\{ id, name, email \}\);/, "the register response must never echo the password or its hash back");
assert.match(authJs, /res\.json\(\{ id: user\.id, name: user\.name, email: user\.email \}\);/, "the login response must never echo the password or its hash back");

assert.match(serverJsForUploads, /app\.use\(attachSession\(db\)\)/, "every request must get a real session attached");
assert.match(serverJsForUploads, /app\.use\("\/api\/auth", createAuthRouter\(db\)\)/);
assert.match(serverJsForUploads, /requireSession, handleGenerateImage/, "the real-money AI proxy must also be gated server-side, not just by the client");

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
    "auth-error",
    "auth-continue-button",
    "auth-mode-toggle",
    "auth-guest-button",
    "auth-modal-close",
    "auth-form",
    "auth-google-signin",
    "auth-divider",
    "auth-divider-text",
    "compose-modal",
    "compose-modal-title",
    "compose-message-input",
    "compose-cancel-button",
    "compose-send-button",
    "compose-modal-close",
    "toast",
    "active-filter-chips",
    "sort-indicator",
    "filter-sheet",
    "filter-sheet-title",
    "filter-sheet-close",
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
    "login-error",
    "login-continue-button",
    "login-mode-toggle",
    "login-guest-button",
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
    "seller-profile"
  ];
  const map = Object.fromEntries(ids.map((id) => [id, new Element("div")]));
  map["sell-subtype-field"].hidden = true;
  map["auth-modal"].hidden = true;
  map["compose-modal"].hidden = true;
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
  "profile-view"
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

async function runBehavioralTests() {
  const firstBootstrap = vm.runInNewContext(combinedJs, { document, fetch: makeTestFetch() });
  await firstBootstrap;

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
  /aria-label="Open listing: iPhone 14, 128 GB, 5 900 kr, sponsored, Fresh, Solna, 6\.8 km away"/
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
const context = vm.createContext({
  document,
  fetch: makeTestFetch(),
  FileReader: FakeFileReader,
  Image: FakeImage,
  navigator: fakeNavigator,
  window: { location: { href: "http://localhost:4173/" }, addEventListener() {} }
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
    body: JSON.stringify({ name, email, password })
  });
  const cookie = (response.headers.get("set-cookie") || "").split(";")[0];
  const user = await response.json();
  return { user, cookie };
}

// Re-running the script re-initializes everything against the same shared
// mock elements; confirms the expanded seed data renders end to end again.
assert.equal(elements["result-count"].textContent, "8 listings");
assert.match(elements["listing-grid"].innerHTML, /Volvo V60/);

context.openListing("iphone-14");
assert.match(elements["listing-detail"].innerHTML, /Message seller/);
assert.match(elements["listing-detail"].innerHTML, /Hi, is this still available\?/);
assert.match(elements["listing-detail"].innerHTML, /Professional seller/);
assert.match(elements["listing-detail"].innerHTML, /Meet safely/);

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
elements["toast"].hidden = true;
elements["toast"].textContent = "";
await context.handleShareClick("iphone-14");
assert.equal(fakeClipboard.lastWrittenText, "iPhone 14, 128 GB — 5 900 kr http://localhost:4173/");
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

// Price formatting.
assert.equal(context.formatPrice("1200"), "1 200 kr");
assert.equal(context.formatPrice(""), "");

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
assert.match(elements["sell-preview"].innerHTML, /900 kr/);

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
assert.match(elements["listing-detail"].innerHTML, /aria-label="Message Test Seller about Test kayak, barely used"/);

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
await context.handleReportClick("iphone-14");
assert.equal(elements["toast"].hidden, true, "a guest's report must not go through yet");
assert.equal(elements["auth-modal"].hidden, false);
context.dismissAuthModal();
assert.equal(elements["auth-modal"].hidden, true, "Continue as Guest must dismiss the prompt");
assert.equal(elements["toast"].hidden, true, "Continue as Guest must NOT resume the pending report -- guests cannot report anymore");
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

// A real, successful sign-up.
elements["auth-password-input"].value = "realpassword1";
const newUser = await context.submitAuthForm("auth", "register");
assert.ok(newUser, "a valid registration must succeed");
assert.equal(newUser.email, "newperson@example.com");
assert.equal(typeof newUser.id, "string");
assert.equal(Object.prototype.hasOwnProperty.call(newUser, "password"), false, "the password must never be echoed back, hashed or otherwise");
await context.signOutUser();

// Registering the SAME email again must be rejected -- one real account per email.
context.setAuthMode("auth", "register");
elements["auth-name-input"].value = "Impersonator";
elements["auth-email-input"].value = "newperson@example.com";
elements["auth-password-input"].value = "differentpassword1";
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
  body: JSON.stringify({ name: "Password First", email: "linkme@example.com", password: DEFAULT_TEST_PASSWORD })
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
assert.match(elements["active-filter-chips"].innerHTML, /Price: 500–3000 kr/);
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
await loginTestUser("ola@example.com", DEFAULT_TEST_PASSWORD);

context.renderMyListings();
assert.match(elements["my-listings-content"].innerHTML, /Analytics test bicycle/);
assert.match(elements["my-listings-content"].innerHTML, new RegExp(`data-toggle-boost="${analyticsListing.id}"`));
assert.doesNotMatch(elements["my-listings-content"].innerHTML, /class="account-action boosted"/, "a fresh listing must not show as boosted");

// Boosting is a real mutation: it actually sets sponsored on the listing record.
function findCardHtml(id) {
  const match = elements["listing-grid"].innerHTML.match(new RegExp(`<article class="listing-card" data-id="${id}">[\\s\\S]*?</article>`));
  return match ? match[0] : "";
}

await context.toggleBoost(analyticsListing.id);
assert.equal(context.getMyListings()[0].sponsored, true, "boosting must set sponsored=true on the real listing, not just update a UI flag");
assert.match(
  findCardHtml(analyticsListing.id),
  /Sponsored/,
  "the boosted listing's real Browse card must show the Sponsored badge"
);
context.renderMyListings();
assert.match(elements["my-listings-content"].innerHTML, /class="account-action boosted"/);

// Ownership check: boosting a listing you do NOT own must be a silent no-op, not a bypassable UI-only gate.
await context.toggleBoost("oak-table");
assert.doesNotMatch(findCardHtml("oak-table"), /Sponsored/, "a user must not be able to boost a listing they don't own");

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
assert.equal(editedListing.price, "650 kr");
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

// --- NM-A3: i18n mechanism (en + sv fully wired; no/da/fi/is fall back to en) ---
assert.equal(context.t("nav.browse", "en"), "Browse");
assert.equal(context.t("nav.browse", "sv"), "Bläddra");
assert.equal(context.t("nav.browse", "no"), "Browse", "unfinished languages must fall back to English, not a raw key");

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

// NM-A14: register a real account for the restart-persistence check below,
// while the server is still up -- its own real session cookie, captured now
// and reused (unmodified) against the REOPENED server after a real restart.
restartPersistenceTestUser = await registerRealUserDirectly("Restart Persistence Tester", "restart-persistence@example.com", DEFAULT_TEST_PASSWORD);
}

const serverScript = fs.readFileSync(path.join(root, "scripts", "server.js"), "utf8");
assert.match(serverScript, /app\.use\(express\.static\(root\)\)/, "the real Express server must serve the SPA's static files");
assert.match(serverScript, /app\.post\("\/api\/generate-image"/, "server must expose the generate-image endpoint");
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

async function main() {
  const testServer = await startTestServer(TEST_DB_PATH, TEST_UPLOADS_DIR);
  serverOrigin = `http://127.0.0.1:${testServer.port}`;

  try {
    await runBehavioralTests();
  } finally {
    // A leftover open server socket keeps the event loop alive forever, so a
    // failing assertion would hang the process indefinitely instead of
    // failing fast -- this must run whether runBehavioralTests() throws or not.
    testServer.server.close();
  }

  await assertBackendPersistsAcrossRestart(TEST_DB_PATH, TEST_UPLOADS_DIR);

  console.log(
    "E2E FindNord workflow passed: browse, search, empty state, detail contact, seller trust, safety, tracking, expanded categories, listing creation, language switch, country theming, real email + password authentication (NM-A14: sign-up, login, wrong-password rejection, returning-user recognition, server-side-enforced ownership, and a real session surviving a genuine restart) gating save/message/report/publish, the filter & sort sheet, gated AI photo generation, the real Express + SQLite backend (NM-A11) with real local file storage for every photo (NM-A12) surviving a genuine restart, basic listing management for sellers (NM-A13: edit, Reserved/Sold status, and server-side-enforced delete, all surviving a genuine restart), public seller profiles (NM-A16: clickable seller detail link, guest-readable profile, localized verification placeholder, and profile listing navigation), the dedicated Login page, the messaging prototype, media improvements (6-image cap, real multi-photo storage, gallery thumbnails), and the signed-in account bar (profile avatar, real My Listings, real Boost with ownership checks, and real Analytics) verified."
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
