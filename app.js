// --- Data layer (NM-A7) ---
// Category taxonomy and listings used to be literal arrays declared right
// here. They now live in data-service.js (the "database") and are fetched
// through DataService at bootstrap into these local caches. Every render
// function below still reads these two variables synchronously — only the
// code that FETCHES or MUTATES them (bootstrap, commitPublish, etc.) is
// async. This keeps the render/filter/sort code completely unchanged while
// making the actual data access swappable for a real backend later.
let categoryTaxonomy = [];
let listings = [];

// --- i18n groundwork: English + Swedish are fully wired; the remaining Nordic
// languages are stubbed with the same key set so the switching mechanism,
// persistence, and fallback are real now and only translation content is
// left for the next slice (see EVIDENCE.md). ---
const translations = {
  en: {
    "brand.eyebrow": "Nearby marketplace",
    "nav.browse": "Browse",
    "nav.categories": "Categories",
    "nav.sell": "Sell",
    "nav.inbox": "Inbox",
    "nav.you": "You",
    "browse.heading": "Fresh finds near you",
    "browse.filter": "Filter",
    "browse.searchLabel": "Search",
    "browse.searchPlaceholder": "What are you looking for?",
    "empty.heading": "No exact matches nearby",
    "sell.heading": "Sell in under two minutes",
    "auth.eyebrow": "Sign in required",
    "auth.title": "Sign in to continue",
    "auth.body": "Save items, message sellers, publish listings, and report issues once you're signed in.",
    "auth.emailLabel": "Email",
    "auth.emailPlaceholder": "you@example.com",
    "auth.nameLabel": "Name",
    "auth.passwordLabel": "Password",
    "auth.continue": "Continue",
    "auth.guest": "Continue as Guest",
    "auth.close": "Close",
    "auth.loginButton": "Log in",
    "auth.registerButton": "Create account",
    "auth.modeToggleToRegister": "New to FindNord? Create an account",
    "auth.modeToggleToLogin": "Already have an account? Log in",
    "auth.errorInvalidCredentials": "Incorrect email or password.",
    "auth.errorEmailTaken": "That email is already registered. Try logging in instead.",
    "auth.errorPasswordTooShort": "Password must be at least 8 characters.",
    "auth.errorNameRequired": "Add your name.",
    "auth.errorGeneric": "Something went wrong. Try again.",
    "auth.errorGoogleEmailNotVerified": "That Google account's email isn't verified yet.",
    "auth.googleUnavailable": "Google sign-in is currently unavailable.",
    "auth.orContinueWithEmail": "or continue with email",
    "account.eyebrow": "Your activity",
    "account.heading": "Saved items, listings, and trust settings",
    "account.body": "Sign in when you want to save, message, sell, report, or create alerts.",
    "account.signedInEyebrow": "Signed in",
    "account.signedInHeading": "Welcome back",
    "account.emailLabel": "Signed in as",
    "account.signOut": "Sign out",
    "account.signInButton": "Sign in",
    "login.tagline": "The marketplace for the Scandinavians",
    "inbox.eyebrow": "Marketplace only",
    "inbox.signedOutBody": "Sign in to see your conversations.",
    "inbox.emptyBody": "Conversations start from a listing's Message seller button.",
    "inbox.unknownListing": "Listing",
    "thread.replyLabel": "Message",
    "thread.replyPlaceholder": "Write a message...",
    "thread.send": "Send",
    "compose.headingPrefix": "Message",
    "compose.send": "Send",
    "compose.cancel": "Cancel",
    "compose.sent": "Message sent. View it in your Inbox.",
    "report.sent": "Thanks — we've noted this report (mocked). Real moderation review arrives in a later slice.",
    "share.copied": "Link copied to clipboard.",
    "share.failed": "Couldn't share this listing.",
    "filter.title": "Filter & sort",
    "filter.sortLabel": "Sort by",
    "sort.recent": "Most recent",
    "sort.priceLow": "Lowest price",
    "sort.priceHigh": "Highest price",
    "sort.nearest": "Nearest",
    "sort.indicatorPrefix": "Sorted by",
    "filter.priceMinLabel": "Min price",
    "filter.priceMaxLabel": "Max price",
    "filter.conditionLabel": "Condition",
    "filter.sellerLabel": "Seller type",
    "filter.distanceLabel": "Distance",
    "filter.categoryLabel": "Category",
    "filter.subtypeLabel": "Type",
    "filter.categoryAll": "All categories",
    "distance.any": "Any distance",
    "distance.within5": "Within 5 km",
    "distance.within10": "Within 10 km",
    "distance.within25": "Within 25 km",
    "distance.within50": "Within 50 km",
    "distance.within100": "Within 100 km",
    "filter.clear": "Clear",
    "filter.reset": "Reset",
    "filter.apply": "Apply",
    "filter.close": "Close",
    "filter.activeFiltersLabel": "Active filters",
    "filter.priceChipPrefix": "Price",
    "ai.badge": "AI photo",
    "ai.buttonLabel": "Generate with AI",
    "ai.promptLabel": "Describe your item for AI (optional)",
    "ai.promptPlaceholder": "e.g. blue vintage bicycle",
    "ai.generating": "Generating photo...",
    "ai.success": "Photo added.",
    "ai.failed": "Couldn't generate a photo.",
    "ai.promptRequired": "Describe the item first, or add a title.",
    "ai.limitReached": "You've reached the 6-photo limit.",
    "detail.photoLabel": "Photo",
    "detail.morePhotos": "More photos",
    "sell.photosHint": "1–6 photos, up to 1 MB each. Tap Make cover to feature a different photo.",
    "photo.makeCover": "Make cover",
    "photo.uploadFailed": "Couldn't add that photo. Try a different image.",
    "account.actionCreate": "Create Sell Ad",
    "account.actionMessages": "Messages",
    "account.actionMyListings": "My Listings",
    "account.actionProfile": "Profile",
    "account.actionLogout": "Logout",
    "myListings.emptyBody": "You haven't published any listings yet.",
    "myListings.emptyCta": "Start selling",
    "myListings.boost": "Boost",
    "myListings.unboost": "Remove boost",
    "myListings.boosted": "Boosted",
    "account.actionBoost": "Boost Ads",
    "account.actionAnalytics": "Analytics",
    "analytics.signedOutBody": "Sign in to see your analytics.",
    "analytics.listings": "Listings",
    "analytics.saves": "Saves received",
    "analytics.conversations": "Conversations",
    "analytics.messages": "Messages received",
    "analytics.boosted": "Boosted",
    "sell.headingEdit": "Edit your listing",
    "sell.publishButton": "Publish listing",
    "sell.saveChangesButton": "Save changes",
    "myListings.edit": "Edit",
    "myListings.delete": "Delete",
    "myListings.deleteConfirm": "Confirm delete?",
    "myListings.deleted": "Listing deleted.",
    "myListings.editSaved": "Changes saved.",
    "myListings.statusLabel": "Status",
    "status.active": "Active",
    "status.reserved": "Reserved",
    "status.sold": "Sold",
    "profile.memberSince": "Member since",
    "profile.activeListingSingular": "active listing",
    "profile.activeListingsPlural": "active listings",
    "profile.verifiedBadge": "Verified",
    "profile.unverifiedBadge": "Not verified yet",
    "profile.noActiveListings": "This seller has no active listings right now.",
    "profile.notFound": "This profile could not be found.",
    "profile.listingsTitle": "Active listings",
    "filter.regionLabel": "Region",
    "filter.regionPlaceholder": "Select or type a region",
    "sell.regionLabel": "Region",
    "sell.regionPlaceholder": "Select or type your region",
    "sidebar.browseAll": "Browse all",
    "sidebar.createListing": "Create new listing",
    "sidebar.locationTitle": "Location",
    "sidebar.searchLabel": "Search Marketplace"
  },
  sv: {
    "brand.eyebrow": "Marknad i närheten",
    "nav.browse": "Bläddra",
    "nav.categories": "Kategorier",
    "nav.sell": "Sälj",
    "nav.inbox": "Inkorg",
    "nav.you": "Du",
    "browse.heading": "Färska fynd nära dig",
    "browse.filter": "Filter",
    "browse.searchLabel": "Sök",
    "browse.searchPlaceholder": "Vad letar du efter?",
    "empty.heading": "Inga exakta träffar i närheten",
    "sell.heading": "Sälj på under två minuter",
    "auth.eyebrow": "Inloggning krävs",
    "auth.title": "Logga in för att fortsätta",
    "auth.body": "Spara annonser, meddela säljare, publicera annonser och anmäl innehåll när du är inloggad.",
    "auth.emailLabel": "E-post",
    "auth.emailPlaceholder": "du@exempel.se",
    "auth.nameLabel": "Namn",
    "auth.passwordLabel": "Lösenord",
    "auth.continue": "Fortsätt",
    "auth.guest": "Fortsätt som gäst",
    "auth.close": "Stäng",
    "auth.loginButton": "Logga in",
    "auth.registerButton": "Skapa konto",
    "auth.modeToggleToRegister": "Ny på FindNord? Skapa ett konto",
    "auth.modeToggleToLogin": "Har du redan ett konto? Logga in",
    "auth.errorInvalidCredentials": "Fel e-post eller lösenord.",
    "auth.errorEmailTaken": "E-postadressen är redan registrerad. Prova att logga in istället.",
    "auth.errorPasswordTooShort": "Lösenordet måste vara minst 8 tecken.",
    "auth.errorNameRequired": "Ange ditt namn.",
    "auth.errorGeneric": "Något gick fel. Försök igen.",
    "auth.errorGoogleEmailNotVerified": "E-postadressen för det Google-kontot är inte verifierad än.",
    "auth.googleUnavailable": "Google-inloggning är inte tillgänglig just nu.",
    "auth.orContinueWithEmail": "eller fortsätt med e-post",
    "account.eyebrow": "Din aktivitet",
    "account.heading": "Sparat, annonser och förtroendeinställningar",
    "account.body": "Logga in för att spara, meddela, sälja, anmäla eller skapa bevakningar.",
    "account.signedInEyebrow": "Inloggad",
    "account.signedInHeading": "Välkommen tillbaka",
    "account.emailLabel": "Inloggad som",
    "account.signOut": "Logga ut",
    "account.signInButton": "Logga in",
    "login.tagline": "Marknadsplatsen för skandinaver",
    "inbox.eyebrow": "Endast marknadsplatsen",
    "inbox.signedOutBody": "Logga in för att se dina konversationer.",
    "inbox.emptyBody": "Konversationer startar från en annons knapp Meddela säljare.",
    "inbox.unknownListing": "Annons",
    "thread.replyLabel": "Meddelande",
    "thread.replyPlaceholder": "Skriv ett meddelande...",
    "thread.send": "Skicka",
    "compose.headingPrefix": "Meddela",
    "compose.send": "Skicka",
    "compose.cancel": "Avbryt",
    "compose.sent": "Meddelandet har skickats. Se det i din inkorg.",
    "report.sent": "Tack — vi har noterat anmälan (simulerat). Riktig granskning kommer i en senare del.",
    "share.copied": "Länken har kopierats.",
    "share.failed": "Kunde inte dela annonsen.",
    "filter.title": "Filtrera och sortera",
    "filter.sortLabel": "Sortera efter",
    "sort.recent": "Senaste",
    "sort.priceLow": "Lägst pris",
    "sort.priceHigh": "Högst pris",
    "sort.nearest": "Närmast",
    "sort.indicatorPrefix": "Sorterat efter",
    "filter.priceMinLabel": "Lägsta pris",
    "filter.priceMaxLabel": "Högsta pris",
    "filter.conditionLabel": "Skick",
    "filter.sellerLabel": "Säljartyp",
    "filter.distanceLabel": "Avstånd",
    "filter.categoryLabel": "Kategori",
    "filter.subtypeLabel": "Typ",
    "filter.categoryAll": "Alla kategorier",
    "distance.any": "Alla avstånd",
    "distance.within5": "Inom 5 km",
    "distance.within10": "Inom 10 km",
    "distance.within25": "Inom 25 km",
    "distance.within50": "Inom 50 km",
    "distance.within100": "Inom 100 km",
    "filter.clear": "Rensa",
    "filter.reset": "Återställ",
    "filter.apply": "Använd",
    "filter.close": "Stäng",
    "filter.activeFiltersLabel": "Aktiva filter",
    "filter.priceChipPrefix": "Pris",
    "ai.badge": "AI-foto",
    "ai.buttonLabel": "Skapa med AI",
    "ai.promptLabel": "Beskriv föremålet för AI (valfritt)",
    "ai.promptPlaceholder": "t.ex. blå vintagecykel",
    "ai.generating": "Skapar foto...",
    "ai.success": "Foto tillagt.",
    "ai.failed": "Kunde inte skapa ett foto.",
    "ai.promptRequired": "Beskriv föremålet först, eller lägg till en titel.",
    "ai.limitReached": "Du har nått gränsen på 6 foton.",
    "detail.photoLabel": "Foto",
    "detail.morePhotos": "Fler foton",
    "sell.photosHint": "1–6 foton, max 1 MB vardera. Tryck på Gör till omslag för att välja ett annat foto.",
    "photo.makeCover": "Gör till omslag",
    "photo.uploadFailed": "Kunde inte lägga till fotot. Prova en annan bild.",
    "account.actionCreate": "Skapa annons",
    "account.actionMessages": "Meddelanden",
    "account.actionMyListings": "Mina annonser",
    "account.actionProfile": "Profil",
    "account.actionLogout": "Logga ut",
    "myListings.emptyBody": "Du har inte publicerat några annonser än.",
    "myListings.emptyCta": "Börja sälja",
    "myListings.boost": "Boosta",
    "myListings.unboost": "Ta bort boost",
    "myListings.boosted": "Boostad",
    "account.actionBoost": "Boosta annonser",
    "account.actionAnalytics": "Statistik",
    "analytics.signedOutBody": "Logga in för att se din statistik.",
    "analytics.listings": "Annonser",
    "analytics.saves": "Sparade av andra",
    "analytics.conversations": "Konversationer",
    "analytics.messages": "Mottagna meddelanden",
    "analytics.boosted": "Boostade",
    "sell.headingEdit": "Redigera din annons",
    "sell.publishButton": "Publicera annons",
    "sell.saveChangesButton": "Spara ändringar",
    "myListings.edit": "Redigera",
    "myListings.delete": "Ta bort",
    "myListings.deleteConfirm": "Bekräfta borttagning?",
    "myListings.deleted": "Annonsen togs bort.",
    "myListings.editSaved": "Ändringarna sparades.",
    "myListings.statusLabel": "Status",
    "status.active": "Aktiv",
    "status.reserved": "Reserverad",
    "status.sold": "Såld",
    "profile.memberSince": "Medlem sedan",
    "profile.activeListingSingular": "aktiv annons",
    "profile.activeListingsPlural": "aktiva annonser",
    "profile.verifiedBadge": "Verifierad",
    "profile.unverifiedBadge": "Inte verifierad än",
    "profile.noActiveListings": "Den här säljaren har inga aktiva annonser just nu.",
    "profile.notFound": "Den här profilen kunde inte hittas.",
    "profile.listingsTitle": "Aktiva annonser",
    "filter.regionLabel": "Region",
    "filter.regionPlaceholder": "Välj eller skriv en region",
    "sell.regionLabel": "Region",
    "sell.regionPlaceholder": "Välj eller skriv din region",
    "sidebar.browseAll": "Bläddra bland allt",
    "sidebar.createListing": "Skapa ny annons",
    "sidebar.locationTitle": "Plats",
    "sidebar.searchLabel": "Sök på Marketplace"
  },
  // Stubs: same key set as `en`, translation content lands in the language slice.
  no: {},
  da: {},
  fi: {},
  is: {}
};

let currentLanguage = "en";

function t(key, lang) {
  const dict = translations[lang || currentLanguage] || {};
  return dict[key] ?? translations.en[key] ?? key;
}

function loadSavedLanguage() {
  let saved = null;
  try {
    if (typeof localStorage !== "undefined") saved = localStorage.getItem("fn_lang");
  } catch (error) {
    saved = null;
  }
  currentLanguage = saved && translations[saved] ? saved : "en";
}

function applyTranslations() {
  const staticTargets = {
    "brand-eyebrow": "brand.eyebrow",
    "browse-title": "browse.heading",
    "filter-button-label": "browse.filter",
    "search-label-text": "browse.searchLabel",
    "empty-heading": "empty.heading",
    "sell-title": "sell.heading",
    "sidebar-browse-label": "sidebar.browseAll",
    "sidebar-categories-label": "nav.categories",
    "sidebar-inbox-label": "nav.inbox",
    "sidebar-create-label": "sidebar.createListing",
    "sidebar-location-title": "sidebar.locationTitle",
    "sidebar-categories-title": "nav.categories",
    "sidebar-search-label": "sidebar.searchLabel",
    "auth-modal-eyebrow": "auth.eyebrow",
    "auth-modal-title": "auth.title",
    "auth-modal-body": "auth.body",
    "auth-name-label": "auth.nameLabel",
    "auth-email-label": "auth.emailLabel",
    "auth-password-label": "auth.passwordLabel",
    "auth-guest-button": "auth.guest",
    "auth-divider-text": "auth.orContinueWithEmail",
    "login-divider-text": "auth.orContinueWithEmail",
    "compose-cancel-button": "compose.cancel",
    "compose-send-button": "compose.send",
    "filter-sheet-title": "filter.title",
    "filter-sort-label": "filter.sortLabel",
    "filter-sort-recent": "sort.recent",
    "filter-sort-price-low": "sort.priceLow",
    "filter-sort-price-high": "sort.priceHigh",
    "filter-sort-nearest": "sort.nearest",
    "filter-price-min-label": "filter.priceMinLabel",
    "filter-price-max-label": "filter.priceMaxLabel",
    "filter-condition-label": "filter.conditionLabel",
    "filter-seller-label": "filter.sellerLabel",
    "filter-distance-label": "filter.distanceLabel",
    "filter-category-label": "filter.categoryLabel",
    "filter-subtype-label": "filter.subtypeLabel",
    "filter-distance-any": "distance.any",
    "filter-distance-5": "distance.within5",
    "filter-distance-10": "distance.within10",
    "filter-distance-25": "distance.within25",
    "filter-distance-50": "distance.within50",
    "filter-distance-100": "distance.within100",
    "filter-region-label": "filter.regionLabel",
    "sell-region-label": "sell.regionLabel",
    "filter-clear-button": "filter.clear",
    "filter-reset-button": "filter.reset",
    "filter-apply-button": "filter.apply",
    "generate-ai-photo": "ai.buttonLabel",
    "ai-photo-prompt-label": "ai.promptLabel",
    "login-name-label": "auth.nameLabel",
    "login-email-label": "auth.emailLabel",
    "login-password-label": "auth.passwordLabel",
    "login-guest-button": "auth.guest",
    "login-tagline": "login.tagline",
    "inbox-eyebrow": "inbox.eyebrow",
    "inbox-title": "nav.inbox",
    "thread-reply-label": "thread.replyLabel",
    "thread-send-button": "thread.send",
    "sell-photos-hint": "sell.photosHint",
    "sell-publish": "sell.publishButton",
    "my-listings-eyebrow": "account.eyebrow",
    "my-listings-title": "account.actionMyListings",
    "analytics-eyebrow": "account.eyebrow",
    "analytics-title": "account.actionAnalytics"
  };
  Object.entries(staticTargets).forEach(([id, key]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = t(key);
  });

  // The close buttons show a plain "×" glyph; only their accessible name is
  // translated, so textContent must not be overwritten here.
  const ariaLabelTargets = {
    "auth-modal-close": "auth.close",
    "compose-modal-close": "auth.close",
    "filter-sheet-close": "filter.close"
  };
  Object.entries(ariaLabelTargets).forEach(([id, key]) => {
    const element = document.getElementById(id);
    if (element) element.setAttribute("aria-label", t(key));
  });

  const activeFilterChips = document.getElementById("active-filter-chips");
  if (activeFilterChips) activeFilterChips.setAttribute("aria-label", t("filter.activeFiltersLabel"));

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.setAttribute("placeholder", t("browse.searchPlaceholder"));

  const sidebarSearchInput = document.getElementById("sidebar-search-input");
  if (sidebarSearchInput) sidebarSearchInput.setAttribute("placeholder", t("sidebar.searchLabel"));

  const filterRegionInput = document.getElementById("filter-region-input");
  if (filterRegionInput) filterRegionInput.setAttribute("placeholder", t("filter.regionPlaceholder"));

  const sellRegionInput = document.getElementById("sell-region-input");
  if (sellRegionInput) sellRegionInput.setAttribute("placeholder", t("sell.regionPlaceholder"));

  const authEmailInput = document.getElementById("auth-email-input");
  if (authEmailInput) authEmailInput.setAttribute("placeholder", t("auth.emailPlaceholder"));

  const aiPromptInput = document.getElementById("ai-photo-prompt");
  if (aiPromptInput) aiPromptInput.setAttribute("placeholder", t("ai.promptPlaceholder"));

  const loginEmailInput = document.getElementById("login-email-input");
  if (loginEmailInput) loginEmailInput.setAttribute("placeholder", t("auth.emailPlaceholder"));

  const threadReplyInput = document.getElementById("thread-reply-input");
  if (threadReplyInput) threadReplyInput.setAttribute("placeholder", t("thread.replyPlaceholder"));

  renderInbox();
  renderMyListings();
  renderProfileAvatar();
  renderAccountActions();
  setAuthMode("auth", authMode);
  setAuthMode("login", authMode);
  refreshGoogleSignInUi();
  setSellFormMode(Boolean(editingListingId));
  refreshOpenGalleryLanguage();
  renderFilterCategorySelectOptions();
  renderSortIndicator();
  if (activeView === "analytics-view") renderAnalytics();

  const navKeyMap = {
    "browse-view": "nav.browse",
    "categories-view": "nav.categories",
    "sell-view": "nav.sell",
    "inbox-view": "nav.inbox",
    "you-view": "nav.you"
  };
  document.querySelectorAll(".nav-item").forEach((item) => {
    const key = navKeyMap[item.dataset.view];
    const label = item.querySelector(".nav-label");
    if (key && label) label.textContent = t(key);
  });

  if (document.documentElement) document.documentElement.lang = currentLanguage;
  renderAccountPanel();
}

function setLanguage(lang) {
  currentLanguage = translations[lang] ? lang : "en";
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem("fn_lang", currentLanguage);
  } catch (error) {
    // Storage can be unavailable (private browsing, blocked cookies); the UI still works.
  }
  applyTranslations();
}

// --- Country-colored navigation groundwork: real color mapping + a working
// theme-application function. No country switcher UI yet (that lands with
// geographic browse modes); Sweden is applied as today's fixed default so
// the mechanism is visibly live now. ---
const countryThemes = {
  Sweden: { primary: "#006AA7", accent: "#FECC02" },
  Denmark: { primary: "#C8102E", accent: "#FFFFFF" },
  Norway: { primary: "#BA0C2F", accent: "#00205B" },
  Finland: { primary: "#003580", accent: "#FFFFFF" },
  Iceland: { primary: "#02529C", accent: "#DC1E35" }
};

let activeCountry = "Sweden";

function applyCountryTheme(country) {
  const theme = countryThemes[country] || countryThemes.Sweden;
  activeCountry = countryThemes[country] ? country : "Sweden";
  const root = document.documentElement;
  if (root && root.style && typeof root.style.setProperty === "function") {
    root.style.setProperty("--country-primary", theme.primary);
    root.style.setProperty("--country-accent", theme.accent);
  }
  renderRegionDatalist("sell-region-datalist");
  renderRegionDatalist("filter-region-datalist");
}

// Real administrative regions (Sweden's län, Norway's fylker, Denmark's
// regioner, Finland's maakunnat, Iceland's landshlutar) -- keyed by the same
// country names countryThemes already uses. The State/Region field is a
// combobox (a text input with a <datalist>), so a user can pick one of these
// real values OR type their own -- this list is suggestions, not a closed
// enum, which is also why getFilteredListings() below matches it with a
// substring compare rather than requiring an exact match.
const REGIONS_BY_COUNTRY = {
  Sweden: [
    "Blekinge",
    "Dalarna",
    "Gotland",
    "Gävleborg",
    "Halland",
    "Jämtland",
    "Jönköping",
    "Kalmar",
    "Kronoberg",
    "Norrbotten",
    "Örebro",
    "Östergötland",
    "Skåne",
    "Södermanland",
    "Stockholm",
    "Uppsala",
    "Värmland",
    "Västerbotten",
    "Västernorrland",
    "Västmanland",
    "Västra Götaland"
  ],
  Norway: [
    "Agder",
    "Akershus",
    "Buskerud",
    "Finnmark",
    "Innlandet",
    "Møre og Romsdal",
    "Nordland",
    "Oslo",
    "Østfold",
    "Rogaland",
    "Telemark",
    "Troms",
    "Trøndelag",
    "Vestfold",
    "Vestland"
  ],
  Denmark: ["Hovedstaden", "Midtjylland", "Nordjylland", "Sjælland", "Syddanmark"],
  Finland: [
    "Ahvenanmaa",
    "Etelä-Karjala",
    "Etelä-Pohjanmaa",
    "Etelä-Savo",
    "Kainuu",
    "Kanta-Häme",
    "Keski-Pohjanmaa",
    "Keski-Suomi",
    "Kymenlaakso",
    "Lappi",
    "Pirkanmaa",
    "Pohjanmaa",
    "Pohjois-Karjala",
    "Pohjois-Pohjanmaa",
    "Pohjois-Savo",
    "Päijät-Häme",
    "Satakunta",
    "Uusimaa",
    "Varsinais-Suomi"
  ],
  Iceland: [
    "Austurland",
    "Höfuðborgarsvæðið",
    "Norðurland eystra",
    "Norðurland vestra",
    "Suðurland",
    "Suðurnes",
    "Vestfirðir",
    "Vesturland"
  ]
};

// Shared by both the Sell form and the Filter sheet's Region combobox --
// repopulated whenever the active country changes (today that's only ever
// Sweden at bootstrap, but this already reads from activeCountry so real
// country switching, whenever it lands, needs no changes here).
// `regions` defaults to every real region of the active country; passing a
// narrower list (see regionsWithinRadius below) is how the Filter sheet's
// Distance field visibly narrows the Region combobox's own suggestions.
function renderRegionDatalist(datalistId, regions) {
  const datalist = document.getElementById(datalistId);
  if (!datalist) return;
  const list = regions || REGIONS_BY_COUNTRY[activeCountry] || REGIONS_BY_COUNTRY.Sweden;
  datalist.innerHTML = list.map((region) => `<option value="${region}"></option>`).join("");
}

// Approximate real-world centroid coordinates (city-level, not survey-grade
// -- consistent with the rest of this prototype's "approximate" geography,
// e.g. every listing's own fake `distance` string) for every region in
// REGIONS_BY_COUNTRY, keyed the same way. Powers two things: detecting which
// country/region a real geolocated user is closest to, and computing which
// regions fall within a chosen Distance radius of the active location.
const REGION_COORDS = {
  Sweden: {
    Blekinge: { lat: 56.18, lng: 15.15 },
    Dalarna: { lat: 60.61, lng: 15.63 },
    Gotland: { lat: 57.47, lng: 18.49 },
    Gävleborg: { lat: 60.67, lng: 17.14 },
    Halland: { lat: 56.67, lng: 12.86 },
    Jämtland: { lat: 63.18, lng: 14.64 },
    Jönköping: { lat: 57.78, lng: 14.16 },
    Kalmar: { lat: 56.66, lng: 16.36 },
    Kronoberg: { lat: 56.88, lng: 14.81 },
    Norrbotten: { lat: 65.58, lng: 22.15 },
    Örebro: { lat: 59.27, lng: 15.21 },
    Östergötland: { lat: 58.41, lng: 15.62 },
    Skåne: { lat: 55.61, lng: 13.0 },
    Södermanland: { lat: 59.19, lng: 16.75 },
    Stockholm: { lat: 59.33, lng: 18.07 },
    Uppsala: { lat: 59.86, lng: 17.64 },
    Värmland: { lat: 59.4, lng: 13.51 },
    Västerbotten: { lat: 63.83, lng: 20.26 },
    Västernorrland: { lat: 62.39, lng: 17.31 },
    Västmanland: { lat: 59.61, lng: 16.55 },
    "Västra Götaland": { lat: 57.71, lng: 11.97 }
  },
  Norway: {
    Agder: { lat: 58.16, lng: 8.0 },
    Akershus: { lat: 59.95, lng: 11.05 },
    Buskerud: { lat: 59.74, lng: 10.2 },
    Finnmark: { lat: 70.0, lng: 25.0 },
    Innlandet: { lat: 60.79, lng: 11.07 },
    "Møre og Romsdal": { lat: 62.47, lng: 6.15 },
    Nordland: { lat: 67.28, lng: 14.4 },
    Oslo: { lat: 59.91, lng: 10.75 },
    Østfold: { lat: 59.22, lng: 10.93 },
    Rogaland: { lat: 58.97, lng: 5.73 },
    Telemark: { lat: 59.21, lng: 9.61 },
    Troms: { lat: 69.65, lng: 18.96 },
    Trøndelag: { lat: 63.43, lng: 10.39 },
    Vestfold: { lat: 59.27, lng: 10.41 },
    Vestland: { lat: 60.39, lng: 5.32 }
  },
  Denmark: {
    Hovedstaden: { lat: 55.68, lng: 12.57 },
    Midtjylland: { lat: 56.16, lng: 10.2 },
    Nordjylland: { lat: 57.05, lng: 9.92 },
    Sjælland: { lat: 55.44, lng: 11.79 },
    Syddanmark: { lat: 55.47, lng: 9.47 }
  },
  Finland: {
    Ahvenanmaa: { lat: 60.1, lng: 19.93 },
    "Etelä-Karjala": { lat: 61.06, lng: 28.19 },
    "Etelä-Pohjanmaa": { lat: 62.79, lng: 22.85 },
    "Etelä-Savo": { lat: 61.69, lng: 27.27 },
    Kainuu: { lat: 64.22, lng: 27.73 },
    "Kanta-Häme": { lat: 60.99, lng: 24.46 },
    "Keski-Pohjanmaa": { lat: 63.83, lng: 23.13 },
    "Keski-Suomi": { lat: 62.24, lng: 25.75 },
    Kymenlaakso: { lat: 60.87, lng: 26.7 },
    Lappi: { lat: 66.5, lng: 25.73 },
    Pirkanmaa: { lat: 61.5, lng: 23.79 },
    Pohjanmaa: { lat: 63.1, lng: 21.62 },
    "Pohjois-Karjala": { lat: 62.6, lng: 29.76 },
    "Pohjois-Pohjanmaa": { lat: 65.01, lng: 25.47 },
    "Pohjois-Savo": { lat: 62.9, lng: 27.68 },
    "Päijät-Häme": { lat: 60.98, lng: 25.66 },
    Satakunta: { lat: 61.49, lng: 21.8 },
    Uusimaa: { lat: 60.17, lng: 24.94 },
    "Varsinais-Suomi": { lat: 60.45, lng: 22.27 }
  },
  Iceland: {
    Austurland: { lat: 65.27, lng: 14.4 },
    Höfuðborgarsvæðið: { lat: 64.13, lng: -21.9 },
    "Norðurland eystra": { lat: 65.68, lng: -18.1 },
    "Norðurland vestra": { lat: 65.5, lng: -19.8 },
    Suðurland: { lat: 63.93, lng: -19.0 },
    Suðurnes: { lat: 63.98, lng: -22.55 },
    Vestfirðir: { lat: 65.9, lng: -22.0 },
    Vesturland: { lat: 64.85, lng: -21.8 }
  }
};

const DEFAULT_LOCATION_COORDS = REGION_COORDS.Sweden.Stockholm;

// The real reference point radius search and country auto-detection both
// measure from. Defaults to Stockholm (matching every other default in this
// app) until/unless a real geolocated position resolves -- see
// detectUserLocation() below.
let activeLocationCoords = DEFAULT_LOCATION_COORDS;

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Which of the active country's real regions fall within `km` of the
// current reference point -- the Filter sheet's Distance field drives this
// to narrow the Region combobox's own suggestions (see updateFilterRegionSuggestions).
function regionsWithinRadius(country, km) {
  const coords = REGION_COORDS[country] || REGION_COORDS.Sweden;
  return Object.keys(coords).filter((region) => haversineKm(activeLocationCoords, coords[region]) <= km);
}

// Scans every region of every country (not just the active one) -- this is
// what lets a real geolocated position auto-detect the RIGHT country, not
// just narrow within whichever one happened to already be active.
function nearestRegion(coords) {
  let best = null;
  Object.keys(REGION_COORDS).forEach((country) => {
    Object.keys(REGION_COORDS[country]).forEach((region) => {
      const distanceKm = haversineKm(coords, REGION_COORDS[country][region]);
      if (!best || distanceKm < best.distanceKm) best = { country, region, distanceKm };
    });
  });
  return best;
}

// Wrapped so a denied/unavailable/unsupported geolocation prompt can never
// hang or break the rest of the app -- resolves null in every failure case,
// which every caller below treats as "keep the Stockholm/Sweden default."
function detectUserLocation() {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== "function") {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

// Deliberately NOT awaited by bootstrap() -- a real geolocation permission
// prompt can take a while (or never resolve if ignored), and the rest of the
// app must render immediately with the safe Stockholm/Sweden default rather
// than block on it. If/when a real position resolves, this updates the
// active country, the visible location text, and the region datalists live.
async function applyDetectedLocation() {
  const coords = await detectUserLocation();
  if (!coords) return;
  activeLocationCoords = coords;
  const nearest = nearestRegion(coords);
  if (!nearest) return;
  if (nearest.country !== activeCountry) applyCountryTheme(nearest.country);
  const locationEl = document.getElementById("active-location");
  if (locationEl) locationEl.textContent = `${nearest.region}, ${nearest.country}`;
  renderSidebarLocation();
  updateFilterRegionSuggestions();
}

// Re-narrows the Region combobox's suggestions to whichever regions fall
// within the currently-chosen Distance value -- called when the sheet opens,
// whenever Distance itself changes, and after a real location is detected.
// "Any distance" (no value chosen) shows every real region again.
function updateFilterRegionSuggestions() {
  const distanceRaw = document.getElementById("filter-distance-select").value;
  const km = distanceRaw ? Number(distanceRaw) : null;
  renderRegionDatalist("filter-region-datalist", km != null ? regionsWithinRadius(activeCountry, km) : null);
}

// --- Auth boundaries (NM-A4), now backed by real email + password accounts
// and real server-verified sessions (NM-A14). A signed-in session is a real
// account with a hashed password on the server; "browsing as a guest" is
// simply currentUser === null -- there is no separate mocked guest identity
// anymore, so publishing/saving/messaging/reporting genuinely cannot happen
// without a real account (requireAuth is the only gate that matters now,
// since the server independently enforces the same boundary -- see
// scripts/auth.js's requireSession). Gated actions stash a single pending
// callback and resume it the instant sign-in completes; `requireAuth`
// returns whatever the action returns (often a Promise), so callers that
// care can await it.
let currentUser = null;
let pendingAction = null;
let currentDetailListingId = null;
let composeListingId = null;
let savedItemsCache = new Set();
// Shared by both sign-in surfaces (the interrupted-action modal and the
// dedicated Login/Sign-up page) since only one is ever visible at a time.
let authMode = "login";

async function refreshSavedItemsCache() {
  if (!currentUser) {
    savedItemsCache = new Set();
    return;
  }
  const ids = await DataService.savedItems.getForUser(currentUser.id);
  savedItemsCache = new Set(ids);
}

function requireAuth(action) {
  if (currentUser) {
    return action();
  }
  pendingAction = action;
  openAuthModal();
  return null;
}

function openAuthModal() {
  setAuthMode("auth", "login");
  document.getElementById("auth-modal").hidden = false;
}

function closeAuthModal() {
  document.getElementById("auth-modal").hidden = true;
  clearAuthFormFields("auth");
}

function clearAuthFormFields(prefix) {
  document.getElementById(`${prefix}-name-input`).value = "";
  document.getElementById(`${prefix}-email-input`).value = "";
  document.getElementById(`${prefix}-password-input`).value = "";
  const errorEl = document.getElementById(`${prefix}-error`);
  errorEl.hidden = true;
  errorEl.textContent = "";
}

// Toggles a sign-in form (the modal's "auth" fields, or the login page's
// "login" fields) between login and register: only registering needs a name
// and a "must be at least 8 characters" password, so the name field and the
// submit/toggle copy change with the mode. Called on open and on every
// language switch (from applyTranslations) so the labels never go stale.
function setAuthMode(prefix, mode) {
  authMode = mode;
  const isRegister = mode === "register";
  const nameField = document.getElementById(`${prefix}-name-field`);
  const passwordInput = document.getElementById(`${prefix}-password-input`);
  const submitButton = document.getElementById(`${prefix}-continue-button`);
  const toggleButton = document.getElementById(`${prefix}-mode-toggle`);
  if (nameField) nameField.hidden = !isRegister;
  if (passwordInput) passwordInput.setAttribute("autocomplete", isRegister ? "new-password" : "current-password");
  if (submitButton) submitButton.textContent = t(isRegister ? "auth.registerButton" : "auth.loginButton");
  if (toggleButton) toggleButton.textContent = t(isRegister ? "auth.modeToggleToLogin" : "auth.modeToggleToRegister");
}

// Shared by both sign-in surfaces: the interrupted-action auth modal (NM-A4)
// and the dedicated Login/Sign-up page (NM-A7 UX pass) — one real
// register/login pipeline, two entry points.
async function submitAuthForm(prefix, mode) {
  const name = mode === "register" ? document.getElementById(`${prefix}-name-input`).value.trim() : "";
  const email = document.getElementById(`${prefix}-email-input`).value.trim();
  const password = document.getElementById(`${prefix}-password-input`).value;
  const errorEl = document.getElementById(`${prefix}-error`);
  errorEl.hidden = true;
  errorEl.textContent = "";

  if (mode === "register" && !name) {
    errorEl.textContent = t("auth.errorNameRequired");
    errorEl.hidden = false;
    return null;
  }
  if (!email || !password) {
    errorEl.textContent = t("auth.errorInvalidCredentials");
    errorEl.hidden = false;
    return null;
  }
  if (mode === "register" && password.length < 8) {
    errorEl.textContent = t("auth.errorPasswordTooShort");
    errorEl.hidden = false;
    return null;
  }

  try {
    const user = mode === "register" ? await DataService.users.register({ name, email, password }) : await DataService.users.login({ email, password });
    await completeSignIn(user);
    return user;
  } catch (error) {
    const key = error.code === "EMAIL_TAKEN" ? "auth.errorEmailTaken" : error.code === "INVALID_CREDENTIALS" ? "auth.errorInvalidCredentials" : "auth.errorGeneric";
    errorEl.textContent = t(key);
    errorEl.hidden = false;
    return null;
  }
}

// `user` here is already a real, server-authenticated account (the response
// from register/login) -- this just finishes the resume/render sequence.
async function completeSignIn(user) {
  currentUser = user;
  await refreshSavedItemsCache();
  await refreshInboxCache();
  closeAuthModal();
  renderAccountPanel();
  renderProfileAvatar();
  renderAccountActions();
  renderListings();
  renderInbox();
  renderMyListings();
  if (currentDetailListingId) openListing(currentDetailListingId);
  const action = pendingAction;
  pendingAction = null;
  // Fire-and-forget, matching requireAuth's direct-authenticated path (which
  // also never awaits `action()`): resuming should behave identically to
  // already being signed in, not gain extra blocking behavior just because
  // it was deferred.
  if (action) action();
}

async function handleAuthFormSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();
  await submitAuthForm("auth", authMode);
}

// "Continue as Guest" no longer creates any identity (mocked or otherwise)
// -- guests can only browse (NM-A14). It just dismisses the prompt and
// discards whatever action was waiting for a real sign-in.
function dismissAuthModal() {
  pendingAction = null;
  closeAuthModal();
}

// --- NM-A15: Google Sign-In (real Google Identity Services, an ID-token
// flow -- not a stub). Both auth surfaces (the interrupted-action modal and
// the dedicated Login page) get the exact same "Continue with Google"
// button and the exact same completeSignIn() finish as email + password, so
// a Google sign-in resumes a pending Save/Message/Report/Publish exactly
// like a password one already does.
//
// This project has no real Google Cloud OAuth client configured in this
// dev/test environment, so `googleSignInState` naturally lands on
// "unavailable" here (GET /api/auth/google/config resolves clientId: null)
// -- that path is real, tested, and exactly what a deployment without
// GOOGLE_CLIENT_ID set will also see, not a special-cased shortcut.
let googleClientId = null;
let googleSignInState = "pending"; // "pending" | "available" | "unavailable"
let googleScriptLoadPromise = null;
const GOOGLE_LOCALE_BY_LANGUAGE = { en: "en", sv: "sv", no: "nb", da: "da", fi: "fi", is: "is" };

function loadGoogleIdentityScript() {
  if (googleScriptLoadPromise) return googleScriptLoadPromise;
  googleScriptLoadPromise = new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.google && window.google.accounts && window.google.accounts.id) {
      resolve();
      return;
    }
    if (typeof document === "undefined" || typeof document.createElement !== "function" || !document.head) {
      reject(new Error("No document available to load the Google script into."));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services."));
    document.head.appendChild(script);
  });
  return googleScriptLoadPromise;
}

// Google renders its OWN button (and its own internal accessible text) into
// each container -- its styling is Google's, by design (a well-known
// constraint of any real Google Sign-In integration, not a shortcut this
// project took). `locale` is the one thing that keeps it in sync with the
// app's own i18n.
function renderGoogleButtons() {
  ["auth-google-signin", "login-google-signin"].forEach((id) => {
    const container = document.getElementById(id);
    if (!container || typeof window === "undefined" || !window.google || !window.google.accounts || !window.google.accounts.id) return;
    container.innerHTML = "";
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: 300,
      locale: GOOGLE_LOCALE_BY_LANGUAGE[currentLanguage] || "en"
    });
  });
}

function renderGoogleUnavailable() {
  ["auth-google-signin", "login-google-signin"].forEach((id) => {
    const container = document.getElementById(id);
    if (container) container.innerHTML = `<p class="google-unavailable">${t("auth.googleUnavailable")}</p>`;
  });
}

// Re-applies whichever state Google sign-in already landed on (called from
// applyTranslations on every language switch) -- a no-op while still
// "pending" (initGoogleSignIn hasn't resolved yet), so the containers stay
// empty rather than flashing a wrong/stale state.
function refreshGoogleSignInUi() {
  if (googleSignInState === "available") renderGoogleButtons();
  else if (googleSignInState === "unavailable") renderGoogleUnavailable();
}

// Deliberately not awaited by bootstrap() -- fetching config, loading a real
// external script, and initializing Google's own SDK can all take a moment
// (or fail entirely, e.g. offline or GOOGLE_CLIENT_ID unset), and the rest
// of the app must render immediately either way, same reasoning as
// applyDetectedLocation().
async function initGoogleSignIn() {
  try {
    const config = await DataService.users.googleConfig();
    if (!config || !config.clientId) {
      googleSignInState = "unavailable";
      renderGoogleUnavailable();
      return;
    }
    googleClientId = config.clientId;
    await loadGoogleIdentityScript();
    if (typeof window === "undefined" || !window.google || !window.google.accounts || !window.google.accounts.id) {
      googleSignInState = "unavailable";
      renderGoogleUnavailable();
      return;
    }
    window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredentialResponse });
    googleSignInState = "available";
    renderGoogleButtons();
  } catch (error) {
    googleSignInState = "unavailable";
    renderGoogleUnavailable();
  }
}

// The one callback Google Identity Services invokes after a successful
// account picker flow, regardless of which of the two "Continue with
// Google" buttons was clicked (GIS has a single global callback, not one
// per rendered button) -- so this reads whichever surface is actually open
// to decide where to show an error, the same way submitAuthForm's `prefix`
// does for the email/password form. A user who simply closes/cancels the
// Google popup never triggers this callback at all -- nothing to catch,
// nothing breaks, they can just try again (NM-A15 requirement 6).
async function handleGoogleCredentialResponse(response) {
  const credential = response && response.credential;
  if (!credential) return;
  const authModalOpen = !document.getElementById("auth-modal").hidden;
  // Captured BEFORE completeSignIn() runs, not after: completeSignIn can
  // itself change activeView (it reopens the detail view for a pending
  // Save/Message/Report), so checking activeView afterward would sometimes
  // see that overridden value instead of "was the Login page actually where
  // this sign-in started."
  const wasOnLoginPage = activeView === "login-view";
  const errorEl = document.getElementById(authModalOpen ? "auth-error" : "login-error");
  errorEl.hidden = true;
  errorEl.textContent = "";
  try {
    const user = await DataService.users.loginWithGoogle(credential);
    await completeSignIn(user);
    if (wasOnLoginPage) showView("you-view");
  } catch (error) {
    errorEl.textContent = t(error.code === "GOOGLE_EMAIL_NOT_VERIFIED" ? "auth.errorGoogleEmailNotVerified" : "auth.errorGeneric");
    errorEl.hidden = false;
  }
}

async function handleLoginPageFormSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();
  const user = await submitAuthForm("login", authMode);
  if (user) {
    clearAuthFormFields("login");
    showView("you-view");
  }
}

function handleLoginPageGuestClick() {
  pendingAction = null;
  showView("browse-view");
}

async function signOutUser() {
  currentUser = await DataService.users.signOut();
  await refreshSavedItemsCache();
  await refreshInboxCache();
  renderAccountPanel();
  renderProfileAvatar();
  renderAccountActions();
  renderListings();
  renderInbox();
  renderMyListings();
  if (currentDetailListingId) openListing(currentDetailListingId);
}

function renderAccountPanel() {
  const panel = document.getElementById("you-panel");
  if (!panel) return;
  if (currentUser) {
    panel.innerHTML = `
      <p class="eyebrow">${t("account.signedInEyebrow")}</p>
      <h2 id="you-title">${t("account.signedInHeading")}</h2>
      <p>${t("account.emailLabel")}: ${currentUser.email}</p>
      <button type="button" class="secondary-action" id="sign-out-button">${t("account.signOut")}</button>
    `;
  } else {
    panel.innerHTML = `
      <p class="eyebrow">${t("account.eyebrow")}</p>
      <h2 id="you-title">${t("account.heading")}</h2>
      <p>${t("account.body")}</p>
      <button type="button" class="publish-button" data-view="login-view">${t("account.signInButton")}</button>
    `;
  }
}

// A small circular avatar in the topbar (initials for a real name) so a
// signed-in session is visible from anywhere in the app, not only on the You
// tab. No real photo upload exists, so initials are the honest
// representation rather than a placeholder image pretending to be one.
function renderProfileAvatar() {
  const button = document.getElementById("profile-button");
  if (!button) return;
  if (currentUser) {
    const initial = (currentUser.name || currentUser.email || "?").trim().charAt(0).toUpperCase() || "?";
    button.textContent = initial;
    button.classList.add("signed-in");
    button.setAttribute("aria-label", `${t("account.actionProfile")}: ${currentUser.name}`);
  } else {
    button.textContent = "You";
    button.classList.remove("signed-in");
    button.setAttribute("aria-label", "Open profile");
  }
}

// The horizontal quick-action pill row (topbar), only shown when signed in.
// Every pill leads somewhere real: Create Sell Ad -> Sell, Boost Ads and My
// Listings both -> My Listings (boosting is a per-listing control inside it,
// not a separate feature), Analytics -> real computed numbers, Messages ->
// Inbox, Profile -> You, Logout -> a real sign-out.
function renderAccountActions() {
  const container = document.getElementById("account-actions");
  if (!container) return;
  if (!currentUser) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.hidden = false;
  container.innerHTML = `
    <button type="button" class="account-action create" data-view="sell-view">${t("account.actionCreate")}</button>
    <button type="button" class="account-action boost" data-view="my-listings-view">${t("account.actionBoost")}</button>
    <button type="button" class="account-action my-listings" data-view="my-listings-view">${t("account.actionMyListings")}</button>
    <button type="button" class="account-action analytics" data-view="analytics-view">${t("account.actionAnalytics")}</button>
    <button type="button" class="account-action messages" data-view="inbox-view">${t("account.actionMessages")}</button>
    <button type="button" class="account-action profile" data-view="you-view">${t("account.actionProfile")}</button>
    <button type="button" class="account-action logout" data-logout>${t("account.actionLogout")}</button>
  `;
}

// --- My Listings + Boost (NM-A9 UX pass) ---

function getMyListings() {
  if (!currentUser) return [];
  return listings.filter((listing) => listing.sellerId === currentUser.id);
}

async function toggleBoost(listingId) {
  const listing = listings.find((item) => item.id === listingId);
  // Ownership check: a real permission boundary now that listings carry a
  // real sellerId, not just a decorative gate on who happens to click first.
  // NM-A14: also checked server-side now, from the real session -- not a
  // client-supplied id the request could simply lie about.
  if (!listing || !currentUser || listing.sellerId !== currentUser.id) return;
  await DataService.listings.update(listingId, { sponsored: !listing.sponsored });
  listings = await DataService.listings.getAll();
  renderMyListings();
  renderListings();
  renderCategories();
  if (currentDetailListingId === listingId) openListing(listingId);
}

// NM-A13: Reserved/Sold status, editable inline via a select. Any status
// change goes through the same server-side ownership check as Boost/Edit/Delete.
const LISTING_STATUSES = ["active", "reserved", "sold"];

async function handleMyListingStatusChange(listingId, status) {
  const listing = listings.find((item) => item.id === listingId);
  if (!listing || !currentUser || listing.sellerId !== currentUser.id) return;
  if (!LISTING_STATUSES.includes(status)) return;
  await DataService.listings.update(listingId, { status });
  listings = await DataService.listings.getAll();
  renderMyListings();
  renderListings();
  if (currentDetailListingId === listingId) openListing(listingId);
}

// Delete requires two clicks (the button becomes a "Confirm delete?" state
// on the first click) rather than a native confirm() dialog, consistent
// with this app's custom-modal approach elsewhere (auth, compose, filters)
// and so the flow stays testable without a real browser dialog.
function handleDeleteListingClick(listingId) {
  if (pendingDeleteListingId !== listingId) {
    pendingDeleteListingId = listingId;
    renderMyListings();
    return undefined;
  }
  pendingDeleteListingId = null;
  return deleteListing(listingId);
}

async function deleteListing(listingId) {
  const listing = listings.find((item) => item.id === listingId);
  if (!listing || !currentUser || listing.sellerId !== currentUser.id) return;
  await DataService.listings.delete(listingId);
  listings = await DataService.listings.getAll();
  renderMyListings();
  renderListings();
  renderCategories();
  renderCategoryChips();
  if (currentDetailListingId === listingId) {
    currentDetailListingId = null;
    showView("browse-view");
  }
  showToast(t("myListings.deleted"));
}

function myListingRowTemplate(listing) {
  const statusOptions = LISTING_STATUSES.map(
    (status) => `<option value="${status}"${listing.status === status ? " selected" : ""}>${t(`status.${status}`)}</option>`
  ).join("");
  const confirmingDelete = pendingDeleteListingId === listing.id;
  return `
    <article class="inbox-row my-listing-row">
      <button type="button" class="inbox-row-open" data-open-listing="${listing.id}" aria-label="${listing.title}">
        <div class="inbox-row-photo" style="background: ${listing.image}" aria-hidden="true"></div>
        <div class="inbox-row-copy" aria-hidden="true">
          <strong>${listing.title}</strong>
          <span>${listing.price}</span>
          <p>${listing.sponsored ? t("myListings.boosted") : ""}</p>
        </div>
      </button>
      <div class="my-listing-actions">
        <label class="sr-only" for="status-select-${listing.id}">${t("myListings.statusLabel")}</label>
        <select class="status-select status-select-${listing.status}" id="status-select-${listing.id}" data-status-select="${listing.id}">
          ${statusOptions}
        </select>
        <button type="button" class="account-action edit" data-edit-listing="${listing.id}">${t("myListings.edit")}</button>
        <button type="button" class="account-action${listing.sponsored ? " boosted" : " boost"}" data-toggle-boost="${listing.id}">
          ${listing.sponsored ? t("myListings.unboost") : t("myListings.boost")}
        </button>
        <button type="button" class="account-action delete${confirmingDelete ? " confirming" : ""}" data-delete-listing="${listing.id}">
          ${confirmingDelete ? t("myListings.deleteConfirm") : t("myListings.delete")}
        </button>
      </div>
    </article>
  `;
}

function renderMyListings() {
  const content = document.getElementById("my-listings-content");
  if (!content) return;
  const mine = getMyListings();
  if (!currentUser) {
    content.innerHTML = `<div class="quiet-state"><p>${t("inbox.signedOutBody")}</p><button type="button" class="publish-button" data-view="login-view">${t("account.signInButton")}</button></div>`;
    return;
  }
  if (mine.length === 0) {
    content.innerHTML = `<div class="quiet-state"><p>${t("myListings.emptyBody")}</p><button type="button" class="publish-button" data-view="sell-view">${t("myListings.emptyCta")}</button></div>`;
    return;
  }
  content.innerHTML = mine.map((listing) => myListingRowTemplate(listing)).join("");
}

// --- Analytics (NM-A9): real numbers computed from actual DataService
// records for the signed-in user's own listings — no placeholder counters. ---
async function renderAnalytics() {
  const content = document.getElementById("analytics-content");
  if (!content) return;
  if (!currentUser) {
    content.innerHTML = `<div class="quiet-state"><p>${t("analytics.signedOutBody")}</p></div>`;
    return;
  }
  const mine = getMyListings();
  const myListingIds = mine.map((listing) => listing.id);
  const [allSaved, allConversations] = await Promise.all([DataService.savedItems.getAll(), DataService.conversations.getAll()]);
  const savesReceived = allSaved.filter((item) => myListingIds.includes(item.listingId)).length;
  const myConversations = allConversations.filter((conversation) => myListingIds.includes(conversation.listingId));
  const messageCounts = await Promise.all(myConversations.map((conversation) => DataService.conversations.getMessages(conversation.id)));
  const messagesReceived = messageCounts.reduce((total, list) => total + list.length, 0);
  const boostedCount = mine.filter((listing) => listing.sponsored).length;

  content.innerHTML = `
    <div class="analytics-grid">
      <div class="analytics-tile"><strong>${mine.length}</strong><span>${t("analytics.listings")}</span></div>
      <div class="analytics-tile"><strong>${savesReceived}</strong><span>${t("analytics.saves")}</span></div>
      <div class="analytics-tile"><strong>${myConversations.length}</strong><span>${t("analytics.conversations")}</span></div>
      <div class="analytics-tile"><strong>${messagesReceived}</strong><span>${t("analytics.messages")}</span></div>
      <div class="analytics-tile"><strong>${boostedCount}</strong><span>${t("analytics.boosted")}</span></div>
    </div>
  `;
}

function isSaved(id) {
  return savedItemsCache.has(id);
}

async function toggleSaveListing(id) {
  if (!currentUser) return;
  await DataService.savedItems.toggle(currentUser.id, id);
  await refreshSavedItemsCache();
  renderListings();
  if (currentDetailListingId === id) openListing(id);
}

function handleSaveClick(id) {
  return requireAuth(() => toggleSaveListing(id));
}

function openMessageComposer(id) {
  const listing = listings.find((item) => item.id === id);
  if (!listing) return;
  composeListingId = id;
  document.getElementById("compose-modal-title").textContent = `${t("compose.headingPrefix")} ${listing.seller}`;
  document.getElementById("compose-message-input").value = "Hi, is this still available?";
  document.getElementById("compose-modal").hidden = false;
}

function closeComposeModal() {
  document.getElementById("compose-modal").hidden = true;
  composeListingId = null;
}

// Structure-only per NM-A7 scope: a real Conversation + Message record is
// created via the data service (so the shape is genuinely exercised), even
// though there is no Inbox UI yet to read it back.
async function sendComposedMessage() {
  const listingId = composeListingId;
  const text = document.getElementById("compose-message-input").value;
  closeComposeModal();
  if (currentUser && listingId) {
    const conversation = await DataService.conversations.startOrGet(listingId, [currentUser.id]);
    await DataService.conversations.addMessage(conversation.id, { senderId: currentUser.id, text });
    await refreshInboxCache();
    renderInbox();
  }
  showToast(t("compose.sent"));
}

function handleMessageClick(id) {
  if (!id) return null;
  return requireAuth(() => openMessageComposer(id));
}

// --- Inbox / message thread (NM-A8). Reads what NM-A7 wrote as "structure
// only" — the same DataService.conversations/messages methods, now with a
// real UI on top. `inboxConversationsCache` mirrors the fetch-once/cache-
// locally pattern already used for `listings`/`savedItemsCache`. ---
let inboxConversationsCache = [];
let currentThreadId = null;

async function refreshInboxCache() {
  if (!currentUser) {
    inboxConversationsCache = [];
    return;
  }
  const conversations = await DataService.conversations.getForUser(currentUser.id);
  const withMessages = await Promise.all(
    conversations.map(async (conversation) => {
      const conversationMessages = await DataService.conversations.getMessages(conversation.id);
      return { ...conversation, messages: conversationMessages, lastMessage: conversationMessages[conversationMessages.length - 1] || null };
    })
  );
  withMessages.sort((a, b) => {
    const aTime = a.lastMessage ? a.lastMessage.sentAt : a.createdAt;
    const bTime = b.lastMessage ? b.lastMessage.sentAt : b.createdAt;
    return bTime - aTime;
  });
  inboxConversationsCache = withMessages;
}

function inboxRowTemplate(conversation) {
  const listing = listings.find((item) => item.id === conversation.listingId);
  const title = listing ? listing.title : t("inbox.unknownListing");
  const seller = listing ? listing.seller : "";
  const image = listing ? listing.image : "linear-gradient(135deg, #dfe6e1, #f4f6f1)";
  const preview = conversation.lastMessage ? conversation.lastMessage.text : "";
  return `
    <button type="button" class="inbox-row" data-open-thread="${conversation.id}" aria-label="${t("thread.replyLabel")}: ${title}, ${seller}">
      <div class="inbox-row-photo" style="background: ${image}" aria-hidden="true"></div>
      <div class="inbox-row-copy" aria-hidden="true">
        <strong>${title}</strong>
        <span>${seller}</span>
        <p>${preview}</p>
      </div>
    </button>
  `;
}

function renderInbox() {
  const content = document.getElementById("inbox-content");
  if (!content) return;
  if (!currentUser) {
    content.innerHTML = `
      <div class="quiet-state">
        <p>${t("inbox.signedOutBody")}</p>
        <button type="button" class="publish-button" data-view="login-view">${t("account.signInButton")}</button>
      </div>
    `;
    return;
  }
  if (inboxConversationsCache.length === 0) {
    content.innerHTML = `<div class="quiet-state"><p>${t("inbox.emptyBody")}</p></div>`;
    return;
  }
  content.innerHTML = inboxConversationsCache.map((conversation) => inboxRowTemplate(conversation)).join("");
}

function renderThreadMessages(messages) {
  const container = document.getElementById("thread-messages");
  container.innerHTML = messages
    .map((message) => {
      const mine = currentUser && message.senderId === currentUser.id;
      return `<div class="thread-message${mine ? " mine" : ""}"><p>${message.text}</p></div>`;
    })
    .join("");
}

function openThread(conversationId) {
  const conversation = inboxConversationsCache.find((item) => item.id === conversationId);
  if (!conversation) return;
  currentThreadId = conversationId;
  const listing = listings.find((item) => item.id === conversation.listingId);
  document.getElementById("thread-snapshot").innerHTML = `
    <p class="eyebrow">${listing ? listing.locality : ""}</p>
    <h2 id="thread-title">${listing ? listing.title : t("inbox.unknownListing")}</h2>
    <p class="detail-meta">${listing ? `${listing.price} · ${listing.seller}` : ""}</p>
  `;
  renderThreadMessages(conversation.messages);
  document.getElementById("thread-reply-input").value = "";
  showView("thread-view");
}

async function sendThreadReply(event) {
  if (event && event.preventDefault) event.preventDefault();
  const input = document.getElementById("thread-reply-input");
  const text = input.value.trim();
  if (!text || !currentThreadId || !currentUser) return;
  await DataService.conversations.addMessage(currentThreadId, { senderId: currentUser.id, text });
  input.value = "";
  await refreshInboxCache();
  const conversation = inboxConversationsCache.find((item) => item.id === currentThreadId);
  if (conversation) renderThreadMessages(conversation.messages);
  renderInbox();
}

async function submitReport(id) {
  await DataService.reports.create({ listingId: id, reporterId: currentUser ? currentUser.id : null });
  showToast(t("report.sent"));
}

function handleReportClick(id) {
  return requireAuth(() => submitReport(id));
}

// Sharing a public listing needs no account (unlike Save/Message/Report,
// which are all tied to a real signed-in identity) -- a guest can share just
// as freely as they can browse. Prefers the real native share sheet
// (navigator.share) where the browser supports one; otherwise falls back to
// copying a shareable summary + this page's URL to the clipboard, with a
// toast since a clipboard write is otherwise invisible feedback-wise.
// There's no per-listing deep link yet (this app has no URL routing at all
// today -- a reload always returns to Browse), so the URL shared is the
// site's own address, not a link that reopens this exact listing; that's a
// known, honestly-scoped limitation, not a bug.
async function copyShareLinkToClipboard(shareText) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(shareText);
      showToast(t("share.copied"));
      return;
    }
  } catch (error) {
    // fall through to the failure toast below
  }
  showToast(t("share.failed"));
}

async function handleShareClick(id) {
  const listing = listings.find((item) => item.id === id);
  if (!listing) return;
  const url = typeof window !== "undefined" && window.location ? window.location.href : "";
  const shareText = `${listing.title} — ${listing.price}`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: listing.title, text: shareText, url });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") return; // the user closed the native share sheet -- not a failure
      await copyShareLinkToClipboard(`${shareText} ${url}`.trim());
      return;
    }
  }

  await copyShareLinkToClipboard(`${shareText} ${url}`.trim());
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
}

let activeCategory = "All";
let activeScope = "Nearby";
let activeView = "browse-view";
let sellPhotos = [];
// NM-A13: null while creating a new listing; set to a listing's id while
// editing an existing one. The Sell form (fields, photos, publish handler)
// is shared between both modes -- this is the only thing that distinguishes
// them.
let editingListingId = null;
let pendingDeleteListingId = null;

function normalize(value) {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// --- Filter & sort (NM-A5). All client-side; `activeFilters`/`activeSort`
// are the applied state that `getFilteredListings()` reads, while
// `draftFilters` holds in-progress edits inside the open sheet until Apply
// commits them (Clear only resets the draft; Reset clears both). ---
const CONDITIONS = ["New", "Like new", "Good", "Fair", "Used", "For parts"];
const SELLER_TYPES = ["Private seller", "Professional seller"];

function defaultFilters() {
  return { priceMin: null, priceMax: null, conditions: [], sellerTypes: [], maxDistanceKm: null, subtype: "", region: "" };
}

let activeFilters = defaultFilters();
let activeSort = "recent";
let draftFilters = defaultFilters();

function parsePriceValue(price) {
  if (price === "Free") return 0;
  const digits = String(price).replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function parseDistanceKm(distance) {
  const match = /^([\d.]+)\s*km$/i.exec(String(distance || "").trim());
  return match ? parseFloat(match[1]) : null;
}

function sortListings(list, sort) {
  const copy = list.slice();
  if (sort === "price-low") {
    copy.sort((a, b) => parsePriceValue(a.price) - parsePriceValue(b.price));
  } else if (sort === "price-high") {
    copy.sort((a, b) => parsePriceValue(b.price) - parsePriceValue(a.price));
  } else if (sort === "nearest") {
    copy.sort((a, b) => {
      const distanceA = parseDistanceKm(a.distance);
      const distanceB = parseDistanceKm(b.distance);
      if (distanceA == null && distanceB == null) return 0;
      if (distanceA == null) return 1;
      if (distanceB == null) return -1;
      return distanceA - distanceB;
    });
  } else {
    copy.sort((a, b) => (b.postedAt || 0) - (a.postedAt || 0));
  }
  return copy;
}

function populateSubtypeSelect(select, categoryId) {
  const entry = categoryTaxonomy.find((category) => category.id === categoryId);
  if (entry && entry.subtypes.length > 0) {
    select.innerHTML = entry.subtypes.map((subtype) => `<option value="${subtype}">${subtype}</option>`).join("");
    return true;
  }
  select.innerHTML = "";
  return false;
}

function updateFilterSubtypeVisibility() {
  const categoryId = document.getElementById("filter-category-select").value;
  const field = document.getElementById("filter-subtype-field");
  const select = document.getElementById("filter-subtype-select");
  field.hidden = !populateSubtypeSelect(select, categoryId);
}

function renderFilterCategorySelectOptions() {
  const select = document.getElementById("filter-category-select");
  if (!select) return;
  select.innerHTML =
    `<option value="All">${t("filter.categoryAll")}</option>` +
    categoryTaxonomy.map((category) => `<option value="${category.id}">${category.label}</option>`).join("");
  select.value = activeCategory;
  updateFilterSubtypeVisibility();
}

function renderFilterChipGroup(containerId, options, selected) {
  document.getElementById(containerId).innerHTML = options
    .map((option) => {
      const isActive = selected.includes(option);
      const group = containerId === "filter-condition-group" ? "conditions" : "sellerTypes";
      return `<button type="button" class="chip${isActive ? " active" : ""}" data-filter-group="${group}" data-filter-value="${option}" aria-pressed="${isActive}">${option}</button>`;
    })
    .join("");
}

function toggleFilterChip(group, value) {
  const list = draftFilters[group];
  const index = list.indexOf(value);
  if (index === -1) list.push(value);
  else list.splice(index, 1);
  renderFilterChipGroup(
    group === "conditions" ? "filter-condition-group" : "filter-seller-group",
    group === "conditions" ? CONDITIONS : SELLER_TYPES,
    list
  );
}

function openFilterSheet() {
  draftFilters = {
    priceMin: activeFilters.priceMin,
    priceMax: activeFilters.priceMax,
    conditions: activeFilters.conditions.slice(),
    sellerTypes: activeFilters.sellerTypes.slice(),
    maxDistanceKm: activeFilters.maxDistanceKm,
    subtype: activeFilters.subtype,
    region: activeFilters.region
  };
  document.getElementById("filter-price-min").value = draftFilters.priceMin != null ? draftFilters.priceMin : "";
  document.getElementById("filter-price-max").value = draftFilters.priceMax != null ? draftFilters.priceMax : "";
  document.getElementById("filter-distance-select").value =
    draftFilters.maxDistanceKm != null ? String(draftFilters.maxDistanceKm) : "";
  document.getElementById("filter-region-input").value = draftFilters.region || "";
  updateFilterRegionSuggestions();
  document.getElementById("filter-sort-select").value = activeSort;
  document.getElementById("filter-category-select").value = activeCategory;
  updateFilterSubtypeVisibility();
  if (!document.getElementById("filter-subtype-field").hidden) {
    document.getElementById("filter-subtype-select").value = draftFilters.subtype || "";
  }
  renderFilterChipGroup("filter-condition-group", CONDITIONS, draftFilters.conditions);
  renderFilterChipGroup("filter-seller-group", SELLER_TYPES, draftFilters.sellerTypes);
  document.getElementById("filter-sheet").hidden = false;
}

function closeFilterSheet() {
  document.getElementById("filter-sheet").hidden = true;
}

function clearFilterDraft() {
  draftFilters = defaultFilters();
  document.getElementById("filter-price-min").value = "";
  document.getElementById("filter-price-max").value = "";
  document.getElementById("filter-distance-select").value = "";
  document.getElementById("filter-region-input").value = "";
  updateFilterRegionSuggestions();
  document.getElementById("filter-sort-select").value = "recent";
  document.getElementById("filter-category-select").value = "All";
  updateFilterSubtypeVisibility();
  renderFilterChipGroup("filter-condition-group", CONDITIONS, []);
  renderFilterChipGroup("filter-seller-group", SELLER_TYPES, []);
}

function renderSortIndicator() {
  const indicator = document.getElementById("sort-indicator");
  if (!indicator) return;
  if (activeSort === "recent") {
    indicator.hidden = true;
    indicator.textContent = "";
  } else {
    const sortKey = { "price-low": "sort.priceLow", "price-high": "sort.priceHigh", nearest: "sort.nearest" }[activeSort];
    indicator.hidden = false;
    indicator.textContent = `${t("sort.indicatorPrefix")}: ${t(sortKey)}`;
  }
}

function renderActiveFilterChips() {
  const container = document.getElementById("active-filter-chips");
  const chips = [];

  if (activeFilters.priceMin != null || activeFilters.priceMax != null) {
    const min = activeFilters.priceMin != null ? activeFilters.priceMin : 0;
    const max = activeFilters.priceMax != null ? activeFilters.priceMax : "∞";
    chips.push({ key: "price", label: `${t("filter.priceChipPrefix")}: ${min}–${max} kr` });
  }
  activeFilters.conditions.forEach((condition) => chips.push({ key: `condition:${condition}`, label: condition }));
  activeFilters.sellerTypes.forEach((sellerType) => chips.push({ key: `seller:${sellerType}`, label: sellerType }));
  if (activeFilters.maxDistanceKm != null) {
    chips.push({ key: "distance", label: `${t(`distance.within${activeFilters.maxDistanceKm}`)}` });
  }
  if (activeFilters.region) {
    chips.push({ key: "region", label: activeFilters.region });
  }

  container.innerHTML = chips
    .map(
      (chip) =>
        `<button type="button" class="active-filter-chip" data-remove-filter="${chip.key}">${chip.label} <span aria-hidden="true">×</span></button>`
    )
    .join("");
}

function removeActiveFilter(key) {
  if (key === "price") {
    activeFilters.priceMin = null;
    activeFilters.priceMax = null;
  } else if (key === "distance") {
    activeFilters.maxDistanceKm = null;
  } else if (key === "region") {
    activeFilters.region = "";
  } else if (key.indexOf("condition:") === 0) {
    const value = key.slice("condition:".length);
    activeFilters.conditions = activeFilters.conditions.filter((item) => item !== value);
  } else if (key.indexOf("seller:") === 0) {
    const value = key.slice("seller:".length);
    activeFilters.sellerTypes = activeFilters.sellerTypes.filter((item) => item !== value);
  }
  renderActiveFilterChips();
  renderListings();
}

function applyFilters() {
  const priceMinRaw = document.getElementById("filter-price-min").value.trim();
  const priceMaxRaw = document.getElementById("filter-price-max").value.trim();
  draftFilters.priceMin = priceMinRaw ? Number(priceMinRaw) : null;
  draftFilters.priceMax = priceMaxRaw ? Number(priceMaxRaw) : null;
  const distanceRaw = document.getElementById("filter-distance-select").value;
  draftFilters.maxDistanceKm = distanceRaw ? Number(distanceRaw) : null;
  draftFilters.region = document.getElementById("filter-region-input").value.trim();
  const subtypeField = document.getElementById("filter-subtype-field");
  draftFilters.subtype = subtypeField.hidden ? "" : document.getElementById("filter-subtype-select").value;

  activeFilters = draftFilters;
  activeSort = document.getElementById("filter-sort-select").value;
  activeCategory = document.getElementById("filter-category-select").value;

  closeFilterSheet();
  renderCategoryChips();
  renderSortIndicator();
  renderActiveFilterChips();
  renderListings();
}

function resetFilters() {
  clearFilterDraft();
  activeFilters = defaultFilters();
  activeSort = "recent";
  activeCategory = "All";
  closeFilterSheet();
  renderCategoryChips();
  renderSortIndicator();
  renderActiveFilterChips();
  renderListings();
}

function handleFilterSheetChange(event) {
  if (event.target.id === "filter-category-select") updateFilterSubtypeVisibility();
  if (event.target.id === "filter-distance-select") updateFilterRegionSuggestions();
}

function getFilteredListings() {
  const query = normalize(document.getElementById("search-input").value.trim());
  const results = listings.filter((listing) => {
    const matchesCategory =
      activeCategory === "All" ||
      listing.category === activeCategory ||
      (activeCategory === "Free Items" && listing.price === "Free");
    const matchesSubtype = !activeFilters.subtype || listing.subtype === activeFilters.subtype;
    const searchable = normalize(
      `${listing.title} ${listing.category} ${listing.subtype || ""} ${listing.locality} ${listing.condition}`
    );
    const matchesSearch = !query || searchable.includes(query);

    const price = parsePriceValue(listing.price);
    const matchesPriceMin = activeFilters.priceMin == null || price >= activeFilters.priceMin;
    const matchesPriceMax = activeFilters.priceMax == null || price <= activeFilters.priceMax;

    const matchesCondition = activeFilters.conditions.length === 0 || activeFilters.conditions.includes(listing.condition);
    const matchesSellerType =
      activeFilters.sellerTypes.length === 0 || activeFilters.sellerTypes.includes(listing.sellerType);

    const distanceKm = parseDistanceKm(listing.distance);
    const matchesDistance =
      activeFilters.maxDistanceKm == null || distanceKm == null || distanceKm <= activeFilters.maxDistanceKm;

    // A combobox, not a closed enum (see REGIONS_BY_COUNTRY): an explicit
    // typed/picked region always wins, matched with the same substring
    // compare the free-text search box already uses. With no explicit
    // region but a Distance chosen, Distance does double duty -- it ALSO
    // limits results to whichever real regions fall within that radius of
    // the active location (see regionsWithinRadius), the same computed set
    // the Region combobox's own suggestions were just narrowed to.
    // A listing with no region on record at all (published before this
    // slice existed -- the migration adds the column but has no way to know
    // what an old listing's real region was) must never be silently
    // excluded by radius filtering it was never given data for. It's only
    // excluded when a region IS on record and genuinely falls outside the
    // radius.
    let matchesRegion;
    if (activeFilters.region) {
      matchesRegion = normalize(listing.region || "").includes(normalize(activeFilters.region));
    } else if (activeFilters.maxDistanceKm != null && listing.region) {
      const inRadius = regionsWithinRadius(activeCountry, activeFilters.maxDistanceKm);
      matchesRegion = inRadius.some((region) => normalize(region) === normalize(listing.region));
    } else {
      matchesRegion = true;
    }

    return (
      matchesCategory &&
      matchesSubtype &&
      matchesSearch &&
      matchesPriceMin &&
      matchesPriceMax &&
      matchesCondition &&
      matchesSellerType &&
      matchesDistance &&
      matchesRegion
    );
  });

  return sortListings(results, activeSort);
}

function listingCardTemplate(listing, options) {
  const interactive = !options || options.interactive !== false;
  const photoCount = listing.images ? listing.images.length : 0;
  const status = listing.status && listing.status !== "active" ? listing.status : null;
  // A status badge (Reserved/Sold) takes the same corner "Sponsored" uses and
  // takes priority over it when both would apply -- advertising a sold item
  // isn't useful, so there's never a real need to show both at once.
  const mediaBadges = `${
    status ? `<span class="status-badge status-${status}">${t(`status.${status}`)}</span>` : listing.sponsored ? '<span class="sponsored">Sponsored</span>' : ""
  }${listing.freshness ? `<span class="freshness">${listing.freshness}</span>` : ""}${
    listing.aiPhoto ? `<span class="ai-badge">${t("ai.badge")}</span>` : ""
  }${photoCount > 1 ? `<span class="photo-count-badge">1/${photoCount}</span>` : ""}`;
  const body = `
    <div class="listing-photo" style="background: ${listing.image}" aria-hidden="true">${mediaBadges}</div>
    <div class="card-copy"${interactive ? ' aria-hidden="true"' : ""}>
      <strong>${listing.price}</strong>
      <h3>${listing.title}</h3>
      <p>${listing.locality} · ${listing.distance}</p>
    </div>
  `;

  if (!interactive) {
    return `<article class="listing-card preview-card">${body}</article>`;
  }

  const saved = isSaved(listing.id);
  return `
    <article class="listing-card" data-id="${listing.id}">
      <button type="button" class="card-button" data-open-listing="${listing.id}" aria-label="Open listing: ${listing.title}, ${listing.price}${status ? ", " + t(`status.${status}`) : ""}${listing.sponsored ? ", sponsored" : ""}${listing.freshness ? ", " + listing.freshness : ""}, ${listing.locality}, ${listing.distance} away">
        ${body}
      </button>
      <button type="button" class="save-button${saved ? " saved" : ""}" data-save-listing="${listing.id}" aria-pressed="${saved}" aria-label="${saved ? `Remove ${listing.title} from saved items` : `Save ${listing.title} for later`}">${saved ? HEART_ICON_FILLED : HEART_ICON_OUTLINE}${saved ? "Saved" : "Save"}</button>
    </article>
  `;
}

function renderListings() {
  const grid = document.getElementById("listing-grid");
  const empty = document.getElementById("empty-state");
  const results = getFilteredListings();
  document.getElementById("result-count").textContent = `${results.length} ${results.length === 1 ? "listing" : "listings"}`;
  document.getElementById("result-scope").textContent = activeScope;
  empty.hidden = results.length > 0;
  grid.innerHTML = results.map((listing) => listingCardTemplate(listing)).join("");
  renderSidebarLocation();
}

// The sidebar's search box (desktop-only, persistently visible, matching
// Facebook Marketplace) is an alternate entry point to the SAME search --
// not a second, separate search feature. Typing syncs the real #search-input
// and jumps to Browse so results are actually visible.
function handleSidebarSearchInput(event) {
  const searchInput = document.getElementById("search-input");
  searchInput.value = event.target.value;
  if (activeView !== "browse-view") showView("browse-view");
  renderListings();
}

// Mirrors the existing (also static, also untranslated) #active-location
// text into the desktop sidebar's location link, appending the current scope
// -- kept in sync from the one place scope changes always flow through.
function renderSidebarLocation() {
  const textEl = document.getElementById("sidebar-location-text");
  const locationEl = document.getElementById("active-location");
  if (!textEl || !locationEl) return;
  textEl.textContent = `${locationEl.textContent} · ${activeScope}`;
}

// One small outline icon per category, in the same hand-authored SVG style
// as the nav/search/filter icons in index.html (no icon-font/library
// dependency). Keyed by the real category id from db/seed-data.js.
const CATEGORY_ICONS = {
  Vehicles:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 13l1.5-5A2 2 0 0 1 6.4 6.5h11.2A2 2 0 0 1 19.5 8l1.5 5"/><rect x="2" y="13" width="20" height="5" rx="1.5"/><circle cx="7" cy="18.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="17" cy="18.5" r="1.6" fill="currentColor" stroke="none"/></svg>',
  "Real Estate":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-7h6v7"/></svg>',
  Electronics:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg>',
  "Phones & Tablets":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M11 18.5h2"/></svg>',
  "Home & Furniture":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/><path d="M3 12h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z"/><path d="M5 18v2M19 18v2"/></svg>',
  Fashion:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8 4l4 2 4-2 4 4-3 3v10H7V11L4 8z"/></svg>',
  "Baby & Kids":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="15" r="5"/><path d="M9 10c0-2.2 1.3-4 3-4s3 1 3 2.2"/><circle cx="12" cy="6" r="1.6"/></svg>',
  "Sports & Outdoor":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 12h10"/><rect x="4" y="9" width="3" height="6" rx="1"/><rect x="17" y="9" width="3" height="6" rx="1"/><path d="M2 10.5v3M22 10.5v3"/></svg>',
  Jobs:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="7" width="18" height="12" rx="1.5"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>',
  Services:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14.7 6.3a4 4 0 0 0-5.4 4.6L3 17.2V21h3.8l6.3-6.3a4 4 0 0 0 4.6-5.4l-3 3-2-2z"/></svg>',
  "Agriculture & Garden":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 4C10 4 4 10 4 18c8 0 14-6 14-14z"/><path d="M4 20c3-3 6-6 12-12"/></svg>',
  "Free Items":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="9" width="18" height="4" rx="1"/><rect x="4" y="13" width="16" height="8" rx="1"/><path d="M12 9v12"/><path d="M12 9c-1.5-3-6-3-6 0h6zM12 9c1.5-3 6-3 6 0h-6z"/></svg>'
};

const HEART_ICON_OUTLINE =
  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20s-7.5-4.6-9.8-9.2C.8 7.4 2.4 4 5.9 3.4 8.1 3 10 4 12 6.2 14 4 15.9 3 18.1 3.4c3.5.6 5.1 4 3.7 7.4C19.5 15.4 12 20 12 20z"/></svg>';
const HEART_ICON_FILLED =
  '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20s-7.5-4.6-9.8-9.2C.8 7.4 2.4 4 5.9 3.4 8.1 3 10 4 12 6.2 14 4 15.9 3 18.1 3.4c3.5.6 5.1 4 3.7 7.4C19.5 15.4 12 20 12 20z"/></svg>';

const SHARE_ICON =
  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4"/></svg>';
const FLAG_ICON =
  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/></svg>';

const DEFAULT_CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/></svg>';

// The sidebar's own scannable category list (Facebook Marketplace shows the
// full category list inline in its sidebar, not just as a separate page) --
// reuses the exact same data-category-jump handling the Categories page's
// tiles already use, so no new click-handling logic was needed for this.
function renderSidebarCategories() {
  const container = document.getElementById("sidebar-categories-list");
  if (!container) return;
  container.innerHTML = categoryTaxonomy
    .map(
      (category) => `
        <button type="button" class="sidebar-category-item" data-category-jump="${category.id}">
          <span class="icon">${CATEGORY_ICONS[category.id] || DEFAULT_CATEGORY_ICON}</span>
          <span>${category.label}</span>
        </button>
      `
    )
    .join("");
}

function renderCategoryChips() {
  const chips = [{ id: "All", label: "All", featured: false }, ...categoryTaxonomy];
  document.getElementById("category-chips").innerHTML = chips
    .map(
      (category) =>
        `<button type="button" class="chip${category.id === activeCategory ? " active" : ""}${
          category.featured ? " featured" : ""
        }" data-category="${category.id}">${category.label}</button>`
    )
    .join("");
  updateChipCarouselArrows();
}

// Desktop-only carousel arrows (see the `@media (min-width: 780px)` rule for
// .chip-carousel-arrow) for the category chip row: on a wide screen there's
// no touch-swipe affordance, and 12 categories rarely all fit, so a mouse
// user has no obvious way to reach the ones scrolled out of view otherwise.
// Mobile keeps native touch-scroll only, unchanged, since swipe is already
// the natural gesture there.
function updateChipCarouselArrows() {
  const container = document.getElementById("category-chips");
  const prevButton = document.getElementById("category-chips-prev");
  const nextButton = document.getElementById("category-chips-next");
  if (!container || !prevButton || !nextButton) return;
  const maxScroll = container.scrollWidth - container.clientWidth;
  prevButton.hidden = container.scrollLeft <= 4;
  nextButton.hidden = maxScroll <= 4 || container.scrollLeft >= maxScroll - 4;
}

function scrollCategoryChips(direction) {
  const container = document.getElementById("category-chips");
  if (!container) return;
  const amount = (container.clientWidth || 220) * 0.7 * direction;
  if (typeof container.scrollBy === "function") container.scrollBy({ left: amount, behavior: "smooth" });
  else container.scrollLeft += amount;
}

function renderCategories() {
  document.getElementById("category-grid").innerHTML = categoryTaxonomy
    .map((category) => {
      const count = listings.filter(
        (listing) => listing.category === category.id || (category.id === "Free Items" && listing.price === "Free")
      ).length;
      return `
        <button type="button" class="category-tile${category.featured ? " featured" : ""}" data-category-jump="${category.id}">
          ${category.featured ? '<span class="popular-badge">Popular</span>' : ""}
          <strong>${category.label}</strong>
          <span>${count} nearby</span>
        </button>
      `;
    })
    .join("");
  renderSidebarCategories();
}

function renderCategorySelectOptions() {
  document.getElementById("sell-category-select").innerHTML = categoryTaxonomy
    .map((category) => `<option value="${category.id}">${category.label}</option>`)
    .join("");
  updateSubtypeVisibility();
}

function updateSubtypeVisibility() {
  const categoryId = document.getElementById("sell-category-select").value;
  const field = document.getElementById("sell-subtype-field");
  const select = document.getElementById("sell-subtype-select");
  field.hidden = !populateSubtypeSelect(select, categoryId);
}

function showView(viewId) {
  activeView = viewId;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active-view", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  document.querySelectorAll(".sidebar-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
}

// A listing published before NM-A9 only ever had the single `image`/`aiPhoto`
// pair; one built since has a real `images` array (up to MAX_LISTING_PHOTOS).
// This normalizes either shape into the same array so the gallery never has
// to branch on which kind of listing it's showing.
function getListingImages(listing) {
  if (listing.images && listing.images.length > 0) return listing.images;
  return [{ css: listing.image, aiGenerated: Boolean(listing.aiPhoto) }];
}

function galleryTemplate(listing, activeIndex) {
  const images = getListingImages(listing);
  const index = Math.max(0, Math.min(activeIndex, images.length - 1));
  const thumbs =
    images.length > 1
      ? `
        <div class="detail-gallery-thumbs" role="group" aria-label="${t("detail.morePhotos")}">
          ${images
            .map(
              (image, i) =>
                `<button type="button" class="gallery-thumb${i === index ? " active" : ""}" data-gallery-index="${i}" style="background: ${image.css}" aria-label="${t("detail.photoLabel")} ${i + 1}"></button>`
            )
            .join("")}
        </div>
      `
      : "";
  return `
    <div class="detail-gallery" style="background: ${images[index].css}" role="img" aria-label="${t("detail.photoLabel")} ${index + 1}: ${listing.title}">
      ${images[index].aiGenerated ? `<span class="ai-badge">${t("ai.badge")}</span>` : ""}
    </div>
    ${thumbs}
  `;
}

let currentGalleryIndex = 0;

function selectGalleryImage(index) {
  const listing = listings.find((item) => item.id === currentDetailListingId);
  if (!listing) return;
  currentGalleryIndex = index;
  document.getElementById("detail-gallery-wrap").innerHTML = galleryTemplate(listing, index);
}

// Re-renders just the gallery (not the whole detail view) when the language
// changes while a listing detail happens to be open — otherwise the gallery's
// aria-labels/thumbnail alt text stay frozen in whatever language they were
// first rendered in, since openListing() only runs once per navigation.
function refreshOpenGalleryLanguage() {
  if (!currentDetailListingId) return;
  const listing = listings.find((item) => item.id === currentDetailListingId);
  const galleryWrap = document.getElementById("detail-gallery-wrap");
  if (listing && galleryWrap) galleryWrap.innerHTML = galleryTemplate(listing, currentGalleryIndex);
}

function openListing(id) {
  const listing = listings.find((item) => item.id === id);
  if (!listing) return;
  currentDetailListingId = id;
  currentGalleryIndex = 0;
  const saved = isSaved(listing.id);
  document.getElementById("listing-detail").innerHTML = `
    <div id="detail-gallery-wrap">${galleryTemplate(listing, 0)}</div>
    <section class="detail-main">
      <p class="eyebrow">${listing.locality} · ${listing.distance} · ${listing.posted}</p>
      <h2 id="detail-title">${listing.title}</h2>
      ${listing.status && listing.status !== "active" ? `<span class="status-badge status-${listing.status}">${t(`status.${listing.status}`)}</span>` : ""}
      <strong class="detail-price">${listing.price}</strong>
      <p class="detail-meta">${listing.condition} · ${listing.category}${listing.subtype ? " · " + listing.subtype : ""}</p>
      <div class="detail-actions">
        <button type="button" class="secondary-action${saved ? " saved" : ""}" data-save-listing="${listing.id}" aria-pressed="${saved}" aria-label="${saved ? `Remove ${listing.title} from saved items` : `Save ${listing.title} for later`}">${saved ? HEART_ICON_FILLED : HEART_ICON_OUTLINE}${saved ? "Saved" : "Save"}</button>
        <button type="button" class="secondary-action" data-share-listing="${listing.id}" aria-label="Share ${listing.title}">${SHARE_ICON}Share</button>
        <button type="button" class="secondary-action" data-report-listing="${listing.id}" aria-label="Report ${listing.title}">${FLAG_ICON}Report</button>
      </div>
      <button type="button" class="opener" id="suggested-opener">Hi, is this still available?</button>
      <p>${listing.description}</p>
      <dl class="attributes">
        <div><dt>Seller type</dt><dd>${listing.sellerType}</dd></div>
        <div><dt>Pickup area</dt><dd>${listing.locality}</dd></div>
        <div><dt>Currency</dt><dd>Original listing currency</dd></div>
      </dl>
      <section class="trust-box">
        <h3>${listing.sellerId ? `<button type="button" class="seller-name-link" data-open-profile="${listing.sellerId}">${listing.seller}</button>` : listing.seller}</h3>
        <p>${listing.trust}</p>
      </section>
      <section class="safety-box">
        <h3>Meet safely</h3>
        <p>Keep exact home addresses private until you choose to share more. Watch for payment pressure or suspicious links.</p>
      </section>
    </section>
    <aside class="similar-items">
      <h3>Similar nearby items</h3>
      <div>${listings.filter((item) => item.category === listing.category && item.id !== listing.id).slice(0, 2).map((item) => `<button type="button" data-open-listing="${item.id}">${item.title} · ${item.price}</button>`).join("")}</div>
    </aside>
    <div class="cta-bar">
      <button type="button" id="message-seller" aria-label="Message ${listing.seller} about ${listing.title}">Message seller</button>
    </div>
  `;
  showView("detail-view");
}

// --- NM-A16: public seller profiles ---

// Reuses GOOGLE_LOCALE_BY_LANGUAGE (see NM-A15) as a general app-language ->
// BCP47 locale map -- nothing about its values is Google-specific, only its
// original use site was.
function formatMemberSince(timestampMs) {
  const locale = GOOGLE_LOCALE_BY_LANGUAGE[currentLanguage] || "en";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(new Date(timestampMs));
}

function sellerProfileTemplate(profile) {
  const badge = profile.verified
    ? `<span class="verified-badge">${t("profile.verifiedBadge")}</span>`
    : `<span class="verified-badge unverified">${t("profile.unverifiedBadge")}</span>`;
  const listingsCountLabel = profile.activeListingCount === 1 ? t("profile.activeListingSingular") : t("profile.activeListingsPlural");
  const listingsHtml =
    profile.listings.length > 0
      ? `<div class="listing-grid">${profile.listings.map((listing) => listingCardTemplate(listing)).join("")}</div>`
      : `<p class="profile-empty">${t("profile.noActiveListings")}</p>`;

  return `
    <header class="profile-header">
      <div class="profile-avatar">${(profile.name || "?").charAt(0).toUpperCase()}</div>
      <div>
        <h2 id="profile-title">${profile.name}${badge}</h2>
        <p class="profile-meta">${t("profile.memberSince")} ${formatMemberSince(profile.memberSince)} · ${profile.activeListingCount} ${listingsCountLabel}</p>
      </div>
    </header>
    <h3 class="profile-listings-title">${t("profile.listingsTitle")}</h3>
    ${listingsHtml}
  `;
}

// A guest can open any real seller's public profile with no gate at all
// (NM-A16 requirement 6) -- unlike Save/Message/Report/Publish, viewing a
// profile touches no account-specific data.
async function openSellerProfile(sellerId) {
  const profile = await DataService.users.getProfile(sellerId);
  const container = document.getElementById("seller-profile");
  if (!profile) {
    container.innerHTML = `<p class="profile-empty">${t("profile.notFound")}</p>`;
    showView("profile-view");
    return;
  }
  container.innerHTML = sellerProfileTemplate(profile);
  showView("profile-view");
}

// --- Sell flow (NM-A3): photo-first, publishes into `listings`. ---
// NM-A10: photos are real user uploads (or real AI images), not fake CSS
// placeholders — see resizeImageFromSrc() below.

// Each entry in `sellPhotos` is { kind: "upload" | "ai" | "existing", value }.
// For "upload"/"ai", `value` is always a real data URL: either read from a
// file the user picked (resizeImageFile) or returned by the OpenAI backend
// call in generateAiPhoto() -- both passed through the same resize/compress
// pipeline before being stored, so every NEW photo respects MAX_PHOTO_BYTES
// regardless of how it was added. For "existing" (NM-A13: editing a
// published listing), `value` is already a complete CSS background value --
// a real /uploads file URL or a seed gradient -- so it's used as-is, not
// re-wrapped in another url(...) and never re-compressed.
function photoToCss(photo) {
  if (!photo) return "linear-gradient(135deg, #dfe6e1, #f4f6f1)";
  if (photo.kind === "existing") return photo.value;
  return `url(${photo.value}) center/cover no-repeat`;
}

const MAX_LISTING_PHOTOS = 6;
const MAX_PHOTO_BYTES = 1024 * 1024;
const MAX_PHOTO_DIMENSION = 1600;

function dataUrlByteLength(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.ceil((base64.length * 3) / 4);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image."));
    img.src = src;
  });
}

// Shrinks dimensions first if the source is larger than MAX_PHOTO_DIMENSION,
// then steps JPEG quality down, and finally shrinks further if quality
// alone can't reach the 1MB cap — always trying the least-lossy option
// first so quality is retained whenever the file allows it.
async function resizeImageFromSrc(src) {
  const img = await loadImageElement(src);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.92;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrlByteLength(dataUrl) > MAX_PHOTO_BYTES && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  while (dataUrlByteLength(dataUrl) > MAX_PHOTO_BYTES && width > 300) {
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

function resizeImageFile(file) {
  return readFileAsDataUrl(file).then((src) => resizeImageFromSrc(src));
}

function addSellPhoto() {
  if (sellPhotos.length >= MAX_LISTING_PHOTOS) return;
  const input = document.getElementById("sell-photo-input");
  if (input) input.click();
}

async function handleSellPhotoFilesSelected(event) {
  const input = event.target;
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length) return;
  const remainingSlots = MAX_LISTING_PHOTOS - sellPhotos.length;
  for (const file of files.slice(0, Math.max(0, remainingSlots))) {
    try {
      const dataUrl = await resizeImageFile(file);
      sellPhotos.push({ kind: "upload", value: dataUrl });
      renderSellPhotos();
      renderSellPreview();
    } catch (error) {
      showToast(t("photo.uploadFailed"));
    }
  }
}

function removeSellPhoto(index) {
  sellPhotos.splice(index, 1);
  renderSellPhotos();
  renderSellPreview();
}

// The cover/featured photo is always sellPhotos[0] — the same convention
// photosToImageObjects(), commitPublish(), and the gallery's default active
// index already rely on — so "make featured" is just a reorder.
function setSellPhotoCover(index) {
  if (index <= 0 || index >= sellPhotos.length) return;
  const [photo] = sellPhotos.splice(index, 1);
  sellPhotos.unshift(photo);
  renderSellPhotos();
  renderSellPreview();
}

function renderSellPhotos() {
  const grid = document.getElementById("sell-photo-grid");
  const tiles = sellPhotos
    .map(
      (photo, index) => `
        <div class="photo-tile" style="background: ${photoToCss(photo)}">
          ${index === 0 ? '<span class="cover-badge">Cover</span>' : `<button type="button" class="make-cover-button" data-make-cover="${index}">${t("photo.makeCover")}</button>`}
          ${photo.kind === "ai" || (photo.kind === "existing" && photo.aiGenerated) ? `<span class="ai-badge">${t("ai.badge")}</span>` : ""}
          <button type="button" class="remove-photo" data-remove-photo="${index}" aria-label="Remove photo ${index + 1}">×</button>
        </div>
      `
    )
    .join("");
  const addTile =
    sellPhotos.length < MAX_LISTING_PHOTOS
      ? `<button type="button" class="add-photo-tile" id="add-sell-photo" aria-label="Add a photo">+ Add photo</button>`
      : "";
  grid.innerHTML = tiles + addTile;
}

function formatPrice(rawPrice) {
  const digits = rawPrice.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return `${digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ")} kr`;
}

function getSellFormValues() {
  const isFree = document.getElementById("sell-free-toggle").checked;
  const subtypeField = document.getElementById("sell-subtype-field");
  return {
    title: document.getElementById("sell-title-input").value.trim(),
    isFree,
    rawPrice: document.getElementById("sell-price-input").value.trim(),
    category: document.getElementById("sell-category-select").value,
    subtype: subtypeField.hidden ? "" : document.getElementById("sell-subtype-select").value,
    condition: document.getElementById("sell-condition-select").value,
    location: document.getElementById("sell-location-input").value.trim(),
    region: document.getElementById("sell-region-input").value.trim(),
    description: document.getElementById("sell-description-input").value.trim(),
    photos: sellPhotos.slice()
  };
}

function validateSellForm(values) {
  const errors = [];
  if (values.photos.length < 1) errors.push("Add at least 1 photo.");
  if (!values.title) errors.push("Add a title.");
  if (!values.isFree && !values.rawPrice) errors.push("Set a price, or toggle Free.");
  if (!values.category) errors.push("Choose a category.");
  if (!values.condition) errors.push("Choose a condition.");
  if (!values.location) errors.push("Add an approximate location.");
  if (!values.description) errors.push("Add a short description.");
  return errors;
}

// Every place that stores or previews a listing's photos uses this shared
// shape: an array of { css, aiGenerated }, always capped at
// MAX_LISTING_PHOTOS. `image`/`aiPhoto` (singular) stay as derived
// convenience fields — the cover photo — so the existing card/Inbox
// rendering (which only ever showed one photo) needed no changes.
function photosToImageObjects(photos) {
  return photos.slice(0, MAX_LISTING_PHOTOS).map((photo) => ({
    css: photoToCss(photo),
    aiGenerated: photo.kind === "existing" ? Boolean(photo.aiGenerated) : photo.kind === "ai"
  }));
}

function renderSellPreview() {
  const values = getSellFormValues();
  const images = photosToImageObjects(values.photos);
  const previewListing = {
    title: values.title || "Your title will appear here",
    price: values.isFree ? "Free" : formatPrice(values.rawPrice) || "Set a price",
    locality: values.location || "Approximate area",
    distance: "New listing",
    sponsored: false,
    freshness: "New today",
    aiPhoto: Boolean(images[0] && images[0].aiGenerated),
    image: images[0] ? images[0].css : photoToCss(null),
    images
  };
  document.getElementById("sell-preview").innerHTML = listingCardTemplate(previewListing, { interactive: false });
}

function generateAiPhoto() {
  if (sellPhotos.length >= MAX_LISTING_PHOTOS) {
    const status = document.getElementById("ai-photo-status");
    status.classList.remove("success");
    status.textContent = t("ai.limitReached");
    return;
  }
  const promptInput = document.getElementById("ai-photo-prompt");
  const titleInput = document.getElementById("sell-title-input");
  const prompt = promptInput.value.trim() || titleInput.value.trim();
  if (!prompt) {
    const status = document.getElementById("ai-photo-status");
    status.classList.remove("success");
    status.textContent = t("ai.promptRequired");
    return;
  }
  requireAuth(() => performAiGeneration(prompt));
}

async function performAiGeneration(prompt) {
  const button = document.getElementById("generate-ai-photo");
  const status = document.getElementById("ai-photo-status");
  button.disabled = true;
  status.classList.remove("success");
  status.textContent = t("ai.generating");

  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      status.textContent = `${t("ai.failed")} ${data.error || ""}`.trim();
      return;
    }
    if (!data.image) {
      status.textContent = t("ai.failed");
      return;
    }

    const compressed = await resizeImageFromSrc(data.image);
    sellPhotos.push({ kind: "ai", value: compressed });
    renderSellPhotos();
    renderSellPreview();
    status.classList.add("success");
    status.textContent = t("ai.success");
  } catch (error) {
    status.textContent = `${t("ai.failed")} ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

// NM-A13: toggles the Sell form's heading/submit-button copy between
// "publish a new listing" and "save changes to an existing one" -- the form
// itself (fields, photos, validation) is identical either way.
function setSellFormMode(isEditing) {
  const heading = document.getElementById("sell-title");
  const submit = document.getElementById("sell-publish");
  if (heading) heading.textContent = t(isEditing ? "sell.headingEdit" : "sell.heading");
  if (submit) submit.textContent = t(isEditing ? "sell.saveChangesButton" : "sell.publishButton");
}

function resetSellForm() {
  editingListingId = null;
  setSellFormMode(false);
  sellPhotos = [];
  renderSellPhotos();
  document.getElementById("ai-photo-prompt").value = "";
  document.getElementById("ai-photo-status").textContent = "";
  document.getElementById("ai-photo-status").classList.remove("success");
  document.getElementById("sell-title-input").value = "";
  document.getElementById("sell-price-input").value = "";
  document.getElementById("sell-price-input").disabled = false;
  document.getElementById("sell-free-toggle").checked = false;
  document.getElementById("sell-category-select").selectedIndex = 0;
  updateSubtypeVisibility();
  document.getElementById("sell-condition-select").selectedIndex = 0;
  document.getElementById("sell-location-input").value = "";
  document.getElementById("sell-region-input").value = "";
  document.getElementById("sell-description-input").value = "";
  renderSellPreview();
}

// NM-A13: populates the Sell form from an existing listing the current user
// owns, and flips it into "edit" mode. Reuses every existing Sell-form
// mechanism (6-photo cap, compression pipeline, Make cover, validation) --
// only publishListing()'s save step branches on editingListingId.
function startEditListing(id) {
  if (!currentUser) return;
  const listing = listings.find((item) => item.id === id);
  if (!listing || listing.sellerId !== currentUser.id) return;

  editingListingId = id;
  sellPhotos = getListingImages(listing).map((image) => ({ kind: "existing", value: image.css, aiGenerated: image.aiGenerated }));

  const isFree = listing.price === "Free";
  document.getElementById("sell-title-input").value = listing.title;
  document.getElementById("sell-free-toggle").checked = isFree;
  document.getElementById("sell-price-input").value = isFree ? "" : String(parsePriceValue(listing.price));
  document.getElementById("sell-price-input").disabled = isFree;
  document.getElementById("sell-category-select").value = listing.category;
  updateSubtypeVisibility();
  if (listing.subtype) document.getElementById("sell-subtype-select").value = listing.subtype;
  document.getElementById("sell-condition-select").value = listing.condition;
  document.getElementById("sell-location-input").value = listing.locality;
  document.getElementById("sell-region-input").value = listing.region || "";
  document.getElementById("sell-description-input").value = listing.description;

  renderSellPhotos();
  renderSellPreview();
  setSellFormMode(true);
  showView("sell-view");
}

async function commitPublish(values) {
  const images = photosToImageObjects(values.photos);
  const record = await DataService.listings.create({
    title: values.title,
    category: values.category,
    subtype: values.subtype,
    price: values.isFree ? "Free" : formatPrice(values.rawPrice),
    locality: values.location,
    region: values.region,
    distance: "New listing",
    condition: values.condition,
    posted: "Just now",
    postedAt: Date.now(),
    freshness: "New today",
    aiPhoto: Boolean(images[0] && images[0].aiGenerated),
    image: images[0] ? images[0].css : photoToCss(null),
    images,
    description: values.description,
    // NM-A14: seller/sellerId are now derived server-side from the real
    // session (see scripts/api.js) -- publishing already requires a real
    // account, so there's no "You"/guest fallback to write here anymore.
    sellerType: "Private seller",
    trust: "New seller · Published just now",
    sponsored: false
  });

  listings = await DataService.listings.getAll();
  renderCategories();
  renderCategoryChips();
  renderListings();
  renderMyListings();
  const validation = document.getElementById("sell-validation");
  validation.classList.add("success");
  validation.textContent = "Listing published. Opening your listing...";
  resetSellForm();
  openListing(record.id);
  return record;
}

async function commitEdit(values) {
  const editedId = editingListingId;
  const images = photosToImageObjects(values.photos);
  const record = await DataService.listings.update(editedId, {
    title: values.title,
    category: values.category,
    subtype: values.subtype,
    price: values.isFree ? "Free" : formatPrice(values.rawPrice),
    locality: values.location,
    region: values.region,
    condition: values.condition,
    description: values.description,
    images
  });

  listings = await DataService.listings.getAll();
  renderCategories();
  renderCategoryChips();
  renderListings();
  renderMyListings();
  const validation = document.getElementById("sell-validation");
  validation.classList.add("success");
  validation.textContent = t("myListings.editSaved");
  resetSellForm();
  openListing(editedId);
  return record;
}

async function publishListing(event) {
  if (event && event.preventDefault) event.preventDefault();
  const values = getSellFormValues();
  const errors = validateSellForm(values);
  const validation = document.getElementById("sell-validation");

  if (errors.length > 0) {
    validation.classList.remove("success");
    validation.textContent = errors.join(" ");
    return null;
  }

  return requireAuth(() => (editingListingId ? commitEdit(values) : commitPublish(values)));
}

function handleSellFormChange(event) {
  if (event.target.id === "sell-category-select") updateSubtypeVisibility();
  if (event.target.id === "sell-free-toggle") {
    document.getElementById("sell-price-input").disabled = event.target.checked;
  }
  renderSellPreview();
}

function bindEvents() {
  document.getElementById("search-input").addEventListener("input", renderListings);
  document.getElementById("sidebar-search-input").addEventListener("input", handleSidebarSearchInput);
  document.getElementById("back-to-browse").addEventListener("click", () => showView("browse-view"));
  document.getElementById("language-select").addEventListener("change", (event) => setLanguage(event.target.value));
  document.getElementById("sell-form").addEventListener("submit", publishListing);
  document.getElementById("sell-form").addEventListener("input", handleSellFormChange);
  document.getElementById("sell-form").addEventListener("change", handleSellFormChange);
  document.getElementById("generate-ai-photo").addEventListener("click", generateAiPhoto);
  document.getElementById("sell-photo-input").addEventListener("change", handleSellPhotoFilesSelected);

  document.getElementById("login-form").addEventListener("submit", handleLoginPageFormSubmit);
  document.getElementById("login-guest-button").addEventListener("click", handleLoginPageGuestClick);
  document.getElementById("login-mode-toggle").addEventListener("click", () => {
    setAuthMode("login", authMode === "login" ? "register" : "login");
  });

  document.getElementById("thread-reply-form").addEventListener("submit", sendThreadReply);

  document.getElementById("auth-form").addEventListener("submit", handleAuthFormSubmit);
  document.getElementById("auth-guest-button").addEventListener("click", dismissAuthModal);
  document.getElementById("auth-mode-toggle").addEventListener("click", () => {
    setAuthMode("auth", authMode === "login" ? "register" : "login");
  });
  document.getElementById("auth-modal-close").addEventListener("click", closeAuthModal);
  document.getElementById("compose-modal-close").addEventListener("click", closeComposeModal);
  document.getElementById("compose-cancel-button").addEventListener("click", closeComposeModal);
  document.getElementById("compose-send-button").addEventListener("click", sendComposedMessage);

  document.getElementById("filter-button").addEventListener("click", openFilterSheet);
  document.getElementById("filter-sheet-close").addEventListener("click", closeFilterSheet);
  document.getElementById("filter-clear-button").addEventListener("click", clearFilterDraft);
  document.getElementById("filter-reset-button").addEventListener("click", resetFilters);
  document.getElementById("filter-apply-button").addEventListener("click", applyFilters);
  document.getElementById("filter-sheet").addEventListener("change", handleFilterSheetChange);

  document.getElementById("category-chips").addEventListener("scroll", updateChipCarouselArrows);
  if (typeof window !== "undefined") window.addEventListener("resize", updateChipCarouselArrows);

  document.addEventListener("click", (event) => {
    const listingButton = event.target.closest("[data-open-listing]");
    const chip = event.target.closest("[data-category]");
    const chipScrollButton = event.target.closest("[data-chip-scroll]");
    const scope = event.target.closest("[data-scope]");
    const nav = event.target.closest("[data-view]");
    const categoryJump = event.target.closest("[data-category-jump]");
    const addPhoto = event.target.closest("#add-sell-photo");
    const removePhoto = event.target.closest("[data-remove-photo]");
    const makeCover = event.target.closest("[data-make-cover]");
    const saveButton = event.target.closest("[data-save-listing]");
    const reportButton = event.target.closest("[data-report-listing]");
    const shareButton = event.target.closest("[data-share-listing]");
    const openProfileButton = event.target.closest("[data-open-profile]");
    // The suggested-opener pill is a one-tap shortcut into the exact same
    // gated compose flow as the Message seller button (both end up
    // pre-filled with the same "Hi, is this still available?" opener) --
    // not a separate feature needing its own handler.
    const messageButton = event.target.closest("#message-seller, #suggested-opener");
    const signOutButton = event.target.closest("#sign-out-button");
    const filterChip = event.target.closest("[data-filter-value]");
    const removeFilterChip = event.target.closest("[data-remove-filter]");
    const openThreadButton = event.target.closest("[data-open-thread]");
    const galleryThumb = event.target.closest("[data-gallery-index]");
    const boostButton = event.target.closest("[data-toggle-boost]");
    const logoutButton = event.target.closest("[data-logout]");
    const editListingButton = event.target.closest("[data-edit-listing]");
    const deleteListingButton = event.target.closest("[data-delete-listing]");

    if (listingButton) openListing(listingButton.dataset.openListing);
    if (chipScrollButton) scrollCategoryChips(Number(chipScrollButton.dataset.chipScroll));
    if (chip) {
      activeCategory = chip.dataset.category;
      activeFilters.subtype = "";
      renderCategoryChips();
      renderActiveFilterChips();
      renderListings();
    }
    if (scope) {
      activeScope = scope.dataset.scope;
      document.querySelectorAll(".scope").forEach((item) => item.classList.toggle("active", item === scope));
      renderListings();
    }
    if (nav) {
      // Leaving to another tab while mid-edit (without saving) abandons the
      // edit -- otherwise a stale editingListingId would silently turn the
      // NEXT "Publish" into an unintended edit of a different listing.
      if (nav.dataset.view === "sell-view" && editingListingId) resetSellForm();
      showView(nav.dataset.view);
      if (nav.dataset.view === "analytics-view") renderAnalytics();
      if (nav.dataset.view === "my-listings-view") {
        pendingDeleteListingId = null;
        renderMyListings();
      }
      if (nav.dataset.view === "login-view") {
        setAuthMode("login", "login");
        clearAuthFormFields("login");
      }
    }
    if (categoryJump) {
      activeCategory = categoryJump.dataset.categoryJump;
      activeFilters.subtype = "";
      renderCategoryChips();
      renderActiveFilterChips();
      renderListings();
      showView("browse-view");
    }
    if (addPhoto) addSellPhoto();
    if (removePhoto) removeSellPhoto(Number(removePhoto.dataset.removePhoto));
    if (makeCover) setSellPhotoCover(Number(makeCover.dataset.makeCover));
    if (saveButton) handleSaveClick(saveButton.dataset.saveListing);
    if (reportButton) handleReportClick(reportButton.dataset.reportListing);
    if (shareButton) handleShareClick(shareButton.dataset.shareListing);
    if (openProfileButton) openSellerProfile(openProfileButton.dataset.openProfile);
    if (messageButton) handleMessageClick(currentDetailListingId);
    if (signOutButton) signOutUser();
    if (filterChip) toggleFilterChip(filterChip.dataset.filterGroup, filterChip.dataset.filterValue);
    if (removeFilterChip) removeActiveFilter(removeFilterChip.dataset.removeFilter);
    if (boostButton) toggleBoost(boostButton.dataset.toggleBoost);
    if (logoutButton) signOutUser();
    if (openThreadButton) openThread(openThreadButton.dataset.openThread);
    if (galleryThumb) selectGalleryImage(Number(galleryThumb.dataset.galleryIndex));
    if (editListingButton) startEditListing(editListingButton.dataset.editListing);
    if (deleteListingButton) handleDeleteListingClick(deleteListingButton.dataset.deleteListing);
  });

  document.addEventListener("change", (event) => {
    const statusSelect = event.target.closest("[data-status-select]");
    if (statusSelect) handleMyListingStatusChange(statusSelect.dataset.statusSelect, statusSelect.value);
  });
}

// Bootstrap (NM-A7): the one place that awaits the data service before the
// first render. Everything it awaits resolves on a microtask today (no real
// network), but writing it as async now means swapping DataService for a
// real backend later needs no changes here.
async function bootstrap() {
  currentUser = await DataService.users.getCurrent();
  await refreshSavedItemsCache();
  loadSavedLanguage();
  applyCountryTheme(activeCountry);
  categoryTaxonomy = await DataService.categories.getAll();
  listings = await DataService.listings.getAll();
  await refreshInboxCache();
  renderCategoryChips();
  renderCategorySelectOptions();
  renderCategories();
  renderActiveFilterChips();
  renderListings();
  renderInbox();
  renderMyListings();
  renderProfileAvatar();
  renderAccountActions();
  renderSellPhotos();
  renderSellPreview();
  bindEvents();
  applyTranslations();
  if (document.getElementById("language-select")) {
    document.getElementById("language-select").value = currentLanguage;
  }
  // Deliberately not awaited -- see applyDetectedLocation()'s own comment.
  applyDetectedLocation();
  // Deliberately not awaited -- see initGoogleSignIn()'s own comment.
  initGoogleSignIn();
}

bootstrap();
