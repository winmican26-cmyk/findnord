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
    "browse.discoverTitle": "More to discover",
    "browse.discoverSubtitle": "A random mix of regular listings, so every seller gets a fair chance to be seen.",
    "price.free": "Free",
    "price.perMonthSuffix": "/month",
    "price.placeholder": "Set a price",
    "browse.resultCountSingular": "listing",
    "browse.resultCountPlural": "listings",
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
    "auth.ageConfirmLabel": "I confirm I am at least 18 years old.",
    "auth.errorAgeNotConfirmed": "You must confirm you're at least 18 to create an account.",
    "auth.errorNameRequired": "Add your name.",
    "auth.errorGeneric": "Something went wrong. Try again.",
    "auth.errorGoogleEmailNotVerified": "That Google account's email isn't verified yet.",
    "auth.googleUnavailable": "Google sign-in is currently unavailable.",
    "auth.orContinueWithEmail": "or continue with email",
    "auth.forgotPasswordLink": "Forgot password?",
    "auth.forgotPasswordModalTitle": "Reset your password",
    "auth.forgotPasswordModalBody": "Enter your account email and we'll send a reset link.",
    "auth.forgotPasswordEmailLabel": "Email",
    "auth.forgotPasswordSubmitButton": "Send reset link",
    "auth.forgotPasswordSuccess": "If that email exists, we've sent a reset link.",
    "auth.resetPasswordModalTitle": "Set a new password",
    "auth.resetPasswordModalBody": "Choose a new password for your account.",
    "auth.resetPasswordLabel": "New password",
    "auth.resetPasswordSubmitButton": "Set new password",
    "auth.resetPasswordSuccess": "Your password has been reset. You can now log in with your new password.",
    "auth.errorResetTokenInvalid": "This reset link is invalid.",
    "auth.errorResetTokenExpired": "This reset link has expired. Request a new one.",
    "auth.errorResetTokenUsed": "This reset link has already been used.",
    "auth.errorGoogleAccountNoPassword": "This account signs in with Google — there's no password to reset. Try \"Continue with Google\" instead.",
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
    "inbox.buyerLabel": "Buyer",
    "thread.replyLabel": "Message",
    "thread.replyPlaceholder": "Write a message...",
    "thread.send": "Send",
    "compose.headingPrefix": "Message",
    "compose.send": "Send",
    "compose.cancel": "Cancel",
    "compose.sent": "Message sent. View it in your Inbox.",
    "compose.failed": "Couldn't send that message.",
    "report.sent": "Thanks — your report has been submitted for review.",
    "report.failed": "Couldn't submit that report.",
    "sell.publishFailed": "Couldn't publish this listing. Please try again.",
    "rateLimit.listings": "You're publishing listings too quickly. Try again in {minutes} minutes.",
    "rateLimit.messages": "You're sending messages too quickly. Try again in {minutes} minutes.",
    "rateLimit.reports": "You're submitting reports too quickly. Try again in {minutes} minutes.",
    "report.reportUser": "Report user",
    "report.modalTitleListing": "Report this listing",
    "report.modalTitleUser": "Report this user",
    "report.modalBody": "Tell us what's wrong. Reports are reviewed by the FindNord team.",
    "report.reasonLabel": "Reason",
    "report.detailsLabel": "Details (optional)",
    "report.detailsPlaceholder": "Any specifics that would help us review this",
    "report.cancel": "Cancel",
    "report.submit": "Submit report",
    "report.reason.prohibited_item": "Prohibited or illegal item",
    "report.reason.scam_or_fraud": "Scam or fraud",
    "report.reason.inappropriate_content": "Inappropriate content",
    "report.reason.harassment": "Harassment or abuse",
    "report.reason.spam": "Spam",
    "report.reason.other": "Other",
    "block.blockAction": "Block",
    "block.unblockAction": "Unblock",
    "block.added": "User blocked. You won't see their listings or messages.",
    "block.removed": "User unblocked.",
    "block.messagingBlocked": "You can't message this user.",
    "safety.title": "Meet safely",
    "safety.body": "Keep exact home addresses private until you choose to share more. Watch for payment pressure, and use the Report button if anything feels wrong.",
    "safety.readMore": "Read our Safety Tips",
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
    "account.actionSettings": "Settings",
    "account.actionLogout": "Logout",
    "settings.signedOutBody": "Sign in to manage your contact info.",
    "settings.emailLabel": "Email",
    "settings.emailHint": "This is your account's sign-in email and can't be changed here.",
    "settings.phoneLabel": "Mobile number",
    "settings.phonePlaceholder": "e.g. +46 70 123 45 67",
    "settings.homeCountryLabel": "Home country",
    "settings.homeRegionLabel": "Home region",
    "settings.homeRegionPlaceholder": "Select or type your region",
    "settings.homeLocationHint": "Used for new listings you publish — separate from whatever country you're currently browsing.",
    "settings.save": "Save changes",
    "settings.saved": "Settings saved.",
    "settings.failed": "Couldn't save your settings.",
    "admin.actionQueue": "Moderation Queue",
    "admin.internalEyebrow": "Internal",
    "admin.accessDenied": "You don't have access to this page.",
    "admin.emptyQueue": "No reports right now.",
    "admin.targetListing": "Listing",
    "admin.targetUser": "User",
    "admin.targetUnknown": "Unknown target",
    "admin.reportedBy": "Reported by",
    "admin.markReviewed": "Mark reviewed",
    "admin.markDismissed": "Dismiss",
    "admin.hideListing": "Hide listing",
    "admin.unhideListing": "Unhide listing",
    "admin.flagUser": "Flag user",
    "admin.unflagUser": "Unflag user",
    "admin.status.open": "Open",
    "admin.status.reviewed": "Reviewed",
    "admin.status.dismissed": "Dismissed",
    "myListings.emptyBody": "You haven't published any listings yet.",
    "myListings.emptyCta": "Start selling",
    "myListings.boost": "Boost",
    "myListings.unboost": "Remove boost",
    "myListings.boosted": "Boosted",
    "myListings.boostedUntil": "Boosted until",
    "account.actionBoost": "Boost Ads",
    "boost.sheetTitle": "Boost this listing",
    "boost.introFree": "Boosting is completely free while FindNord is in its early access period. Pick a duration below.",
    "boost.introPaid": "Choose a boost package and complete checkout to activate it.",
    "boost.freeDuringLaunch": "Free for now",
    "boost.selectFree": "Activate free",
    "boost.selectPay": "Pay & activate",
    "boost.activeUntil": "Boosted until",
    "boost.changePackage": "Change package",
    "boost.activated": "Boost activated.",
    "boost.cancelled": "Boost removed.",
    "boost.failed": "Couldn't activate that boost.",
    "boost.package.24h": "24 hours",
    "boost.package.7d": "7 days",
    "boost.package.30d": "30 days",
    "boost.package.6m": "6 months",
    "boost.package.12m": "12 months",
    "boost.package.legacy": "Legacy boost",
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
    "profile.ratingEmpty": "No reviews yet",
    "profile.reviewSingular": "review",
    "profile.reviewPlural": "reviews",
    "profile.reviewsTitle": "Recent reviews",
    "profile.noReviews": "No reviews yet.",
    "review.leaveTitle": "Leave a review",
    "review.ratingLabel": "Rating",
    "review.textLabel": "Short review",
    "review.textPlaceholder": "Share a short, practical note",
    "review.submit": "Post review",
    "review.signInHint": "Sign in to leave a review.",
    "review.notForSelf": "You cannot review yourself.",
    "review.posted": "Review posted.",
    "review.failed": "Couldn't post that review.",
    "review.sellerSummaryEmpty": "No seller reviews yet",
    "review.duplicate": "You already reviewed this seller for this listing.",
    "review.warningModerated": "Your review was posted, but inappropriate language was removed. Repeated violations will block you from leaving reviews.",
    "review.banned": "You are no longer allowed to leave reviews.",
    "review.bannedNow": "Your review contained inappropriate language. Repeated violations have blocked you from leaving reviews.",
    "footer.tagline": "The marketplace for the Scandinavians. Buy, sell & discover across the Nordics.",
    "footer.createAccount": "Create free account",
    "footer.startSelling": "Start selling",
    "footer.companyLine": "FindNord — a branch of Micany Investment",
    "footer.colCategories": "Categories",
    "footer.colExplore": "Explore",
    "footer.colBuySell": "Buy & Sell",
    "footer.colHelp": "Help & Support",
    "footer.colLegal": "Legal & Trust",
    "footer.colCompany": "Company",
    "footer.browseAll": "Browse all →",
    "footer.countriesTitle": "Browse by country",
    "footer.copyright": "© 2026 FindNord — a branch of Micany Investment. All rights reserved.",
    "footer.linkAbout": "About Us",
    "footer.linkHow": "How It Works",
    "footer.linkSafetyTips": "Safety Tips",
    "footer.linkTerms": "Terms of Service",
    "footer.linkPost": "Post a Listing",
    "footer.linkPricing": "Pricing Guide",
    "footer.linkPhoto": "Photo Guide",
    "footer.linkSafeSelling": "Safe Selling Guide",
    "footer.linkHelpCenter": "Help Center",
    "footer.linkFaq": "FAQ",
    "footer.linkContact": "Contact Support",
    "footer.linkReport": "Report an Issue",
    "footer.linkPrivacy": "Privacy Policy",
    "footer.linkCookies": "Cookie Policy",
    "footer.linkDsr": "Data Subject Rights",
    "footer.linkMicany": "Micany Investment",
    "footer.linkModeration": "Content & Moderation",
    "footer.linkDataSafety": "Data Safety",
    "footer.linkBoost": "Boost Your Ads",
    "cookie.bannerText": "We use cookies to keep you signed in, secure your account, and understand how the marketplace is used. You can change your choices any time.",
    "cookie.settings": "Cookie Settings",
    "cookie.accept": "Accept",
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
    "browse.discoverTitle": "Mer att upptäcka",
    "browse.discoverSubtitle": "Ett slumpmässigt urval av vanliga annonser, så att alla säljare får en rättvis chans att synas.",
    "price.free": "Gratis",
    "price.perMonthSuffix": "/månad",
    "price.placeholder": "Ange ett pris",
    "browse.resultCountSingular": "annons",
    "browse.resultCountPlural": "annonser",
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
    "auth.ageConfirmLabel": "Jag bekräftar att jag är minst 18 år.",
    "auth.errorAgeNotConfirmed": "Du måste bekräfta att du är minst 18 år för att skapa ett konto.",
    "auth.errorNameRequired": "Ange ditt namn.",
    "auth.errorGeneric": "Något gick fel. Försök igen.",
    "auth.errorGoogleEmailNotVerified": "E-postadressen för det Google-kontot är inte verifierad än.",
    "auth.googleUnavailable": "Google-inloggning är inte tillgänglig just nu.",
    "auth.orContinueWithEmail": "eller fortsätt med e-post",
    "auth.forgotPasswordLink": "Glömt lösenordet?",
    "auth.forgotPasswordModalTitle": "Återställ ditt lösenord",
    "auth.forgotPasswordModalBody": "Ange din kontos e-postadress och vi skickar en återställningslänk.",
    "auth.forgotPasswordEmailLabel": "E-post",
    "auth.forgotPasswordSubmitButton": "Skicka återställningslänk",
    "auth.forgotPasswordSuccess": "Om den e-postadressen finns har vi skickat en återställningslänk.",
    "auth.resetPasswordModalTitle": "Ange ett nytt lösenord",
    "auth.resetPasswordModalBody": "Välj ett nytt lösenord för ditt konto.",
    "auth.resetPasswordLabel": "Nytt lösenord",
    "auth.resetPasswordSubmitButton": "Ange nytt lösenord",
    "auth.resetPasswordSuccess": "Ditt lösenord har återställts. Du kan nu logga in med ditt nya lösenord.",
    "auth.errorResetTokenInvalid": "Den här återställningslänken är ogiltig.",
    "auth.errorResetTokenExpired": "Den här återställningslänken har gått ut. Begär en ny.",
    "auth.errorResetTokenUsed": "Den här återställningslänken har redan använts.",
    "auth.errorGoogleAccountNoPassword": "Det här kontot loggar in med Google — det finns inget lösenord att återställa. Prova \"Fortsätt med Google\" istället.",
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
    "inbox.buyerLabel": "Köpare",
    "thread.replyLabel": "Meddelande",
    "thread.replyPlaceholder": "Skriv ett meddelande...",
    "thread.send": "Skicka",
    "compose.headingPrefix": "Meddela",
    "compose.send": "Skicka",
    "compose.cancel": "Avbryt",
    "compose.sent": "Meddelandet har skickats. Se det i din inkorg.",
    "compose.failed": "Meddelandet kunde inte skickas.",
    "report.sent": "Tack — din anmälan har skickats för granskning.",
    "report.failed": "Anmälan kunde inte skickas.",
    "sell.publishFailed": "Annonsen kunde inte publiceras. Försök igen.",
    "rateLimit.listings": "Du publicerar annonser för snabbt. Försök igen om {minutes} minuter.",
    "rateLimit.messages": "Du skickar meddelanden för snabbt. Försök igen om {minutes} minuter.",
    "rateLimit.reports": "Du skickar anmälningar för snabbt. Försök igen om {minutes} minuter.",
    "report.reportUser": "Anmäl användare",
    "report.modalTitleListing": "Anmäl den här annonsen",
    "report.modalTitleUser": "Anmäl den här användaren",
    "report.modalBody": "Berätta vad som är fel. Anmälningar granskas av FindNords team.",
    "report.reasonLabel": "Anledning",
    "report.detailsLabel": "Detaljer (valfritt)",
    "report.detailsPlaceholder": "Eventuella detaljer som kan hjälpa oss att granska detta",
    "report.cancel": "Avbryt",
    "report.submit": "Skicka anmälan",
    "report.reason.prohibited_item": "Förbjuden eller olaglig vara",
    "report.reason.scam_or_fraud": "Bedrägeri",
    "report.reason.inappropriate_content": "Olämpligt innehåll",
    "report.reason.harassment": "Trakasserier eller kränkning",
    "report.reason.spam": "Skräppost",
    "report.reason.other": "Annat",
    "block.blockAction": "Blockera",
    "block.unblockAction": "Avblockera",
    "block.added": "Användaren är blockerad. Du kommer inte se deras annonser eller meddelanden.",
    "block.removed": "Användaren är avblockerad.",
    "block.messagingBlocked": "Du kan inte skicka meddelanden till den här användaren.",
    "safety.title": "Träffas säkert",
    "safety.body": "Håll din exakta hemadress privat tills du själv väljer att dela mer. Var uppmärksam på betalningspress, och använd anmälningsknappen om något känns fel.",
    "safety.readMore": "Läs våra säkerhetstips",
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
    "account.actionSettings": "Inställningar",
    "account.actionLogout": "Logga ut",
    "settings.signedOutBody": "Logga in för att hantera din kontaktinformation.",
    "settings.emailLabel": "E-post",
    "settings.emailHint": "Det här är ditt kontos inloggnings-e-post och kan inte ändras här.",
    "settings.phoneLabel": "Mobilnummer",
    "settings.phonePlaceholder": "t.ex. +46 70 123 45 67",
    "settings.homeCountryLabel": "Hemland",
    "settings.homeRegionLabel": "Hemregion",
    "settings.homeRegionPlaceholder": "Välj eller skriv din region",
    "settings.homeLocationHint": "Används för nya annonser du publicerar — oberoende av vilket land du för tillfället bläddrar i.",
    "settings.save": "Spara ändringar",
    "settings.saved": "Inställningarna har sparats.",
    "settings.failed": "Inställningarna kunde inte sparas.",
    "admin.actionQueue": "Granskningskö",
    "admin.internalEyebrow": "Internt",
    "admin.accessDenied": "Du har inte åtkomst till den här sidan.",
    "admin.emptyQueue": "Inga anmälningar just nu.",
    "admin.targetListing": "Annons",
    "admin.targetUser": "Användare",
    "admin.targetUnknown": "Okänt mål",
    "admin.reportedBy": "Anmäld av",
    "admin.markReviewed": "Markera som granskad",
    "admin.markDismissed": "Avfärda",
    "admin.hideListing": "Dölj annons",
    "admin.unhideListing": "Visa annons igen",
    "admin.flagUser": "Flagga användare",
    "admin.unflagUser": "Ta bort flaggning",
    "admin.status.open": "Öppen",
    "admin.status.reviewed": "Granskad",
    "admin.status.dismissed": "Avfärdad",
    "myListings.emptyBody": "Du har inte publicerat några annonser än.",
    "myListings.emptyCta": "Börja sälja",
    "myListings.boost": "Boosta",
    "myListings.unboost": "Ta bort boost",
    "myListings.boosted": "Boostad",
    "myListings.boostedUntil": "Boostad till",
    "account.actionBoost": "Boosta annonser",
    "boost.sheetTitle": "Boosta den här annonsen",
    "boost.introFree": "Att boosta är helt gratis medan FindNord är i sin tidiga lanseringsperiod. Välj en varaktighet nedan.",
    "boost.introPaid": "Välj ett boost-paket och slutför betalningen för att aktivera det.",
    "boost.freeDuringLaunch": "Gratis just nu",
    "boost.selectFree": "Aktivera gratis",
    "boost.selectPay": "Betala och aktivera",
    "boost.activeUntil": "Boostad till",
    "boost.changePackage": "Byt paket",
    "boost.activated": "Boosten är aktiverad.",
    "boost.cancelled": "Boosten togs bort.",
    "boost.failed": "Kunde inte aktivera boosten.",
    "boost.package.24h": "24 timmar",
    "boost.package.7d": "7 dagar",
    "boost.package.30d": "30 dagar",
    "boost.package.6m": "6 månader",
    "boost.package.12m": "12 månader",
    "boost.package.legacy": "Äldre boost",
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
    "profile.ratingEmpty": "Inga omdömen än",
    "profile.reviewSingular": "omdöme",
    "profile.reviewPlural": "omdömen",
    "profile.reviewsTitle": "Senaste omdömen",
    "profile.noReviews": "Inga omdömen än.",
    "review.leaveTitle": "Lämna omdöme",
    "review.ratingLabel": "Betyg",
    "review.textLabel": "Kort omdöme",
    "review.textPlaceholder": "Dela en kort och praktisk notering",
    "review.submit": "Publicera omdöme",
    "review.signInHint": "Logga in för att lämna ett omdöme.",
    "review.notForSelf": "Du kan inte recensera dig själv.",
    "review.posted": "Omdömet har publicerats.",
    "review.failed": "Kunde inte publicera omdömet.",
    "review.sellerSummaryEmpty": "Inga säljaromdömen än",
    "review.duplicate": "Du har redan recenserat den här säljaren för den här annonsen.",
    "review.warningModerated": "Ditt omdöme publicerades, men olämpligt språk togs bort. Upprepade överträdelser kommer att blockera dig från att lämna recensioner.",
    "review.banned": "Du får inte längre lämna recensioner.",
    "review.bannedNow": "Ditt omdöme innehöll olämpligt språk. Upprepade överträdelser har blockerat dig från att lämna recensioner.",
    "footer.tagline": "Marknadsplatsen för skandinaver. Köp, sälj och upptäck i hela Norden.",
    "footer.createAccount": "Skapa gratis konto",
    "footer.startSelling": "Börja sälja",
    "footer.companyLine": "FindNord — en del av Micany Investment",
    "footer.colCategories": "Kategorier",
    "footer.colExplore": "Utforska",
    "footer.colBuySell": "Köp & Sälj",
    "footer.colHelp": "Hjälp & Support",
    "footer.colLegal": "Juridik & Förtroende",
    "footer.colCompany": "Företag",
    "footer.browseAll": "Bläddra bland allt →",
    "footer.countriesTitle": "Bläddra efter land",
    "footer.copyright": "© 2026 FindNord — en del av Micany Investment. Alla rättigheter förbehållna.",
    "footer.linkAbout": "Om oss",
    "footer.linkHow": "Så fungerar det",
    "footer.linkSafetyTips": "Säkerhetstips",
    "footer.linkTerms": "Användarvillkor",
    "footer.linkPost": "Skapa en annons",
    "footer.linkPricing": "Prisguide",
    "footer.linkPhoto": "Fotoguide",
    "footer.linkSafeSelling": "Guide för säker försäljning",
    "footer.linkHelpCenter": "Hjälpcenter",
    "footer.linkFaq": "Vanliga frågor",
    "footer.linkContact": "Kontakta support",
    "footer.linkReport": "Anmäl ett problem",
    "footer.linkPrivacy": "Integritetspolicy",
    "footer.linkCookies": "Cookiepolicy",
    "footer.linkDsr": "Dina rättigheter (DSR)",
    "footer.linkMicany": "Micany Investment",
    "footer.linkModeration": "Innehåll & Moderering",
    "footer.linkDataSafety": "Datasäkerhet",
    "footer.linkBoost": "Boosta dina annonser",
    "cookie.bannerText": "Vi använder cookies för att hålla dig inloggad, skydda ditt konto och förstå hur marknadsplatsen används. Du kan ändra dina val när som helst.",
    "cookie.settings": "Cookieinställningar",
    "cookie.accept": "Acceptera",
    "filter.regionLabel": "Region",
    "filter.regionPlaceholder": "Välj eller skriv en region",
    "sell.regionLabel": "Region",
    "sell.regionPlaceholder": "Välj eller skriv din region",
    "sidebar.browseAll": "Bläddra bland allt",
    "sidebar.createListing": "Skapa ny annons",
    "sidebar.locationTitle": "Plats",
    "sidebar.searchLabel": "Sök på Marketplace"
  },
  // NM-A26: Norwegian (Bokmal), Danish, Finnish, and Icelandic -- full
  // translation coverage for every key that exists in en/sv (see EVIDENCE.md).
  no: {
    "brand.eyebrow": "Marked i nærheten",
    "nav.browse": "Utforsk",
    "nav.categories": "Kategorier",
    "nav.sell": "Selg",
    "nav.inbox": "Innboks",
    "nav.you": "Du",
    "browse.heading": "Nye funn nær deg",
    "browse.filter": "Filter",
    "browse.searchLabel": "Søk",
    "browse.searchPlaceholder": "Hva leter du etter?",
    "browse.discoverTitle": "Mer å oppdage",
    "browse.discoverSubtitle": "Et tilfeldig utvalg av vanlige annonser, slik at alle selgere får en rettferdig sjanse til å bli sett.",
    "price.free": "Gratis",
    "price.perMonthSuffix": "/måned",
    "price.placeholder": "Angi en pris",
    "browse.resultCountSingular": "annonse",
    "browse.resultCountPlural": "annonser",
    "empty.heading": "Ingen eksakte treff i nærheten",
    "sell.heading": "Selg på under to minutter",
    "auth.eyebrow": "Innlogging kreves",
    "auth.title": "Logg inn for å fortsette",
    "auth.body": "Lagre annonser, send meldinger til selgere, publiser annonser og rapporter problemer når du er logget inn.",
    "auth.emailLabel": "E-post",
    "auth.emailPlaceholder": "du@eksempel.no",
    "auth.nameLabel": "Navn",
    "auth.passwordLabel": "Passord",
    "auth.continue": "Fortsett",
    "auth.guest": "Fortsett som gjest",
    "auth.close": "Lukk",
    "auth.loginButton": "Logg inn",
    "auth.registerButton": "Opprett konto",
    "auth.modeToggleToRegister": "Ny på FindNord? Opprett en konto",
    "auth.modeToggleToLogin": "Har du allerede en konto? Logg inn",
    "auth.errorInvalidCredentials": "Feil e-post eller passord.",
    "auth.errorEmailTaken": "Den e-postadressen er allerede registrert. Prøv å logge inn i stedet.",
    "auth.errorPasswordTooShort": "Passordet må være minst 8 tegn.",
    "auth.ageConfirmLabel": "Jeg bekrefter at jeg er minst 18 år.",
    "auth.errorAgeNotConfirmed": "Du må bekrefte at du er minst 18 år for å opprette en konto.",
    "auth.errorNameRequired": "Legg til navnet ditt.",
    "auth.errorGeneric": "Noe gikk feil. Prøv igjen.",
    "auth.errorGoogleEmailNotVerified": "E-postadressen til den Google-kontoen er ikke bekreftet ennå.",
    "auth.googleUnavailable": "Innlogging med Google er ikke tilgjengelig akkurat nå.",
    "auth.orContinueWithEmail": "eller fortsett med e-post",
    "auth.forgotPasswordLink": "Glemt passord?",
    "auth.forgotPasswordModalTitle": "Tilbakestill passordet ditt",
    "auth.forgotPasswordModalBody": "Skriv inn e-postadressen til kontoen din, og vi sender en lenke for tilbakestilling.",
    "auth.forgotPasswordEmailLabel": "E-post",
    "auth.forgotPasswordSubmitButton": "Send tilbakestillingslenke",
    "auth.forgotPasswordSuccess": "Hvis den e-postadressen finnes, har vi sendt en tilbakestillingslenke.",
    "auth.resetPasswordModalTitle": "Angi et nytt passord",
    "auth.resetPasswordModalBody": "Velg et nytt passord for kontoen din.",
    "auth.resetPasswordLabel": "Nytt passord",
    "auth.resetPasswordSubmitButton": "Angi nytt passord",
    "auth.resetPasswordSuccess": "Passordet ditt er tilbakestilt. Du kan nå logge inn med det nye passordet.",
    "auth.errorResetTokenInvalid": "Denne tilbakestillingslenken er ugyldig.",
    "auth.errorResetTokenExpired": "Denne tilbakestillingslenken har utløpt. Be om en ny.",
    "auth.errorResetTokenUsed": "Denne tilbakestillingslenken er allerede brukt.",
    "auth.errorGoogleAccountNoPassword": "Denne kontoen logger inn med Google — det finnes ikke noe passord å tilbakestille. Prøv «Fortsett med Google» i stedet.",
    "account.eyebrow": "Din aktivitet",
    "account.heading": "Lagrede annonser, dine annonser og tillitsinnstillinger",
    "account.body": "Logg inn når du vil lagre, sende meldinger, selge, rapportere eller lage varsler.",
    "account.signedInEyebrow": "Innlogget",
    "account.signedInHeading": "Velkommen tilbake",
    "account.emailLabel": "Innlogget som",
    "account.signOut": "Logg ut",
    "account.signInButton": "Logg inn",
    "login.tagline": "Markedsplassen for skandinavene",
    "inbox.eyebrow": "Kun markedsplass",
    "inbox.signedOutBody": "Logg inn for å se samtalene dine.",
    "inbox.emptyBody": "Samtaler starter fra en annonses knapp for å melde selger.",
    "inbox.unknownListing": "Annonse",
    "inbox.buyerLabel": "Kjøper",
    "thread.replyLabel": "Melding",
    "thread.replyPlaceholder": "Skriv en melding...",
    "thread.send": "Send",
    "compose.headingPrefix": "Melding til",
    "compose.send": "Send",
    "compose.cancel": "Avbryt",
    "compose.sent": "Meldingen er sendt. Se den i innboksen din.",
    "compose.failed": "Kunne ikke sende meldingen.",
    "report.sent": "Takk — rapporten din er sendt til gjennomgang.",
    "report.failed": "Kunne ikke sende rapporten.",
    "sell.publishFailed": "Kunne ikke publisere annonsen. Prøv igjen.",
    "rateLimit.listings": "Du publiserer annonser for raskt. Prøv igjen om {minutes} minutter.",
    "rateLimit.messages": "Du sender meldinger for raskt. Prøv igjen om {minutes} minutter.",
    "rateLimit.reports": "Du sender rapporter for raskt. Prøv igjen om {minutes} minutter.",
    "report.reportUser": "Rapporter bruker",
    "report.modalTitleListing": "Rapporter denne annonsen",
    "report.modalTitleUser": "Rapporter denne brukeren",
    "report.modalBody": "Fortell oss hva som er galt. Rapporter blir gjennomgått av FindNord-teamet.",
    "report.reasonLabel": "Grunn",
    "report.detailsLabel": "Detaljer (valgfritt)",
    "report.detailsPlaceholder": "Detaljer som kan hjelpe oss med gjennomgangen",
    "report.cancel": "Avbryt",
    "report.submit": "Send rapport",
    "report.reason.prohibited_item": "Forbudt eller ulovlig vare",
    "report.reason.scam_or_fraud": "Svindel eller bedrageri",
    "report.reason.inappropriate_content": "Upassende innhold",
    "report.reason.harassment": "Trakassering eller misbruk",
    "report.reason.spam": "Spam",
    "report.reason.other": "Annet",
    "block.blockAction": "Blokker",
    "block.unblockAction": "Avblokker",
    "block.added": "Brukeren er blokkert. Du vil ikke se annonsene eller meldingene deres.",
    "block.removed": "Brukeren er avblokkert.",
    "block.messagingBlocked": "Du kan ikke sende meldinger til denne brukeren.",
    "safety.title": "Møtes trygt",
    "safety.body": "Hold den eksakte hjemmeadressen privat til du selv velger å dele mer. Vær oppmerksom på betalingspress, og bruk rapporteringsknappen hvis noe føles feil.",
    "safety.readMore": "Les våre sikkerhetstips",
    "share.copied": "Lenken er kopiert til utklippstavlen.",
    "share.failed": "Kunne ikke dele denne annonsen.",
    "filter.title": "Filtrer og sorter",
    "filter.sortLabel": "Sorter etter",
    "sort.recent": "Nyeste",
    "sort.priceLow": "Lavest pris",
    "sort.priceHigh": "Høyest pris",
    "sort.nearest": "Nærmest",
    "sort.indicatorPrefix": "Sortert etter",
    "filter.priceMinLabel": "Min. pris",
    "filter.priceMaxLabel": "Maks. pris",
    "filter.conditionLabel": "Tilstand",
    "filter.sellerLabel": "Selgertype",
    "filter.distanceLabel": "Avstand",
    "filter.categoryLabel": "Kategori",
    "filter.subtypeLabel": "Type",
    "filter.categoryAll": "Alle kategorier",
    "distance.any": "Alle avstander",
    "distance.within5": "Innen 5 km",
    "distance.within10": "Innen 10 km",
    "distance.within25": "Innen 25 km",
    "distance.within50": "Innen 50 km",
    "distance.within100": "Innen 100 km",
    "filter.clear": "Fjern",
    "filter.reset": "Nullstill",
    "filter.apply": "Bruk",
    "filter.close": "Lukk",
    "filter.activeFiltersLabel": "Aktive filtre",
    "filter.priceChipPrefix": "Pris",
    "ai.badge": "AI-bilde",
    "ai.buttonLabel": "Generer med AI",
    "ai.promptLabel": "Beskriv varen for AI (valgfritt)",
    "ai.promptPlaceholder": "f.eks. blå vintagesykkel",
    "ai.generating": "Genererer bilde...",
    "ai.success": "Bildet er lagt til.",
    "ai.failed": "Kunne ikke generere et bilde.",
    "ai.promptRequired": "Beskriv varen først, eller legg til en tittel.",
    "ai.limitReached": "Du har nådd grensen på 6 bilder.",
    "detail.photoLabel": "Bilde",
    "detail.morePhotos": "Flere bilder",
    "sell.photosHint": "1–6 bilder, opptil 1 MB hver. Trykk på Gjør til forside for å velge et annet bilde.",
    "photo.makeCover": "Gjør til forside",
    "photo.uploadFailed": "Kunne ikke legge til bildet. Prøv et annet bilde.",
    "account.actionCreate": "Opprett annonse",
    "account.actionMessages": "Meldinger",
    "account.actionMyListings": "Mine annonser",
    "account.actionProfile": "Profil",
    "account.actionSettings": "Innstillinger",
    "account.actionLogout": "Logg ut",
    "settings.signedOutBody": "Logg inn for å administrere kontaktinformasjonen din.",
    "settings.emailLabel": "E-post",
    "settings.emailHint": "Dette er kontoens innloggings-e-post og kan ikke endres her.",
    "settings.phoneLabel": "Mobilnummer",
    "settings.phonePlaceholder": "f.eks. +47 400 12 345",
    "settings.homeCountryLabel": "Hjemland",
    "settings.homeRegionLabel": "Hjemregion",
    "settings.homeRegionPlaceholder": "Velg eller skriv inn regionen din",
    "settings.homeLocationHint": "Brukes for nye annonser du publiserer — uavhengig av hvilket land du for øyeblikket blar i.",
    "settings.save": "Lagre endringer",
    "settings.saved": "Innstillingene er lagret.",
    "settings.failed": "Kunne ikke lagre innstillingene.",
    "admin.actionQueue": "Moderasjonskø",
    "admin.internalEyebrow": "Internt",
    "admin.accessDenied": "Du har ikke tilgang til denne siden.",
    "admin.emptyQueue": "Ingen rapporter akkurat nå.",
    "admin.targetListing": "Annonse",
    "admin.targetUser": "Bruker",
    "admin.targetUnknown": "Ukjent mål",
    "admin.reportedBy": "Rapportert av",
    "admin.markReviewed": "Merk som gjennomgått",
    "admin.markDismissed": "Avvis",
    "admin.hideListing": "Skjul annonse",
    "admin.unhideListing": "Vis annonse igjen",
    "admin.flagUser": "Flagg bruker",
    "admin.unflagUser": "Fjern flagg",
    "admin.status.open": "Åpen",
    "admin.status.reviewed": "Gjennomgått",
    "admin.status.dismissed": "Avvist",
    "myListings.emptyBody": "Du har ikke publisert noen annonser ennå.",
    "myListings.emptyCta": "Begynn å selge",
    "myListings.boost": "Boost",
    "myListings.unboost": "Fjern boost",
    "myListings.boosted": "Boostet",
    "myListings.boostedUntil": "Boostet til",
    "account.actionBoost": "Boost annonser",
    "boost.sheetTitle": "Boost denne annonsen",
    "boost.introFree": "Det er helt gratis å booste annonser mens FindNord er i sin tidlige lanseringsperiode. Velg en varighet under.",
    "boost.introPaid": "Velg en boost-pakke og fullfør betalingen for å aktivere den.",
    "boost.freeDuringLaunch": "Gratis for nå",
    "boost.selectFree": "Aktiver gratis",
    "boost.selectPay": "Betal og aktiver",
    "boost.activeUntil": "Boostet til",
    "boost.changePackage": "Endre pakke",
    "boost.activated": "Boost er aktivert.",
    "boost.cancelled": "Boost er fjernet.",
    "boost.failed": "Kunne ikke aktivere boosten.",
    "boost.package.24h": "24 timer",
    "boost.package.7d": "7 dager",
    "boost.package.30d": "30 dager",
    "boost.package.6m": "6 måneder",
    "boost.package.12m": "12 måneder",
    "boost.package.legacy": "Eldre boost",
    "account.actionAnalytics": "Statistikk",
    "analytics.signedOutBody": "Logg inn for å se statistikken din.",
    "analytics.listings": "Annonser",
    "analytics.saves": "Mottatte lagringer",
    "analytics.conversations": "Samtaler",
    "analytics.messages": "Mottatte meldinger",
    "analytics.boosted": "Boostet",
    "sell.headingEdit": "Rediger annonsen din",
    "sell.publishButton": "Publiser annonse",
    "sell.saveChangesButton": "Lagre endringer",
    "myListings.edit": "Rediger",
    "myListings.delete": "Slett",
    "myListings.deleteConfirm": "Bekreft sletting?",
    "myListings.deleted": "Annonsen er slettet.",
    "myListings.editSaved": "Endringene er lagret.",
    "myListings.statusLabel": "Status",
    "status.active": "Aktiv",
    "status.reserved": "Reservert",
    "status.sold": "Solgt",
    "profile.memberSince": "Medlem siden",
    "profile.activeListingSingular": "aktiv annonse",
    "profile.activeListingsPlural": "aktive annonser",
    "profile.verifiedBadge": "Verifisert",
    "profile.unverifiedBadge": "Ikke verifisert ennå",
    "profile.noActiveListings": "Denne selgeren har ingen aktive annonser akkurat nå.",
    "profile.notFound": "Denne profilen ble ikke funnet.",
    "profile.listingsTitle": "Aktive annonser",
    "profile.ratingEmpty": "Ingen omtaler ennå",
    "profile.reviewSingular": "omtale",
    "profile.reviewPlural": "omtaler",
    "profile.reviewsTitle": "Nylige omtaler",
    "profile.noReviews": "Ingen omtaler ennå.",
    "review.leaveTitle": "Legg igjen en omtale",
    "review.ratingLabel": "Vurdering",
    "review.textLabel": "Kort omtale",
    "review.textPlaceholder": "Del en kort, praktisk kommentar",
    "review.submit": "Publiser omtale",
    "review.signInHint": "Logg inn for å legge igjen en omtale.",
    "review.notForSelf": "Du kan ikke vurdere deg selv.",
    "review.posted": "Omtalen er publisert.",
    "review.failed": "Kunne ikke publisere omtalen.",
    "review.sellerSummaryEmpty": "Ingen selgeromtaler ennå",
    "review.duplicate": "Du har allerede vurdert denne selgeren for denne annonsen.",
    "review.warningModerated": "Omtalen din ble publisert, men upassende språk ble fjernet. Gjentatte brudd vil hindre deg fra å legge igjen flere omtaler.",
    "review.banned": "Du har ikke lenger lov til å legge igjen omtaler.",
    "review.bannedNow": "Omtalen din inneholdt upassende språk. Gjentatte brudd har hindret deg fra å legge igjen flere omtaler.",
    "footer.tagline": "Markedsplassen for skandinavene. Kjøp, selg og oppdag i hele Norden.",
    "footer.createAccount": "Opprett gratis konto",
    "footer.startSelling": "Begynn å selge",
    "footer.companyLine": "FindNord — en del av Micany Investment",
    "footer.colCategories": "Kategorier",
    "footer.colExplore": "Utforsk",
    "footer.colBuySell": "Kjøp og selg",
    "footer.colHelp": "Hjelp og support",
    "footer.colLegal": "Juridisk og tillit",
    "footer.colCompany": "Bedrift",
    "footer.browseAll": "Utforsk alt →",
    "footer.countriesTitle": "Bla etter land",
    "footer.copyright": "© 2026 FindNord — en del av Micany Investment. Alle rettigheter forbeholdt.",
    "footer.linkAbout": "Om oss",
    "footer.linkHow": "Slik fungerer det",
    "footer.linkSafetyTips": "Sikkerhetstips",
    "footer.linkTerms": "Brukervilkår",
    "footer.linkPost": "Legg ut en annonse",
    "footer.linkPricing": "Prisguide",
    "footer.linkPhoto": "Fotoguide",
    "footer.linkSafeSelling": "Guide for trygt salg",
    "footer.linkHelpCenter": "Hjelpesenter",
    "footer.linkFaq": "Ofte stilte spørsmål",
    "footer.linkContact": "Kontakt support",
    "footer.linkReport": "Rapporter et problem",
    "footer.linkPrivacy": "Personvernerklæring",
    "footer.linkCookies": "Cookiepolicy",
    "footer.linkDsr": "Dine rettigheter (DSR)",
    "footer.linkMicany": "Micany Investment",
    "footer.linkModeration": "Innhold og moderering",
    "footer.linkDataSafety": "Datasikkerhet",
    "footer.linkBoost": "Boost annonsene dine",
    "cookie.bannerText": "Vi bruker cookies for å holde deg innlogget, sikre kontoen din og forstå hvordan markedsplassen brukes. Du kan endre valgene dine når som helst.",
    "cookie.settings": "Cookie-innstillinger",
    "cookie.accept": "Godta",
    "filter.regionLabel": "Region",
    "filter.regionPlaceholder": "Velg eller skriv en region",
    "sell.regionLabel": "Region",
    "sell.regionPlaceholder": "Velg eller skriv regionen din",
    "sidebar.browseAll": "Utforsk alt",
    "sidebar.createListing": "Opprett ny annonse",
    "sidebar.locationTitle": "Sted",
    "sidebar.searchLabel": "Søk på markedsplassen"
  },
  da: {
    "brand.eyebrow": "Marked i nærheden",
    "nav.browse": "Gennemse",
    "nav.categories": "Kategorier",
    "nav.sell": "Sælg",
    "nav.inbox": "Indbakke",
    "nav.you": "Dig",
    "browse.heading": "Friske fund nær dig",
    "browse.filter": "Filter",
    "browse.searchLabel": "Søg",
    "browse.searchPlaceholder": "Hvad leder du efter?",
    "browse.discoverTitle": "Mere at opdage",
    "browse.discoverSubtitle": "Et tilfældigt udvalg af almindelige annoncer, så alle sælgere får en fair chance for at blive set.",
    "price.free": "Gratis",
    "price.perMonthSuffix": "/måned",
    "price.placeholder": "Angiv en pris",
    "browse.resultCountSingular": "annonce",
    "browse.resultCountPlural": "annoncer",
    "empty.heading": "Ingen præcise match i nærheden",
    "sell.heading": "Sælg på under to minutter",
    "auth.eyebrow": "Login påkrævet",
    "auth.title": "Log ind for at fortsætte",
    "auth.body": "Gem annoncer, send beskeder til sælgere, publicer annoncer og anmeld problemer, når du er logget ind.",
    "auth.emailLabel": "E-mail",
    "auth.emailPlaceholder": "dig@eksempel.dk",
    "auth.nameLabel": "Navn",
    "auth.passwordLabel": "Adgangskode",
    "auth.continue": "Fortsæt",
    "auth.guest": "Fortsæt som gæst",
    "auth.close": "Luk",
    "auth.loginButton": "Log ind",
    "auth.registerButton": "Opret konto",
    "auth.modeToggleToRegister": "Ny på FindNord? Opret en konto",
    "auth.modeToggleToLogin": "Har du allerede en konto? Log ind",
    "auth.errorInvalidCredentials": "Forkert e-mail eller adgangskode.",
    "auth.errorEmailTaken": "Den e-mailadresse er allerede registreret. Prøv at logge ind i stedet.",
    "auth.errorPasswordTooShort": "Adgangskoden skal være mindst 8 tegn.",
    "auth.ageConfirmLabel": "Jeg bekræfter, at jeg er mindst 18 år.",
    "auth.errorAgeNotConfirmed": "Du skal bekræfte, at du er mindst 18 år for at oprette en konto.",
    "auth.errorNameRequired": "Tilføj dit navn.",
    "auth.errorGeneric": "Noget gik galt. Prøv igen.",
    "auth.errorGoogleEmailNotVerified": "E-mailadressen for den Google-konto er endnu ikke bekræftet.",
    "auth.googleUnavailable": "Google-login er ikke tilgængeligt lige nu.",
    "auth.orContinueWithEmail": "eller fortsæt med e-mail",
    "auth.forgotPasswordLink": "Glemt adgangskode?",
    "auth.forgotPasswordModalTitle": "Nulstil din adgangskode",
    "auth.forgotPasswordModalBody": "Indtast din kontos e-mail, og vi sender et link til nulstilling.",
    "auth.forgotPasswordEmailLabel": "E-mail",
    "auth.forgotPasswordSubmitButton": "Send nulstillingslink",
    "auth.forgotPasswordSuccess": "Hvis den e-mailadresse findes, har vi sendt et nulstillingslink.",
    "auth.resetPasswordModalTitle": "Angiv en ny adgangskode",
    "auth.resetPasswordModalBody": "Vælg en ny adgangskode til din konto.",
    "auth.resetPasswordLabel": "Ny adgangskode",
    "auth.resetPasswordSubmitButton": "Angiv ny adgangskode",
    "auth.resetPasswordSuccess": "Din adgangskode er blevet nulstillet. Du kan nu logge ind med din nye adgangskode.",
    "auth.errorResetTokenInvalid": "Dette nulstillingslink er ugyldigt.",
    "auth.errorResetTokenExpired": "Dette nulstillingslink er udløbet. Anmod om et nyt.",
    "auth.errorResetTokenUsed": "Dette nulstillingslink er allerede blevet brugt.",
    "auth.errorGoogleAccountNoPassword": "Denne konto logger ind med Google — der er ingen adgangskode at nulstille. Prøv \"Fortsæt med Google\" i stedet.",
    "account.eyebrow": "Din aktivitet",
    "account.heading": "Gemte annoncer, dine annoncer og tillidsindstillinger",
    "account.body": "Log ind, når du vil gemme, sende beskeder, sælge, anmelde eller oprette underretninger.",
    "account.signedInEyebrow": "Logget ind",
    "account.signedInHeading": "Velkommen tilbage",
    "account.emailLabel": "Logget ind som",
    "account.signOut": "Log ud",
    "account.signInButton": "Log ind",
    "login.tagline": "Markedspladsen for skandinaverne",
    "inbox.eyebrow": "Kun markedsplads",
    "inbox.signedOutBody": "Log ind for at se dine samtaler.",
    "inbox.emptyBody": "Samtaler starter fra en annonces knap Send besked til sælger.",
    "inbox.unknownListing": "Annonce",
    "inbox.buyerLabel": "Køber",
    "thread.replyLabel": "Besked",
    "thread.replyPlaceholder": "Skriv en besked...",
    "thread.send": "Send",
    "compose.headingPrefix": "Besked til",
    "compose.send": "Send",
    "compose.cancel": "Annuller",
    "compose.sent": "Besked sendt. Se den i din indbakke.",
    "compose.failed": "Kunne ikke sende den besked.",
    "report.sent": "Tak — din anmeldelse er sendt til gennemgang.",
    "report.failed": "Kunne ikke indsende anmeldelsen.",
    "sell.publishFailed": "Kunne ikke publicere denne annonce. Prøv igen.",
    "rateLimit.listings": "Du opretter annoncer for hurtigt. Prøv igen om {minutes} minutter.",
    "rateLimit.messages": "Du sender beskeder for hurtigt. Prøv igen om {minutes} minutter.",
    "rateLimit.reports": "Du indsender anmeldelser for hurtigt. Prøv igen om {minutes} minutter.",
    "report.reportUser": "Anmeld bruger",
    "report.modalTitleListing": "Anmeld denne annonce",
    "report.modalTitleUser": "Anmeld denne bruger",
    "report.modalBody": "Fortæl os, hvad der er forkert. Anmeldelser gennemgås af FindNord-teamet.",
    "report.reasonLabel": "Grund",
    "report.detailsLabel": "Detaljer (valgfrit)",
    "report.detailsPlaceholder": "Eventuelle detaljer, der kan hjælpe os med at gennemgå dette",
    "report.cancel": "Annuller",
    "report.submit": "Indsend anmeldelse",
    "report.reason.prohibited_item": "Forbudt eller ulovlig vare",
    "report.reason.scam_or_fraud": "Svindel eller bedrageri",
    "report.reason.inappropriate_content": "Upassende indhold",
    "report.reason.harassment": "Chikane eller misbrug",
    "report.reason.spam": "Spam",
    "report.reason.other": "Andet",
    "block.blockAction": "Bloker",
    "block.unblockAction": "Fjern blokering",
    "block.added": "Brugeren er blokeret. Du vil ikke se deres annoncer eller beskeder.",
    "block.removed": "Brugeren er ikke længere blokeret.",
    "block.messagingBlocked": "Du kan ikke sende beskeder til denne bruger.",
    "safety.title": "Mød hinanden sikkert",
    "safety.body": "Hold den præcise hjemmeadresse privat, indtil du selv vælger at dele mere. Vær opmærksom på betalingspres, og brug anmeldelsesknappen, hvis noget føles forkert.",
    "safety.readMore": "Læs vores sikkerhedstips",
    "share.copied": "Link kopieret til udklipsholderen.",
    "share.failed": "Kunne ikke dele denne annonce.",
    "filter.title": "Filtrer og sorter",
    "filter.sortLabel": "Sorter efter",
    "sort.recent": "Nyeste",
    "sort.priceLow": "Lavest pris",
    "sort.priceHigh": "Højest pris",
    "sort.nearest": "Tættest på",
    "sort.indicatorPrefix": "Sorteret efter",
    "filter.priceMinLabel": "Min. pris",
    "filter.priceMaxLabel": "Maks. pris",
    "filter.conditionLabel": "Stand",
    "filter.sellerLabel": "Sælgertype",
    "filter.distanceLabel": "Afstand",
    "filter.categoryLabel": "Kategori",
    "filter.subtypeLabel": "Type",
    "filter.categoryAll": "Alle kategorier",
    "distance.any": "Enhver afstand",
    "distance.within5": "Inden for 5 km",
    "distance.within10": "Inden for 10 km",
    "distance.within25": "Inden for 25 km",
    "distance.within50": "Inden for 50 km",
    "distance.within100": "Inden for 100 km",
    "filter.clear": "Ryd",
    "filter.reset": "Nulstil",
    "filter.apply": "Anvend",
    "filter.close": "Luk",
    "filter.activeFiltersLabel": "Aktive filtre",
    "filter.priceChipPrefix": "Pris",
    "ai.badge": "AI-foto",
    "ai.buttonLabel": "Generer med AI",
    "ai.promptLabel": "Beskriv din vare til AI (valgfrit)",
    "ai.promptPlaceholder": "f.eks. blå vintagecykel",
    "ai.generating": "Genererer foto...",
    "ai.success": "Foto tilføjet.",
    "ai.failed": "Kunne ikke generere et foto.",
    "ai.promptRequired": "Beskriv varen først, eller tilføj en titel.",
    "ai.limitReached": "Du har nået grænsen på 6 fotos.",
    "detail.photoLabel": "Foto",
    "detail.morePhotos": "Flere fotos",
    "sell.photosHint": "1–6 fotos, op til 1 MB hver. Tryk på Gør til forside for at vælge et andet foto.",
    "photo.makeCover": "Gør til forside",
    "photo.uploadFailed": "Kunne ikke tilføje det foto. Prøv et andet billede.",
    "account.actionCreate": "Opret annonce",
    "account.actionMessages": "Beskeder",
    "account.actionMyListings": "Mine annoncer",
    "account.actionProfile": "Profil",
    "account.actionSettings": "Indstillinger",
    "account.actionLogout": "Log ud",
    "settings.signedOutBody": "Log ind for at administrere dine kontaktoplysninger.",
    "settings.emailLabel": "E-mail",
    "settings.emailHint": "Dette er din kontos login-e-mail og kan ikke ændres her.",
    "settings.phoneLabel": "Mobilnummer",
    "settings.phonePlaceholder": "f.eks. +45 12 34 56 78",
    "settings.homeCountryLabel": "Hjemland",
    "settings.homeRegionLabel": "Hjemregion",
    "settings.homeRegionPlaceholder": "Vælg eller skriv din region",
    "settings.homeLocationHint": "Bruges til nye annoncer, du opretter — uafhængigt af hvilket land du lige nu browser i.",
    "settings.save": "Gem ændringer",
    "settings.saved": "Indstillingerne er gemt.",
    "settings.failed": "Kunne ikke gemme dine indstillinger.",
    "admin.actionQueue": "Moderationskø",
    "admin.internalEyebrow": "Internt",
    "admin.accessDenied": "Du har ikke adgang til denne side.",
    "admin.emptyQueue": "Ingen anmeldelser lige nu.",
    "admin.targetListing": "Annonce",
    "admin.targetUser": "Bruger",
    "admin.targetUnknown": "Ukendt mål",
    "admin.reportedBy": "Anmeldt af",
    "admin.markReviewed": "Marker som gennemgået",
    "admin.markDismissed": "Afvis",
    "admin.hideListing": "Skjul annonce",
    "admin.unhideListing": "Vis annonce igen",
    "admin.flagUser": "Marker bruger",
    "admin.unflagUser": "Fjern markering",
    "admin.status.open": "Åben",
    "admin.status.reviewed": "Gennemgået",
    "admin.status.dismissed": "Afvist",
    "myListings.emptyBody": "Du har ikke publiceret nogen annoncer endnu.",
    "myListings.emptyCta": "Begynd at sælge",
    "myListings.boost": "Boost",
    "myListings.unboost": "Fjern boost",
    "myListings.boosted": "Boostet",
    "myListings.boostedUntil": "Boostet indtil",
    "account.actionBoost": "Boost annoncer",
    "boost.sheetTitle": "Boost denne annonce",
    "boost.introFree": "Det er helt gratis at booste, mens FindNord er i sin tidlige lanceringsperiode. Vælg en varighed nedenfor.",
    "boost.introPaid": "Vælg en boost-pakke, og gennemfør betalingen for at aktivere den.",
    "boost.freeDuringLaunch": "Gratis for nu",
    "boost.selectFree": "Aktiver gratis",
    "boost.selectPay": "Betal og aktiver",
    "boost.activeUntil": "Boostet indtil",
    "boost.changePackage": "Skift pakke",
    "boost.activated": "Boost aktiveret.",
    "boost.cancelled": "Boost fjernet.",
    "boost.failed": "Kunne ikke aktivere den boost.",
    "boost.package.24h": "24 timer",
    "boost.package.7d": "7 dage",
    "boost.package.30d": "30 dage",
    "boost.package.6m": "6 måneder",
    "boost.package.12m": "12 måneder",
    "boost.package.legacy": "Ældre boost",
    "account.actionAnalytics": "Statistik",
    "analytics.signedOutBody": "Log ind for at se din statistik.",
    "analytics.listings": "Annoncer",
    "analytics.saves": "Gemt af andre",
    "analytics.conversations": "Samtaler",
    "analytics.messages": "Modtagne beskeder",
    "analytics.boosted": "Boostet",
    "sell.headingEdit": "Rediger din annonce",
    "sell.publishButton": "Publicer annonce",
    "sell.saveChangesButton": "Gem ændringer",
    "myListings.edit": "Rediger",
    "myListings.delete": "Slet",
    "myListings.deleteConfirm": "Bekræft sletning?",
    "myListings.deleted": "Annoncen er slettet.",
    "myListings.editSaved": "Ændringerne er gemt.",
    "myListings.statusLabel": "Status",
    "status.active": "Aktiv",
    "status.reserved": "Reserveret",
    "status.sold": "Solgt",
    "profile.memberSince": "Medlem siden",
    "profile.activeListingSingular": "aktiv annonce",
    "profile.activeListingsPlural": "aktive annoncer",
    "profile.verifiedBadge": "Verificeret",
    "profile.unverifiedBadge": "Ikke verificeret endnu",
    "profile.noActiveListings": "Denne sælger har ingen aktive annoncer lige nu.",
    "profile.notFound": "Denne profil kunne ikke findes.",
    "profile.listingsTitle": "Aktive annoncer",
    "profile.ratingEmpty": "Ingen vurderinger endnu",
    "profile.reviewSingular": "vurdering",
    "profile.reviewPlural": "vurderinger",
    "profile.reviewsTitle": "Seneste vurderinger",
    "profile.noReviews": "Ingen vurderinger endnu.",
    "review.leaveTitle": "Skriv en vurdering",
    "review.ratingLabel": "Bedømmelse",
    "review.textLabel": "Kort vurdering",
    "review.textPlaceholder": "Del en kort, praktisk kommentar",
    "review.submit": "Udgiv vurdering",
    "review.signInHint": "Log ind for at skrive en vurdering.",
    "review.notForSelf": "Du kan ikke vurdere dig selv.",
    "review.posted": "Vurderingen er udgivet.",
    "review.failed": "Kunne ikke udgive vurderingen.",
    "review.sellerSummaryEmpty": "Ingen sælgervurderinger endnu",
    "review.duplicate": "Du har allerede vurderet denne sælger for denne annonce.",
    "review.warningModerated": "Din vurdering blev udgivet, men upassende sprog blev fjernet. Gentagne overtrædelser vil forhindre dig i at skrive flere vurderinger.",
    "review.banned": "Du har ikke længere lov til at skrive vurderinger.",
    "review.bannedNow": "Din vurdering indeholdt upassende sprog. Gentagne overtrædelser har forhindret dig i at skrive flere vurderinger.",
    "footer.tagline": "Markedspladsen for skandinaverne. Køb, sælg og oplev i hele Norden.",
    "footer.createAccount": "Opret gratis konto",
    "footer.startSelling": "Begynd at sælge",
    "footer.companyLine": "FindNord — en del af Micany Investment",
    "footer.colCategories": "Kategorier",
    "footer.colExplore": "Udforsk",
    "footer.colBuySell": "Køb og sælg",
    "footer.colHelp": "Hjælp og support",
    "footer.colLegal": "Jura og tillid",
    "footer.colCompany": "Virksomhed",
    "footer.browseAll": "Se alle →",
    "footer.countriesTitle": "Gennemse efter land",
    "footer.copyright": "© 2026 FindNord — en del af Micany Investment. Alle rettigheder forbeholdes.",
    "footer.linkAbout": "Om os",
    "footer.linkHow": "Sådan fungerer det",
    "footer.linkSafetyTips": "Sikkerhedstips",
    "footer.linkTerms": "Servicevilkår",
    "footer.linkPost": "Opret en annonce",
    "footer.linkPricing": "Prisguide",
    "footer.linkPhoto": "Fotoguide",
    "footer.linkSafeSelling": "Guide til tryg handel",
    "footer.linkHelpCenter": "Hjælpecenter",
    "footer.linkFaq": "Ofte stillede spørgsmål",
    "footer.linkContact": "Kontakt support",
    "footer.linkReport": "Anmeld et problem",
    "footer.linkPrivacy": "Privatlivspolitik",
    "footer.linkCookies": "Cookiepolitik",
    "footer.linkDsr": "Dine rettigheder (DSR)",
    "footer.linkMicany": "Micany Investment",
    "footer.linkModeration": "Indhold og moderation",
    "footer.linkDataSafety": "Datasikkerhed",
    "footer.linkBoost": "Boost dine annoncer",
    "cookie.bannerText": "Vi bruger cookies til at holde dig logget ind, sikre din konto og forstå, hvordan markedspladsen bruges. Du kan ændre dine valg når som helst.",
    "cookie.settings": "Cookieindstillinger",
    "cookie.accept": "Accepter",
    "filter.regionLabel": "Region",
    "filter.regionPlaceholder": "Vælg eller skriv en region",
    "sell.regionLabel": "Region",
    "sell.regionPlaceholder": "Vælg eller skriv din region",
    "sidebar.browseAll": "Se alle",
    "sidebar.createListing": "Opret ny annonce",
    "sidebar.locationTitle": "Sted",
    "sidebar.searchLabel": "Søg på markedspladsen"
  },
  fi: {
    "brand.eyebrow": "Markkinapaikka lähistöllä",
    "nav.browse": "Selaa",
    "nav.categories": "Kategoriat",
    "nav.sell": "Myy",
    "nav.inbox": "Viestit",
    "nav.you": "Sinä",
    "browse.heading": "Uusia löytöjä lähelläsi",
    "browse.filter": "Suodatin",
    "browse.searchLabel": "Haku",
    "browse.searchPlaceholder": "Mitä etsit?",
    "browse.discoverTitle": "Lisää löydettävää",
    "browse.discoverSubtitle": "Satunnainen valikoima tavallisia ilmoituksia, jotta jokainen myyjä saa reilun mahdollisuuden tulla nähdyksi.",
    "price.free": "Ilmainen",
    "price.perMonthSuffix": "/kk",
    "price.placeholder": "Aseta hinta",
    "browse.resultCountSingular": "ilmoitus",
    "browse.resultCountPlural": "ilmoitusta",
    "empty.heading": "Ei tarkkoja osumia lähistöllä",
    "sell.heading": "Myy alle kahdessa minuutissa",
    "auth.eyebrow": "Kirjautuminen vaaditaan",
    "auth.title": "Kirjaudu sisään jatkaaksesi",
    "auth.body": "Tallenna kohteita, lähetä viestejä myyjille, julkaise ilmoituksia ja ilmoita ongelmista, kun olet kirjautunut sisään.",
    "auth.emailLabel": "Sähköposti",
    "auth.emailPlaceholder": "sina@esimerkki.fi",
    "auth.nameLabel": "Nimi",
    "auth.passwordLabel": "Salasana",
    "auth.continue": "Jatka",
    "auth.guest": "Jatka vierailijana",
    "auth.close": "Sulje",
    "auth.loginButton": "Kirjaudu sisään",
    "auth.registerButton": "Luo tili",
    "auth.modeToggleToRegister": "Uusi FindNordissa? Luo tili",
    "auth.modeToggleToLogin": "Onko sinulla jo tili? Kirjaudu sisään",
    "auth.errorInvalidCredentials": "Väärä sähköposti tai salasana.",
    "auth.errorEmailTaken": "Tämä sähköposti on jo rekisteröity. Kirjaudu sisään sen sijaan.",
    "auth.errorPasswordTooShort": "Salasanan on oltava vähintään 8 merkkiä.",
    "auth.ageConfirmLabel": "Vahvistan olevani vähintään 18-vuotias.",
    "auth.errorAgeNotConfirmed": "Sinun on vahvistettava olevasi vähintään 18-vuotias luodaksesi tilin.",
    "auth.errorNameRequired": "Lisää nimesi.",
    "auth.errorGeneric": "Jokin meni pieleen. Yritä uudelleen.",
    "auth.errorGoogleEmailNotVerified": "Tämän Google-tilin sähköpostia ei ole vielä vahvistettu.",
    "auth.googleUnavailable": "Google-kirjautuminen ei ole juuri nyt käytettävissä.",
    "auth.orContinueWithEmail": "tai jatka sähköpostilla",
    "auth.forgotPasswordLink": "Unohditko salasanan?",
    "auth.forgotPasswordModalTitle": "Palauta salasanasi",
    "auth.forgotPasswordModalBody": "Anna tilisi sähköpostiosoite, ja lähetämme palautuslinkin.",
    "auth.forgotPasswordEmailLabel": "Sähköposti",
    "auth.forgotPasswordSubmitButton": "Lähetä palautuslinkki",
    "auth.forgotPasswordSuccess": "Jos tämä sähköposti on olemassa, olemme lähettäneet palautuslinkin.",
    "auth.resetPasswordModalTitle": "Aseta uusi salasana",
    "auth.resetPasswordModalBody": "Valitse tilillesi uusi salasana.",
    "auth.resetPasswordLabel": "Uusi salasana",
    "auth.resetPasswordSubmitButton": "Aseta uusi salasana",
    "auth.resetPasswordSuccess": "Salasanasi on nollattu. Voit nyt kirjautua sisään uudella salasanallasi.",
    "auth.errorResetTokenInvalid": "Tämä palautuslinkki on virheellinen.",
    "auth.errorResetTokenExpired": "Tämä palautuslinkki on vanhentunut. Pyydä uusi.",
    "auth.errorResetTokenUsed": "Tätä palautuslinkkiä on jo käytetty.",
    "auth.errorGoogleAccountNoPassword": "Tämä tili kirjautuu sisään Googlella — sillä ei ole salasanaa palautettavaksi. Kokeile sen sijaan \"Jatka Googlella\".",
    "account.eyebrow": "Toimintasi",
    "account.heading": "Tallennetut kohteet, ilmoituksesi ja luottamusasetukset",
    "account.body": "Kirjaudu sisään, kun haluat tallentaa, lähettää viestejä, myydä, ilmoittaa tai luoda hälytyksiä.",
    "account.signedInEyebrow": "Kirjautunut sisään",
    "account.signedInHeading": "Tervetuloa takaisin",
    "account.emailLabel": "Kirjautuneena",
    "account.signOut": "Kirjaudu ulos",
    "account.signInButton": "Kirjaudu sisään",
    "login.tagline": "Markkinapaikka skandinaaveille",
    "inbox.eyebrow": "Vain markkinapaikka",
    "inbox.signedOutBody": "Kirjaudu sisään nähdäksesi keskustelusi.",
    "inbox.emptyBody": "Keskustelut alkavat ilmoituksen Viesti myyjälle -painikkeesta.",
    "inbox.unknownListing": "Ilmoitus",
    "inbox.buyerLabel": "Ostaja",
    "thread.replyLabel": "Viesti",
    "thread.replyPlaceholder": "Kirjoita viesti...",
    "thread.send": "Lähetä",
    "compose.headingPrefix": "Viesti:",
    "compose.send": "Lähetä",
    "compose.cancel": "Peruuta",
    "compose.sent": "Viesti lähetetty. Näet sen Viestit-osiossa.",
    "compose.failed": "Viestin lähettäminen epäonnistui.",
    "report.sent": "Kiitos — ilmoituksesi on lähetetty tarkistettavaksi.",
    "report.failed": "Ilmoituksen lähettäminen epäonnistui.",
    "sell.publishFailed": "Ilmoituksen julkaiseminen epäonnistui. Yritä uudelleen.",
    "rateLimit.listings": "Julkaiset ilmoituksia liian nopeasti. Yritä uudelleen {minutes} minuutin kuluttua.",
    "rateLimit.messages": "Lähetät viestejä liian nopeasti. Yritä uudelleen {minutes} minuutin kuluttua.",
    "rateLimit.reports": "Lähetät ilmoituksia liian nopeasti. Yritä uudelleen {minutes} minuutin kuluttua.",
    "report.reportUser": "Ilmoita käyttäjästä",
    "report.modalTitleListing": "Ilmoita tästä ilmoituksesta",
    "report.modalTitleUser": "Ilmoita tästä käyttäjästä",
    "report.modalBody": "Kerro, mikä on vialla. FindNord-tiimi tarkistaa ilmoitukset.",
    "report.reasonLabel": "Syy",
    "report.detailsLabel": "Lisätiedot (valinnainen)",
    "report.detailsPlaceholder": "Kaikki tiedot, jotka auttaisivat meitä tarkistamaan tämän",
    "report.cancel": "Peruuta",
    "report.submit": "Lähetä ilmoitus",
    "report.reason.prohibited_item": "Kielletty tai laiton tuote",
    "report.reason.scam_or_fraud": "Huijaus tai petos",
    "report.reason.inappropriate_content": "Asiaton sisältö",
    "report.reason.harassment": "Häirintä tai väärinkäyttö",
    "report.reason.spam": "Roskaposti",
    "report.reason.other": "Muu",
    "block.blockAction": "Estä",
    "block.unblockAction": "Poista esto",
    "block.added": "Käyttäjä estetty. Et näe hänen ilmoituksiaan tai viestejään.",
    "block.removed": "Käyttäjän esto poistettu.",
    "block.messagingBlocked": "Et voi lähettää viestejä tälle käyttäjälle.",
    "safety.title": "Tapaa turvallisesti",
    "safety.body": "Pidä tarkka kotiosoitteesi yksityisenä, kunnes päätät itse jakaa enemmän. Ole varuillasi maksupaineen suhteen, ja käytä ilmoituspainiketta, jos jokin tuntuu väärältä.",
    "safety.readMore": "Lue turvallisuusvinkkimme",
    "share.copied": "Linkki kopioitu leikepöydälle.",
    "share.failed": "Tämän ilmoituksen jakaminen epäonnistui.",
    "filter.title": "Suodata ja järjestä",
    "filter.sortLabel": "Järjestä",
    "sort.recent": "Uusimmat",
    "sort.priceLow": "Halvin hinta",
    "sort.priceHigh": "Korkein hinta",
    "sort.nearest": "Lähimmät",
    "sort.indicatorPrefix": "Järjestetty",
    "filter.priceMinLabel": "Vähimmäishinta",
    "filter.priceMaxLabel": "Enimmäishinta",
    "filter.conditionLabel": "Kunto",
    "filter.sellerLabel": "Myyjätyyppi",
    "filter.distanceLabel": "Etäisyys",
    "filter.categoryLabel": "Kategoria",
    "filter.subtypeLabel": "Tyyppi",
    "filter.categoryAll": "Kaikki kategoriat",
    "distance.any": "Mikä tahansa etäisyys",
    "distance.within5": "5 km sisällä",
    "distance.within10": "10 km sisällä",
    "distance.within25": "25 km sisällä",
    "distance.within50": "50 km sisällä",
    "distance.within100": "100 km sisällä",
    "filter.clear": "Tyhjennä",
    "filter.reset": "Nollaa",
    "filter.apply": "Käytä",
    "filter.close": "Sulje",
    "filter.activeFiltersLabel": "Aktiiviset suodattimet",
    "filter.priceChipPrefix": "Hinta",
    "ai.badge": "AI-kuva",
    "ai.buttonLabel": "Luo AI:lla",
    "ai.promptLabel": "Kuvaile tuotettasi AI:lle (valinnainen)",
    "ai.promptPlaceholder": "esim. sininen vintage-polkupyörä",
    "ai.generating": "Luodaan kuvaa...",
    "ai.success": "Kuva lisätty.",
    "ai.failed": "Kuvan luominen epäonnistui.",
    "ai.promptRequired": "Kuvaile tuote ensin, tai lisää otsikko.",
    "ai.limitReached": "Olet saavuttanut 6 kuvan rajan.",
    "detail.photoLabel": "Kuva",
    "detail.morePhotos": "Lisää kuvia",
    "sell.photosHint": "1–6 kuvaa, enintään 1 MB kukin. Napauta Aseta kansikuvaksi valitaksesi toisen kuvan.",
    "photo.makeCover": "Aseta kansikuvaksi",
    "photo.uploadFailed": "Kuvan lisääminen epäonnistui. Kokeile toista kuvaa.",
    "account.actionCreate": "Luo myynti-ilmoitus",
    "account.actionMessages": "Viestit",
    "account.actionMyListings": "Omat ilmoitukset",
    "account.actionProfile": "Profiili",
    "account.actionSettings": "Asetukset",
    "account.actionLogout": "Kirjaudu ulos",
    "settings.signedOutBody": "Kirjaudu sisään hallitaksesi yhteystietojasi.",
    "settings.emailLabel": "Sähköposti",
    "settings.emailHint": "Tämä on tilisi kirjautumissähköposti, eikä sitä voi muuttaa tässä.",
    "settings.phoneLabel": "Matkapuhelinnumero",
    "settings.phonePlaceholder": "esim. +358 40 123 4567",
    "settings.homeCountryLabel": "Kotimaa",
    "settings.homeRegionLabel": "Kotialue",
    "settings.homeRegionPlaceholder": "Valitse tai kirjoita alueesi",
    "settings.homeLocationHint": "Käytetään uusille julkaisemillesi ilmoituksille — riippumatta siitä, mitä maata selaat juuri nyt.",
    "settings.save": "Tallenna muutokset",
    "settings.saved": "Asetukset tallennettu.",
    "settings.failed": "Asetusten tallentaminen epäonnistui.",
    "admin.actionQueue": "Valvontajono",
    "admin.internalEyebrow": "Sisäinen",
    "admin.accessDenied": "Sinulla ei ole pääsyä tälle sivulle.",
    "admin.emptyQueue": "Ei ilmoituksia juuri nyt.",
    "admin.targetListing": "Ilmoitus",
    "admin.targetUser": "Käyttäjä",
    "admin.targetUnknown": "Tuntematon kohde",
    "admin.reportedBy": "Ilmoittanut",
    "admin.markReviewed": "Merkitse tarkistetuksi",
    "admin.markDismissed": "Hylkää",
    "admin.hideListing": "Piilota ilmoitus",
    "admin.unhideListing": "Näytä ilmoitus",
    "admin.flagUser": "Merkitse käyttäjä",
    "admin.unflagUser": "Poista merkintä",
    "admin.status.open": "Avoin",
    "admin.status.reviewed": "Tarkistettu",
    "admin.status.dismissed": "Hylätty",
    "myListings.emptyBody": "Et ole vielä julkaissut ilmoituksia.",
    "myListings.emptyCta": "Aloita myyminen",
    "myListings.boost": "Nosta",
    "myListings.unboost": "Poista nosto",
    "myListings.boosted": "Nostettu",
    "myListings.boostedUntil": "Nostettu asti",
    "account.actionBoost": "Nosta ilmoituksia",
    "boost.sheetTitle": "Nosta tätä ilmoitusta",
    "boost.introFree": "Nostaminen on täysin ilmaista, kun FindNord on varhaisen käyttöönoton vaiheessa. Valitse kesto alta.",
    "boost.introPaid": "Valitse nostopaketti ja viimeistele maksu aktivoidaksesi sen.",
    "boost.freeDuringLaunch": "Ilmainen toistaiseksi",
    "boost.selectFree": "Aktivoi ilmaiseksi",
    "boost.selectPay": "Maksa ja aktivoi",
    "boost.activeUntil": "Nostettu asti",
    "boost.changePackage": "Vaihda pakettia",
    "boost.activated": "Nosto aktivoitu.",
    "boost.cancelled": "Nosto poistettu.",
    "boost.failed": "Noston aktivointi epäonnistui.",
    "boost.package.24h": "24 tuntia",
    "boost.package.7d": "7 päivää",
    "boost.package.30d": "30 päivää",
    "boost.package.6m": "6 kuukautta",
    "boost.package.12m": "12 kuukautta",
    "boost.package.legacy": "Vanha nosto",
    "account.actionAnalytics": "Tilastot",
    "analytics.signedOutBody": "Kirjaudu sisään nähdäksesi tilastosi.",
    "analytics.listings": "Ilmoitukset",
    "analytics.saves": "Vastaanotetut tallennukset",
    "analytics.conversations": "Keskustelut",
    "analytics.messages": "Vastaanotetut viestit",
    "analytics.boosted": "Nostettu",
    "sell.headingEdit": "Muokkaa ilmoitustasi",
    "sell.publishButton": "Julkaise ilmoitus",
    "sell.saveChangesButton": "Tallenna muutokset",
    "myListings.edit": "Muokkaa",
    "myListings.delete": "Poista",
    "myListings.deleteConfirm": "Vahvista poisto?",
    "myListings.deleted": "Ilmoitus poistettu.",
    "myListings.editSaved": "Muutokset tallennettu.",
    "myListings.statusLabel": "Tila",
    "status.active": "Aktiivinen",
    "status.reserved": "Varattu",
    "status.sold": "Myyty",
    "profile.memberSince": "Jäsen alkaen",
    "profile.activeListingSingular": "aktiivinen ilmoitus",
    "profile.activeListingsPlural": "aktiivista ilmoitusta",
    "profile.verifiedBadge": "Vahvistettu",
    "profile.unverifiedBadge": "Ei vielä vahvistettu",
    "profile.noActiveListings": "Tällä myyjällä ei ole aktiivisia ilmoituksia juuri nyt.",
    "profile.notFound": "Tätä profiilia ei löytynyt.",
    "profile.listingsTitle": "Aktiiviset ilmoitukset",
    "profile.ratingEmpty": "Ei arvosteluja vielä",
    "profile.reviewSingular": "arvostelu",
    "profile.reviewPlural": "arvostelua",
    "profile.reviewsTitle": "Viimeisimmät arvostelut",
    "profile.noReviews": "Ei arvosteluja vielä.",
    "review.leaveTitle": "Jätä arvostelu",
    "review.ratingLabel": "Arvosana",
    "review.textLabel": "Lyhyt arvostelu",
    "review.textPlaceholder": "Jaa lyhyt, käytännöllinen huomio",
    "review.submit": "Julkaise arvostelu",
    "review.signInHint": "Kirjaudu sisään jättääksesi arvostelun.",
    "review.notForSelf": "Et voi arvostella itseäsi.",
    "review.posted": "Arvostelu julkaistu.",
    "review.failed": "Arvostelun julkaiseminen epäonnistui.",
    "review.sellerSummaryEmpty": "Ei myyjäarvosteluja vielä",
    "review.duplicate": "Olet jo arvostellut tämän myyjän tämän ilmoituksen osalta.",
    "review.warningModerated": "Arvostelusi julkaistiin, mutta asiaton kieli poistettiin. Toistuvat rikkomukset estävät sinua jättämästä arvosteluja.",
    "review.banned": "Sinulla ei ole enää oikeutta jättää arvosteluja.",
    "review.bannedNow": "Arvostelusi sisälsi asiatonta kieltä. Toistuvat rikkomukset ovat estäneet sinua jättämästä arvosteluja.",
    "footer.tagline": "Markkinapaikka skandinaaveille. Osta, myy ja löydä uutta ympäri Pohjolaa.",
    "footer.createAccount": "Luo ilmainen tili",
    "footer.startSelling": "Aloita myyminen",
    "footer.companyLine": "FindNord — osa Micany Investmentiä",
    "footer.colCategories": "Kategoriat",
    "footer.colExplore": "Tutustu",
    "footer.colBuySell": "Osta ja myy",
    "footer.colHelp": "Ohjeet ja tuki",
    "footer.colLegal": "Lakiasiat ja luottamus",
    "footer.colCompany": "Yritys",
    "footer.browseAll": "Selaa kaikkia →",
    "footer.countriesTitle": "Selaa maittain",
    "footer.copyright": "© 2026 FindNord — osa Micany Investmentiä. Kaikki oikeudet pidätetään.",
    "footer.linkAbout": "Tietoa meistä",
    "footer.linkHow": "Näin se toimii",
    "footer.linkSafetyTips": "Turvallisuusvinkit",
    "footer.linkTerms": "Käyttöehdot",
    "footer.linkPost": "Julkaise ilmoitus",
    "footer.linkPricing": "Hinnoitteluopas",
    "footer.linkPhoto": "Kuvausopas",
    "footer.linkSafeSelling": "Turvallisen myynnin opas",
    "footer.linkHelpCenter": "Ohjekeskus",
    "footer.linkFaq": "UKK",
    "footer.linkContact": "Ota yhteyttä tukeen",
    "footer.linkReport": "Ilmoita ongelmasta",
    "footer.linkPrivacy": "Tietosuojakäytäntö",
    "footer.linkCookies": "Evästekäytäntö",
    "footer.linkDsr": "Rekisteröidyn oikeudet (DSR)",
    "footer.linkMicany": "Micany Investment",
    "footer.linkModeration": "Sisältö ja valvonta",
    "footer.linkDataSafety": "Tietoturva",
    "footer.linkBoost": "Nosta ilmoituksiasi",
    "cookie.bannerText": "Käytämme evästeitä pitääksemme sinut kirjautuneena, suojataksemme tiliäsi ja ymmärtääksemme, miten markkinapaikkaa käytetään. Voit muuttaa valintojasi milloin tahansa.",
    "cookie.settings": "Evästeasetukset",
    "cookie.accept": "Hyväksy",
    "filter.regionLabel": "Alue",
    "filter.regionPlaceholder": "Valitse tai kirjoita alue",
    "sell.regionLabel": "Alue",
    "sell.regionPlaceholder": "Valitse tai kirjoita alueesi",
    "sidebar.browseAll": "Selaa kaikkia",
    "sidebar.createListing": "Luo uusi ilmoitus",
    "sidebar.locationTitle": "Sijainti",
    "sidebar.searchLabel": "Hae markkinapaikalta"
  },
  is: {
    "brand.eyebrow": "Markaðstorg í nágrenninu",
    "nav.browse": "Skoða",
    "nav.categories": "Flokkar",
    "nav.sell": "Selja",
    "nav.inbox": "Innhólf",
    "nav.you": "Þú",
    "browse.heading": "Nýjar vörur nálægt þér",
    "browse.filter": "Sía",
    "browse.searchLabel": "Leit",
    "browse.searchPlaceholder": "Hvað ertu að leita að?",
    "browse.discoverTitle": "Meira að skoða",
    "browse.discoverSubtitle": "Slembiúrtak af almennum auglýsingum, svo allir seljendur fái sanngjarnt tækifæri til að sjást.",
    "price.free": "Frítt",
    "price.perMonthSuffix": "/mán.",
    "price.placeholder": "Settu verð",
    "browse.resultCountSingular": "auglýsing",
    "browse.resultCountPlural": "auglýsingar",
    "empty.heading": "Engar nákvæmar samsvaranir í nágrenninu",
    "sell.heading": "Selja á innan við tveimur mínútum",
    "auth.eyebrow": "Innskráning nauðsynleg",
    "auth.title": "Skráðu þig inn til að halda áfram",
    "auth.body": "Vista hluti, senda skilaboð til seljenda, birta auglýsingar og tilkynna vandamál eftir að þú hefur skráð þig inn.",
    "auth.emailLabel": "Netfang",
    "auth.emailPlaceholder": "þú@dæmi.is",
    "auth.nameLabel": "Nafn",
    "auth.passwordLabel": "Lykilorð",
    "auth.continue": "Halda áfram",
    "auth.guest": "Halda áfram sem gestur",
    "auth.close": "Loka",
    "auth.loginButton": "Skrá inn",
    "auth.registerButton": "Búa til aðgang",
    "auth.modeToggleToRegister": "Nýr á FindNord? Búa til aðgang",
    "auth.modeToggleToLogin": "Þegar með aðgang? Skrá inn",
    "auth.errorInvalidCredentials": "Rangt netfang eða lykilorð.",
    "auth.errorEmailTaken": "Þetta netfang er þegar skráð. Prófaðu að skrá þig inn í staðinn.",
    "auth.errorPasswordTooShort": "Lykilorð þarf að vera minnst 8 stafir.",
    "auth.ageConfirmLabel": "Ég staðfesti að ég er að minnsta kosti 18 ára.",
    "auth.errorAgeNotConfirmed": "Þú verður að staðfesta að þú sért að minnsta kosti 18 ára til að stofna aðgang.",
    "auth.errorNameRequired": "Bættu við nafninu þínu.",
    "auth.errorGeneric": "Eitthvað fór úrskeiðis. Prófaðu aftur.",
    "auth.errorGoogleEmailNotVerified": "Netfang þessa Google-aðgangs hefur ekki verið staðfest enn.",
    "auth.googleUnavailable": "Innskráning með Google er ekki í boði núna.",
    "auth.orContinueWithEmail": "eða halda áfram með netfangi",
    "auth.forgotPasswordLink": "Gleymt lykilorð?",
    "auth.forgotPasswordModalTitle": "Endurstilla lykilorðið þitt",
    "auth.forgotPasswordModalBody": "Sláðu inn netfang aðgangsins og við sendum tengil til að endurstilla.",
    "auth.forgotPasswordEmailLabel": "Netfang",
    "auth.forgotPasswordSubmitButton": "Senda endurstillingartengil",
    "auth.forgotPasswordSuccess": "Ef þetta netfang er til hefur endurstillingartengill verið sendur.",
    "auth.resetPasswordModalTitle": "Settu nýtt lykilorð",
    "auth.resetPasswordModalBody": "Veldu nýtt lykilorð fyrir aðganginn þinn.",
    "auth.resetPasswordLabel": "Nýtt lykilorð",
    "auth.resetPasswordSubmitButton": "Setja nýtt lykilorð",
    "auth.resetPasswordSuccess": "Lykilorðinu þínu hefur verið endurstillt. Þú getur nú skráð þig inn með nýja lykilorðinu.",
    "auth.errorResetTokenInvalid": "Þessi endurstillingartengill er ógildur.",
    "auth.errorResetTokenExpired": "Þessi endurstillingartengill er útrunninn. Óskaðu eftir nýjum.",
    "auth.errorResetTokenUsed": "Þessi endurstillingartengill hefur þegar verið notaður.",
    "auth.errorGoogleAccountNoPassword": "Þessi aðgangur skráir sig inn með Google — það er ekkert lykilorð til að endurstilla. Prófaðu \"Halda áfram með Google\" í staðinn.",
    "account.eyebrow": "Virkni þín",
    "account.heading": "Vistaðir hlutir, auglýsingar og trausts­stillingar",
    "account.body": "Skráðu þig inn þegar þú vilt vista, senda skilaboð, selja, tilkynna eða búa til viðvaranir.",
    "account.signedInEyebrow": "Skráð(ur) inn",
    "account.signedInHeading": "Velkomin aftur",
    "account.emailLabel": "Skráð inn sem",
    "account.signOut": "Skrá út",
    "account.signInButton": "Skrá inn",
    "login.tagline": "Markaðstorgið fyrir Skandinava",
    "inbox.eyebrow": "Aðeins markaðstorg",
    "inbox.signedOutBody": "Skráðu þig inn til að sjá samtölin þín.",
    "inbox.emptyBody": "Samtöl byrja frá hnappinum Senda skilaboð til seljanda á auglýsingu.",
    "inbox.unknownListing": "Auglýsing",
    "inbox.buyerLabel": "Kaupandi",
    "thread.replyLabel": "Skilaboð",
    "thread.replyPlaceholder": "Skrifa skilaboð...",
    "thread.send": "Senda",
    "compose.headingPrefix": "Skilaboð til",
    "compose.send": "Senda",
    "compose.cancel": "Hætta við",
    "compose.sent": "Skilaboð send. Skoða þau í innhólfinu þínu.",
    "compose.failed": "Ekki var hægt að senda skilaboðin.",
    "report.sent": "Takk — tilkynningin þín hefur verið send til yfirferðar.",
    "report.failed": "Ekki var hægt að senda tilkynninguna.",
    "sell.publishFailed": "Ekki var hægt að birta þessa auglýsingu. Vinsamlegast reyndu aftur.",
    "rateLimit.listings": "Þú birtir auglýsingar of hratt. Reyndu aftur eftir {minutes} mínútur.",
    "rateLimit.messages": "Þú sendir skilaboð of hratt. Reyndu aftur eftir {minutes} mínútur.",
    "rateLimit.reports": "Þú sendir tilkynningar of hratt. Reyndu aftur eftir {minutes} mínútur.",
    "report.reportUser": "Tilkynna notanda",
    "report.modalTitleListing": "Tilkynna þessa auglýsingu",
    "report.modalTitleUser": "Tilkynna þennan notanda",
    "report.modalBody": "Segðu okkur hvað er að. Tilkynningar eru yfirfarnar af FindNord-teyminu.",
    "report.reasonLabel": "Ástæða",
    "report.detailsLabel": "Nánari upplýsingar (valkvætt)",
    "report.detailsPlaceholder": "Allar upplýsingar sem gætu hjálpað okkur að fara yfir þetta",
    "report.cancel": "Hætta við",
    "report.submit": "Senda tilkynningu",
    "report.reason.prohibited_item": "Bönnuð eða ólögleg vara",
    "report.reason.scam_or_fraud": "Svindl eða fjársvik",
    "report.reason.inappropriate_content": "Óviðeigandi efni",
    "report.reason.harassment": "Áreitni eða misnotkun",
    "report.reason.spam": "Ruslpóstur",
    "report.reason.other": "Annað",
    "block.blockAction": "Loka á",
    "block.unblockAction": "Opna á",
    "block.added": "Búið er að loka á notandann. Þú munt ekki sjá auglýsingar eða skilaboð frá þeim.",
    "block.removed": "Notandinn er ekki lengur lokaður.",
    "block.messagingBlocked": "Þú getur ekki sent þessum notanda skilaboð.",
    "safety.title": "Hittast á öruggan hátt",
    "safety.body": "Halda nákvæmu heimilisfangi þínu einkalegu þar til þú velur að deila meira. Fylgstu með greiðsluþrýstingi og notaðu tilkynningarhnappinn ef eitthvað virðist rangt.",
    "safety.readMore": "Lesa öryggisráðin okkar",
    "share.copied": "Tengill afritaður á klippispjaldið.",
    "share.failed": "Ekki var hægt að deila þessari auglýsingu.",
    "filter.title": "Sía og raða",
    "filter.sortLabel": "Raða eftir",
    "sort.recent": "Nýjast",
    "sort.priceLow": "Lægsta verð",
    "sort.priceHigh": "Hæsta verð",
    "sort.nearest": "Nálægast",
    "sort.indicatorPrefix": "Raðað eftir",
    "filter.priceMinLabel": "Lágmarksverð",
    "filter.priceMaxLabel": "Hámarksverð",
    "filter.conditionLabel": "Ástand",
    "filter.sellerLabel": "Tegund seljanda",
    "filter.distanceLabel": "Fjarlægð",
    "filter.categoryLabel": "Flokkur",
    "filter.subtypeLabel": "Tegund",
    "filter.categoryAll": "Allir flokkar",
    "distance.any": "Hvaða fjarlægð sem er",
    "distance.within5": "Innan 5 km",
    "distance.within10": "Innan 10 km",
    "distance.within25": "Innan 25 km",
    "distance.within50": "Innan 50 km",
    "distance.within100": "Innan 100 km",
    "filter.clear": "Hreinsa",
    "filter.reset": "Endurstilla",
    "filter.apply": "Nota",
    "filter.close": "Loka",
    "filter.activeFiltersLabel": "Virkar síur",
    "filter.priceChipPrefix": "Verð",
    "ai.badge": "AI-mynd",
    "ai.buttonLabel": "Búa til með AI",
    "ai.promptLabel": "Lýstu hlutnum fyrir AI (valkvætt)",
    "ai.promptPlaceholder": "t.d. blátt vintage reiðhjól",
    "ai.generating": "Býr til mynd...",
    "ai.success": "Mynd bætt við.",
    "ai.failed": "Ekki var hægt að búa til mynd.",
    "ai.promptRequired": "Lýstu hlutnum fyrst, eða bættu við titli.",
    "ai.limitReached": "Þú hefur náð 6 mynda hámarkinu.",
    "detail.photoLabel": "Mynd",
    "detail.morePhotos": "Fleiri myndir",
    "sell.photosHint": "1–6 myndir, allt að 1 MB hver. Ýttu á Gera að forsíðumynd til að velja aðra mynd.",
    "photo.makeCover": "Gera að forsíðumynd",
    "photo.uploadFailed": "Ekki var hægt að bæta myndinni við. Prófaðu aðra mynd.",
    "account.actionCreate": "Búa til auglýsingu",
    "account.actionMessages": "Skilaboð",
    "account.actionMyListings": "Mínar auglýsingar",
    "account.actionProfile": "Prófíll",
    "account.actionSettings": "Stillingar",
    "account.actionLogout": "Skrá út",
    "settings.signedOutBody": "Skráðu þig inn til að stjórna tengiliðaupplýsingum þínum.",
    "settings.emailLabel": "Netfang",
    "settings.emailHint": "Þetta er innskráningarnetfang aðgangsins þíns og er ekki hægt að breyta því hér.",
    "settings.phoneLabel": "Farsímanúmer",
    "settings.phonePlaceholder": "t.d. +354 123 4567",
    "settings.homeCountryLabel": "Heimaland",
    "settings.homeRegionLabel": "Heimasvæði",
    "settings.homeRegionPlaceholder": "Veldu eða skrifaðu svæðið þitt",
    "settings.homeLocationHint": "Notað fyrir nýjar auglýsingar sem þú birtir — óháð því hvaða land þú ert að skoða núna.",
    "settings.save": "Vista breytingar",
    "settings.saved": "Stillingar vistaðar.",
    "settings.failed": "Ekki var hægt að vista stillingarnar.",
    "admin.actionQueue": "Tilkynningaröð",
    "admin.internalEyebrow": "Innra",
    "admin.accessDenied": "Þú hefur ekki aðgang að þessari síðu.",
    "admin.emptyQueue": "Engar tilkynningar núna.",
    "admin.targetListing": "Auglýsing",
    "admin.targetUser": "Notandi",
    "admin.targetUnknown": "Óþekkt viðfang",
    "admin.reportedBy": "Tilkynnt af",
    "admin.markReviewed": "Merkja sem yfirfarið",
    "admin.markDismissed": "Vísa frá",
    "admin.hideListing": "Fela auglýsingu",
    "admin.unhideListing": "Birta auglýsingu aftur",
    "admin.flagUser": "Flagga notanda",
    "admin.unflagUser": "Fjarlægja flöggun",
    "admin.status.open": "Opið",
    "admin.status.reviewed": "Yfirfarið",
    "admin.status.dismissed": "Vísað frá",
    "myListings.emptyBody": "Þú hefur ekki birt neinar auglýsingar enn.",
    "myListings.emptyCta": "Byrja að selja",
    "myListings.boost": "Efla",
    "myListings.unboost": "Fjarlægja eflingu",
    "myListings.boosted": "Eflt",
    "myListings.boostedUntil": "Eflt til",
    "account.actionBoost": "Efla auglýsingar",
    "boost.sheetTitle": "Efla þessa auglýsingu",
    "boost.introFree": "Það er alveg frítt að efla auglýsingar meðan FindNord er á sínu fyrsta aðgangstímabili. Veldu tímalengd hér fyrir neðan.",
    "boost.introPaid": "Veldu eflingarpakka og ljúktu greiðslu til að virkja hann.",
    "boost.freeDuringLaunch": "Frítt í bili",
    "boost.selectFree": "Virkja frítt",
    "boost.selectPay": "Greiða og virkja",
    "boost.activeUntil": "Eflt til",
    "boost.changePackage": "Breyta pakka",
    "boost.activated": "Efling virkjuð.",
    "boost.cancelled": "Efling fjarlægð.",
    "boost.failed": "Ekki var hægt að virkja eflinguna.",
    "boost.package.24h": "24 klukkustundir",
    "boost.package.7d": "7 dagar",
    "boost.package.30d": "30 dagar",
    "boost.package.6m": "6 mánuðir",
    "boost.package.12m": "12 mánuðir",
    "boost.package.legacy": "Eldri efling",
    "account.actionAnalytics": "Tölfræði",
    "analytics.signedOutBody": "Skráðu þig inn til að sjá tölfræðina þína.",
    "analytics.listings": "Auglýsingar",
    "analytics.saves": "Vistanir frá öðrum",
    "analytics.conversations": "Samtöl",
    "analytics.messages": "Móttekin skilaboð",
    "analytics.boosted": "Eflt",
    "sell.headingEdit": "Breyta auglýsingunni þinni",
    "sell.publishButton": "Birta auglýsingu",
    "sell.saveChangesButton": "Vista breytingar",
    "myListings.edit": "Breyta",
    "myListings.delete": "Eyða",
    "myListings.deleteConfirm": "Staðfesta eyðingu?",
    "myListings.deleted": "Auglýsingu eytt.",
    "myListings.editSaved": "Breytingar vistaðar.",
    "myListings.statusLabel": "Staða",
    "status.active": "Virk",
    "status.reserved": "Frátekin",
    "status.sold": "Selt",
    "profile.memberSince": "Meðlimur frá",
    "profile.activeListingSingular": "virk auglýsing",
    "profile.activeListingsPlural": "virkar auglýsingar",
    "profile.verifiedBadge": "Staðfest",
    "profile.unverifiedBadge": "Ekki staðfest enn",
    "profile.noActiveListings": "Þessi seljandi hefur engar virkar auglýsingar núna.",
    "profile.notFound": "Þessi notandasíða fannst ekki.",
    "profile.listingsTitle": "Virkar auglýsingar",
    "profile.ratingEmpty": "Engar umsagnir enn",
    "profile.reviewSingular": "umsögn",
    "profile.reviewPlural": "umsagnir",
    "profile.reviewsTitle": "Nýlegar umsagnir",
    "profile.noReviews": "Engar umsagnir enn.",
    "review.leaveTitle": "Skrifa umsögn",
    "review.ratingLabel": "Einkunn",
    "review.textLabel": "Stutt umsögn",
    "review.textPlaceholder": "Deila stuttri, hagnýtri athugasemd",
    "review.submit": "Birta umsögn",
    "review.signInHint": "Skráðu þig inn til að skrifa umsögn.",
    "review.notForSelf": "Þú getur ekki skrifað umsögn um sjálfan þig.",
    "review.posted": "Umsögn birt.",
    "review.failed": "Ekki var hægt að birta umsögnina.",
    "review.sellerSummaryEmpty": "Engar umsagnir um seljanda enn",
    "review.duplicate": "Þú hefur þegar skrifað umsögn um þennan seljanda fyrir þessa auglýsingu.",
    "review.warningModerated": "Umsögnin þín var birt, en óviðeigandi orðalag var fjarlægt. Endurtekin brot munu koma í veg fyrir að þú getir skrifað fleiri umsagnir.",
    "review.banned": "Þú hefur ekki lengur leyfi til að skrifa umsagnir.",
    "review.bannedNow": "Umsögnin þín innihélt óviðeigandi orðalag. Endurtekin brot hafa komið í veg fyrir að þú getir skrifað fleiri umsagnir.",
    "footer.tagline": "Markaðstorgið fyrir Skandinava. Kauptu, seldu og uppgötvaðu um öll Norðurlöndin.",
    "footer.createAccount": "Búa til frían aðgang",
    "footer.startSelling": "Byrja að selja",
    "footer.companyLine": "FindNord — hluti af Micany Investment",
    "footer.colCategories": "Flokkar",
    "footer.colExplore": "Skoða",
    "footer.colBuySell": "Kaupa og selja",
    "footer.colHelp": "Hjálp og aðstoð",
    "footer.colLegal": "Lagalegt og traust",
    "footer.colCompany": "Fyrirtæki",
    "footer.browseAll": "Skoða allt →",
    "footer.countriesTitle": "Skoða eftir landi",
    "footer.copyright": "© 2026 FindNord — hluti af Micany Investment. Allur réttur áskilinn.",
    "footer.linkAbout": "Um okkur",
    "footer.linkHow": "Hvernig þetta virkar",
    "footer.linkSafetyTips": "Öryggisráð",
    "footer.linkTerms": "Notkunarskilmálar",
    "footer.linkPost": "Birta auglýsingu",
    "footer.linkPricing": "Verðleiðbeiningar",
    "footer.linkPhoto": "Myndaleiðbeiningar",
    "footer.linkSafeSelling": "Leiðbeiningar um öruggar sölur",
    "footer.linkHelpCenter": "Hjálparmiðstöð",
    "footer.linkFaq": "Spurt og svarað",
    "footer.linkContact": "Hafa samband við þjónustuver",
    "footer.linkReport": "Tilkynna vandamál",
    "footer.linkPrivacy": "Persónuverndarstefna",
    "footer.linkCookies": "Kökustefna",
    "footer.linkDsr": "Réttindi þín (DSR)",
    "footer.linkMicany": "Micany Investment",
    "footer.linkModeration": "Efni og eftirlit",
    "footer.linkDataSafety": "Gagnaöryggi",
    "footer.linkBoost": "Efla auglýsingarnar þínar",
    "cookie.bannerText": "Við notum vafrakökur til að halda þér innskráðum, tryggja aðganginn þinn og skilja hvernig markaðstorgið er notað. Þú getur breytt vali þínu hvenær sem er.",
    "cookie.settings": "Kökustillingar",
    "cookie.accept": "Samþykkja",
    "filter.regionLabel": "Svæði",
    "filter.regionPlaceholder": "Velja eða skrifa svæði",
    "sell.regionLabel": "Svæði",
    "sell.regionPlaceholder": "Velja eða skrifa svæðið þitt",
    "sidebar.browseAll": "Skoða allt",
    "sidebar.createListing": "Búa til nýja auglýsingu",
    "sidebar.locationTitle": "Staðsetning",
    "sidebar.searchLabel": "Leita á markaðstorgi"
  }
};

let currentLanguage = "en";

function t(key, lang) {
  const dict = translations[lang || currentLanguage] || {};
  return dict[key] ?? translations.en[key] ?? key;
}

// Deployment-readiness audit finding: real, reproducible stored XSS -- any
// user-supplied text (listing title/description, chat messages, review
// text, names) was interpolated raw into `.innerHTML`-bound template
// literals throughout this file with zero escaping anywhere. A listing
// titled `<img src=x onerror=alert(1)>` executed for every viewer who
// browsed it. Every sink that renders real user content must wrap it in
// this. Never used on trusted, hand-authored markup (icons, translated UI
// strings, etc.) -- only on values that ultimately trace back to something
// a user typed.
function escapeHtml(value) {
  return String(value == null ? "" : value).replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]
  );
}

// NM-A24: a small, hand-rolled interpolation for the ONE dynamic value these
// rate-limit messages need (a rounded minute count) -- this codebase has no
// i18n library and no other translated string needs a numeric placeholder,
// so a full interpolation system would be over-building for one use. Every
// `rateLimit.*` key above contains a literal "{minutes}" token; this just
// swaps it in. `retryAfterSeconds` is the real Retry-After header value the
// server sent (see data-service.js's `error.retryAfter`); rounds UP so the
// message never underpromises how long the real wait actually is.
function formatRetryMinutesMessage(key, retryAfterSeconds) {
  const minutes = Math.max(1, Math.ceil((Number(retryAfterSeconds) || 60) / 60));
  return t(key).replace("{minutes}", String(minutes));
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
    "auth-age-label": "auth.ageConfirmLabel",
    "auth-guest-button": "auth.guest",
    "auth-divider-text": "auth.orContinueWithEmail",
    "login-divider-text": "auth.orContinueWithEmail",
    "auth-forgot-link": "auth.forgotPasswordLink",
    "login-forgot-link": "auth.forgotPasswordLink",
    "forgot-password-modal-title": "auth.forgotPasswordModalTitle",
    "forgot-password-modal-body": "auth.forgotPasswordModalBody",
    "forgot-password-email-label": "auth.forgotPasswordEmailLabel",
    "forgot-password-submit-button": "auth.forgotPasswordSubmitButton",
    "reset-password-modal-title": "auth.resetPasswordModalTitle",
    "reset-password-modal-body": "auth.resetPasswordModalBody",
    "reset-password-label": "auth.resetPasswordLabel",
    "reset-password-submit-button": "auth.resetPasswordSubmitButton",
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
    "login-age-label": "auth.ageConfirmLabel",
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
    "analytics-title": "account.actionAnalytics",
    "settings-eyebrow": "account.eyebrow",
    "settings-title": "account.actionSettings",
    "settings-signed-out-text": "settings.signedOutBody",
    "settings-email-label": "settings.emailLabel",
    "settings-email-hint": "settings.emailHint",
    "settings-phone-label": "settings.phoneLabel",
    "settings-home-country-label": "settings.homeCountryLabel",
    "settings-home-region-label": "settings.homeRegionLabel",
    "settings-home-location-hint": "settings.homeLocationHint",
    "settings-save-button": "settings.save",
    "admin-eyebrow": "admin.internalEyebrow",
    "admin-title": "admin.actionQueue",
    "footer-tagline": "footer.tagline",
    "footer-cta-account": "footer.createAccount",
    "footer-cta-sell": "footer.startSelling",
    "footer-company-line": "footer.companyLine",
    "footer-col-categories": "footer.colCategories",
    "footer-col-explore": "footer.colExplore",
    "footer-col-buysell": "footer.colBuySell",
    "footer-col-help": "footer.colHelp",
    "footer-col-legal": "footer.colLegal",
    "footer-col-company": "footer.colCompany",
    "footer-browse-all": "footer.browseAll",
    "footer-link-about": "footer.linkAbout",
    "footer-link-how": "footer.linkHow",
    "footer-link-safety-tips": "footer.linkSafetyTips",
    "footer-link-terms-explore": "footer.linkTerms",
    "footer-link-post": "footer.linkPost",
    "footer-link-pricing": "footer.linkPricing",
    "footer-link-photo": "footer.linkPhoto",
    "footer-link-safe-selling": "footer.linkSafeSelling",
    "footer-link-help-center": "footer.linkHelpCenter",
    "footer-link-faq": "footer.linkFaq",
    "footer-link-contact": "footer.linkContact",
    "footer-link-report": "footer.linkReport",
    "footer-link-privacy": "footer.linkPrivacy",
    "footer-link-terms": "footer.linkTerms",
    "footer-link-cookies": "footer.linkCookies",
    "footer-link-dsr": "footer.linkDsr",
    "footer-link-micany": "footer.linkMicany",
    "footer-link-moderation": "footer.linkModeration",
    "footer-link-data-safety": "footer.linkDataSafety",
    "footer-link-boost": "footer.linkBoost",
    "footer-countries-title": "footer.countriesTitle",
    "footer-copyright": "footer.copyright",
    "cookie-banner-text": "cookie.bannerText",
    "cookie-settings-button": "cookie.settings",
    "cookie-accept-button": "cookie.accept",
    "report-modal-body": "report.modalBody",
    "report-reason-label": "report.reasonLabel",
    "report-details-label": "report.detailsLabel",
    "report-cancel-button": "report.cancel",
    "report-submit-button": "report.submit"
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
    "report-modal-close": "auth.close",
    "filter-sheet-close": "filter.close",
    "forgot-password-modal-close": "auth.close",
    "reset-password-modal-close": "auth.close"
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

  const forgotPasswordEmailInput = document.getElementById("forgot-password-email-input");
  if (forgotPasswordEmailInput) forgotPasswordEmailInput.setAttribute("placeholder", t("auth.emailPlaceholder"));

  const threadReplyInput = document.getElementById("thread-reply-input");
  if (threadReplyInput) threadReplyInput.setAttribute("placeholder", t("thread.replyPlaceholder"));

  const reportDetailsInput = document.getElementById("report-details-input");
  if (reportDetailsInput) reportDetailsInput.setAttribute("placeholder", t("report.detailsPlaceholder"));

  const settingsPhoneInput = document.getElementById("settings-phone-input");
  if (settingsPhoneInput) settingsPhoneInput.setAttribute("placeholder", t("settings.phonePlaceholder"));
  const settingsHomeRegionInput = document.getElementById("settings-home-region-input");
  if (settingsHomeRegionInput) settingsHomeRegionInput.setAttribute("placeholder", t("settings.homeRegionPlaceholder"));
  renderReportReasonSelectOptions();
  // report-modal-title alternates between two keys depending on WHAT is
  // being reported (set in openReportModal) -- it can't be a fixed
  // staticTargets entry, so it's only re-applied here if the modal happens
  // to be open mid-language-switch, the same pattern the boost sheet uses.
  const reportModal = document.getElementById("report-modal");
  if (reportModal && !reportModal.hidden && reportTargetType) {
    document.getElementById("report-modal-title").textContent = t(reportTargetType === "user" ? "report.modalTitleUser" : "report.modalTitleListing");
  }

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
  // BL-A04: category labels are per-language too -- re-render every surface
  // that shows one so a language switch updates them immediately instead of
  // only on next reload, matching how the rest of this block already keeps
  // everything else live.
  if (categoryTaxonomy.length > 0) {
    renderCategoryChips();
    renderCategories();
    renderCategorySelectOptions();
  }
  renderSortIndicator();
  if (activeView === "analytics-view") renderAnalytics();
  // BL-A02: a static page open when the language changes must re-render
  // live, in the new language, not stay frozen until the next open/reload.
  if (currentStaticPageId) openStaticPage(currentStaticPageId);
  if (activeView === "profile-view" && currentProfileSellerId) openSellerProfile(currentProfileSellerId);
  if (boostSheetListingId && !document.getElementById("boost-sheet").hidden) openBoostSheet(boostSheetListingId);

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

// NM-A19: each Nordic country's real currency and its own native BCP47
// locale for number formatting -- kept as a plain lookup on the SAME keys
// countryThemes already uses, not a new/separate country concept. The
// locale here is always the LISTING's own country (so a price reads exactly
// as a local buyer in that country would expect it, e.g. "1.200 kr." for
// Denmark), independent of the browsing viewer's chosen UI language --
// deliberately different from GOOGLE_LOCALE_BY_LANGUAGE below, which drives
// UI text/date formatting off the viewer's own language choice instead.
// Mirrors scripts/api.js's CURRENCY_BY_COUNTRY exactly -- duplicated, not
// fetched, because unlike NM-A18's boost prices this is a fixed geographic
// fact (ISO 4217 currencies), not business data that could change.
const CURRENCY_BY_COUNTRY = {
  Sweden: "SEK",
  Norway: "NOK",
  Denmark: "DKK",
  Finland: "EUR",
  Iceland: "ISK"
};

const LOCALE_BY_COUNTRY = {
  Sweden: "sv-SE",
  Norway: "nb-NO",
  Denmark: "da-DK",
  Finland: "fi-FI",
  Iceland: "is-IS"
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

// BL-A06: the seller's real home country/region -- deliberately SEPARATE
// from `activeCountry` above. `activeCountry` is pure browse-scope state
// (geolocation at bootstrap, or a footer flag click) and never persists;
// `homeCountry`/`homeRegion` only ever change via an explicit Settings save
// (see saveSettings()) and are what a NEW listing gets published under (see
// commitPublishRequest()/renderSellPreview()) -- so idly browsing Norwegian
// listings can never silently mis-file a real listing under Norway.
const HOME_LOCATION_STORAGE_KEY = "fn_home_location";
let homeCountry = "Sweden";
let homeRegion = "Stockholm";

// Guest-only persistence (a signed-in user's home location lives on their
// account instead -- see loadHomeLocation()). Same try/catch-around-
// localStorage idiom as loadSavedLanguage()/the cookie-banner helpers.
function saveHomeLocationLocally(country, region) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(HOME_LOCATION_STORAGE_KEY, JSON.stringify({ country, region }));
    }
  } catch (error) {
    // Storage can be unavailable (private browsing, blocked cookies); the UI still works.
  }
}

// Called once at bootstrap, after `currentUser` is known. A signed-in
// account's own saved fields win; a guest falls back to whatever was
// previously saved locally; either way, an unset value defaults to
// Sweden/Stockholm, matching every other default in this app.
function loadHomeLocation() {
  if (currentUser) {
    homeCountry = countryThemes[currentUser.homeCountry] ? currentUser.homeCountry : "Sweden";
    homeRegion = currentUser.homeRegion || "Stockholm";
    return;
  }
  let saved = null;
  try {
    if (typeof localStorage !== "undefined") {
      saved = JSON.parse(localStorage.getItem(HOME_LOCATION_STORAGE_KEY) || "null");
    }
  } catch (error) {
    saved = null;
  }
  homeCountry = saved && countryThemes[saved.country] ? saved.country : "Sweden";
  homeRegion = (saved && saved.region) || "Stockholm";
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
let currentProfileSellerId = null;
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

// NM-A20: mirrors savedItemsCache's own fetch-once/cache-locally pattern.
// Refreshed at bootstrap/sign-in/sign-out (same as savedItemsCache) and
// again immediately after every block/unblock action, so "stop seeing
// another user's listings/messages" takes effect instantly, not on next reload.
let blockedUserIds = new Set();

async function refreshBlockedUsersCache() {
  if (!currentUser) {
    blockedUserIds = new Set();
    return;
  }
  const ids = await DataService.blocks.getMine();
  blockedUserIds = new Set(ids);
}

// A single toggle button (used identically from a profile and from a
// conversation thread) -- block if not already blocked, unblock if already
// blocked, always re-syncing every surface a block affects afterward
// (Browse listings, the profile's own button label, and the Inbox list).
async function toggleBlockUser(userId) {
  return requireAuth(async () => {
    if (!userId || (currentUser && userId === currentUser.id)) return;
    if (blockedUserIds.has(userId)) {
      await DataService.blocks.remove(userId);
      showToast(t("block.removed"));
    } else {
      await DataService.blocks.create(userId);
      showToast(t("block.added"));
    }
    await refreshBlockedUsersCache();
    await refreshInboxCache();
    renderListings();
    renderInbox();
    if (currentProfileSellerId === userId) openSellerProfile(userId);
    if (currentThreadId) {
      if (inboxConversationsCache.some((item) => item.id === currentThreadId)) {
        openThread(currentThreadId);
      } else {
        showView("inbox-view");
      }
    }
  });
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
  const ageCheckbox = document.getElementById(`${prefix}-age-checkbox`);
  if (ageCheckbox) ageCheckbox.checked = false;
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
  const ageField = document.getElementById(`${prefix}-age-field`);
  const passwordInput = document.getElementById(`${prefix}-password-input`);
  const submitButton = document.getElementById(`${prefix}-continue-button`);
  const toggleButton = document.getElementById(`${prefix}-mode-toggle`);
  // NM-A23: there's no password to forget mid-registration -- only shown in login mode.
  const forgotLink = document.getElementById(`${prefix}-forgot-link`);
  if (nameField) nameField.hidden = !isRegister;
  // Deployment-readiness audit finding: age confirmation only makes sense at
  // registration, same visibility rule as the name field above.
  if (ageField) ageField.hidden = !isRegister;
  if (passwordInput) passwordInput.setAttribute("autocomplete", isRegister ? "new-password" : "current-password");
  if (submitButton) submitButton.textContent = t(isRegister ? "auth.registerButton" : "auth.loginButton");
  if (toggleButton) toggleButton.textContent = t(isRegister ? "auth.modeToggleToLogin" : "auth.modeToggleToRegister");
  if (forgotLink) forgotLink.hidden = isRegister;
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
  // Deployment-readiness audit finding: the ToS said "you must be old enough
  // to form a binding contract" but nothing checked it -- a real, if
  // self-declared, check now exists both here and (authoritatively)
  // server-side in scripts/auth.js's /register route.
  const ageConfirmed = mode === "register" ? Boolean(document.getElementById(`${prefix}-age-checkbox`)?.checked) : true;
  if (mode === "register" && !ageConfirmed) {
    errorEl.textContent = t("auth.errorAgeNotConfirmed");
    errorEl.hidden = false;
    return null;
  }

  try {
    const user = mode === "register" ? await DataService.users.register({ name, email, password, ageConfirmed }) : await DataService.users.login({ email, password });
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
  // BL-A06: a guest who signs in mid-session must pick up THEIR account's
  // own saved home location (not silently keep whatever a previous guest
  // session had in localStorage on this browser).
  loadHomeLocation();
  await refreshSavedItemsCache();
  await refreshBlockedUsersCache();
  await refreshInboxCache();
  closeAuthModal();
  renderAccountPanel();
  renderProfileAvatar();
  renderAccountActions();
  renderListings();
  renderInbox();
  renderMyListings();
  renderSettings();
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

// --- NM-A23: Password reset / forgot-password ---
// Two small, separate modals (matching this app's existing one-modal-per-
// concern pattern -- compose/report/filter are all separate too), not a
// second mode bolted onto the sign-in modal: requesting a reset and setting
// a new password are genuinely different forms with different fields.

// Holds the token pulled from `?resetToken=...` at bootstrap (see
// bootstrap()'s own comment) until the set-new-password form submits it.
let pendingResetToken = null;

function openForgotPasswordModal() {
  document.getElementById("forgot-password-email-input").value = "";
  const errorEl = document.getElementById("forgot-password-error");
  errorEl.hidden = true;
  errorEl.textContent = "";
  const successEl = document.getElementById("forgot-password-success");
  successEl.hidden = true;
  successEl.textContent = "";
  document.getElementById("forgot-password-form").hidden = false;
  document.getElementById("forgot-password-modal").hidden = false;
}

function closeForgotPasswordModal() {
  document.getElementById("forgot-password-modal").hidden = true;
}

async function handleForgotPasswordSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();
  const email = document.getElementById("forgot-password-email-input").value.trim();
  const errorEl = document.getElementById("forgot-password-error");
  const successEl = document.getElementById("forgot-password-success");
  errorEl.hidden = true;
  errorEl.textContent = "";
  successEl.hidden = true;
  successEl.textContent = "";

  if (!email) {
    errorEl.textContent = t("auth.errorInvalidCredentials");
    errorEl.hidden = false;
    return;
  }

  try {
    await DataService.users.requestPasswordReset(email);
    // Always the same generic confirmation on success -- matching the
    // server's own always-200 /forgot-password contract (NM-A23 requirement
    // 1): shown identically whether or not `email` is a real account.
    successEl.textContent = t("auth.forgotPasswordSuccess");
    successEl.hidden = false;
  } catch (error) {
    if (error.status === 429) {
      // A real rate-limit response is shown as-is -- it says nothing about
      // whether THIS email is a real account (the same message appears no
      // matter what was typed), so surfacing it plainly doesn't violate the
      // "never leak account existence" rule above.
      errorEl.textContent = error.message || t("auth.errorGeneric");
      errorEl.hidden = false;
    } else {
      // Any other transport failure still shows the same generic
      // confirmation as success -- never a distinct failure state that
      // could be used to probe account existence.
      successEl.textContent = t("auth.forgotPasswordSuccess");
      successEl.hidden = false;
    }
  }
}

function openResetPasswordModal(token) {
  pendingResetToken = token;
  document.getElementById("reset-password-input").value = "";
  const errorEl = document.getElementById("reset-password-error");
  errorEl.hidden = true;
  errorEl.textContent = "";
  const successEl = document.getElementById("reset-password-success");
  successEl.hidden = true;
  successEl.textContent = "";
  document.getElementById("reset-password-form").hidden = false;
  document.getElementById("reset-password-modal").hidden = false;
}

function closeResetPasswordModal() {
  document.getElementById("reset-password-modal").hidden = true;
  pendingResetToken = null;
}

async function handleResetPasswordSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();
  const password = document.getElementById("reset-password-input").value;
  const errorEl = document.getElementById("reset-password-error");
  const successEl = document.getElementById("reset-password-success");
  errorEl.hidden = true;
  errorEl.textContent = "";
  successEl.hidden = true;
  successEl.textContent = "";

  if (!pendingResetToken) {
    errorEl.textContent = t("auth.errorResetTokenInvalid");
    errorEl.hidden = false;
    return;
  }
  if (password.length < 8) {
    errorEl.textContent = t("auth.errorPasswordTooShort");
    errorEl.hidden = false;
    return;
  }

  try {
    await DataService.users.resetPassword(pendingResetToken, password);
    successEl.textContent = t("auth.resetPasswordSuccess");
    successEl.hidden = false;
    document.getElementById("reset-password-form").hidden = true;
    pendingResetToken = null;
  } catch (error) {
    const key =
      error.code === "RESET_TOKEN_EXPIRED"
        ? "auth.errorResetTokenExpired"
        : error.code === "RESET_TOKEN_USED"
          ? "auth.errorResetTokenUsed"
          : error.code === "GOOGLE_ACCOUNT_NO_PASSWORD"
            ? "auth.errorGoogleAccountNoPassword"
            : error.code === "PASSWORD_TOO_SHORT"
              ? "auth.errorPasswordTooShort"
              : error.code === "INVALID_RESET_TOKEN"
                ? "auth.errorResetTokenInvalid"
                : "auth.errorGeneric";
    errorEl.textContent = t(key);
    errorEl.hidden = false;
  }
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
  // BL-A06: back to guest-scoped home location (localStorage, or the
  // Sweden/Stockholm default) now that there's no account to read it from.
  loadHomeLocation();
  await refreshSavedItemsCache();
  await refreshBlockedUsersCache();
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
    button.textContent = t("nav.you");
    button.classList.remove("signed-in");
    button.setAttribute("aria-label", t("account.actionProfile"));
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
  // NM-A21: the moderation queue's entry point exists ONLY in this
  // markup for an admin -- a non-admin's DOM never even contains a link to
  // it (defense in depth alongside the server's own requireAdmin on every
  // real request; see openAdminQueue's own client-side check too).
  const adminAction = currentUser.isAdmin
    ? `<button type="button" class="account-action admin" data-view="admin-view">${t("admin.actionQueue")}</button>`
    : "";
  container.innerHTML = `
    <button type="button" class="account-action create" data-view="sell-view">${t("account.actionCreate")}</button>
    <button type="button" class="account-action boost" data-view="my-listings-view">${t("account.actionBoost")}</button>
    <button type="button" class="account-action my-listings" data-view="my-listings-view">${t("account.actionMyListings")}</button>
    <button type="button" class="account-action analytics" data-view="analytics-view">${t("account.actionAnalytics")}</button>
    <button type="button" class="account-action messages" data-view="inbox-view">${t("account.actionMessages")}</button>
    <button type="button" class="account-action profile" data-view="you-view">${t("account.actionProfile")}</button>
    <button type="button" class="account-action settings" data-view="settings-view">${t("account.actionSettings")}</button>
    ${adminAction}
    <button type="button" class="account-action logout" data-logout>${t("account.actionLogout")}</button>
  `;
}

// --- My Listings + Boost (NM-A9 UX pass) ---

function getMyListings() {
  if (!currentUser) return [];
  return listings.filter((listing) => listing.sellerId === currentUser.id);
}

// --- NM-A18 follow-up: positional-quota boost rotation + a random fairness
// segment ---
// Direct user feedback after the first NM-A18 pass: a fixed "all boosted
// listings permanently outrank everything else, forever, in purchase/boost
// order" ranking isn't fair once more than a handful of sellers are
// boosted at once -- whoever boosted first (or whoever the sort happens to
// favor) would permanently occupy the top of the page while an equally
// "boosted" competitor never gets seen. Real platforms solve this with a
// LIMITED number of top slots that ROTATE among eligible boosted listings
// (a "positional quota," one of the two systems the user explicitly named)
// -- reshuffled every time listings data actually changes, not on every
// keystroke, so the page doesn't visibly flicker mid-browse. A listing that
// isn't in this rotation's slots keeps its real "Sponsored" label (it IS
// genuinely boosted) but doesn't get the ranking bonus that round --
// everyone boosted gets fair turns at the top over time, not a permanent
// first-come-first-served queue.
//
// The random "fairness segment" (the user's other explicit ask) is a
// separate, clearly-labeled shelf of non-boosted listings, reshuffled on
// the same cadence, so organic sellers keep real visibility regardless of
// how many competitors are boosted.
const SPONSORED_SLOT_COUNT = 4;
const FAIRNESS_SPOTLIGHT_COUNT = 4;
let sponsoredRotationIds = [];
let fairnessSpotlightIds = [];

function shuffleArray(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Recomputed every time `listings` itself is refreshed (see
// refreshListingsCache below) -- a real rotation over time (each fresh
// bootstrap, each publish/edit/boost/delete), not a per-render random flicker.
function refreshBoostRotation() {
  const activeSponsored = listings.filter((listing) => listing.sponsored && listing.status === "active");
  sponsoredRotationIds = shuffleArray(activeSponsored)
    .slice(0, SPONSORED_SLOT_COUNT)
    .map((listing) => listing.id);

  const activeOrganic = listings.filter((listing) => !listing.sponsored && listing.status === "active");
  fairnessSpotlightIds = shuffleArray(activeOrganic)
    .slice(0, FAIRNESS_SPOTLIGHT_COUNT)
    .map((listing) => listing.id);
}

// The one place `listings` is re-fetched from the server -- replaces every
// former `listings = await DataService.listings.getAll();` call site, so
// the rotation can never go stale relative to what's actually rendered.
async function refreshListingsCache() {
  listings = await DataService.listings.getAll();
  refreshBoostRotation();
}

// Plain getters so tests can observe this module-scope rotation state --
// `let`/`const` bindings never become properties of a vm sandbox context
// the way function declarations do, so a bare `context.sponsoredRotationIds`
// would read as undefined even though the real variable is live.
function getSponsoredRotationIds() {
  return sponsoredRotationIds;
}

function getFairnessSpotlightIds() {
  return fairnessSpotlightIds;
}

function fairnessSectionTemplate() {
  const candidates = fairnessSpotlightIds.map((id) => listings.find((listing) => listing.id === id)).filter(Boolean);
  if (candidates.length === 0) return "";
  return `
    <section class="fairness-section" aria-labelledby="fairness-section-title">
      <h3 id="fairness-section-title">${t("browse.discoverTitle")}</h3>
      <p class="fairness-section-subtitle">${t("browse.discoverSubtitle")}</p>
      <div class="listing-grid">${candidates.map((listing) => listingCardTemplate(listing)).join("")}</div>
    </section>
  `;
}

// --- NM-A18: Boost / Premium (free-first, Stripe-ready) ---
// Replaces NM-A9's simple sponsored on/off toggle with real, package-based,
// time-limited boosts. `boostConfig` (real packages + the live
// BOOST_PAYMENTS_ENABLED flag) is fetched once at bootstrap -- the same
// "ask the server, don't hardcode" pattern NM-A15's Google config and
// NM-A16/17's rating data already use.
let boostConfig = null;
let boostSheetListingId = null;

async function loadBoostConfig() {
  try {
    boostConfig = await DataService.boost.config();
  } catch (error) {
    boostConfig = { paymentsEnabled: false, packages: [] };
  }
}

function formatBoostExpiry(timestampMs) {
  if (!timestampMs) return "";
  const locale = GOOGLE_LOCALE_BY_LANGUAGE[currentLanguage] || "en";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(timestampMs));
}

function boostPackageLabel(packageId) {
  const key = `boost.package.${packageId}`;
  const translated = t(key);
  return translated === key ? packageId : translated;
}

function boostPackageRowTemplate(pkg, listing) {
  const isCurrent = listing.sponsored && listing.boostPackage === pkg.id;
  const priceHtml = boostConfig.paymentsEnabled
    ? `<span class="boost-package-price">${pkg.priceSek} kr</span>`
    : `<span class="boost-package-price boost-price-free">${t("boost.freeDuringLaunch")}</span><span class="boost-package-price-original">${pkg.priceSek} kr</span>`;
  return `
    <div class="boost-package-row${isCurrent ? " active" : ""}">
      <div class="boost-package-info">
        <strong>${boostPackageLabel(pkg.id)}</strong>
        ${priceHtml}
      </div>
      <button type="button" class="account-action boost" data-activate-boost="${pkg.id}">${boostConfig.paymentsEnabled ? t("boost.selectPay") : t("boost.selectFree")}</button>
    </div>
  `;
}

function boostSheetBodyTemplate(listing) {
  if (listing.sponsored) {
    return `
      <p class="boost-active-status">${t("boost.activeUntil")} ${formatBoostExpiry(listing.boostExpiresAt)} (${boostPackageLabel(listing.boostPackage)})</p>
      <button type="button" class="secondary-action" id="boost-cancel-button">${t("myListings.unboost")}</button>
      <h3 class="boost-sheet-subtitle">${t("boost.changePackage")}</h3>
      <div class="boost-package-list">${(boostConfig.packages || []).map((pkg) => boostPackageRowTemplate(pkg, listing)).join("")}</div>
    `;
  }
  return `
    <p class="boost-sheet-intro">${boostConfig.paymentsEnabled ? t("boost.introPaid") : t("boost.introFree")}</p>
    <div class="boost-package-list">${(boostConfig.packages || []).map((pkg) => boostPackageRowTemplate(pkg, listing)).join("")}</div>
  `;
}

// Boost management lives on My Listings (NM-A18 requirement 1) -- a real
// ownership check here mirrors the server's own (which is what actually
// enforces it; this is just so a non-owner never even sees the sheet).
function openBoostSheet(listingId) {
  const listing = listings.find((item) => item.id === listingId);
  if (!listing || !currentUser || listing.sellerId !== currentUser.id) return;
  boostSheetListingId = listingId;
  document.getElementById("boost-sheet-title").textContent = t("boost.sheetTitle");
  document.getElementById("boost-sheet-body").innerHTML = boostSheetBodyTemplate(listing);
  document.getElementById("boost-sheet").hidden = false;
}

function closeBoostSheet() {
  document.getElementById("boost-sheet").hidden = true;
  boostSheetListingId = null;
}

async function refreshAfterBoostChange(listingId) {
  await refreshListingsCache();
  renderMyListings();
  renderListings();
  renderCategories();
  if (currentDetailListingId === listingId) openListing(listingId);
}

// Free path (paymentsEnabled === false, the PRD's launch-policy default) vs.
// paid path (redirects to a real Stripe Checkout Session) -- the SAME
// button triggers whichever is currently real, so the seller never sees a
// broken/dead "pay" button while payments are off.
async function activateBoostPackage(packageId) {
  const listingId = boostSheetListingId;
  if (!listingId) return;
  try {
    if (boostConfig.paymentsEnabled) {
      const session = await DataService.boost.checkout(listingId, packageId, typeof window !== "undefined" && window.location ? window.location.href : "");
      if (session && session.url && typeof window !== "undefined" && window.location) window.location.href = session.url;
      return;
    }
    await DataService.boost.activate(listingId, packageId);
    await refreshAfterBoostChange(listingId);
    showToast(t("boost.activated"));
    closeBoostSheet();
  } catch (error) {
    showToast(error.message || t("boost.failed"));
  }
}

async function cancelActiveBoost() {
  const listingId = boostSheetListingId;
  if (!listingId) return;
  await DataService.boost.cancel(listingId);
  await refreshAfterBoostChange(listingId);
  showToast(t("boost.cancelled"));
  closeBoostSheet();
}

// NM-A13: Reserved/Sold status, editable inline via a select. Any status
// change goes through the same server-side ownership check as Boost/Edit/Delete.
const LISTING_STATUSES = ["active", "reserved", "sold"];

async function handleMyListingStatusChange(listingId, status) {
  const listing = listings.find((item) => item.id === listingId);
  if (!listing || !currentUser || listing.sellerId !== currentUser.id) return;
  if (!LISTING_STATUSES.includes(status)) return;
  await DataService.listings.update(listingId, { status });
  await refreshListingsCache();
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
  await refreshListingsCache();
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
  // NM-A18: "clearly labeled" (requirement 4) means more than a bare
  // "Boosted" chip -- a real expiry date the seller can act on before it lapses.
  const boostStatusLine = listing.sponsored ? `<p>${t("myListings.boostedUntil")} ${formatBoostExpiry(listing.boostExpiresAt)}</p>` : "";
  return `
    <article class="inbox-row my-listing-row">
      <button type="button" class="inbox-row-open" data-open-listing="${listing.id}" aria-label="${escapeHtml(listing.title)}">
        <div class="inbox-row-photo" style="background: ${listing.image}" aria-hidden="true"></div>
        <div class="inbox-row-copy" aria-hidden="true">
          <strong>${escapeHtml(listing.title)}</strong>
          <span>${formatListingPrice(listing)}</span>
          ${boostStatusLine}
        </div>
      </button>
      <div class="my-listing-actions">
        <label class="sr-only" for="status-select-${listing.id}">${t("myListings.statusLabel")}</label>
        <select class="status-select status-select-${listing.status}" id="status-select-${listing.id}" data-status-select="${listing.id}">
          ${statusOptions}
        </select>
        <button type="button" class="account-action edit" data-edit-listing="${listing.id}">${t("myListings.edit")}</button>
        <button type="button" class="account-action${listing.sponsored ? " boosted" : " boost"}" data-open-boost-sheet="${listing.id}">
          ${listing.sponsored ? t("myListings.boosted") : t("myListings.boost")}
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

// --- NM-A21 follow-up: Settings under Profile (Contact info) ---
// Static markup (see index.html), populated/toggled here rather than
// rebuilt via innerHTML -- its Save button's listener is bound once in
// bindEvents(), the same pattern the Sell/auth forms already use, not a
// fresh addEventListener on every render.
function renderSettings() {
  const signedOut = document.getElementById("settings-signed-out");
  const formWrap = document.getElementById("settings-form-wrap");
  if (!signedOut || !formWrap) return;
  if (!currentUser) {
    signedOut.hidden = false;
    formWrap.hidden = true;
    return;
  }
  signedOut.hidden = true;
  formWrap.hidden = false;
  document.getElementById("settings-email-display").value = currentUser.email;
  document.getElementById("settings-phone-input").value = currentUser.phone || "";
  // BL-A06: reflects the account's OWN saved home location (currentUser.*),
  // not the transient activeCountry -- this form is the one, explicit place
  // that's allowed to change it.
  const homeCountrySelect = document.getElementById("settings-home-country-select");
  if (homeCountrySelect) {
    homeCountrySelect.value = homeCountry;
    renderRegionDatalist("settings-home-region-datalist", REGIONS_BY_COUNTRY[homeCountrySelect.value]);
  }
  const homeRegionInput = document.getElementById("settings-home-region-input");
  if (homeRegionInput) homeRegionInput.value = homeRegion;
  const errorEl = document.getElementById("settings-error");
  errorEl.hidden = true;
  errorEl.textContent = "";
}

// BL-A06: the country <select> changing (before Save is pressed) only
// re-narrows the region datalist's own suggestions to that country's real
// regions -- it does NOT write `homeCountry` yet. Nothing is persisted, and
// activeCountry/Browse are completely untouched, until saveSettings() below
// runs on an explicit Save click.
function handleSettingsHomeCountryChange() {
  const select = document.getElementById("settings-home-country-select");
  if (!select) return;
  renderRegionDatalist("settings-home-region-datalist", REGIONS_BY_COUNTRY[select.value]);
}

async function saveSettings() {
  const phone = document.getElementById("settings-phone-input").value.trim();
  const homeCountrySelect = document.getElementById("settings-home-country-select");
  const homeRegionInput = document.getElementById("settings-home-region-input");
  const fields = { phone };
  if (homeCountrySelect) fields.homeCountry = homeCountrySelect.value;
  if (homeRegionInput) fields.homeRegion = homeRegionInput.value.trim();
  const errorEl = document.getElementById("settings-error");
  errorEl.hidden = true;
  try {
    currentUser = await DataService.users.updateSettings(fields);
    // BL-A06: this is the one explicit user action allowed to change the
    // saved home location -- activeCountry/browse scope are never touched
    // here.
    homeCountry = currentUser.homeCountry;
    homeRegion = currentUser.homeRegion;
    showToast(t("settings.saved"));
  } catch (error) {
    errorEl.textContent = error.message || t("settings.failed");
    errorEl.hidden = false;
  }
}

// Deployment-readiness audit / Data Subject Rights: a real, self-service
// export -- builds a real downloadable JSON file client-side from the
// real server response, the standard Blob + object URL + temporary-anchor
// browser download pattern (no server-side file generation needed for a
// payload this size).
async function handleExportDataClick() {
  try {
    const data = await DataService.users.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `findnord-data-export-${currentUser ? currentUser.id : "account"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    showToast(error.message || t("settings.exportFailed"));
  }
}

function showDeleteAccountConfirm() {
  document.getElementById("settings-delete-account-confirm").hidden = false;
}

function hideDeleteAccountConfirm() {
  document.getElementById("settings-delete-account-confirm").hidden = true;
  document.getElementById("settings-delete-account-password").value = "";
}

async function handleConfirmDeleteAccountClick() {
  const password = document.getElementById("settings-delete-account-password").value;
  const errorEl = document.getElementById("settings-error");
  errorEl.hidden = true;
  try {
    await DataService.users.deleteAccount(password);
    hideDeleteAccountConfirm();
    // The account is gone -- same end state as a real sign-out (clears
    // currentUser, re-renders every currentUser-dependent surface), not a
    // special-cased teardown path.
    currentUser = null;
    await refreshSavedItemsCache();
    await refreshBlockedUsersCache();
    await refreshInboxCache();
    renderAccountPanel();
    renderProfileAvatar();
    renderAccountActions();
    renderListings();
    renderInbox();
    renderMyListings();
    showView("browse-view");
    showToast(t("settings.accountDeleted"));
  } catch (error) {
    errorEl.textContent = error.message || t("settings.deleteAccountFailed");
    errorEl.hidden = false;
  }
}

// --- NM-A21: internal moderation queue ---
// A listing/user's target label needs to resolve differently depending on
// what was reported -- kept as one small helper rather than repeating the
// branch in every render/action call site.
function adminReportTargetLabel(report) {
  if (report.listingId) return `${t("admin.targetListing")}: ${report.listingTitle || report.listingId}`;
  if (report.reportedUserId) return `${t("admin.targetUser")}: ${report.reportedUserName || report.reportedUserId}`;
  return t("admin.targetUnknown");
}

function adminReportRowTemplate(report) {
  const listingActions = report.listingId
    ? `<button type="button" class="secondary-action" data-admin-toggle-hide-listing="${report.listingId}" data-hidden="${report.listingAdminHidden ? "1" : "0"}">${t(report.listingAdminHidden ? "admin.unhideListing" : "admin.hideListing")}</button>`
    : "";
  const userActions = report.reportedUserId
    ? `<button type="button" class="secondary-action" data-admin-toggle-flag-user="${report.reportedUserId}" data-flagged="${report.reportedUserFlagged ? "1" : "0"}">${t(report.reportedUserFlagged ? "admin.unflagUser" : "admin.flagUser")}</button>`
    : "";
  return `
    <article class="admin-report-row admin-status-${report.status}">
      <div class="admin-report-meta">
        <span class="admin-report-reason">${t(`report.reason.${report.reason}`)}</span>
        <span class="admin-report-status status-badge status-${report.status}">${t(`admin.status.${report.status}`)}</span>
      </div>
      <p class="admin-report-target">${adminReportTargetLabel(report)}</p>
      ${report.details ? `<p class="admin-report-details">${report.details}</p>` : ""}
      <p class="admin-report-footer">${t("admin.reportedBy")} ${report.reporterName} (${report.reporterEmail}) · ${formatMemberSince(report.createdAt)}</p>
      <div class="admin-report-actions">
        <button type="button" class="secondary-action" data-admin-report-status="${report.id}" data-status="reviewed">${t("admin.markReviewed")}</button>
        <button type="button" class="secondary-action" data-admin-report-status="${report.id}" data-status="dismissed">${t("admin.markDismissed")}</button>
        ${listingActions}
        ${userActions}
      </div>
    </article>
  `;
}

async function openAdminQueue() {
  // Client-side check is defense in depth, not the real gate -- every
  // underlying request the queue makes is independently requireAdmin'd
  // server-side (requirement 4), so a non-admin who somehow forces this
  // view open client-side still sees and can change nothing real.
  if (!currentUser || !currentUser.isAdmin) {
    const content = document.getElementById("admin-content");
    if (content) content.innerHTML = `<div class="quiet-state"><p>${t("admin.accessDenied")}</p></div>`;
    return;
  }
  const content = document.getElementById("admin-content");
  if (!content) return;
  try {
    const reports = await DataService.admin.getReports();
    content.innerHTML =
      reports.length > 0
        ? reports.map((report) => adminReportRowTemplate(report)).join("")
        : `<div class="quiet-state"><p>${t("admin.emptyQueue")}</p></div>`;
  } catch (error) {
    content.innerHTML = `<div class="quiet-state"><p>${t("admin.accessDenied")}</p></div>`;
  }
}

async function handleAdminReportStatusClick(reportId, status) {
  await DataService.admin.updateReportStatus(reportId, status);
  await openAdminQueue();
}

async function handleAdminToggleHideListingClick(listingId, currentlyHidden) {
  if (currentlyHidden) {
    await DataService.admin.unhideListing(listingId);
  } else {
    await DataService.admin.hideListing(listingId);
  }
  await refreshListingsCache();
  renderListings();
  await openAdminQueue();
}

async function handleAdminToggleFlagUserClick(userId, currentlyFlagged) {
  if (currentlyFlagged) {
    await DataService.admin.unflagUser(userId);
  } else {
    await DataService.admin.flagUser(userId);
  }
  await openAdminQueue();
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
    try {
      // NM-A20: the seller is now explicitly included as a real participant
      // (previously only the buyer ever was, which is exactly why the
      // block check on an EXISTING conversation had nothing to check
      // against -- see conversationOtherPartyId's own comment). This also
      // means the block check on start-or-get itself now genuinely
      // considers the real other party, not just whoever the buyer already is.
      const listingForMessage = listings.find((item) => item.id === listingId);
      const participantIds = listingForMessage && listingForMessage.sellerId ? [currentUser.id, listingForMessage.sellerId] : [currentUser.id];
      const conversation = await DataService.conversations.startOrGet(listingId, participantIds);
      await DataService.conversations.addMessage(conversation.id, { senderId: currentUser.id, text });
      await refreshInboxCache();
      renderInbox();
      showToast(t("compose.sent"));
    } catch (error) {
      // NM-A20: a block (either direction) is rejected server-side -- a
      // clear message here, not a silent failure or an unhandled rejection,
      // matches the "honest safety messaging" this slice asks for.
      // NM-A24: a real per-account message rate limit (429, RATE_LIMITED)
      // gets its own clear, translated "slow down" message with a real
      // retry time, not the generic failure text.
      showToast(
        error.code === "RATE_LIMITED"
          ? formatRetryMinutesMessage("rateLimit.messages", error.retryAfter)
          : error.code === "BLOCKED"
            ? t("block.messagingBlocked")
            : error.message || t("compose.failed")
      );
    }
    return;
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

// NM-A20: who a conversation's "other side" actually is. A conversation's
// `participantIds` (NM-A8) only ever contains the BUYER who started it --
// the seller is never added as a formal participant (messaging here is a
// real-but-one-sided structure: a seller has no inbox view onto it at all
// yet). So the real "other party," from the buyer's own perspective
// viewing their own sent conversation, is the listing's sellerId, not
// anything found in participantIds.
function conversationOtherPartyId(conversation) {
  const fromParticipants = conversation.participantIds && conversation.participantIds.find((id) => id !== (currentUser && currentUser.id));
  if (fromParticipants) return fromParticipants;
  const listing = listings.find((item) => item.id === conversation.listingId);
  return listing ? listing.sellerId : null;
}

// NM-A22 re-audit finding: since NM-A20 started recording the seller as a
// real conversation participant (needed for Block to enforce correctly),
// the seller now genuinely sees a buyer's conversation in their OWN Inbox
// -- but `listing.seller` is always the SELLER's name, so a seller
// checking their own inbox saw their own name as if they were messaging
// themselves. There's no resolved name for the buyer available on the
// client (only their id), so this shows an honest, generic "Buyer" label
// from a seller's own perspective rather than a wrong or self-referential name.
function conversationOtherPartyLabel(listing) {
  if (!listing) return "";
  const viewerIsSeller = Boolean(currentUser && listing.sellerId && listing.sellerId === currentUser.id);
  return viewerIsSeller ? t("inbox.buyerLabel") : listing.seller;
}

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
  // NM-A20: "stop seeing... messages" -- a conversation with a blocked user
  // is hidden from the Inbox list entirely (the data itself is untouched
  // server-side, so unblocking brings it straight back, same as blocked
  // listings reappearing in Browse).
  inboxConversationsCache = withMessages.filter((conversation) => {
    const otherPartyId = conversationOtherPartyId(conversation);
    return !otherPartyId || !blockedUserIds.has(otherPartyId);
  });
}

function inboxRowTemplate(conversation) {
  const listing = listings.find((item) => item.id === conversation.listingId);
  const title = listing ? listing.title : t("inbox.unknownListing");
  const seller = conversationOtherPartyLabel(listing);
  const image = listing ? listing.image : "linear-gradient(135deg, #dfe6e1, #f4f6f1)";
  const preview = conversation.lastMessage ? conversation.lastMessage.text : "";
  return `
    <button type="button" class="inbox-row" data-open-thread="${conversation.id}" aria-label="${t("thread.replyLabel")}: ${escapeHtml(title)}, ${escapeHtml(seller)}">
      <div class="inbox-row-photo" style="background: ${image}" aria-hidden="true"></div>
      <div class="inbox-row-copy" aria-hidden="true">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(seller)}</span>
        <p>${escapeHtml(preview)}</p>
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
      return `<div class="thread-message${mine ? " mine" : ""}"><p>${escapeHtml(message.text)}</p></div>`;
    })
    .join("");
}

function openThread(conversationId) {
  const conversation = inboxConversationsCache.find((item) => item.id === conversationId);
  if (!conversation) return;
  currentThreadId = conversationId;
  const listing = listings.find((item) => item.id === conversation.listingId);
  // NM-A20: Block is available directly from a conversation too (per the
  // requirement's own "from profile or conversation") -- see
  // conversationOtherPartyId's own comment for why that's the listing's
  // seller, not anything in participantIds.
  const otherParticipantId = conversationOtherPartyId(conversation);
  const isBlocked = otherParticipantId && blockedUserIds.has(otherParticipantId);
  const blockAction = otherParticipantId
    ? `<button type="button" class="secondary-action${isBlocked ? " blocked" : ""}" data-block-user="${otherParticipantId}">${t(isBlocked ? "block.unblockAction" : "block.blockAction")}</button>`
    : "";
  document.getElementById("thread-snapshot").innerHTML = `
    <p class="eyebrow">${escapeHtml(listing ? listing.locality : "")}</p>
    <h2 id="thread-title">${escapeHtml(listing ? listing.title : t("inbox.unknownListing"))}</h2>
    <p class="detail-meta">${listing ? `${formatListingPrice(listing)} · ${escapeHtml(conversationOtherPartyLabel(listing))}` : ""}</p>
    ${blockAction}
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
  try {
    await DataService.conversations.addMessage(currentThreadId, { senderId: currentUser.id, text });
    input.value = "";
    await refreshInboxCache();
    const conversation = inboxConversationsCache.find((item) => item.id === currentThreadId);
    if (conversation) renderThreadMessages(conversation.messages);
    renderInbox();
  } catch (error) {
    // NM-A20: covers the case where the OTHER person blocked YOU -- you'd
    // have no other signal that a reply will fail until you try to send one.
    // NM-A24: same real per-account message rate limit as sendComposedMessage.
    showToast(
      error.code === "RATE_LIMITED"
        ? formatRetryMinutesMessage("rateLimit.messages", error.retryAfter)
        : error.code === "BLOCKED"
          ? t("block.messagingBlocked")
          : error.message || t("compose.failed")
    );
  }
}

// NM-A20: Report is now a real modal (reason + optional details), reused
// for both a listing report and a user report -- the old version fired
// instantly on click with no reason at all, which is exactly what "already
// partially present... ensure Report is fully functional" refers to.
let reportTargetType = null;
let reportTargetId = null;

function openReportModal(targetType, targetId) {
  reportTargetType = targetType;
  reportTargetId = targetId;
  document.getElementById("report-reason-select").selectedIndex = 0;
  document.getElementById("report-details-input").value = "";
  const errorEl = document.getElementById("report-error");
  errorEl.hidden = true;
  errorEl.textContent = "";
  document.getElementById("report-modal-title").textContent = t(targetType === "user" ? "report.modalTitleUser" : "report.modalTitleListing");
  document.getElementById("report-modal").hidden = false;
}

function closeReportModal() {
  document.getElementById("report-modal").hidden = true;
  reportTargetType = null;
  reportTargetId = null;
}

async function submitReportModal() {
  if (!reportTargetId) return;
  const reason = document.getElementById("report-reason-select").value;
  const details = document.getElementById("report-details-input").value.trim();
  const errorEl = document.getElementById("report-error");
  try {
    await DataService.reports.create({
      listingId: reportTargetType === "listing" ? reportTargetId : undefined,
      reportedUserId: reportTargetType === "user" ? reportTargetId : undefined,
      reason,
      details
    });
    closeReportModal();
    showToast(t("report.sent"));
  } catch (error) {
    // NM-A24: a real per-account report rate limit (429, RATE_LIMITED) gets
    // its own clear, translated message with a real retry time.
    errorEl.textContent = error.code === "RATE_LIMITED" ? formatRetryMinutesMessage("rateLimit.reports", error.retryAfter) : error.message || t("report.failed");
    errorEl.hidden = false;
  }
}

function handleReportListingClick(id) {
  return requireAuth(() => openReportModal("listing", id));
}

function handleReportUserClick(id) {
  return requireAuth(() => openReportModal("user", id));
}

// NM-A25: prefers `window.location.origin` (what a real browser provides);
// falls back to pulling the same thing out of `href` by hand for the
// fake-window test sandbox, which doesn't set `origin`.
function siteOrigin() {
  if (typeof window === "undefined" || !window.location) return "";
  if (window.location.origin) return window.location.origin;
  const match = /^https?:\/\/[^/]+/.exec(window.location.href || "");
  return match ? match[0] : "";
}

// Sharing a public listing needs no account (unlike Save/Message/Report,
// which are all tied to a real signed-in identity) -- a guest can share just
// as freely as they can browse. Prefers the real native share sheet
// (navigator.share) where the browser supports one; otherwise falls back to
// copying a shareable summary + this page's URL to the clipboard, with a
// toast since a clipboard write is otherwise invisible feedback-wise.
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
  // NM-A25: a real, per-listing deep link (`/listing/:id`) -- reloading or
  // pasting this URL anywhere now lands directly on this exact listing (see
  // scripts/server.js's matching route), not just the site's bare address.
  const url = `${siteOrigin()}${routeUrl("listing", id)}`;
  const shareText = `${listing.title} — ${formatListingPrice(listing)}`;

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

// Extracted so it's directly testable (the fake DOM's Element.closest()
// always returns null, so delegated click routing itself can only be
// exercised in real Playwright -- see the click-delegation handler below,
// which now just calls this).
function setActiveScope(scope) {
  activeScope = scope;
  document.querySelectorAll(".scope").forEach((item) => item.classList.toggle("active", item.dataset.scope === scope));
  renderListings();
}

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
    // NM-A18 requirement 5: ranking must respect active boosts -- but only
    // the CURRENT rotation's slot-holders (see refreshBoostRotation above),
    // not every boosted listing unconditionally. A boosted listing outside
    // this rotation cycle still shows its real "Sponsored" label (it IS
    // genuinely boosted) but doesn't get a ranking bonus this round --
    // that's what keeps the top of the feed rotating fairly among boosted
    // sellers instead of being permanently owned by whoever boosted first.
    // Applied only to the default "recent" feed, not an explicit
    // price/nearest sort -- once a user deliberately asks for "lowest price
    // first," overriding that with a boosted-but-expensive listing would be
    // confusing, not helpful.
    copy.sort((a, b) => {
      const boostRank = Number(sponsoredRotationIds.includes(b.id)) - Number(sponsoredRotationIds.includes(a.id));
      if (boostRank !== 0) return boostRank;
      return (b.postedAt || 0) - (a.postedAt || 0);
    });
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

// NM-A20: the report reason <select>'s options are rebuilt on every
// language switch, the same way renderFilterCategorySelectOptions already
// keeps the category filter's options translated -- a plain static HTML
// <option> would otherwise stay in whichever language the page first loaded in.
const REPORT_REASONS = ["prohibited_item", "scam_or_fraud", "inappropriate_content", "harassment", "spam", "other"];

function renderReportReasonSelectOptions() {
  const select = document.getElementById("report-reason-select");
  if (!select) return;
  const previousValue = select.value;
  select.innerHTML = REPORT_REASONS.map((reason) => `<option value="${reason}">${t(`report.reason.${reason}`)}</option>`).join("");
  select.value = REPORT_REASONS.includes(previousValue) ? previousValue : REPORT_REASONS[0];
}

function renderFilterCategorySelectOptions() {
  const select = document.getElementById("filter-category-select");
  if (!select) return;
  select.innerHTML =
    `<option value="All">${t("filter.categoryAll")}</option>` +
    categoryTaxonomy.map((category) => `<option value="${category.id}">${categoryLabel(category.id)}</option>`).join("");
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
    // NM-A19: the min/max bounds themselves are just a range's numbers (not
    // two separately currency-formatted amounts), with the real unit for
    // whichever country is currently active appended once at the end --
    // this used to hardcode " kr" unconditionally, wrong for e.g. a Finnish
    // (€) browsing context.
    const min = formatPlainNumber(activeFilters.priceMin != null ? activeFilters.priceMin : 0, activeCountry);
    const max = activeFilters.priceMax != null ? formatPlainNumber(activeFilters.priceMax, activeCountry) : "∞";
    chips.push({ key: "price", label: `${t("filter.priceChipPrefix")}: ${min}–${max} ${currencyUnitLabel(activeCountry)}` });
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
  const synonymCategoryIds = categorySynonymMatches(query);
  const results = listings.filter((listing) => {
    const matchesCategory =
      activeCategory === "All" ||
      listing.category === activeCategory ||
      (activeCategory === "Free Items" && listing.price === "Free");
    const matchesSubtype = !activeFilters.subtype || listing.subtype === activeFilters.subtype;
    const searchable = normalize(
      `${listing.title} ${listing.category} ${listing.subtype || ""} ${listing.locality} ${listing.condition}`
    );
    // BL-A05: a localized synonym (e.g. Swedish "bil") also matches every
    // listing in the category it maps to, even when that word appears
    // nowhere in the listing's own stored text.
    const matchesSearch = !query || searchable.includes(query) || synonymCategoryIds.includes(listing.category);

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

    // NM-A19 (location depth): the Nearby/Country/All Nordics scope buttons
    // existed since NM-A3 but were purely cosmetic -- clicking one only
    // changed the eyebrow label, never actually filtered anything. "Country"
    // now genuinely restricts results to the browsing country's own real
    // listings.country, using the same field currency formatting relies on.
    // "All Nordics" and "Nearby" both stay intentionally unfiltered here:
    // "All Nordics" by definition, and "Nearby" because this app has no real
    // per-listing coordinates to rank true physical proximity by (Distance
    // filtering already exists separately, in the Filter sheet, driven by
    // Region -- see matchesRegion above) -- narrowing it further here would
    // just be Country filtering with an inaccurate label.
    const matchesScope = activeScope !== "Country" || listing.country === activeCountry;

    // NM-A20: "stop seeing another user's listings" -- a real, immediate
    // client-side filter (mirroring how every other filter here works),
    // not a server-side removal, since a block is the BLOCKER's own
    // preference, not a moderation action against the seller.
    const notBlockedSeller = !listing.sellerId || !blockedUserIds.has(listing.sellerId);

    // NM-A21: a real moderation action, not a preference -- a listing an
    // admin hid must disappear from Browse for EVERYONE, unlike the
    // per-viewer block filter above.
    const notAdminHidden = !listing.adminHidden;

    return (
      matchesCategory &&
      matchesSubtype &&
      matchesSearch &&
      matchesPriceMin &&
      matchesPriceMax &&
      matchesCondition &&
      matchesSellerType &&
      matchesDistance &&
      matchesRegion &&
      matchesScope &&
      notBlockedSeller &&
      notAdminHidden
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
      <strong>${formatListingPrice(listing)}</strong>
      <h3>${escapeHtml(listing.title)}</h3>
      <p>${escapeHtml(listing.locality)} · ${listing.distance}</p>
    </div>
  `;

  if (!interactive) {
    return `<article class="listing-card preview-card">${body}</article>`;
  }

  const saved = isSaved(listing.id);
  return `
    <article class="listing-card" data-id="${listing.id}">
      <button type="button" class="card-button" data-open-listing="${listing.id}" aria-label="Open listing: ${escapeHtml(listing.title)}, ${formatListingPrice(listing)}${status ? ", " + t(`status.${status}`) : ""}${listing.sponsored ? ", sponsored" : ""}${listing.freshness ? ", " + listing.freshness : ""}, ${escapeHtml(listing.locality)}, ${listing.distance} away">
        ${body}
      </button>
      <button type="button" class="save-button${saved ? " saved" : ""}" data-save-listing="${listing.id}" aria-pressed="${saved}" aria-label="${saved ? `Remove ${escapeHtml(listing.title)} from saved items` : `Save ${escapeHtml(listing.title)} for later`}">${saved ? HEART_ICON_FILLED : HEART_ICON_OUTLINE}${saved ? "Saved" : "Save"}</button>
    </article>
  `;
}

function renderListings() {
  const grid = document.getElementById("listing-grid");
  const empty = document.getElementById("empty-state");
  const results = getFilteredListings();
  document.getElementById("result-count").textContent = `${results.length} ${countLabel(results.length, "browse.resultCountSingular", "browse.resultCountPlural")}`;
  document.getElementById("result-scope").textContent = activeScope;
  empty.hidden = results.length > 0;
  grid.innerHTML = results.map((listing) => listingCardTemplate(listing)).join("");
  renderSidebarLocation();
  const fairnessContainer = document.getElementById("fairness-section-container");
  if (fairnessContainer) fairnessContainer.innerHTML = fairnessSectionTemplate();
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

// BL-A04: localized display labels per category id -- `id` stays the
// canonical stored value (listing.category, categoryTaxonomy[].id) in every
// language; only the rendered text changes. Falls back to English for an
// unknown id/language rather than crashing.
const CATEGORY_LABELS = {
  Vehicles: { en: "Vehicles", sv: "Fordon", no: "Kjøretøy", da: "Køretøjer", fi: "Ajoneuvot", is: "Ökutæki" },
  "Real Estate": { en: "Real Estate", sv: "Bostäder", no: "Eiendom", da: "Bolig", fi: "Asunnot", is: "Fasteignir" },
  Electronics: { en: "Electronics", sv: "Elektronik", no: "Elektronikk", da: "Elektronik", fi: "Elektroniikka", is: "Rafeindatæki" },
  "Phones & Tablets": { en: "Phones & Tablets", sv: "Mobiler & Surfplattor", no: "Mobiler & Nettbrett", da: "Mobiler & Tablets", fi: "Puhelimet & Tabletit", is: "Símar & Spjaldtölvur" },
  "Home & Furniture": { en: "Home & Furniture", sv: "Hem & Möbler", no: "Hjem & Møbler", da: "Hjem & Møbler", fi: "Koti & Huonekalut", is: "Heimili & Húsgögn" },
  Fashion: { en: "Fashion", sv: "Mode", no: "Mote", da: "Mode", fi: "Muoti", is: "Tíska" },
  "Baby & Kids": { en: "Baby & Kids", sv: "Barn & Baby", no: "Barn & Baby", da: "Børn & Baby", fi: "Lapset & Vauvat", is: "Börn & Ungbörn" },
  "Sports & Outdoor": { en: "Sports & Outdoor", sv: "Sport & Fritid", no: "Sport & Friluft", da: "Sport & Fritid", fi: "Urheilu & Ulkoilu", is: "Íþróttir & Útivist" },
  Jobs: { en: "Jobs", sv: "Jobb", no: "Jobb", da: "Job", fi: "Työpaikat", is: "Atvinna" },
  Services: { en: "Services", sv: "Tjänster", no: "Tjenester", da: "Tjenester", fi: "Palvelut", is: "Þjónusta" },
  "Agriculture & Garden": { en: "Agriculture & Garden", sv: "Jordbruk & Trädgård", no: "Landbruk & Hage", da: "Landbrug & Have", fi: "Maatalous & Puutarha", is: "Landbúnaður & Garðyrkja" },
  "Free Items": { en: "Free Items", sv: "Gratis", no: "Gratis", da: "Gratis", fi: "Ilmaiset", is: "Ókeypis" }
};

function categoryLabel(id) {
  const entry = CATEGORY_LABELS[id];
  if (!entry) return id;
  return entry[currentLanguage] || entry.en;
}

// BL-A05: extra local-language search terms per category, layered on top of
// (not replacing) the existing normalize()-based substring search below --
// lets "bil"/"möbler" etc. surface listings whose own title/category/locality
// text never contains that word. Canonical category ids are the map keys;
// values are real local vocabulary, not machine transliterations.
const CATEGORY_SEARCH_SYNONYMS = {
  Vehicles: { sv: ["bil", "bilar", "fordon", "motorcykel", "mc", "husbil", "släp"], no: ["bil", "biler", "kjøretøy", "motorsykkel", "mc", "bobil", "tilhenger"], da: ["bil", "biler", "køretøj", "motorcykel", "mc", "autocamper", "trailer"], fi: ["auto", "autot", "ajoneuvo", "moottoripyörä", "mopo", "asuntoauto", "perävaunu"], is: ["bíll", "bílar", "ökutæki", "mótorhjól", "fellihýsi", "kerra"] },
  "Real Estate": { sv: ["bostad", "lägenhet", "hus", "villa", "hyra", "radhus"], no: ["bolig", "leilighet", "hus", "villa", "leie", "rekkehus"], da: ["bolig", "lejlighed", "hus", "villa", "leje", "rækkehus"], fi: ["asunto", "kerrostalo", "talo", "omakotitalo", "vuokra", "rivitalo"], is: ["íbúð", "hús", "einbýlishús", "leiga", "raðhús"] },
  Electronics: { sv: ["elektronik", "dator", "tv", "kamera", "hörlurar"], no: ["elektronikk", "data", "tv", "kamera", "hodetelefoner"], da: ["elektronik", "computer", "tv", "kamera", "hovedtelefoner"], fi: ["elektroniikka", "tietokone", "televisio", "kamera", "kuulokkeet"], is: ["rafeindatæki", "tölva", "sjónvarp", "myndavél", "heyrnartól"] },
  "Phones & Tablets": { sv: ["mobil", "telefon", "surfplatta", "iphone"], no: ["mobil", "telefon", "nettbrett", "iphone"], da: ["mobil", "telefon", "tablet", "iphone"], fi: ["puhelin", "kännykkä", "tabletti", "iphone"], is: ["sími", "farsími", "spjaldtölva", "iphone"] },
  "Home & Furniture": { sv: ["möbler", "soffa", "bord", "stol", "köksinredning"], no: ["møbler", "sofa", "bord", "stol", "kjøkken"], da: ["møbler", "sofa", "bord", "stol", "køkken"], fi: ["huonekalut", "sohva", "pöytä", "tuoli", "keittiö"], is: ["húsgögn", "sófi", "borð", "stóll", "eldhús"] },
  Fashion: { sv: ["kläder", "skor", "väska", "mode"], no: ["klær", "sko", "veske", "mote"], da: ["tøj", "sko", "taske", "mode"], fi: ["vaatteet", "kengät", "laukku", "muoti"], is: ["föt", "skór", "taska", "tíska"] },
  "Baby & Kids": { sv: ["barnvagn", "babykläder", "leksaker"], no: ["barnevogn", "babyklær", "leker"], da: ["barnevogn", "babytøj", "legetøj"], fi: ["lastenvaunut", "vauvanvaatteet", "lelut"], is: ["kerra", "barnaföt", "leikföng"] },
  "Sports & Outdoor": { sv: ["sport", "cykel", "skidor", "gym", "friluftsliv"], no: ["sport", "sykkel", "ski", "trening", "friluftsliv"], da: ["sport", "cykel", "ski", "træning", "friluftsliv"], fi: ["urheilu", "pyörä", "sukset", "kuntosali", "ulkoilu"], is: ["íþróttir", "hjól", "skíði", "útivist"] },
  Jobs: { sv: ["jobb", "arbete", "anställning", "lediga jobb"], no: ["jobb", "arbeid", "stilling", "ledige stillinger"], da: ["job", "arbejde", "stilling", "ledige stillinger"], fi: ["työ", "työpaikka", "työpaikat", "avoimet työpaikat"], is: ["vinna", "starf", "laus störf"] },
  Services: { sv: ["tjänst", "hantverkare", "flytthjälp", "städning"], no: ["tjeneste", "håndverker", "flyttehjelp", "rengjøring"], da: ["tjeneste", "håndværker", "flyttehjælp", "rengøring"], fi: ["palvelu", "remontti", "muuttoapu", "siivous"], is: ["þjónusta", "iðnaðarmaður", "þrif"] },
  "Agriculture & Garden": { sv: ["trädgård", "jordbruk", "traktor", "växter"], no: ["hage", "landbruk", "traktor", "planter"], da: ["have", "landbrug", "traktor", "planter"], fi: ["puutarha", "maatalous", "traktori", "kasvit"], is: ["garður", "landbúnaður", "traktor", "plöntur"] },
  "Free Items": { sv: ["gratis", "skänkes"], no: ["gratis", "gis bort"], da: ["gratis", "gives væk"], fi: ["ilmainen", "annetaan"], is: ["ókeypis", "gefins"] }
};

// Only an exact normalized-word match against a synonym counts (not a
// substring), so a short term like "bil" can't accidentally match inside an
// unrelated word -- see getFilteredListings() below for how this combines
// with the existing substring search.
function categorySynonymMatches(query) {
  if (!query) return [];
  return Object.keys(CATEGORY_SEARCH_SYNONYMS).filter((categoryId) => {
    const synonymsForCategory = Object.values(CATEGORY_SEARCH_SYNONYMS[categoryId]).flat();
    return synonymsForCategory.some((term) => normalize(term) === query);
  });
}

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
          <span>${categoryLabel(category.id)}</span>
        </button>
      `
    )
    .join("");
}

function renderCategoryChips() {
  const chips = [{ id: "All", label: t("filter.categoryAll"), featured: false }, ...categoryTaxonomy];
  document.getElementById("category-chips").innerHTML = chips
    .map(
      (category) =>
        `<button type="button" class="chip${category.id === activeCategory ? " active" : ""}${
          category.featured ? " featured" : ""
        }" data-category="${category.id}">${category.id === "All" ? category.label : categoryLabel(category.id)}</button>`
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
          <strong>${categoryLabel(category.id)}</strong>
          <span>${count} nearby</span>
        </button>
      `;
    })
    .join("");
  renderSidebarCategories();
}

function renderCategorySelectOptions() {
  const select = document.getElementById("sell-category-select");
  // BL-A04: rebuilding <option>s resets the real DOM's selection to the
  // first option unless explicitly restored -- preserves an in-progress
  // Sell form category pick across a language switch, matching the filter
  // select's existing same protection below.
  const previousValue = select.value;
  select.innerHTML = categoryTaxonomy
    .map((category) => `<option value="${category.id}">${categoryLabel(category.id)}</option>`)
    .join("");
  if (previousValue) select.value = previousValue;
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
  // Every view switch is a real "new page" -- without this, opening any
  // page (a footer link's static page most visibly, since reaching it means
  // having scrolled all the way to the bottom of Browse first) kept
  // whatever scroll position the PREVIOUS page happened to be at, so a
  // freshly-opened page could open already scrolled past its own title,
  // straight into the footer -- the opposite of feeling like a real,
  // independent page.
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") window.scrollTo(0, 0);
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
    <div class="detail-gallery" style="background: ${images[index].css}" role="img" aria-label="${t("detail.photoLabel")} ${index + 1}: ${escapeHtml(listing.title)}">
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

function ratingStars(rating) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function reviewCountLabel(count) {
  return countLabel(count, "profile.reviewSingular", "profile.reviewPlural");
}

function ratingSummaryText(summary) {
  if (!summary || !summary.count) return t("profile.ratingEmpty");
  return `${ratingStars(summary.average)} ${summary.average.toFixed(1)} · ${summary.count} ${reviewCountLabel(summary.count)}`;
}

function compactSellerRatingTemplate(summary) {
  if (!summary || !summary.count) return `<span class="seller-rating-summary empty">${t("review.sellerSummaryEmpty")}</span>`;
  return `<span class="seller-rating-summary" aria-label="${summary.average.toFixed(1)} out of 5 from ${summary.count} ${reviewCountLabel(summary.count)}">${ratingStars(summary.average)} ${summary.average.toFixed(1)} (${summary.count})</span>`;
}

// The rating/text inputs are never disabled for a guest -- they can fill
// the form freely, and clicking submit gates through requireAuth exactly
// like Save/Message/Report already do, resuming with the SAME values the
// guest actually typed once they sign in. Disabling the inputs up front
// would silently throw away whatever they wrote the moment the auth modal
// opened, which is worse UX than every other gated action in this app.
function reviewFormTemplate(listing) {
  if (!listing.sellerId) return "";
  if (currentUser && currentUser.id === listing.sellerId) return `<p class="review-hint">${t("review.notForSelf")}</p>`;
  const hint = currentUser ? "" : `<p class="review-hint">${t("review.signInHint")}</p>`;
  return `
    <section class="review-box" aria-labelledby="review-title-${listing.id}">
      <h3 id="review-title-${listing.id}">${t("review.leaveTitle")}</h3>
      ${hint}
      <label class="field-label" for="review-rating-${listing.id}">${t("review.ratingLabel")}</label>
      <select id="review-rating-${listing.id}" class="review-rating-select">
        <option value="5">5 ★</option>
        <option value="4">4 ★</option>
        <option value="3">3 ★</option>
        <option value="2">2 ★</option>
        <option value="1">1 ★</option>
      </select>
      <label class="field-label" for="review-text-${listing.id}">${t("review.textLabel")}</label>
      <textarea id="review-text-${listing.id}" class="review-text-input" maxlength="240" placeholder="${t("review.textPlaceholder")}"></textarea>
      <button type="button" class="account-action review-submit" data-submit-review="${listing.id}">${t("review.submit")}</button>
    </section>
  `;
}

async function submitReview(listingId, rating, text) {
  const listing = listings.find((item) => item.id === listingId);
  if (!listing || !listing.sellerId) return null;
  if (currentUser && currentUser.id === listing.sellerId) {
    showToast(t("review.notForSelf"));
    return null;
  }
  return requireAuth(async () => {
    try {
      const review = await DataService.reviews.create({
        listingId,
        revieweeId: listing.sellerId,
        rating: Number(rating),
        text: text || ""
      });
      await refreshListingsCache();
      openListing(listingId);
      // A first offense still posts (with the abusive words already
      // removed server-side) but must visibly warn the writer -- silently
      // cleaning it with no feedback would teach nothing.
      showToast(t(review.moderated ? "review.warningModerated" : "review.posted"));
      return review;
    } catch (error) {
      const key =
        error.code === "REVIEW_BANNED_NOW" ? "review.bannedNow" : error.code === "REVIEW_BANNED" ? "review.banned" : error.code === "DUPLICATE_REVIEW" ? "review.duplicate" : null;
      showToast(key ? t(key) : error.message || t("review.failed"));
      return null;
    }
  });
}

function handleReviewSubmitClick(listingId) {
  const ratingInput = document.getElementById(`review-rating-${listingId}`);
  const textInput = document.getElementById(`review-text-${listingId}`);
  return submitReview(listingId, ratingInput ? ratingInput.value : 5, textInput ? textInput.value : "");
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
  // NM-A22 re-audit finding: nothing ever stopped a seller from messaging
  // themselves about their own listing (the server-side dedup fix in
  // NM-A20 only stopped it from crashing, not from being offered at all).
  // Real marketplaces never show this CTA on your own listing -- the same
  // "you cannot review yourself" treatment reviewFormTemplate already
  // applies is extended here, just as a hidden control rather than a
  // message, since a persistent empty CTA bar would be a worse UX than no
  // bar at all.
  const isOwnListing = Boolean(currentUser && listing.sellerId && listing.sellerId === currentUser.id);
  const ctaBar = isOwnListing
    ? ""
    : `
    <div class="cta-bar">
      <button type="button" id="message-seller" aria-label="Message ${escapeHtml(listing.seller)} about ${escapeHtml(listing.title)}">Message seller</button>
    </div>
  `;
  document.getElementById("listing-detail").innerHTML = `
    <div id="detail-gallery-wrap">${galleryTemplate(listing, 0)}</div>
    <section class="detail-main">
      <p class="eyebrow">${escapeHtml(listing.locality)} · ${listing.distance} · ${formatRelativeTime(listing.postedAt)}</p>
      <h2 id="detail-title">${escapeHtml(listing.title)}</h2>
      ${listing.status && listing.status !== "active" ? `<span class="status-badge status-${listing.status}">${t(`status.${listing.status}`)}</span>` : ""}
      <strong class="detail-price">${formatListingPrice(listing)}</strong>
      <p class="detail-meta">${listing.condition} · ${listing.category}${listing.subtype ? " · " + listing.subtype : ""}</p>
      <div class="detail-actions">
        <button type="button" class="secondary-action${saved ? " saved" : ""}" data-save-listing="${listing.id}" aria-pressed="${saved}" aria-label="${saved ? `Remove ${escapeHtml(listing.title)} from saved items` : `Save ${escapeHtml(listing.title)} for later`}">${saved ? HEART_ICON_FILLED : HEART_ICON_OUTLINE}${saved ? "Saved" : "Save"}</button>
        <button type="button" class="secondary-action" data-share-listing="${listing.id}" aria-label="Share ${escapeHtml(listing.title)}">${SHARE_ICON}Share</button>
        <button type="button" class="secondary-action" data-report-listing="${listing.id}" aria-label="Report ${escapeHtml(listing.title)}">${FLAG_ICON}Report</button>
      </div>
      ${isOwnListing ? "" : `<button type="button" class="opener" id="suggested-opener">Hi, is this still available?</button>`}
      <p>${escapeHtml(listing.description)}</p>
      <dl class="attributes">
        <div><dt>Seller type</dt><dd>${escapeHtml(listing.sellerType)}</dd></div>
        <div><dt>Pickup area</dt><dd>${escapeHtml(listing.locality)}</dd></div>
        <div><dt>Currency</dt><dd>${listing.currency || CURRENCY_BY_COUNTRY[listing.country] || "SEK"}</dd></div>
      </dl>
      <section class="trust-box">
        <h3>${listing.sellerId ? `<button type="button" class="seller-name-link" data-open-profile="${listing.sellerId}">${escapeHtml(listing.seller)}</button>` : escapeHtml(listing.seller)}</h3>
        ${compactSellerRatingTemplate(listing.sellerRating)}
        ${
          // A real seller's `trust` field is always the same hardcoded
          // "New seller · Published just now" flavor text from the moment
          // they publish (see commitPublish) -- it never updates and, now
          // that real trust signals exist (rating, verification, a real
          // profile), showing it alongside them is stale/duplicate
          // information, not complementary. Seed listings have no real
          // account behind them at all, so their own (real, varied) trust
          // copy is still the only signal available and stays shown.
          listing.sellerId ? "" : `<p>${escapeHtml(listing.trust)}</p>`
        }
      </section>
      ${reviewFormTemplate(listing)}
      <section class="safety-box">
        <h3>${t("safety.title")}</h3>
        <p>${t("safety.body")}</p>
        <button type="button" class="link-button" data-static-page="safetyTips">${t("safety.readMore")}</button>
      </section>
    </section>
    <aside class="similar-items">
      <h3>Similar nearby items</h3>
      <div>${listings.filter((item) => item.category === listing.category && item.id !== listing.id).slice(0, 2).map((item) => `<button type="button" data-open-listing="${item.id}">${escapeHtml(item.title)} · ${formatListingPrice(item)}</button>`).join("")}</div>
    </aside>
    ${ctaBar}
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

// NM-A19: a real, LIVE relative-time string ("today", "yesterday", "3 days
// ago") computed from the listing's actual postedAt timestamp every time
// it's rendered, in the viewer's own active language -- replacing the old
// `posted` field, which was a plain English string frozen at whatever it
// said the moment the listing was created (a seed listing's "Yesterday"
// stayed "Yesterday" forever, even a year later; a Swedish-language viewer
// saw literal English). Intl.RelativeTimeFormat also picks the grammatically
// correct plural form per locale automatically (e.g. Swedish "3 dagar sedan"
// vs "1 dag sedan"), satisfying "proper plural rules" for this string too.
function formatRelativeTime(postedAtMs) {
  if (!postedAtMs) return "";
  const locale = GOOGLE_LOCALE_BY_LANGUAGE[currentLanguage] || "en";
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffSeconds = Math.round((Date.now() - postedAtMs) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffSeconds < 60) return rtf.format(0, "second");
  if (diffMinutes < 60) return rtf.format(-diffMinutes, "minute");
  if (diffHours < 24) return rtf.format(-diffHours, "hour");
  if (diffDays < 7) return rtf.format(-diffDays, "day");
  if (diffDays < 30) return rtf.format(-Math.round(diffDays / 7), "week");
  // Beyond about a month, an ever-growing "N days ago" stops being useful --
  // a real localized date (the same approach formatMemberSince already
  // takes) is clearer than either a huge day count or a vague "long ago".
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(postedAtMs));
}

// NM-A19: one shared, correct plural mechanism (Intl.PluralRules' real CLDR
// categories, not a hand-rolled `=== 1` check) for every count-driven string
// in the app -- the result count, profile listing/review counts, and any
// future one -- so they can never drift into inconsistent pluralization
// rules from each being implemented separately.
function pluralCategory(count, locale) {
  try {
    return new Intl.PluralRules(locale).select(count);
  } catch (error) {
    return count === 1 ? "one" : "other";
  }
}

function countLabel(count, oneKey, otherKey) {
  const locale = GOOGLE_LOCALE_BY_LANGUAGE[currentLanguage] || "en";
  return pluralCategory(count, locale) === "one" ? t(oneKey) : t(otherKey);
}

// One review item in the profile's "Recent reviews" list -- reuses
// ratingStars() (NM-A17) exactly as the compact per-listing seller summary
// already does, so a profile's own rating display never drifts out of sync
// with how the same rating renders on a listing detail page.
function profileReviewItemTemplate(review) {
  return `
    <li class="profile-review-item">
      <p class="profile-review-meta"><span class="profile-review-stars" aria-hidden="true">${ratingStars(review.rating)}</span> <strong>${escapeHtml(review.reviewerName)}</strong>${review.listingTitle ? ` · ${escapeHtml(review.listingTitle)}` : ""}</p>
      ${review.text ? `<p class="profile-review-text">${escapeHtml(review.text)}</p>` : ""}
    </li>
  `;
}

function sellerProfileTemplate(profile) {
  const badge = profile.verified
    ? `<span class="verified-badge">${t("profile.verifiedBadge")}</span>`
    : `<span class="verified-badge unverified">${t("profile.unverifiedBadge")}</span>`;
  const listingsCountLabel = countLabel(profile.activeListingCount, "profile.activeListingSingular", "profile.activeListingsPlural");
  const listingsHtml =
    profile.listings.length > 0
      ? `<div class="listing-grid">${profile.listings.map((listing) => listingCardTemplate(listing)).join("")}</div>`
      : `<p class="profile-empty">${t("profile.noActiveListings")}</p>`;
  // profile.rating/profile.reviews come from the same NM-A17 rating
  // machinery every listing detail page's compact seller summary already
  // uses (ratingSummaryForUser/recentReviewsForUser server-side) -- this is
  // real data flowing through, not a stub, even though NM-A16 itself never
  // implements the reviewing UI (that's the listing detail page's job).
  const reviewsHtml =
    profile.reviews && profile.reviews.length > 0
      ? `<ul class="profile-reviews-list">${profile.reviews.map((review) => profileReviewItemTemplate(review)).join("")}</ul>`
      : `<p class="profile-empty">${t("profile.noReviews")}</p>`;

  // NM-A20: Report/Block are only ever shown on someone ELSE's profile --
  // reporting or blocking yourself is meaningless and the server rejects it
  // anyway (defense in depth, same as self-review being blocked in NM-A17).
  const isOwnProfile = Boolean(currentUser && profile.id === currentUser.id);
  const isBlocked = blockedUserIds.has(profile.id);
  const trustActions = isOwnProfile
    ? ""
    : `
      <div class="profile-trust-actions">
        <button type="button" class="secondary-action" data-report-user="${profile.id}">${FLAG_ICON}${t("report.reportUser")}</button>
        <button type="button" class="secondary-action${isBlocked ? " blocked" : ""}" data-block-user="${profile.id}">${t(isBlocked ? "block.unblockAction" : "block.blockAction")}</button>
      </div>
    `;

  return `
    <header class="profile-header">
      <div class="profile-avatar">${escapeHtml((profile.name || "?").charAt(0).toUpperCase())}</div>
      <div>
        <h2 id="profile-title">${escapeHtml(profile.name)}${badge}</h2>
        <p class="profile-meta">${t("profile.memberSince")} ${formatMemberSince(profile.memberSince)} · ${profile.activeListingCount} ${listingsCountLabel}</p>
        <p class="profile-meta">${ratingSummaryText(profile.rating)}</p>
      </div>
    </header>
    ${trustActions}
    <h3 class="profile-listings-title">${t("profile.listingsTitle")}</h3>
    ${listingsHtml}
    <h3 class="profile-listings-title">${t("profile.reviewsTitle")}</h3>
    ${reviewsHtml}
  `;
}

// A guest can open any real seller's public profile with no gate at all
// (NM-A16 requirement 6) -- unlike Save/Message/Report/Publish, viewing a
// profile touches no account-specific data.
async function openSellerProfile(sellerId) {
  currentProfileSellerId = sellerId;
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

// NM-A19: `price` is now stored as a plain numeric string (or the "Free"
// sentinel) -- just the raw digits a seller typed, with no currency
// formatting baked in. It used to also embed a hardcoded " kr" suffix
// (Sweden-only, wrong for a Finnish listing's real €), which is exactly the
// bug this slice fixes: a stored value must never assume one specific
// currency. Every DISPLAY site now goes through formatListingPrice() below,
// which knows the listing's own real currency; storage and display are two
// separate, correctly-separated concerns.
function formatPrice(rawPrice) {
  return String(rawPrice || "").replace(/[^0-9]/g, "");
}

// The one place a stored price (plus a listing's own country) becomes a
// real, locale-correct display string -- Intl.NumberFormat handles
// spacing/separator/symbol-placement conventions per currency natively
// (e.g. "1 200 kr" for Sweden, "1.200 kr." for Denmark, "1 200 €" for
// Finland), so nothing here hardcodes a symbol or a separator.
function currencyFormatterForCountry(country) {
  const locale = LOCALE_BY_COUNTRY[country] || LOCALE_BY_COUNTRY.Sweden;
  const currency = CURRENCY_BY_COUNTRY[country] || CURRENCY_BY_COUNTRY.Sweden;
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// A currency's own real display unit ("kr", "kr.", "€") pulled straight out
// of Intl's own formatting, never hand-typed -- so the Filter sheet's price
// range chip (which shows one bound-to-bound range, not two separately
// currency-formatted amounts) can append the correct real unit once instead
// of repeating full currency formatting on both numbers.
function currencyUnitLabel(country) {
  const parts = currencyFormatterForCountry(country).formatToParts(0);
  const currencyPart = parts.find((part) => part.type === "currency");
  return currencyPart ? currencyPart.value : CURRENCY_BY_COUNTRY[country] || CURRENCY_BY_COUNTRY.Sweden;
}

function formatPlainNumber(amount, country) {
  const locale = LOCALE_BY_COUNTRY[country] || LOCALE_BY_COUNTRY.Sweden;
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

// Real Estate/"For Rent" is the one existing listing type that's priced
// recurring (per month) rather than one-time -- derived from the listing's
// own category/subtype (already on every record) rather than a separate
// stored flag, the same "derive, don't duplicate" approach NM-A18 used for
// `sponsored`.
function isMonthlyRental(listing) {
  return listing.category === "Real Estate" && listing.subtype === "For Rent";
}

function formatListingPrice(listing) {
  if (!listing) return "";
  if (listing.price === "Free") return t("price.free");
  // The Sell form's live preview renders a not-yet-submitted draft, which
  // can have no price typed yet at all -- shown as a real, translated
  // placeholder rather than running an empty value through currency
  // formatting (which would otherwise render a misleading "0 kr").
  if (!listing.price) return t("price.placeholder");
  const amount = parsePriceValue(listing.price);
  const formatted = currencyFormatterForCountry(listing.country).format(amount);
  return isMonthlyRental(listing) ? `${formatted}${t("price.perMonthSuffix")}` : formatted;
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
    price: values.isFree ? "Free" : formatPrice(values.rawPrice),
    // BL-A06: the preview reflects the seller's real, SAVED home location
    // (Settings), the same field commitPublishRequest() itself stamps a new
    // listing with below -- deliberately NOT activeCountry (transient browse
    // scope), so idly browsing another country's listings can never change
    // what currency a new listing's live preview -- or the real saved
    // listing -- shows.
    country: homeCountry,
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

async function commitPublishRequest(values, images) {
  return await DataService.listings.create({
    title: values.title,
    category: values.category,
    subtype: values.subtype,
    price: values.isFree ? "Free" : formatPrice(values.rawPrice),
    locality: values.location,
    region: values.region,
    // BL-A06 (supersedes the old NM-A19 behavior of stamping activeCountry
    // here): a listing's country (and therefore currency) is fixed to the
    // seller's real, explicitly SAVED home location (see Settings /
    // saveSettings()), never to activeCountry -- which is only ever the
    // transient country the seller happens to be BROWSING right now (via
    // geolocation or a footer flag click). Browsing Norway's listings must
    // never silently file a Swedish seller's new listing under Norway/NOK.
    // The server independently validates this against the 5 real countries
    // and ignores it entirely on any later edit (see LISTING_UPDATE_COLUMNS
    // in scripts/api.js) -- a listing never silently changes currency after
    // publish just because the seller's home location later changes.
    country: homeCountry,
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
}

async function commitPublish(values) {
  const images = photosToImageObjects(values.photos);
  const validation = document.getElementById("sell-validation");
  let record;
  try {
    record = await commitPublishRequest(values, images);
  } catch (error) {
    // NM-A24: publishing had NO error handling at all before this slice --
    // any server rejection (now including a real per-account rate limit)
    // became a silent unhandled promise rejection, with nothing shown to
    // the user. Mirrors the same inline validation-message slot the
    // client-side checks above already use, rather than a toast, since
    // that's this exact form's own existing error-surfacing convention.
    validation.classList.remove("success");
    validation.textContent = error.code === "RATE_LIMITED" ? formatRetryMinutesMessage("rateLimit.listings", error.retryAfter) : error.message || t("sell.publishFailed");
    return null;
  }

  await refreshListingsCache();
  renderCategories();
  renderCategoryChips();
  renderListings();
  renderMyListings();
  validation.classList.add("success");
  validation.textContent = "Listing published. Opening your listing...";
  resetSellForm();
  // NM-A25: this IS a real navigation (Sell -> the new listing's own detail
  // page) with the exact same "opening a listing" semantics as tapping it
  // from Browse, so it goes through the same real-URL wrapper -- sharing or
  // reloading right after publishing must land back on this exact listing.
  navigateToListing(record.id);
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

  await refreshListingsCache();
  renderCategories();
  renderCategoryChips();
  renderListings();
  renderMyListings();
  const validation = document.getElementById("sell-validation");
  validation.classList.add("success");
  validation.textContent = t("myListings.editSaved");
  resetSellForm();
  // NM-A25: same reasoning as commitPublish above -- landing back on the
  // edited listing's own detail page is a real navigation into it.
  navigateToListing(editedId);
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
  document.getElementById("auth-forgot-link").addEventListener("click", () => {
    closeAuthModal();
    openForgotPasswordModal();
  });
  document.getElementById("login-forgot-link").addEventListener("click", openForgotPasswordModal);
  document.getElementById("forgot-password-modal-close").addEventListener("click", closeForgotPasswordModal);
  document.getElementById("forgot-password-form").addEventListener("submit", handleForgotPasswordSubmit);
  document.getElementById("reset-password-modal-close").addEventListener("click", closeResetPasswordModal);
  document.getElementById("reset-password-form").addEventListener("submit", handleResetPasswordSubmit);
  document.getElementById("compose-modal-close").addEventListener("click", closeComposeModal);
  document.getElementById("compose-cancel-button").addEventListener("click", closeComposeModal);
  document.getElementById("compose-send-button").addEventListener("click", sendComposedMessage);
  document.getElementById("report-modal-close").addEventListener("click", closeReportModal);
  document.getElementById("report-cancel-button").addEventListener("click", closeReportModal);
  document.getElementById("report-submit-button").addEventListener("click", submitReportModal);
  document.getElementById("settings-save-button").addEventListener("click", saveSettings);
  document.getElementById("settings-home-country-select").addEventListener("change", handleSettingsHomeCountryChange);

  document.getElementById("filter-button").addEventListener("click", openFilterSheet);
  document.getElementById("cookie-accept-button").addEventListener("click", dismissCookieBanner);
  document.getElementById("cookie-settings-button").addEventListener("click", handleCookieSettingsClick);
  document.getElementById("filter-sheet-close").addEventListener("click", closeFilterSheet);
  document.getElementById("boost-sheet-close").addEventListener("click", closeBoostSheet);
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
    const reportUserButton = event.target.closest("[data-report-user]");
    const blockUserButton = event.target.closest("[data-block-user]");
    const adminReportStatusButton = event.target.closest("[data-admin-report-status]");
    const adminToggleHideListingButton = event.target.closest("[data-admin-toggle-hide-listing]");
    const adminToggleFlagUserButton = event.target.closest("[data-admin-toggle-flag-user]");
    const shareButton = event.target.closest("[data-share-listing]");
    const openProfileButton = event.target.closest("[data-open-profile]");
    const submitReviewButton = event.target.closest("[data-submit-review]");
    const staticPageButton = event.target.closest("[data-static-page]");
    const browseCountryButton = event.target.closest("[data-browse-country]");
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
    const openBoostSheetButton = event.target.closest("[data-open-boost-sheet]");
    const activateBoostButton = event.target.closest("[data-activate-boost]");
    const cancelBoostButton = event.target.closest("#boost-cancel-button");
    const logoutButton = event.target.closest("[data-logout]");
    const editListingButton = event.target.closest("[data-edit-listing]");
    const deleteListingButton = event.target.closest("[data-delete-listing]");

    if (listingButton) navigateToListing(listingButton.dataset.openListing);
    if (chipScrollButton) scrollCategoryChips(Number(chipScrollButton.dataset.chipScroll));
    if (chip) {
      activeCategory = chip.dataset.category;
      activeFilters.subtype = "";
      renderCategoryChips();
      renderActiveFilterChips();
      renderListings();
    }
    if (scope) {
      setActiveScope(scope.dataset.scope);
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
      if (nav.dataset.view === "settings-view") renderSettings();
      if (nav.dataset.view === "admin-view") openAdminQueue();
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
    if (reportButton) handleReportListingClick(reportButton.dataset.reportListing);
    if (reportUserButton) handleReportUserClick(reportUserButton.dataset.reportUser);
    if (blockUserButton) toggleBlockUser(blockUserButton.dataset.blockUser);
    if (adminReportStatusButton) handleAdminReportStatusClick(adminReportStatusButton.dataset.adminReportStatus, adminReportStatusButton.dataset.status);
    if (adminToggleHideListingButton) {
      handleAdminToggleHideListingClick(adminToggleHideListingButton.dataset.adminToggleHideListing, adminToggleHideListingButton.dataset.hidden === "1");
    }
    if (adminToggleFlagUserButton) {
      handleAdminToggleFlagUserClick(adminToggleFlagUserButton.dataset.adminToggleFlagUser, adminToggleFlagUserButton.dataset.flagged === "1");
    }
    if (shareButton) handleShareClick(shareButton.dataset.shareListing);
    if (openProfileButton) navigateToProfile(openProfileButton.dataset.openProfile);
    if (submitReviewButton) handleReviewSubmitClick(submitReviewButton.dataset.submitReview);
    if (staticPageButton) navigateToStaticPage(staticPageButton.dataset.staticPage);
    if (browseCountryButton) handleFooterCountryClick(browseCountryButton.dataset.browseCountry);
    if (messageButton) handleMessageClick(currentDetailListingId);
    if (signOutButton) signOutUser();
    if (filterChip) toggleFilterChip(filterChip.dataset.filterGroup, filterChip.dataset.filterValue);
    if (removeFilterChip) removeActiveFilter(removeFilterChip.dataset.removeFilter);
    if (openBoostSheetButton) openBoostSheet(openBoostSheetButton.dataset.openBoostSheet);
    if (activateBoostButton) activateBoostPackage(activateBoostButton.dataset.activateBoost);
    if (cancelBoostButton) cancelActiveBoost();
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

// --- Site footer, static content pages, and cookie notice ---
// Structured after the afromarketplaces.com reference the user provided
// (brand+CTAs column, multi-column link groups, a browse-by-country strip,
// a legal bottom bar) but built on FindNord's own brand and real features --
// every footer link either reuses an existing view/action (Post a Listing,
// category jumps, Browse all) or opens a real, genuinely-written static
// page, never a dead "#" link.
//
// Deliberate i18n scope decision: the footer's own chrome (column headers,
// CTA buttons, tagline, copyright, cookie banner) is fully translated en/sv
// like everything else in this app. The LONG-FORM static page content
// itself (Privacy Policy, Terms, DSR, Cookie Policy, guides, etc.) is
// English-only for this pass -- fabricating Swedish legal-document
// translations would risk being actively misleading in a way a missing UI
// label never is. Documented here and in EVIDENCE.md, not silently done.

const COMPANY_LINE_BY_LANG = {
  en: "FindNord is a marketplace operated as a branch of Micany Investment.",
  sv: "FindNord är en marknadsplats som drivs som en filial till Micany Investment.",
  no: "FindNord er en markedsplass som drives som en filial av Micany Investment.",
  da: "FindNord er en markedsplads, der drives som en filial af Micany Investment.",
  fi: "FindNord on markkinapaikka, jota ylläpitää Micany Investmentin sivuliike.",
  is: "FindNord er markaðstorg sem er rekið sem útibú frá Micany Investment."
};

const STATIC_PAGES = {
  about: {
    en: { title: "About FindNord", body: `
  <p>FindNord is the marketplace for the Scandinavians -- a place to buy, sell, and discover nearby items, vehicles, real estate, and more across Sweden, Norway, Denmark, Finland, and Iceland.</p>
  <p>${COMPANY_LINE_BY_LANG.en} We built FindNord around a simple idea: local, trustworthy trade shouldn't require a middleman -- just a clear, honest place for buyers and sellers to find each other.</p>
`},
    sv: { title: "Om FindNord", body: `
  <p>FindNord är marknadsplatsen för skandinaver -- en plats för att köpa, sälja och upptäcka annonser, fordon, bostäder med mera i närheten, i hela Sverige, Norge, Danmark, Finland och Island.</p>
  <p>${COMPANY_LINE_BY_LANG.sv} Vi byggde FindNord kring en enkel idé: lokal, pålitlig handel ska inte kräva en mellanhand -- bara en tydlig, ärlig plats där köpare och säljare kan hitta varandra.</p>
`},
    no: { title: "Om FindNord", body: `
  <p>FindNord er markedsplassen for skandinaver -- et sted for å kjøpe, selge og oppdage annonser, kjøretøy, eiendom og mer i nærheten, i hele Sverige, Norge, Danmark, Finland og Island.</p>
  <p>${COMPANY_LINE_BY_LANG.no} Vi bygde FindNord rundt en enkel idé: lokal, pålitelig handel skal ikke kreve en mellommann -- bare et tydelig, ærlig sted der selgere og kjøpere kan finne hverandre.</p>
`},
    da: { title: "Om FindNord", body: `
  <p>FindNord er markedspladsen for skandinaver -- et sted til at købe, sælge og opdage annoncer, køretøjer, boliger og meget mere i nærheden, i hele Sverige, Norge, Danmark, Finland og Island.</p>
  <p>${COMPANY_LINE_BY_LANG.da} Vi byggede FindNord omkring en enkel idé: lokal, troværdig handel bør ikke kræve en mellemmand -- kun et tydeligt, ærligt sted, hvor købere og sælgere kan finde hinanden.</p>
`},
    fi: { title: "Tietoa FindNordista", body: `
  <p>FindNord on skandinaavien markkinapaikka -- paikka, jossa voit ostaa, myydä ja löytää lähellä olevia ilmoituksia, ajoneuvoja, asuntoja ja paljon muuta kaikkialla Ruotsissa, Norjassa, Tanskassa, Suomessa ja Islannissa.</p>
  <p>${COMPANY_LINE_BY_LANG.fi} Rakensimme FindNordin yksinkertaisen ajatuksen ympärille: paikallisen, luotettavan kaupankäynnin ei pitäisi vaatia välikättä -- vain selkeä, rehellinen paikka, jossa ostajat ja myyjät löytävät toisensa.</p>
`},
    is: { title: "Um FindNord", body: `
  <p>FindNord er markaðstorg fyrir Norðurlandabúa -- staður til að kaupa, selja og uppgötva auglýsingar, ökutæki, fasteignir og fleira í nágrenninu, um allt Svíþjóð, Noreg, Danmörku, Finnland og Ísland.</p>
  <p>${COMPANY_LINE_BY_LANG.is} Við byggðum FindNord á einfaldri hugmynd: staðbundin, áreiðanleg viðskipti ættu ekki að krefjast milliliðs -- aðeins skýran, heiðarlegan stað þar sem kaupendur og seljendur geta fundið hvor annan.</p>
`}
  },
  howItWorks: {
    en: { title: "How It Works", body: `
  <p><strong>Browsing:</strong> Anyone can browse listings, view seller profiles, and check ratings without an account.</p>
  <p><strong>Selling:</strong> Sign in, tap "Post a Listing," add photos, a price, and a description -- your listing goes live immediately.</p>
  <p><strong>Buying:</strong> Message a seller directly from any listing, or save items to review later. Deals are arranged and completed directly between buyer and seller -- FindNord does not process payments or hold funds in escrow.</p>
  <p><strong>Trust:</strong> Every seller has a public profile showing how long they've been a member, their real rating from past buyers, and a simple verification signal.</p>
`},
    sv: { title: "Så fungerar det", body: `
  <p><strong>Bläddra:</strong> Vem som helst kan bläddra bland annonser, se säljarprofiler och kolla betyg utan konto.</p>
  <p><strong>Sälja:</strong> Logga in, tryck på "Publicera en annons", lägg till foton, ett pris och en beskrivning -- din annons publiceras direkt.</p>
  <p><strong>Köpa:</strong> Meddela en säljare direkt från valfri annons, eller spara annonser för att titta på senare. Affärer arrangeras och slutförs direkt mellan köpare och säljare -- FindNord hanterar inte betalningar och håller inte inne pengar i deposition.</p>
  <p><strong>Förtroende:</strong> Varje säljare har en offentlig profil som visar hur länge de har varit medlem, deras verkliga betyg från tidigare köpare och en enkel verifieringssignal.</p>
`},
    no: { title: "Slik fungerer det", body: `
  <p><strong>Bla gjennom:</strong> Hvem som helst kan bla gjennom annonser, se selgerprofiler og sjekke vurderinger uten konto.</p>
  <p><strong>Selge:</strong> Logg inn, trykk på «Legg ut en annonse», legg til bilder, en pris og en beskrivelse -- annonsen din publiseres umiddelbart.</p>
  <p><strong>Kjøpe:</strong> Send en melding direkte til en selger fra en hvilken som helst annonse, eller lagre annonser for å se på senere. Avtaler ordnes og fullføres direkte mellom kjøper og selger -- FindNord behandler ikke betalinger og holder ikke tilbake penger i depot.</p>
  <p><strong>Tillit:</strong> Hver selger har en offentlig profil som viser hvor lenge de har vært medlem, deres reelle vurdering fra tidligere kjøpere, og et enkelt verifiseringssignal.</p>
`},
    da: { title: "Sådan fungerer det", body: `
  <p><strong>Gennemse:</strong> Alle kan gennemse annoncer, se sælgerprofiler og tjekke bedømmelser uden en konto.</p>
  <p><strong>Sælge:</strong> Log ind, tryk på "Opret en annonce", tilføj billeder, en pris og en beskrivelse -- din annonce offentliggøres med det samme.</p>
  <p><strong>Købe:</strong> Send en besked direkte til en sælger fra en hvilken som helst annonce, eller gem varer for at se dem senere. Handler aftales og gennemføres direkte mellem køber og sælger -- FindNord behandler ikke betalinger og opbevarer ikke penge i deponering.</p>
  <p><strong>Tillid:</strong> Hver sælger har en offentlig profil, der viser, hvor længe de har været medlem, deres reelle bedømmelse fra tidligere købere og et enkelt verifikationssignal.</p>
`},
    fi: { title: "Näin se toimii", body: `
  <p><strong>Selaaminen:</strong> Kuka tahansa voi selata ilmoituksia, katsoa myyjien profiileja ja tarkistaa arvioita ilman tiliä.</p>
  <p><strong>Myyminen:</strong> Kirjaudu sisään, napauta "Julkaise ilmoitus", lisää kuvat, hinta ja kuvaus -- ilmoituksesi julkaistaan välittömästi.</p>
  <p><strong>Ostaminen:</strong> Lähetä viesti myyjälle suoraan mistä tahansa ilmoituksesta tai tallenna kohteita katsottavaksi myöhemmin. Kaupat sovitaan ja toteutetaan suoraan ostajan ja myyjän välillä -- FindNord ei käsittele maksuja eikä säilytä varoja lukkotilillä.</p>
  <p><strong>Luottamus:</strong> Jokaisella myyjällä on julkinen profiili, joka näyttää, kuinka kauan hän on ollut jäsen, hänen todellisen arvionsa aiemmilta ostajilta sekä yksinkertaisen vahvistusmerkinnän.</p>
`},
    is: { title: "Svona virkar það", body: `
  <p><strong>Skoða auglýsingar:</strong> Hver sem er getur skoðað auglýsingar, séð upplýsingar um seljendur og skoðað einkunnir án aðgangs.</p>
  <p><strong>Selja:</strong> Skráðu þig inn, ýttu á „Setja inn auglýsingu“, bættu við myndum, verði og lýsingu -- auglýsingin þín birtist samstundis.</p>
  <p><strong>Kaupa:</strong> Sendu seljanda skilaboð beint úr hvaða auglýsingu sem er, eða vistaðu hluti til að skoða síðar. Viðskipti eru ákveðin og kláruð beint milli kaupanda og seljanda -- FindNord annast ekki greiðslur né varðveitir fé í vörslu.</p>
  <p><strong>Traust:</strong> Hver seljandi er með opinberan prófíl sem sýnir hversu lengi hann hefur verið meðlimur, raunverulega einkunn frá fyrri kaupendum og einfalt staðfestingarmerki.</p>
`}
  },
  safetyTips: {
    en: { title: "Safety Tips", body: `
  <p>Most trades on FindNord go smoothly, and a little care goes a long way. A few habits worth keeping:</p>
  <ul>
    <li>Meet in a public place for in-person exchanges, and bring a friend if possible.</li>
    <li>Never send payment before seeing an item in person, and be wary of anyone pressuring you to act quickly.</li>
    <li>Keep your exact home address private -- agree on a public meeting point instead.</li>
    <li>Check a seller's public profile, member-since date, and rating before committing to a deal.</li>
    <li>Report anything that breaks our rules using the Report button on a listing or profile -- pick the reason that fits and add any details that would help us review it.</li>
    <li>If someone makes you uncomfortable, you don't need their cooperation to stop hearing from them: block them from their profile or from your conversation, and their listings and messages disappear from your view immediately.</li>
  </ul>
  <p>None of this needs to feel dramatic. FindNord doesn't process payments or hold funds -- you and the other person always arrange the details directly, on your own terms, and these tools are simply here if you ever need them.</p>
`},
    sv: { title: "Säkerhetstips", body: `
  <p>De flesta affärer på FindNord går smidigt, och lite försiktighet räcker långt. Några vanor värda att hålla fast vid:</p>
  <ul>
    <li>Träffas på en offentlig plats för fysiska byten, och ta gärna med en vän om möjligt.</li>
    <li>Skicka aldrig betalning innan du har sett föremålet på plats, och var misstänksam mot alla som pressar dig att agera snabbt.</li>
    <li>Håll din exakta hemadress privat -- kom istället överens om en offentlig mötesplats.</li>
    <li>Kontrollera säljarens offentliga profil, datum för medlemskap och betyg innan du bestämmer dig för en affär.</li>
    <li>Anmäl allt som bryter mot våra regler med Anmäl-knappen på en annons eller profil -- välj den anledning som passar och lägg till detaljer som kan hjälpa oss att granska det.</li>
    <li>Om någon gör dig obekväm behöver du inte deras medverkan för att sluta höra av dem: blockera dem från deras profil eller från er konversation, så försvinner deras annonser och meddelanden direkt från din vy.</li>
  </ul>
  <p>Inget av detta behöver kännas dramatiskt. FindNord hanterar inte betalningar och håller inte inne pengar -- du och den andra personen kommer alltid överens om detaljerna direkt, på egna villkor, och de här verktygen finns bara här om du någonsin skulle behöva dem.</p>
`},
    no: { title: "Sikkerhetstips", body: `
  <p>De fleste handler på FindNord går knirkefritt, og litt forsiktighet gjør stor forskjell. Noen vaner verdt å beholde:</p>
  <ul>
    <li>Møtes på et offentlig sted for personlige overleveringer, og ta gjerne med en venn hvis mulig.</li>
    <li>Send aldri betaling før du har sett varen personlig, og vær forsiktig med noen som presser deg til å handle raskt.</li>
    <li>Hold den nøyaktige hjemmeadressen din privat -- avtal heller et offentlig møtepunkt.</li>
    <li>Sjekk selgerens offentlige profil, medlemsdato og vurdering før du forplikter deg til en handel.</li>
    <li>Rapporter alt som bryter reglene våre med Rapporter-knappen på en annonse eller profil -- velg årsaken som passer, og legg til detaljer som kan hjelpe oss med gjennomgangen.</li>
    <li>Hvis noen gjør deg utrygg, trenger du ikke deres medvirkning for å slutte å høre fra dem: blokker dem fra profilen deres eller fra samtalen din, så forsvinner annonsene og meldingene deres umiddelbart fra visningen din.</li>
  </ul>
  <p>Ingenting av dette trenger å føles dramatisk. FindNord behandler ikke betalinger og holder ikke tilbake penger -- du og den andre personen avtaler alltid detaljene direkte, på egne premisser, og disse verktøyene er bare her hvis du noen gang trenger dem.</p>
`},
    da: { title: "Sikkerhedstips", body: `
  <p>De fleste handler på FindNord forløber problemfrit, og lidt påpasselighed rækker langt. Nogle vaner er værd at holde fast i:</p>
  <ul>
    <li>Mødes på et offentligt sted ved personlige overdragelser, og tag gerne en ven med, hvis muligt.</li>
    <li>Send aldrig betaling, før du har set varen personligt, og vær forsigtig med nogen, der presser dig til at handle hurtigt.</li>
    <li>Hold din præcise hjemmeadresse privat -- aftal i stedet et offentligt mødested.</li>
    <li>Tjek sælgerens offentlige profil, medlemsdato og bedømmelse, før du forpligter dig til en handel.</li>
    <li>Anmeld alt, der bryder vores regler, med Anmeld-knappen på en annonce eller profil -- vælg den årsag, der passer, og tilføj de detaljer, der kan hjælpe os med at gennemgå den.</li>
    <li>Hvis nogen får dig til at føle dig utilpas, behøver du ikke deres medvirken for at holde op med at høre fra dem: bloker dem fra deres profil eller fra din samtale, så forsvinder deres annoncer og beskeder øjeblikkeligt fra din visning.</li>
  </ul>
  <p>Intet af dette behøver at føles dramatisk. FindNord behandler ikke betalinger og opbevarer ikke penge -- du og den anden person aftaler altid detaljerne direkte, på jeres egne betingelser, og disse værktøjer er bare her, hvis du nogensinde skulle få brug for dem.</p>
`},
    fi: { title: "Turvallisuusvinkit", body: `
  <p>Suurin osa kaupoista FindNordissa sujuu mutkattomasti, ja pieni varovaisuus vie pitkälle. Muutama tapa kannattaa pitää mielessä:</p>
  <ul>
    <li>Tapaa julkisella paikalla henkilökohtaisia vaihtoja varten, ja ota mahdollisuuksien mukaan ystävä mukaan.</li>
    <li>Älä koskaan lähetä maksua ennen kuin olet nähnyt tuotteen paikan päällä, ja ole varovainen, jos joku painostaa sinua toimimaan nopeasti.</li>
    <li>Pidä tarkka kotiosoitteesi yksityisenä -- sopikaa sen sijaan julkisesta tapaamispaikasta.</li>
    <li>Tarkista myyjän julkinen profiili, jäsenyyden alkamispäivä ja arviot ennen kuin sitoudut kauppaan.</li>
    <li>Ilmoita kaikesta, mikä rikkoo sääntöjämme, käyttämällä ilmoitusnappia ilmoituksessa tai profiilissa -- valitse sopiva syy ja lisää tiedot, jotka auttavat meitä käsittelyssä.</li>
    <li>Jos joku saa sinut tuntemaan olosi epämukavaksi, sinun ei tarvitse odottaa heidän myötävaikutustaan lopettaaksesi heidän kuulemisensa: estä heidät heidän profiilistaan tai keskustelustanne, jolloin heidän ilmoituksensa ja viestinsä katoavat näkymästäsi välittömästi.</li>
  </ul>
  <p>Minkään tästä ei tarvitse tuntua dramaattiselta. FindNord ei käsittele maksuja eikä säilytä varoja -- sinä ja toinen osapuoli sovitte aina yksityiskohdista suoraan, omilla ehdoillanne, ja nämä työkalut ovat vain täällä, jos joskus tarvitset niitä.</p>
`},
    is: { title: "Öryggisráð", body: `
  <p>Flest viðskipti á FindNord ganga snurðulaust fyrir sig, og smá aðgát skiptir miklu máli. Nokkrar venjur sem vert er að temja sér:</p>
  <ul>
    <li>Hittist á opinberum stað fyrir afhendingu í eigin persónu, og taktu vin með ef hægt er.</li>
    <li>Sendu aldrei greiðslu áður en þú hefur séð hlutinn í eigin persónu, og vertu á varðbergi gagnvart hverjum þeim sem þrýstir á þig að taka ákvörðun hratt.</li>
    <li>Haltu nákvæmu heimilisfangi þínu einkamáli -- komdu þér frekar saman um opinberan fundarstað.</li>
    <li>Skoðaðu opinberan prófíl seljanda, hvenær hann gerðist meðlimur og einkunn áður en þú gengur til samninga.</li>
    <li>Tilkynntu allt sem brýtur reglur okkar með tilkynningarhnappinum á auglýsingu eða prófíl -- veldu þá ástæðu sem á við og bættu við upplýsingum sem gætu hjálpað okkur við yfirferðina.</li>
    <li>Ef einhver lætur þér líða illa þarftu ekki samvinnu hans til að hætta að heyra frá honum: lokaðu á hann af prófílnum hans eða úr samtalinu ykkar, og auglýsingar hans og skilaboð hverfa samstundis úr þinni sýn.</li>
  </ul>
  <p>Ekkert af þessu þarf að vera dramatískt. FindNord annast ekki greiðslur né varðveitir fé -- þú og hinn aðilinn ákveðið alltaf smáatriðin beint, á ykkar eigin forsendum, og þessi verkfæri eru einfaldlega til staðar ef þú skyldir einhvern tímann þurfa á þeim að halda.</p>
`}
  },
  pricingGuide: {
    en: { title: "Pricing Guide", body: `
  <p>Posting a listing on FindNord is free. Boosting a listing (giving it extra visibility in Browse) is currently also free while FindNord is in its early access period -- we'll always tell you clearly, in advance, before that ever changes.</p>
  <p>When pricing an item, check a few similar active listings nearby first -- FindNord's search and category filters make this quick.</p>
`},
    sv: { title: "Prisguide", body: `
  <p>Att publicera en annons på FindNord är gratis. Att boosta en annons (ge den extra synlighet i Bläddra) är för närvarande också gratis under FindNords tidiga tillgångsperiod -- vi kommer alltid att tydligt berätta i förväg innan det någonsin ändras.</p>
  <p>När du prissätter ett föremål, kolla först några liknande aktiva annonser i närheten -- FindNords sök- och kategorifilter gör det här snabbt.</p>
`},
    no: { title: "Prisguide", body: `
  <p>Å legge ut en annonse på FindNord er gratis. Å booste en annonse (gi den ekstra synlighet i Bla gjennom) er for øyeblikket også gratis mens FindNord er i sin tidlige tilgangsperiode -- vi vil alltid fortelle deg det tydelig, på forhånd, før det noen gang endres.</p>
  <p>Når du skal prissette en vare, sjekk noen lignende aktive annonser i nærheten først -- FindNords søk- og kategorifiltre gjør dette raskt.</p>
`},
    da: { title: "Prisguide", body: `
  <p>Det er gratis at oprette en annonce på FindNord. At booste en annonce (give den ekstra synlighed i Gennemse) er i øjeblikket også gratis, mens FindNord er i sin tidlige adgangsperiode -- vi vil altid fortælle dig det tydeligt og på forhånd, før det nogensinde ændrer sig.</p>
  <p>Når du skal prissætte en vare, så tjek nogle lignende aktive annoncer i nærheden først -- FindNords søge- og kategorifiltre gør dette hurtigt.</p>
`},
    fi: { title: "Hinnoitteluopas", body: `
  <p>Ilmoituksen julkaiseminen FindNordissa on ilmaista. Ilmoituksen boostaaminen (lisänäkyvyyden antaminen sille Selaa-näkymässä) on tällä hetkellä myös ilmaista FindNordin varhaisen käyttöönoton aikana -- kerromme siitä aina selkeästi ja etukäteen, ennen kuin se joskus muuttuu.</p>
  <p>Kun hinnoittelet tuotetta, tarkista ensin muutama samankaltainen aktiivinen ilmoitus lähistöllä -- FindNordin haku- ja kategoriasuodattimet tekevät tästä nopeaa.</p>
`},
    is: { title: "Verðlagsleiðbeiningar", body: `
  <p>Það er ókeypis að setja inn auglýsingu á FindNord. Að boosta auglýsingu (gefa henni aukna sýnileika í flettingu) er sem stendur einnig ókeypis á meðan FindNord er á sínu snemmaðgangstímabili -- við munum alltaf láta þig vita skýrt og fyrirfram áður en það breytist.</p>
  <p>Þegar þú verðleggur hlut skaltu fyrst skoða nokkrar svipaðar virkar auglýsingar í nágrenninu -- leitar- og flokkasíur FindNord gera þetta fljótlegt.</p>
`}
  },
  photoGuide: {
    en: { title: "Photo Guide", body: `
  <p>Listings with real, clear photos get noticed faster. A few tips:</p>
  <ul>
    <li>Use natural daylight where possible, and photograph the item from more than one angle.</li>
    <li>Your first photo is the cover photo shown in Browse -- pick your clearest, most flattering shot and use "Make cover" if you want to change it later.</li>
    <li>You can add up to 6 photos per listing, or use FindNord's AI photo generator for a quick placeholder while you take real photos.</li>
  </ul>
`},
    sv: { title: "Fotoguide", body: `
  <p>Annonser med riktiga, tydliga foton uppmärksammas snabbare. Några tips:</p>
  <ul>
    <li>Använd naturligt dagsljus där det går, och fotografera föremålet från mer än en vinkel.</li>
    <li>Ditt första foto är omslagsfotot som visas i Bläddra -- välj din tydligaste, mest fördelaktiga bild och använd "Gör till omslag" om du vill ändra det senare.</li>
    <li>Du kan lägga till upp till 6 foton per annons, eller använda FindNords AI-fotogenerator för en snabb platshållare medan du tar riktiga foton.</li>
  </ul>
`},
    no: { title: "Fotoguide", body: `
  <p>Annonser med ekte, tydelige bilder blir lagt merke til raskere. Noen tips:</p>
  <ul>
    <li>Bruk naturlig dagslys der det er mulig, og fotografer varen fra mer enn én vinkel.</li>
    <li>Det første bildet ditt er forsidebildet som vises i Bla gjennom -- velg det tydeligste og mest fordelaktige bildet, og bruk "Gjør til forsidebilde" hvis du vil endre det senere.</li>
    <li>Du kan legge til opptil 6 bilder per annonse, eller bruke FindNords AI-bildegenerator for et raskt plassholderbilde mens du tar ekte bilder.</li>
  </ul>
`},
    da: { title: "Fotoguide", body: `
  <p>Annoncer med rigtige, tydelige billeder bliver bemærket hurtigere. Nogle tips:</p>
  <ul>
    <li>Brug naturligt dagslys, hvor det er muligt, og fotografer varen fra mere end én vinkel.</li>
    <li>Dit første billede er forsidebilledet, der vises i Gennemse -- vælg dit tydeligste, mest fordelagtige billede, og brug "Gør til forsidebillede", hvis du vil ændre det senere.</li>
    <li>Du kan tilføje op til 6 billeder pr. annonce, eller bruge FindNords AI-billedgenerator til et hurtigt pladsholderbillede, mens du tager rigtige billeder.</li>
  </ul>
`},
    fi: { title: "Valokuvausopas", body: `
  <p>Ilmoitukset, joissa on aitoja ja selkeitä kuvia, huomataan nopeammin. Muutama vinkki:</p>
  <ul>
    <li>Käytä luonnonvaloa aina kun mahdollista, ja kuvaa tuote useammasta kuin yhdestä kulmasta.</li>
    <li>Ensimmäinen kuvasi on kansikuva, joka näkyy Selaa-näkymässä -- valitse selkein ja edustavin kuvasi, ja käytä "Tee kansikuvaksi" -toimintoa, jos haluat vaihtaa sen myöhemmin.</li>
    <li>Voit lisätä jopa 6 kuvaa per ilmoitus, tai käyttää FindNordin AI-kuvageneraattoria nopeaan paikkamerkkikuvaan, kun otat oikeita kuvia.</li>
  </ul>
`},
    is: { title: "Myndaleiðbeiningar", body: `
  <p>Auglýsingar með raunverulegum, skýrum myndum vekja athygli hraðar. Nokkur ráð:</p>
  <ul>
    <li>Notaðu náttúrulega dagsbirtu þar sem hægt er, og taktu mynd af hlutnum úr fleiri en einu horni.</li>
    <li>Fyrsta myndin þín er forsíðumyndin sem birtist í flettingu -- veldu skýrustu og aðlaðandi myndina þína og notaðu „Gera að forsíðumynd“ ef þú vilt breyta því síðar.</li>
    <li>Þú getur bætt við allt að 6 myndum á hverja auglýsingu, eða notað AI-myndavél FindNord til að fá fljótlegan staðgengil á meðan þú tekur alvöru myndir.</li>
  </ul>
`}
  },
  safeSellingGuide: {
    en: { title: "Safe Selling Guide", body: `
  <p>Respond promptly and honestly to buyer questions -- it's the single biggest factor in a smooth sale. Describe any wear, damage, or missing parts up front rather than letting a buyer discover it in person.</p>
  <p>Agree on a public meeting place and time, and confirm payment (cash, or a trusted transfer method) before handing over the item. See our general <button type="button" class="link-button" data-static-page="safetyTips">Safety Tips</button> for more.</p>
`},
    sv: { title: "Guide för säker försäljning", body: `
  <p>Svara snabbt och ärligt på köparens frågor -- det är den enskilt viktigaste faktorn för en smidig försäljning. Beskriv eventuellt slitage, skador eller saknade delar i förväg istället för att låta köparen upptäcka det på plats.</p>
  <p>Kom överens om en offentlig mötesplats och tid, och bekräfta betalningen (kontant eller en pålitlig överföringsmetod) innan du lämnar över föremålet. Se våra allmänna <button type="button" class="link-button" data-static-page="safetyTips">Säkerhetstips</button> för mer.</p>
`},
    no: { title: "Guide for trygt salg", body: `
  <p>Svar raskt og ærlig på kjøperens spørsmål -- det er den enkeltvis viktigste faktoren for et smidig salg. Beskriv eventuell slitasje, skade eller manglende deler på forhånd i stedet for å la kjøperen oppdage det personlig.</p>
  <p>Bli enige om et offentlig møtested og tidspunkt, og bekreft betaling (kontant eller en pålitelig overføringsmetode) før du overleverer varen. Se våre generelle <button type="button" class="link-button" data-static-page="safetyTips">Sikkerhetstips</button> for mer.</p>
`},
    da: { title: "Guide til sikkert salg", body: `
  <p>Svar hurtigt og ærligt på køberens spørgsmål -- det er den enkeltvis vigtigste faktor for et gnidningsfrit salg. Beskriv eventuel slitage, skader eller manglende dele på forhånd i stedet for at lade køberen opdage det personligt.</p>
  <p>Aftal et offentligt mødested og tidspunkt, og bekræft betaling (kontant eller en pålidelig overførselsmetode), før du overdrager varen. Se vores generelle <button type="button" class="link-button" data-static-page="safetyTips">Sikkerhedstips</button> for mere.</p>
`},
    fi: { title: "Turvallisen myynnin opas", body: `
  <p>Vastaa ostajan kysymyksiin nopeasti ja rehellisesti -- se on yksittäin tärkein tekijä sujuvan kaupan kannalta. Kerro mahdollisesta kulumisesta, vauriosta tai puuttuvista osista etukäteen sen sijaan, että annat ostajan huomata sen paikan päällä.</p>
  <p>Sopikaa julkinen tapaamispaikka ja -aika, ja vahvista maksu (käteinen tai luotettava siirtotapa) ennen tuotteen luovuttamista. Katso yleiset <button type="button" class="link-button" data-static-page="safetyTips">Turvallisuusvinkit</button> lisätietoja varten.</p>
`},
    is: { title: "Leiðbeiningar um örugga sölu", body: `
  <p>Svaraðu spurningum kaupanda fljótt og heiðarlega -- það er stærsti einstaki þátturinn í snurðulausri sölu. Lýstu sliti, skemmdum eða vantandi hlutum fyrirfram í stað þess að láta kaupandann uppgötva það í eigin persónu.</p>
  <p>Komið ykkur saman um opinberan fundarstað og tíma, og staðfestu greiðslu (reiðufé eða áreiðanlega millifærsluaðferð) áður en þú afhendir hlutinn. Skoðaðu almenn <button type="button" class="link-button" data-static-page="safetyTips">Öryggisráð</button> okkar til að fá meira.</p>
`}
  },
  helpCenter: {
    en: { title: "Help Center", body: `
  <p>Most questions are answered in our <button type="button" class="link-button" data-static-page="faq">FAQ</button>, <button type="button" class="link-button" data-static-page="howItWorks">How It Works</button>, and <button type="button" class="link-button" data-static-page="safetyTips">Safety Tips</button> pages.</p>
  <p>Can't find what you need? <button type="button" class="link-button" data-static-page="contactSupport">Contact Support</button> directly and a real person will get back to you.</p>
`},
    sv: { title: "Hjälpcenter", body: `
  <p>De flesta frågor besvaras på våra sidor <button type="button" class="link-button" data-static-page="faq">Vanliga frågor</button>, <button type="button" class="link-button" data-static-page="howItWorks">Så fungerar det</button> och <button type="button" class="link-button" data-static-page="safetyTips">Säkerhetstips</button>.</p>
  <p>Hittar du inte det du behöver? <button type="button" class="link-button" data-static-page="contactSupport">Kontakta support</button> direkt så återkommer en riktig person till dig.</p>
`},
    no: { title: "Hjelpesenter", body: `
  <p>De fleste spørsmål besvares på våre sider <button type="button" class="link-button" data-static-page="faq">Ofte stilte spørsmål</button>, <button type="button" class="link-button" data-static-page="howItWorks">Slik fungerer det</button> og <button type="button" class="link-button" data-static-page="safetyTips">Sikkerhetstips</button>.</p>
  <p>Finner du ikke det du trenger? <button type="button" class="link-button" data-static-page="contactSupport">Kontakt kundestøtte</button> direkte, så vil en ekte person svare deg.</p>
`},
    da: { title: "Hjælpecenter", body: `
  <p>De fleste spørgsmål besvares på vores sider <button type="button" class="link-button" data-static-page="faq">Ofte stillede spørgsmål</button>, <button type="button" class="link-button" data-static-page="howItWorks">Sådan fungerer det</button> og <button type="button" class="link-button" data-static-page="safetyTips">Sikkerhedstips</button>.</p>
  <p>Kan du ikke finde det, du har brug for? <button type="button" class="link-button" data-static-page="contactSupport">Kontakt support</button> direkte, så vender en rigtig person tilbage til dig.</p>
`},
    fi: { title: "Ohjekeskus", body: `
  <p>Useimpiin kysymyksiin löytyy vastaus sivuiltamme <button type="button" class="link-button" data-static-page="faq">Usein kysytyt kysymykset</button>, <button type="button" class="link-button" data-static-page="howItWorks">Näin se toimii</button> ja <button type="button" class="link-button" data-static-page="safetyTips">Turvallisuusvinkit</button>.</p>
  <p>Etkö löytänyt etsimääsi? <button type="button" class="link-button" data-static-page="contactSupport">Ota yhteyttä tukeen</button> suoraan, niin oikea henkilö vastaa sinulle.</p>
`},
    is: { title: "Hjálparmiðstöð", body: `
  <p>Flestum spurningum er svarað á síðunum okkar <button type="button" class="link-button" data-static-page="faq">Algengar spurningar</button>, <button type="button" class="link-button" data-static-page="howItWorks">Svona virkar það</button> og <button type="button" class="link-button" data-static-page="safetyTips">Öryggisráð</button>.</p>
  <p>Finnurðu ekki það sem þú þarft? <button type="button" class="link-button" data-static-page="contactSupport">Hafa samband við þjónustuver</button> beint og alvöru manneskja svarar þér.</p>
`}
  },
  faq: {
    en: { title: "Frequently Asked Questions", body: `
  <p><strong>Is FindNord free to use?</strong> Yes -- browsing, messaging, and posting listings are all free.</p>
  <p><strong>How do I sign in?</strong> With an email + password account, or "Continue with Google."</p>
  <p><strong>Does FindNord handle payment or delivery?</strong> No -- buyers and sellers arrange payment and pickup/delivery directly between themselves. See our <button type="button" class="link-button" data-static-page="safetyTips">Safety Tips</button>.</p>
  <p><strong>How is my rating calculated?</strong> As the real average of every 1–5 star rating other members have left on your public profile.</p>
  <p><strong>What does "Verified" mean on a profile?</strong> It means that account signed in with Google, which independently confirms their email is real. It is a simple, honest signal, not a full identity check.</p>
`},
    sv: { title: "Vanliga frågor", body: `
  <p><strong>Är FindNord gratis att använda?</strong> Ja -- att bläddra, meddela och publicera annonser är helt gratis.</p>
  <p><strong>Hur loggar jag in?</strong> Med ett konto med e-post + lösenord, eller "Fortsätt med Google".</p>
  <p><strong>Hanterar FindNord betalning eller leverans?</strong> Nej -- köpare och säljare ordnar betalning och upphämtning/leverans direkt mellan sig. Se våra <button type="button" class="link-button" data-static-page="safetyTips">Säkerhetstips</button>.</p>
  <p><strong>Hur beräknas mitt betyg?</strong> Som det verkliga genomsnittet av varje betyg mellan 1 och 5 stjärnor som andra medlemmar har lämnat på din offentliga profil.</p>
  <p><strong>Vad betyder "Verifierad" på en profil?</strong> Det betyder att kontot loggade in med Google, vilket oberoende bekräftar att e-postadressen är äkta. Det är en enkel, ärlig signal, inte en fullständig identitetskontroll.</p>
`},
    no: { title: "Ofte stilte spørsmål", body: `
  <p><strong>Er FindNord gratis å bruke?</strong> Ja -- å bla gjennom, sende meldinger og legge ut annonser er alt sammen gratis.</p>
  <p><strong>Hvordan logger jeg inn?</strong> Med en e-post + passord-konto, eller «Fortsett med Google».</p>
  <p><strong>Håndterer FindNord betaling eller levering?</strong> Nei -- kjøpere og selgere ordner betaling og henting/levering direkte seg imellom. Se våre <button type="button" class="link-button" data-static-page="safetyTips">Sikkerhetstips</button>.</p>
  <p><strong>Hvordan beregnes vurderingen min?</strong> Som det reelle gjennomsnittet av hver vurdering fra 1 til 5 stjerner som andre medlemmer har gitt på din offentlige profil.</p>
  <p><strong>Hva betyr «Verifisert» på en profil?</strong> Det betyr at kontoen logget inn med Google, som uavhengig bekrefter at e-posten deres er ekte. Det er et enkelt, ærlig signal, ikke en fullstendig identitetskontroll.</p>
`},
    da: { title: "Ofte stillede spørgsmål", body: `
  <p><strong>Er FindNord gratis at bruge?</strong> Ja -- at gennemse, sende beskeder og oprette annoncer er alt sammen gratis.</p>
  <p><strong>Hvordan logger jeg ind?</strong> Med en e-mail + adgangskode-konto, eller "Fortsæt med Google".</p>
  <p><strong>Håndterer FindNord betaling eller levering?</strong> Nej -- købere og sælgere aftaler betaling og afhentning/levering direkte indbyrdes. Se vores <button type="button" class="link-button" data-static-page="safetyTips">Sikkerhedstips</button>.</p>
  <p><strong>Hvordan beregnes min bedømmelse?</strong> Som det reelle gennemsnit af hver bedømmelse fra 1 til 5 stjerner, som andre medlemmer har givet på din offentlige profil.</p>
  <p><strong>Hvad betyder "Verificeret" på en profil?</strong> Det betyder, at kontoen loggede ind med Google, hvilket uafhængigt bekræfter, at deres e-mail er ægte. Det er et enkelt, ærligt signal, ikke et fuldstændigt identitetstjek.</p>
`},
    fi: { title: "Usein kysytyt kysymykset", body: `
  <p><strong>Onko FindNordin käyttö ilmaista?</strong> Kyllä -- selaaminen, viestien lähettäminen ja ilmoitusten julkaiseminen ovat kaikki ilmaisia.</p>
  <p><strong>Miten kirjaudun sisään?</strong> Sähköposti + salasana -tilillä tai "Jatka Googlella".</p>
  <p><strong>Hoitaako FindNord maksun tai toimituksen?</strong> Ei -- ostajat ja myyjät sopivat maksusta ja noudosta/toimituksesta suoraan keskenään. Katso <button type="button" class="link-button" data-static-page="safetyTips">Turvallisuusvinkit</button>.</p>
  <p><strong>Miten arvioni lasketaan?</strong> Todellisena keskiarvona jokaisesta 1–5 tähden arviosta, jonka muut jäsenet ovat jättäneet julkiseen profiiliisi.</p>
  <p><strong>Mitä "Vahvistettu" tarkoittaa profiilissa?</strong> Se tarkoittaa, että tili kirjautui sisään Googlella, mikä vahvistaa riippumattomasti, että sähköposti on aito. Se on yksinkertainen, rehellinen merkki, ei täydellinen henkilöllisyystarkistus.</p>
`},
    is: { title: "Algengar spurningar", body: `
  <p><strong>Er ókeypis að nota FindNord?</strong> Já -- að skoða auglýsingar, senda skilaboð og setja inn auglýsingar er allt ókeypis.</p>
  <p><strong>Hvernig skrái ég mig inn?</strong> Með tölvupósti + lykilorði, eða „Halda áfram með Google“.</p>
  <p><strong>Sér FindNord um greiðslu eða afhendingu?</strong> Nei -- kaupendur og seljendur koma sér saman um greiðslu og afhendingu/sendingu beint sín á milli. Skoðaðu <button type="button" class="link-button" data-static-page="safetyTips">Öryggisráð</button> okkar.</p>
  <p><strong>Hvernig er einkunnin mín reiknuð?</strong> Sem raunverulegt meðaltal hverrar einkunnar frá 1–5 stjörnum sem aðrir meðlimir hafa skilið eftir á opinbera prófílnum þínum.</p>
  <p><strong>Hvað þýðir „Staðfest“ á prófíl?</strong> Það þýðir að aðgangurinn skráði sig inn með Google, sem staðfestir sjálfstætt að tölvupósturinn sé ekta. Þetta er einfalt, heiðarlegt merki, ekki fullkomin auðkennisathugun.</p>
`}
  },
  contactSupport: {
    en: { title: "Contact Support", body: `
  <p>Email <a href="mailto:support@findnord.com">support@findnord.com</a> and we'll get back to you as soon as we can.</p>
  <p>For a specific listing, you can also use that listing's Report button, which flags it for review directly.</p>
`},
    sv: { title: "Kontakta support", body: `
  <p>Skicka e-post till <a href="mailto:support@findnord.com">support@findnord.com</a> så återkommer vi så snart vi kan.</p>
  <p>För en specifik annons kan du också använda annonsens Anmäl-knapp, som flaggar den direkt för granskning.</p>
`},
    no: { title: "Kontakt kundestøtte", body: `
  <p>Send e-post til <a href="mailto:support@findnord.com">support@findnord.com</a>, så svarer vi deg så snart vi kan.</p>
  <p>For en spesifikk annonse kan du også bruke annonsens Rapporter-knapp, som flagger den direkte for gjennomgang.</p>
`},
    da: { title: "Kontakt support", body: `
  <p>Send en e-mail til <a href="mailto:support@findnord.com">support@findnord.com</a>, så vender vi tilbage til dig, så snart vi kan.</p>
  <p>For en bestemt annonce kan du også bruge annoncens Anmeld-knap, som flager den direkte til gennemgang.</p>
`},
    fi: { title: "Ota yhteyttä tukeen", body: `
  <p>Lähetä sähköpostia osoitteeseen <a href="mailto:support@findnord.com">support@findnord.com</a>, niin vastaamme sinulle mahdollisimman pian.</p>
  <p>Tiettyä ilmoitusta koskien voit myös käyttää ilmoituksen ilmoitusnappia, joka merkitsee sen suoraan tarkistettavaksi.</p>
`},
    is: { title: "Hafa samband við þjónustuver", body: `
  <p>Sendu tölvupóst á <a href="mailto:support@findnord.com">support@findnord.com</a> og við svörum eins fljótt og við getum.</p>
  <p>Fyrir tiltekna auglýsingu geturðu líka notað tilkynningarhnapp þeirrar auglýsingar, sem merkir hana beint til yfirferðar.</p>
`}
  },
  reportIssue: {
    en: { title: "Report an Issue", body: `
  <p>If your issue is about a specific listing, use the Report button on that listing's detail page. If it's about a person rather than one listing, use the Report button on their public profile instead. Either way, pick the reason that fits best and add any details that would help us review it -- your report goes straight into our review queue.</p>
  <p>If someone is making you uncomfortable, you don't need to wait for a report to be reviewed: you can <button type="button" class="link-button" data-static-page="safetyTips">block them</button> immediately from their profile or from your conversation with them, and you'll stop seeing their listings and messages right away.</p>
  <p>For anything else (a bug, an account problem, or a concern that isn't tied to one listing or person), email <a href="mailto:support@findnord.com">support@findnord.com</a> with as much detail as you can.</p>
`},
    sv: { title: "Anmäl ett problem", body: `
  <p>Om ditt problem gäller en specifik annons, använd Anmäl-knappen på annonsens detaljsida. Om det gäller en person snarare än en annons, använd istället Anmäl-knappen på personens offentliga profil. Oavsett vilket, välj den anledning som passar bäst och lägg till detaljer som kan hjälpa oss att granska det -- din anmälan går direkt in i vår granskningskö.</p>
  <p>Om någon gör dig obekväm behöver du inte vänta på att en anmälan granskas: du kan <button type="button" class="link-button" data-static-page="safetyTips">blockera personen</button> direkt från deras profil eller från din konversation med dem, och du slutar se deras annonser och meddelanden direkt.</p>
  <p>För allt annat (en bugg, ett kontoproblem, eller något som inte är kopplat till en specifik annons eller person), skicka e-post till <a href="mailto:support@findnord.com">support@findnord.com</a> med så mycket information du kan.</p>
`},
    no: { title: "Rapporter et problem", body: `
  <p>Hvis problemet ditt gjelder en spesifikk annonse, bruk Rapporter-knappen på annonsens detaljside. Hvis det gjelder en person snarere enn én annonse, bruk i stedet Rapporter-knappen på vedkommendes offentlige profil. Uansett, velg årsaken som passer best, og legg til detaljer som kan hjelpe oss med gjennomgangen -- rapporten din går rett inn i granskningskøen vår.</p>
  <p>Hvis noen gjør deg utrygg, trenger du ikke å vente på at en rapport gjennomgås: du kan <button type="button" class="link-button" data-static-page="safetyTips">blokkere vedkommende</button> umiddelbart fra profilen deres eller fra samtalen din med dem, og du slutter å se annonsene og meldingene deres med det samme.</p>
  <p>For alt annet (en feil, et kontoproblem, eller noe som ikke er knyttet til én annonse eller person), send e-post til <a href="mailto:support@findnord.com">support@findnord.com</a> med så mange detaljer du kan.</p>
`},
    da: { title: "Anmeld et problem", body: `
  <p>Hvis dit problem handler om en bestemt annonce, skal du bruge Anmeld-knappen på annoncens detaljeside. Hvis det handler om en person frem for én annonce, skal du i stedet bruge Anmeld-knappen på vedkommendes offentlige profil. Under alle omstændigheder skal du vælge den årsag, der passer bedst, og tilføje de detaljer, der kan hjælpe os med gennemgangen -- din anmeldelse går direkte i vores gennemgangskø.</p>
  <p>Hvis nogen får dig til at føle dig utilpas, behøver du ikke vente på, at en anmeldelse bliver gennemgået: du kan <button type="button" class="link-button" data-static-page="safetyTips">blokere personen</button> med det samme fra vedkommendes profil eller fra din samtale med dem, og du holder straks op med at se deres annoncer og beskeder.</p>
  <p>For alt andet (en fejl, et kontoproblem eller noget, der ikke er knyttet til én annonce eller person), så send en e-mail til <a href="mailto:support@findnord.com">support@findnord.com</a> med så mange detaljer, du kan.</p>
`},
    fi: { title: "Ilmoita ongelmasta", body: `
  <p>Jos ongelmasi koskee tiettyä ilmoitusta, käytä ilmoitusnappia kyseisen ilmoituksen tietosivulla. Jos kyse on henkilöstä eikä yksittäisestä ilmoituksesta, käytä sen sijaan ilmoitusnappia hänen julkisessa profiilissaan. Joka tapauksessa valitse parhaiten sopiva syy ja lisää tiedot, jotka voivat auttaa meitä käsittelyssä -- ilmoituksesi menee suoraan käsittelyjonoomme.</p>
  <p>Jos joku saa sinut tuntemaan olosi epämukavaksi, sinun ei tarvitse odottaa ilmoituksen käsittelyä: voit <button type="button" class="link-button" data-static-page="safetyTips">estää hänet</button> välittömästi hänen profiilistaan tai keskustelustanne, jolloin lakkaat näkemästä hänen ilmoituksensa ja viestinsä heti.</p>
  <p>Kaikkea muuta varten (bugi, tiliongelma tai jokin, joka ei liity yhteen ilmoitukseen tai henkilöön), lähetä sähköpostia osoitteeseen <a href="mailto:support@findnord.com">support@findnord.com</a> mahdollisimman yksityiskohtaisesti.</p>
`},
    is: { title: "Tilkynna vandamál", body: `
  <p>Ef málið þitt varðar tiltekna auglýsingu skaltu nota tilkynningarhnappinn á síðu þeirrar auglýsingar. Ef það varðar einstakling frekar en eina auglýsingu skaltu í staðinn nota tilkynningarhnappinn á opinberum prófíl hans. Í báðum tilvikum, veldu þá ástæðu sem á best við og bættu við upplýsingum sem gætu hjálpað okkur við yfirferðina -- tilkynningin þín fer beint í yfirferðarröðina okkar.</p>
  <p>Ef einhver lætur þér líða illa þarftu ekki að bíða eftir að tilkynning sé yfirfarin: þú getur <button type="button" class="link-button" data-static-page="safetyTips">lokað á viðkomandi</button> samstundis af prófílnum hans eða úr samtalinu ykkar, og þú hættir samstundis að sjá auglýsingar hans og skilaboð.</p>
  <p>Fyrir allt annað (villu, vandamál með aðgang, eða eitthvað sem tengist ekki einni auglýsingu eða einstaklingi), sendu tölvupóst á <a href="mailto:support@findnord.com">support@findnord.com</a> með eins miklum upplýsingum og þú getur.</p>
`}
  },
  boostAds: {
    en: { title: "Boost Your Ads", body: `
  <p>Boosting marks your listing as Sponsored, giving it extra visibility in Browse results. You can boost or unboost any of your own active listings anytime from "My Listings."</p>
  <p>Boosting is currently free while FindNord is in its early access period. See our <button type="button" class="link-button" data-static-page="pricingGuide">Pricing Guide</button>.</p>
`},
    sv: { title: "Boosta dina annonser", body: `
  <p>Att boosta markerar din annons som Sponsored, vilket ger den extra synlighet i Bläddra-resultaten. Du kan boosta eller ta bort boost från vilken som helst av dina egna aktiva annonser när som helst under "Mina annonser".</p>
  <p>Boost är för närvarande gratis under FindNords tidiga tillgångsperiod. Se vår <button type="button" class="link-button" data-static-page="pricingGuide">Prisguide</button>.</p>
`},
    no: { title: "Boost annonsene dine", body: `
  <p>Å booste markerer annonsen din som Sponsored, noe som gir den ekstra synlighet i Bla gjennom-resultatene. Du kan booste eller fjerne boost fra hvilken som helst av dine egne aktive annonser når som helst fra «Mine annonser».</p>
  <p>Boost er for øyeblikket gratis mens FindNord er i sin tidlige tilgangsperiode. Se vår <button type="button" class="link-button" data-static-page="pricingGuide">Prisguide</button>.</p>
`},
    da: { title: "Boost dine annoncer", body: `
  <p>At booste markerer din annonce som Sponsored, hvilket giver den ekstra synlighed i Gennemse-resultaterne. Du kan booste eller fjerne boost fra en hvilken som helst af dine egne aktive annoncer når som helst fra "Mine annoncer".</p>
  <p>Boost er i øjeblikket gratis, mens FindNord er i sin tidlige adgangsperiode. Se vores <button type="button" class="link-button" data-static-page="pricingGuide">Prisguide</button>.</p>
`},
    fi: { title: "Boosta ilmoituksiasi", body: `
  <p>Boostaaminen merkitsee ilmoituksesi Sponsored-ilmoitukseksi, mikä antaa sille lisänäkyvyyttä Selaa-tuloksissa. Voit boostata tai poistaa boostin miltä tahansa omalta aktiiviselta ilmoitukseltasi milloin tahansa kohdasta "Omat ilmoitukset".</p>
  <p>Boostaus on tällä hetkellä ilmaista FindNordin varhaisen käyttöönoton aikana. Katso <button type="button" class="link-button" data-static-page="pricingGuide">Hinnoitteluopas</button>.</p>
`},
    is: { title: "Boostaðu auglýsingarnar þínar", body: `
  <p>Að boosta merkir auglýsinguna þína sem Sponsored, sem gefur henni aukinn sýnileika í niðurstöðum flettingar. Þú getur boostað eða fjarlægt boost af hvaða virku auglýsingu sem er hjá þér, hvenær sem er, undir „Mínar auglýsingar“.</p>
  <p>Boost er sem stendur ókeypis á meðan FindNord er á sínu snemmaðgangstímabili. Skoðaðu <button type="button" class="link-button" data-static-page="pricingGuide">Verðlagsleiðbeiningar</button> okkar.</p>
`}
  },
  contentModeration: {
    en: { title: "Content & Moderation", body: `
  <p>FindNord reviews reported listings and users, and enforces real, automatic protections on reviews: abusive language is removed from review text by default, the reviewer is warned the first time, and a second violation permanently blocks that account from leaving further reviews.</p>
  <p>Listings and profiles can both be reported directly, with a real reason attached -- prohibited items, scams, inappropriate content, harassment, spam, or something else. Every report is recorded with that reason and any details you added, and lands in our internal review queue in the order it came in. We rely on our members to help flag content that doesn't belong here.</p>
  <p>Blocking someone is separate from reporting them: it takes effect immediately, on your side only, and doesn't require anyone to review anything first. Reporting and blocking work well together -- report anything that breaks our rules, and block anyone you'd simply rather not see or hear from.</p>
`},
    sv: { title: "Innehåll och moderering", body: `
  <p>FindNord granskar anmälda annonser och användare, och tillämpar verkliga, automatiska skydd för recensioner: kränkande språk tas bort från recensionstext som standard, recensenten varnas första gången, och en andra överträdelse blockerar permanent det kontot från att lämna fler recensioner.</p>
  <p>Både annonser och profiler kan anmälas direkt, med en verklig anledning kopplad till anmälan -- förbjudna föremål, bedrägerier, olämpligt innehåll, trakasserier, skräppost, eller något annat. Varje anmälan registreras med den anledningen och eventuella detaljer du lagt till, och hamnar i vår interna granskningskö i den ordning den kom in. Vi förlitar oss på våra medlemmar för att hjälpa till att flagga innehåll som inte hör hemma här.</p>
  <p>Att blockera någon är separat från att anmäla dem: det träder i kraft omedelbart, bara på din sida, och kräver inte att någon granskar något först. Anmälan och blockering fungerar bra tillsammans -- anmäl allt som bryter mot våra regler, och blockera vem du helst hellre slipper se eller höra från.</p>
`},
    no: { title: "Innhold og moderering", body: `
  <p>FindNord gjennomgår rapporterte annonser og brukere, og håndhever ekte, automatiske beskyttelser for anmeldelser: krenkende språk fjernes fra anmeldelsestekst som standard, anmelderen advares første gang, og et andre brudd blokkerer permanent kontoen fra å legge igjen flere anmeldelser.</p>
  <p>Både annonser og profiler kan rapporteres direkte, med en reell årsak knyttet til det -- forbudte varer, svindel, upassende innhold, trakassering, spam, eller noe annet. Hver rapport registreres med den årsaken og eventuelle detaljer du la til, og havner i vår interne granskingskø i den rekkefølgen den kom inn. Vi er avhengige av våre medlemmer for å hjelpe til med å flagge innhold som ikke hører hjemme her.</p>
  <p>Å blokkere noen er atskilt fra å rapportere dem: det trer i kraft umiddelbart, bare på din side, og krever ikke at noen gjennomgår noe først. Rapportering og blokkering fungerer godt sammen -- rapporter alt som bryter reglene våre, og blokker hvem som helst du rett og slett heller vil slippe å se eller høre fra.</p>
`},
    da: { title: "Indhold og moderation", body: `
  <p>FindNord gennemgår anmeldte annoncer og brugere og håndhæver reelle, automatiske beskyttelser for anmeldelser: krænkende sprog fjernes som standard fra anmeldelsesteksten, anmelderen advares første gang, og en anden overtrædelse blokerer permanent den konto fra at afgive flere anmeldelser.</p>
  <p>Både annoncer og profiler kan anmeldes direkte med en reel årsag knyttet til det -- forbudte varer, svindel, upassende indhold, chikane, spam eller noget andet. Hver anmeldelse registreres med denne årsag og de detaljer, du har tilføjet, og havner i vores interne gennemgangskø i den rækkefølge, den kom ind. Vi er afhængige af vores medlemmer for at hjælpe med at flage indhold, der ikke hører til her.</p>
  <p>At blokere nogen er adskilt fra at anmelde dem: det træder i kraft med det samme, kun på din side, og kræver ikke, at nogen gennemgår noget først. Anmeldelse og blokering fungerer godt sammen -- anmeld alt, der bryder vores regler, og bloker enhver, du hellere vil slippe for at se eller høre fra.</p>
`},
    fi: { title: "Sisältö ja moderointi", body: `
  <p>FindNord käsittelee ilmoitettuja ilmoituksia ja käyttäjiä sekä ylläpitää todellisia, automaattisia suojauksia arvosteluille: loukkaava kieli poistetaan arvostelutekstistä oletuksena, arvostelijaa varoitetaan ensimmäisellä kerralla, ja toinen rikkomus estää tililtä pysyvästi uusien arvostelujen jättämisen.</p>
  <p>Sekä ilmoituksia että profiileja voi ilmoittaa suoraan, ja mukaan liitetään todellinen syy -- kielletyt tuotteet, huijaukset, sopimaton sisältö, häirintä, roskaposti tai jokin muu. Jokainen ilmoitus tallennetaan kyseisen syyn ja lisäämiesi tietojen kanssa, ja se päätyy sisäiseen käsittelyjonoomme saapumisjärjestyksessä. Luotamme jäseniimme, jotta he auttavat merkitsemään sisällön, joka ei kuulu tänne.</p>
  <p>Jonkun estäminen on eri asia kuin hänen ilmoittamisensa: se astuu voimaan välittömästi, vain sinun puolellasi, eikä vaadi kenenkään tarkistavan mitään ensin. Ilmoittaminen ja estäminen toimivat hyvin yhdessä -- ilmoita kaikesta, mikä rikkoo sääntöjämme, ja estä kuka tahansa, jota mieluummin et näkisi tai kuulisi.</p>
`},
    is: { title: "Efni og eftirlit", body: `
  <p>FindNord fer yfir tilkynntar auglýsingar og notendur, og beitir raunverulegum, sjálfvirkum vörnum fyrir umsagnir: móðgandi orðalag er fjarlægt úr umsagnartexta sjálfgefið, umsagnaraðilinn fær viðvörun í fyrsta skipti, og annað brot lokar aðganginn varanlega frá því að skilja eftir fleiri umsagnir.</p>
  <p>Bæði auglýsingar og prófíla er hægt að tilkynna beint, með raunverulegri ástæðu tengdri því -- bannaða hluti, svik, óviðeigandi efni, áreitni, ruslpóst, eða eitthvað annað. Sérhver tilkynning er skráð með þeirri ástæðu og öllum upplýsingum sem þú bættir við, og lendir í innri yfirferðarröðinni okkar í þeirri röð sem hún barst. Við treystum á meðlimi okkar til að hjálpa til við að merkja efni sem á ekki heima hér.</p>
  <p>Að loka á einhvern er aðskilið frá því að tilkynna hann: það tekur gildi samstundis, aðeins þín megin, og krefst þess ekki að neinn fari yfir neitt fyrst. Tilkynningar og að loka á einhvern virka vel saman -- tilkynntu allt sem brýtur reglur okkar, og lokaðu á hvern sem þú frekar vilt sleppa við að sjá eða heyra frá.</p>
`}
  },
  dataSafety: {
    en: { title: "Data Safety", body: `
  <p>FindNord stores only what's needed to run the marketplace: your account details, your listings and photos, your messages, and your saved items. We never sell your data, and we don't run third-party ad-tracking of any kind.</p>
  <p>See our <button type="button" class="link-button" data-static-page="privacyPolicy">Privacy Policy</button> for the full detail, and our <button type="button" class="link-button" data-static-page="dataSubjectRights">Data Subject Rights</button> page for how to access, correct, or delete your data.</p>
`},
    sv: { title: "Datasäkerhet", body: `
  <p>FindNord lagrar bara det som behövs för att driva marknadsplatsen: dina kontouppgifter, dina annonser och foton, dina meddelanden och dina sparade annonser. Vi säljer aldrig dina uppgifter, och vi kör ingen tredjeparts annonsspårning av något slag.</p>
  <p>Se vår <button type="button" class="link-button" data-static-page="privacyPolicy">Integritetspolicy</button> för alla detaljer, och vår sida <button type="button" class="link-button" data-static-page="dataSubjectRights">Den registrerades rättigheter (DSR)</button> för hur du får tillgång till, rättar eller raderar dina uppgifter.</p>
`},
    no: { title: "Datasikkerhet", body: `
  <p>FindNord lagrer bare det som er nødvendig for å drive markedsplassen: kontoopplysningene dine, annonsene og bildene dine, meldingene dine og de lagrede annonsene dine. Vi selger aldri dataene dine, og vi kjører ingen tredjeparts annonsesporing av noe slag.</p>
  <p>Se vår <button type="button" class="link-button" data-static-page="privacyPolicy">Personvernerklæring</button> for alle detaljer, og siden vår <button type="button" class="link-button" data-static-page="dataSubjectRights">Den registrertes rettigheter (DSR)</button> for hvordan du får tilgang til, retter eller sletter dataene dine.</p>
`},
    da: { title: "Datasikkerhed", body: `
  <p>FindNord gemmer kun det, der er nødvendigt for at drive markedspladsen: dine kontooplysninger, dine annoncer og billeder, dine beskeder og dine gemte annoncer. Vi sælger aldrig dine data, og vi kører ingen form for tredjeparts annoncesporing.</p>
  <p>Se vores <button type="button" class="link-button" data-static-page="privacyPolicy">Privatlivspolitik</button> for alle detaljer, og vores side <button type="button" class="link-button" data-static-page="dataSubjectRights">Den registreredes rettigheder (DSR)</button> for, hvordan du får adgang til, retter eller sletter dine data.</p>
`},
    fi: { title: "Tietoturva", body: `
  <p>FindNord tallentaa vain sen, mitä markkinapaikan ylläpitämiseen tarvitaan: tilisi tiedot, ilmoituksesi ja kuvasi, viestisi ja tallentamasi kohteet. Emme koskaan myy tietojasi, emmekä käytä minkäänlaista kolmannen osapuolen mainosseurantaa.</p>
  <p>Katso <button type="button" class="link-button" data-static-page="privacyPolicy">Tietosuojakäytäntö</button>-sivultamme kaikki tiedot, ja sivultamme <button type="button" class="link-button" data-static-page="dataSubjectRights">Rekisteröidyn oikeudet (DSR)</button>, miten voit käyttää, korjata tai poistaa tietojasi.</p>
`},
    is: { title: "Gagnaöryggi", body: `
  <p>FindNord geymir aðeins það sem þarf til að reka markaðstorgið: aðgangsupplýsingarnar þínar, auglýsingarnar og myndirnar þínar, skilaboðin þín og vistaða hluti þína. Við seljum aldrei gögnin þín og notum enga þriðja aðila auglýsingarakningu af neinu tagi.</p>
  <p>Skoðaðu <button type="button" class="link-button" data-static-page="privacyPolicy">Persónuverndarstefna</button> okkar til að fá allar upplýsingar, og síðuna <button type="button" class="link-button" data-static-page="dataSubjectRights">Réttindi skráðra einstaklinga (DSR)</button> til að sjá hvernig þú getur nálgast, leiðrétt eða eytt gögnunum þínum.</p>
`}
  },
  aboutMicany: {
    en: { title: "Micany Investment", body: `
  <p>${COMPANY_LINE_BY_LANG.en}</p>
  <p>For company or partnership inquiries, contact <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`},
    sv: { title: "Micany Investment", body: `
  <p>${COMPANY_LINE_BY_LANG.sv}</p>
  <p>För företags- eller samarbetsförfrågningar, kontakta <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`},
    no: { title: "Micany Investment", body: `
  <p>${COMPANY_LINE_BY_LANG.no}</p>
  <p>For henvendelser om selskap eller samarbeid, kontakt <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`},
    da: { title: "Micany Investment", body: `
  <p>${COMPANY_LINE_BY_LANG.da}</p>
  <p>For virksomheds- eller samarbejdshenvendelser, kontakt <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`},
    fi: { title: "Micany Investment", body: `
  <p>${COMPANY_LINE_BY_LANG.fi}</p>
  <p>Yritys- tai yhteistyötiedusteluissa ota yhteyttä osoitteeseen <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`},
    is: { title: "Micany Investment", body: `
  <p>${COMPANY_LINE_BY_LANG.is}</p>
  <p>Fyrir fyrirspurnir um fyrirtækið eða samstarf, hafðu samband við <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`}
  },
  privacyPolicy: {
    en: { title: "Privacy Policy", body: `
  <p class="static-page-updated">Last updated: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.en} This policy explains what personal data FindNord collects, why, and how you can control it.</p>
  <h3>What we collect</h3>
  <ul>
    <li><strong>Account data:</strong> your name and email address, and either a securely hashed password or a Google account identifier -- never your actual password or Google credentials.</li>
    <li><strong>Content you create:</strong> listings, photos, messages, saved items, reports, and reviews you post.</li>
    <li><strong>A session identifier</strong> (a single cookie) that keeps you signed in -- see our <button type="button" class="link-button" data-static-page="cookiePolicy">Cookie Policy</button>.</li>
  </ul>
  <h3>Why we collect it</h3>
  <p>Solely to operate the marketplace: to show your listings to other members, deliver your messages, remember what you've saved, and keep your account secure. We do not sell personal data, and we do not share it with third parties for advertising.</p>
  <h3>Legal basis (GDPR)</h3>
  <p>We process account and listing data on the basis of contractual necessity (to provide the service you signed up for) and legitimate interest (to keep the marketplace safe, e.g. review moderation and abuse prevention).</p>
  <h3>How long we keep it</h3>
  <p>For as long as your account is active. If you'd like your data deleted, see your <button type="button" class="link-button" data-static-page="dataSubjectRights">Data Subject Rights</button>.</p>
  <h3>Your rights</h3>
  <p>See the dedicated <button type="button" class="link-button" data-static-page="dataSubjectRights">Data Subject Rights</button> page for your full rights under GDPR and how to exercise them.</p>
  <h3>Contact</h3>
  <p>Questions about this policy: <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`},
    sv: { title: "Integritetspolicy", body: `
  <p class="static-page-updated">Senast uppdaterad: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.sv} Den här policyn förklarar vilka personuppgifter FindNord samlar in, varför, och hur du kan kontrollera dem.</p>
  <h3>Vad vi samlar in</h3>
  <ul>
    <li><strong>Kontouppgifter:</strong> ditt namn och din e-postadress, samt antingen ett säkert hashat lösenord eller en Google-kontoidentifierare -- aldrig ditt faktiska lösenord eller dina Google-uppgifter.</li>
    <li><strong>Innehåll du skapar:</strong> annonser, foton, meddelanden, sparade annonser, anmälningar och recensioner du publicerar.</li>
    <li><strong>En sessionsidentifierare</strong> (en enda cookie) som håller dig inloggad -- se vår <button type="button" class="link-button" data-static-page="cookiePolicy">Cookiepolicy</button>.</li>
  </ul>
  <h3>Varför vi samlar in det</h3>
  <p>Enbart för att driva marknadsplatsen: för att visa dina annonser för andra medlemmar, leverera dina meddelanden, komma ihåg vad du har sparat och hålla ditt konto säkert. Vi säljer inte personuppgifter, och vi delar dem inte med tredje part för annonsering.</p>
  <h3>Rättslig grund enligt GDPR (dataskyddsförordningen)</h3>
  <p>Vi behandlar konto- och annonsuppgifter på grundval av avtalsnödvändighet (för att tillhandahålla tjänsten du registrerade dig för) och berättigat intresse (för att hålla marknadsplatsen säker, t.ex. granskning av recensioner och förebyggande av missbruk).</p>
  <h3>Hur länge vi behåller det</h3>
  <p>Så länge ditt konto är aktivt. Om du vill att dina uppgifter ska raderas, se <button type="button" class="link-button" data-static-page="dataSubjectRights">Den registrerades rättigheter (DSR)</button>.</p>
  <h3>Dina rättigheter</h3>
  <p>Se den dedikerade sidan <button type="button" class="link-button" data-static-page="dataSubjectRights">Den registrerades rättigheter (DSR)</button> för dina fullständiga rättigheter enligt GDPR och hur du utövar dem.</p>
  <h3>Kontakt</h3>
  <p>Frågor om denna policy: <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`},
    no: { title: "Personvernerklæring", body: `
  <p class="static-page-updated">Sist oppdatert: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.no} Denne policyen forklarer hvilke personopplysninger FindNord samler inn, hvorfor, og hvordan du kan kontrollere dem.</p>
  <h3>Hva vi samler inn</h3>
  <ul>
    <li><strong>Kontoopplysninger:</strong> navnet og e-postadressen din, samt enten et sikkert hashet passord eller en Google-kontoidentifikator -- aldri ditt faktiske passord eller dine Google-opplysninger.</li>
    <li><strong>Innhold du skaper:</strong> annonser, bilder, meldinger, lagrede annonser, rapporter og anmeldelser du legger ut.</li>
    <li><strong>En øktidentifikator</strong> (én enkelt informasjonskapsel) som holder deg innlogget -- se vår <button type="button" class="link-button" data-static-page="cookiePolicy">Retningslinjer for cookies</button>.</li>
  </ul>
  <h3>Hvorfor vi samler det inn</h3>
  <p>Utelukkende for å drive markedsplassen: for å vise annonsene dine til andre medlemmer, levere meldingene dine, huske hva du har lagret, og holde kontoen din sikker. Vi selger ikke personopplysninger, og vi deler dem ikke med tredjeparter til annonseformål.</p>
  <h3>Rettslig grunnlag i henhold til GDPR (personvernforordningen)</h3>
  <p>Vi behandler konto- og annonsedata på grunnlag av avtalemessig nødvendighet (for å levere tjenesten du registrerte deg for) og berettiget interesse (for å holde markedsplassen trygg, f.eks. gjennomgang av anmeldelser og forebygging av misbruk).</p>
  <h3>Hvor lenge vi beholder det</h3>
  <p>Så lenge kontoen din er aktiv. Hvis du ønsker at dataene dine skal slettes, se <button type="button" class="link-button" data-static-page="dataSubjectRights">Den registrertes rettigheter (DSR)</button>.</p>
  <h3>Dine rettigheter</h3>
  <p>Se den dedikerte siden <button type="button" class="link-button" data-static-page="dataSubjectRights">Den registrertes rettigheter (DSR)</button> for dine fulle rettigheter under GDPR og hvordan du utøver dem.</p>
  <h3>Kontakt</h3>
  <p>Spørsmål om denne policyen: <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`},
    da: { title: "Privatlivspolitik", body: `
  <p class="static-page-updated">Sidst opdateret: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.da} Denne politik forklarer, hvilke personoplysninger FindNord indsamler, hvorfor, og hvordan du kan kontrollere dem.</p>
  <h3>Hvad vi indsamler</h3>
  <ul>
    <li><strong>Kontooplysninger:</strong> dit navn og din e-mailadresse, samt enten en sikkert hashet adgangskode eller en Google-kontoidentifikator -- aldrig din faktiske adgangskode eller dine Google-oplysninger.</li>
    <li><strong>Indhold, du opretter:</strong> annoncer, billeder, beskeder, gemte annoncer, anmeldelser og bedømmelser, du udgiver.</li>
    <li><strong>En sessionsidentifikator</strong> (én enkelt cookie), der holder dig logget ind -- se vores <button type="button" class="link-button" data-static-page="cookiePolicy">Cookiepolitik</button>.</li>
  </ul>
  <h3>Hvorfor vi indsamler det</h3>
  <p>Udelukkende for at drive markedspladsen: for at vise dine annoncer til andre medlemmer, levere dine beskeder, huske hvad du har gemt, og holde din konto sikker. Vi sælger ikke personoplysninger, og vi deler dem ikke med tredjeparter til reklameformål.</p>
  <h3>Retligt grundlag i henhold til GDPR (databeskyttelsesforordningen)</h3>
  <p>Vi behandler konto- og annoncedata på grundlag af kontraktmæssig nødvendighed (for at levere den tjeneste, du tilmeldte dig) og legitim interesse (for at holde markedspladsen sikker, f.eks. gennemgang af anmeldelser og forebyggelse af misbrug).</p>
  <h3>Hvor længe vi opbevarer det</h3>
  <p>Så længe din konto er aktiv. Hvis du ønsker, at dine data skal slettes, se <button type="button" class="link-button" data-static-page="dataSubjectRights">Den registreredes rettigheder (DSR)</button>.</p>
  <h3>Dine rettigheder</h3>
  <p>Se den dedikerede side <button type="button" class="link-button" data-static-page="dataSubjectRights">Den registreredes rettigheder (DSR)</button> for dine fulde rettigheder under GDPR, og hvordan du udøver dem.</p>
  <h3>Kontakt</h3>
  <p>Spørgsmål om denne politik: <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`},
    fi: { title: "Tietosuojakäytäntö", body: `
  <p class="static-page-updated">Viimeksi päivitetty: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.fi} Tämä käytäntö selittää, mitä henkilötietoja FindNord kerää, miksi, ja miten voit hallita niitä.</p>
  <h3>Mitä keräämme</h3>
  <ul>
    <li><strong>Tilitiedot:</strong> nimesi ja sähköpostiosoitteesi, sekä joko turvallisesti tiivistetty (hash) salasana tai Google-tilin tunniste -- ei koskaan varsinaista salasanaasi tai Google-tunnuksiasi.</li>
    <li><strong>Luomasi sisältö:</strong> ilmoitukset, kuvat, viestit, tallentamasi kohteet, ilmoitukset väärinkäytöksistä ja julkaisemasi arvostelut.</li>
    <li><strong>Istuntotunniste</strong> (yksi ainoa eväste), joka pitää sinut kirjautuneena -- katso <button type="button" class="link-button" data-static-page="cookiePolicy">Evästekäytäntö</button>.</li>
  </ul>
  <h3>Miksi keräämme sitä</h3>
  <p>Ainoastaan markkinapaikan ylläpitämiseksi: näyttääksemme ilmoituksesi muille jäsenille, toimittaaksemme viestisi, muistaaksemme tallentamasi kohteet ja pitääksemme tilisi turvassa. Emme myy henkilötietoja, emmekä jaa niitä kolmansille osapuolille mainontatarkoituksiin.</p>
  <h3>Käsittelyn oikeusperuste — GDPR (tietosuoja-asetus)</h3>
  <p>Käsittelemme tili- ja ilmoitustietoja sopimuksen täytäntöönpanon edellyttämällä perusteella (tarjotaksemme palvelun, johon rekisteröidyit) ja oikeutetun edun perusteella (pitääksemme markkinapaikan turvallisena, esim. arvostelujen valvonta ja väärinkäytösten ehkäisy).</p>
  <h3>Kuinka kauan säilytämme sitä</h3>
  <p>Niin kauan kuin tilisi on aktiivinen. Jos haluat, että tietosi poistetaan, katso <button type="button" class="link-button" data-static-page="dataSubjectRights">Rekisteröidyn oikeudet (DSR)</button>.</p>
  <h3>Oikeutesi</h3>
  <p>Katso sivu <button type="button" class="link-button" data-static-page="dataSubjectRights">Rekisteröidyn oikeudet (DSR)</button> saadaksesi tietää täydet oikeutesi GDPR:n mukaisesti ja miten käytät niitä.</p>
  <h3>Yhteystiedot</h3>
  <p>Kysymykset tästä käytännöstä: <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`},
    is: { title: "Persónuverndarstefna", body: `
  <p class="static-page-updated">Síðast uppfært: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.is} Þessi stefna útskýrir hvaða persónuupplýsingar FindNord safnar, hvers vegna, og hvernig þú getur stjórnað þeim.</p>
  <h3>Hvað við söfnum</h3>
  <ul>
    <li><strong>Aðgangsupplýsingar:</strong> nafnið þitt og netfang, ásamt annaðhvort öruggu dulkóðuðu (hash) lykilorði eða Google-aðgangskennitölu -- aldrei raunverulegt lykilorðið þitt eða Google-upplýsingar.</li>
    <li><strong>Efni sem þú býrð til:</strong> auglýsingar, myndir, skilaboð, vistaða hluti, tilkynningar og umsagnir sem þú birtir.</li>
    <li><strong>Setukenni</strong> (ein stök vefkaka) sem heldur þér skráðum inn -- sjá <button type="button" class="link-button" data-static-page="cookiePolicy">Vafrakökustefna</button> okkar.</li>
  </ul>
  <h3>Af hverju við söfnum því</h3>
  <p>Eingöngu til að reka markaðstorgið: til að sýna auglýsingarnar þínar öðrum meðlimum, koma skilaboðunum þínum til skila, muna hvað þú hefur vistað, og halda aðgangi þínum öruggum. Við seljum ekki persónuupplýsingar og deilum þeim ekki með þriðja aðila í auglýsingaskyni.</p>
  <h3>Lagalegar forsendur — GDPR (persónuverndarreglugerðin)</h3>
  <p>Við vinnum úr aðgangs- og auglýsingagögnum á grundvelli samningsbundinnar nauðsynjar (til að veita þjónustuna sem þú skráðir þig fyrir) og lögmætra hagsmuna (til að halda markaðstorginu öruggu, t.d. yfirferð umsagna og forvarnir gegn misnotkun).</p>
  <h3>Hversu lengi við geymum það</h3>
  <p>Svo lengi sem aðgangurinn þinn er virkur. Ef þú vilt að gögnunum þínum sé eytt, sjá <button type="button" class="link-button" data-static-page="dataSubjectRights">Réttindi skráðra einstaklinga (DSR)</button>.</p>
  <h3>Réttindi þín</h3>
  <p>Sjá sérstaka síðu <button type="button" class="link-button" data-static-page="dataSubjectRights">Réttindi skráðra einstaklinga (DSR)</button> fyrir öll réttindi þín samkvæmt GDPR og hvernig þú beitir þeim.</p>
  <h3>Hafa samband</h3>
  <p>Spurningar um þessa stefnu: <a href="mailto:support@findnord.com">support@findnord.com</a>.</p>
`}
  },
  dataSubjectRights: {
    en: { title: "Data Subject Rights (DSR)", body: `
  <p class="static-page-updated">Last updated: 2026</p>
  <p>Under the General Data Protection Regulation (GDPR), you have the following rights over your personal data on FindNord:</p>
  <ul>
    <li><strong>Right to access</strong> -- request a copy of the personal data we hold about you.</li>
    <li><strong>Right to rectification</strong> -- correct inaccurate or incomplete data.</li>
    <li><strong>Right to erasure</strong> ("right to be forgotten") -- request deletion of your account and associated personal data.</li>
    <li><strong>Right to restrict processing</strong> -- ask us to limit how we use your data in certain circumstances.</li>
    <li><strong>Right to data portability</strong> -- receive your data in a structured, commonly-used format.</li>
    <li><strong>Right to object</strong> -- object to processing based on legitimate interest.</li>
    <li><strong>Right to withdraw consent</strong> -- where processing is based on consent, withdraw it at any time.</li>
    <li><strong>Right to lodge a complaint</strong> with your local data protection supervisory authority.</li>
  </ul>
  <h3>How to exercise your rights</h3>
  <p>Email <a href="mailto:support@findnord.com">support@findnord.com</a> from the address on your account, stating which right you'd like to exercise. We will respond within 30 days, as required by GDPR.</p>
`},
    sv: { title: "Den registrerades rättigheter (DSR)", body: `
  <p class="static-page-updated">Senast uppdaterad: 2026</p>
  <p>Enligt GDPR (dataskyddsförordningen) har du följande rättigheter över dina personuppgifter på FindNord:</p>
  <ul>
    <li><strong>Rätt till tillgång</strong> -- begär en kopia av de personuppgifter vi har om dig.</li>
    <li><strong>Rätt till rättelse</strong> -- korrigera felaktiga eller ofullständiga uppgifter.</li>
    <li><strong>Rätt till radering</strong> ("rätten att bli glömd") -- begär radering av ditt konto och tillhörande personuppgifter.</li>
    <li><strong>Rätt till begränsning av behandling</strong> -- be oss begränsa hur vi använder dina uppgifter under vissa omständigheter.</li>
    <li><strong>Rätt till dataportabilitet</strong> -- få dina uppgifter i ett strukturerat, allmänt använt format.</li>
    <li><strong>Rätt att invända</strong> -- invända mot behandling som grundas på berättigat intresse.</li>
    <li><strong>Rätt att återkalla samtycke</strong> -- där behandlingen grundas på samtycke, återkalla det när som helst.</li>
    <li><strong>Rätt att lämna in klagomål</strong> till din lokala tillsynsmyndighet för dataskydd.</li>
  </ul>
  <h3>Hur du utövar dina rättigheter</h3>
  <p>Skicka e-post till <a href="mailto:support@findnord.com">support@findnord.com</a> från e-postadressen kopplad till ditt konto, och ange vilken rättighet du vill utöva. Vi svarar inom 30 dagar, i enlighet med GDPR.</p>
`},
    no: { title: "Den registrertes rettigheter (DSR)", body: `
  <p class="static-page-updated">Sist oppdatert: 2026</p>
  <p>I henhold til GDPR (personvernforordningen) har du følgende rettigheter over personopplysningene dine på FindNord:</p>
  <ul>
    <li><strong>Rett til innsyn</strong> -- be om en kopi av personopplysningene vi har om deg.</li>
    <li><strong>Rett til retting</strong> -- rette unøyaktige eller ufullstendige opplysninger.</li>
    <li><strong>Rett til sletting</strong> («retten til å bli glemt») -- be om at kontoen din og tilhørende personopplysninger slettes.</li>
    <li><strong>Rett til begrensning av behandling</strong> -- be oss begrense hvordan vi bruker opplysningene dine i visse tilfeller.</li>
    <li><strong>Rett til dataportabilitet</strong> -- motta opplysningene dine i et strukturert, vanlig brukt format.</li>
    <li><strong>Rett til å protestere</strong> -- protestere mot behandling basert på berettiget interesse.</li>
    <li><strong>Rett til å trekke tilbake samtykke</strong> -- der behandlingen er basert på samtykke, trekke det tilbake når som helst.</li>
    <li><strong>Rett til å klage</strong> til din lokale tilsynsmyndighet for personvern.</li>
  </ul>
  <h3>Slik utøver du rettighetene dine</h3>
  <p>Send e-post til <a href="mailto:support@findnord.com">support@findnord.com</a> fra adressen knyttet til kontoen din, og oppgi hvilken rettighet du ønsker å utøve. Vi svarer innen 30 dager, som påkrevd av GDPR.</p>
`},
    da: { title: "Den registreredes rettigheder (DSR)", body: `
  <p class="static-page-updated">Sidst opdateret: 2026</p>
  <p>I henhold til GDPR (databeskyttelsesforordningen) har du følgende rettigheder over dine personoplysninger på FindNord:</p>
  <ul>
    <li><strong>Ret til indsigt</strong> -- anmod om en kopi af de personoplysninger, vi har om dig.</li>
    <li><strong>Ret til berigtigelse</strong> -- ret unøjagtige eller ufuldstændige oplysninger.</li>
    <li><strong>Ret til sletning</strong> ("retten til at blive glemt") -- anmod om sletning af din konto og tilhørende personoplysninger.</li>
    <li><strong>Ret til begrænsning af behandling</strong> -- bed os om at begrænse, hvordan vi bruger dine data under visse omstændigheder.</li>
    <li><strong>Ret til dataportabilitet</strong> -- modtag dine data i et struktureret, almindeligt anvendt format.</li>
    <li><strong>Ret til indsigelse</strong> -- gøre indsigelse mod behandling baseret på legitim interesse.</li>
    <li><strong>Ret til at trække samtykke tilbage</strong> -- hvor behandlingen er baseret på samtykke, kan du trække det tilbage når som helst.</li>
    <li><strong>Ret til at indgive klage</strong> til din lokale tilsynsmyndighed for databeskyttelse.</li>
  </ul>
  <h3>Sådan udøver du dine rettigheder</h3>
  <p>Send en e-mail til <a href="mailto:support@findnord.com">support@findnord.com</a> fra den adresse, der er knyttet til din konto, og angiv, hvilken rettighed du gerne vil udøve. Vi svarer inden for 30 dage, som krævet af GDPR.</p>
`},
    fi: { title: "Rekisteröidyn oikeudet (DSR)", body: `
  <p class="static-page-updated">Viimeksi päivitetty: 2026</p>
  <p>GDPR (tietosuoja-asetuksen) mukaisesti sinulla on seuraavat oikeudet henkilötietoihisi FindNordissa:</p>
  <ul>
    <li><strong>Oikeus tutustua tietoihin</strong> -- pyytää kopio sinusta tallennetuista henkilötiedoista.</li>
    <li><strong>Oikeus tietojen oikaisemiseen</strong> -- korjata virheelliset tai puutteelliset tiedot.</li>
    <li><strong>Oikeus tietojen poistamiseen</strong> ("oikeus tulla unohdetuksi") -- pyytää tilisi ja siihen liittyvien henkilötietojen poistamista.</li>
    <li><strong>Oikeus käsittelyn rajoittamiseen</strong> -- pyytää meitä rajoittamaan tietojesi käyttöä tietyissä tilanteissa.</li>
    <li><strong>Oikeus siirtää tiedot järjestelmästä toiseen</strong> -- saada tietosi jäsennellyssä, yleisesti käytetyssä muodossa.</li>
    <li><strong>Vastustamisoikeus</strong> -- vastustaa oikeutettuun etuun perustuvaa käsittelyä.</li>
    <li><strong>Oikeus peruuttaa suostumus</strong> -- jos käsittely perustuu suostumukseen, voit peruuttaa sen milloin tahansa.</li>
    <li><strong>Oikeus tehdä valitus</strong> paikalliselle tietosuojan valvontaviranomaiselle.</li>
  </ul>
  <h3>Miten käytät oikeuksiasi</h3>
  <p>Lähetä sähköpostia osoitteeseen <a href="mailto:support@findnord.com">support@findnord.com</a> tilillesi liitetystä osoitteesta ja kerro, mitä oikeutta haluat käyttää. Vastaamme 30 päivän kuluessa, kuten GDPR edellyttää.</p>
`},
    is: { title: "Réttindi skráðra einstaklinga (DSR)", body: `
  <p class="static-page-updated">Síðast uppfært: 2026</p>
  <p>Samkvæmt GDPR (persónuverndarreglugerðin) hefur þú eftirfarandi réttindi yfir persónuupplýsingum þínum á FindNord:</p>
  <ul>
    <li><strong>Réttur til aðgangs</strong> -- óska eftir afriti af þeim persónuupplýsingum sem við höfum um þig.</li>
    <li><strong>Réttur til leiðréttingar</strong> -- leiðrétta rangar eða ófullkomnar upplýsingar.</li>
    <li><strong>Réttur til eyðingar</strong> („rétturinn til að gleymast“) -- óska eftir eyðingu aðgangsins þíns og tengdra persónuupplýsinga.</li>
    <li><strong>Réttur til að takmarka vinnslu</strong> -- biðja okkur um að takmarka hvernig við notum gögnin þín við ákveðnar aðstæður.</li>
    <li><strong>Réttur til gagnaflutnings</strong> -- fá gögnin þín afhent á skipulögðu, almennt notuðu sniði.</li>
    <li><strong>Andmælaréttur</strong> -- andmæla vinnslu sem byggist á lögmætum hagsmunum.</li>
    <li><strong>Réttur til að afturkalla samþykki</strong> -- þar sem vinnsla byggist á samþykki, afturkalla það hvenær sem er.</li>
    <li><strong>Réttur til að leggja fram kvörtun</strong> hjá þínu staðbundna eftirlitsyfirvaldi um persónuvernd.</li>
  </ul>
  <h3>Hvernig þú beitir réttindum þínum</h3>
  <p>Sendu tölvupóst á <a href="mailto:support@findnord.com">support@findnord.com</a> frá netfanginu sem tengt er aðgangi þínum, og tilgreindu hvaða rétt þú vilt beita. Við svörum innan 30 daga, eins og GDPR krefst.</p>
`}
  },
  termsOfService: {
    en: { title: "Terms of Service", body: `
  <p class="static-page-updated">Last updated: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.en} By creating an account or using FindNord, you agree to these terms.</p>
  <h3>Your account</h3>
  <p>You must provide accurate information when registering and are responsible for keeping your password secure. You must be old enough to form a binding contract in your country to use FindNord.</p>
  <h3>Listings</h3>
  <p>You may only list items you have the legal right to sell, and your listing's description must be accurate. Prohibited, stolen, counterfeit, or illegal items are never allowed.</p>
  <h3>Conduct</h3>
  <p>No harassment, hate speech, or abusive language toward other members, including in reviews -- see our <button type="button" class="link-button" data-static-page="contentModeration">Content &amp; Moderation</button> policy for how this is enforced.</p>
  <h3>No payments or escrow</h3>
  <p>FindNord is a place to find and arrange deals -- it does not process payments, hold funds, or guarantee any transaction. Buyers and sellers are solely responsible for arranging and completing their own exchanges. See our <button type="button" class="link-button" data-static-page="safetyTips">Safety Tips</button>.</p>
  <h3>Liability</h3>
  <p>FindNord is provided "as is." We are not responsible for the condition of items listed, the conduct of members, or the outcome of any transaction arranged through the platform.</p>
  <h3>Termination</h3>
  <p>We may suspend or remove an account that violates these terms, including the review-abuse policy described in our <button type="button" class="link-button" data-static-page="contentModeration">Content &amp; Moderation</button> page.</p>
  <h3>Contact</h3>
  <p><a href="mailto:support@findnord.com">support@findnord.com</a></p>
`},
    sv: { title: "Användarvillkor", body: `
  <p class="static-page-updated">Senast uppdaterad: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.sv} Genom att skapa ett konto eller använda FindNord godkänner du dessa villkor.</p>
  <h3>Ditt konto</h3>
  <p>Du måste ange korrekt information vid registrering och ansvarar för att hålla ditt lösenord säkert. Du måste vara gammal nog att ingå ett bindande avtal i ditt land för att använda FindNord.</p>
  <h3>Annonser</h3>
  <p>Du får bara annonsera föremål du har laglig rätt att sälja, och din annons beskrivning måste vara korrekt. Förbjudna, stulna, förfalskade eller olagliga föremål är aldrig tillåtna.</p>
  <h3>Uppförande</h3>
  <p>Inga trakasserier, hatiskt språk eller kränkande språk mot andra medlemmar, inklusive i recensioner -- se vår policy för <button type="button" class="link-button" data-static-page="contentModeration">Innehåll och moderering</button> för hur detta upprätthålls.</p>
  <h3>Inga betalningar eller deposition</h3>
  <p>FindNord är en plats för att hitta och arrangera affärer -- det hanterar inte betalningar, håller inte inne pengar och garanterar inte några transaktioner. Köpare och säljare ansvarar ensamma för att arrangera och slutföra sina egna affärer. Se våra <button type="button" class="link-button" data-static-page="safetyTips">Säkerhetstips</button>.</p>
  <h3>Ansvar</h3>
  <p>FindNord tillhandahålls "i befintligt skick". Vi ansvarar inte för skicket på annonserade föremål, medlemmarnas uppförande, eller resultatet av någon transaktion som arrangerats via plattformen.</p>
  <h3>Uppsägning</h3>
  <p>Vi kan stänga av eller ta bort ett konto som bryter mot dessa villkor, inklusive policyn mot missbruk av recensioner som beskrivs på vår sida <button type="button" class="link-button" data-static-page="contentModeration">Innehåll och moderering</button>.</p>
  <h3>Kontakt</h3>
  <p><a href="mailto:support@findnord.com">support@findnord.com</a></p>
`},
    no: { title: "Brukervilkår", body: `
  <p class="static-page-updated">Sist oppdatert: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.no} Ved å opprette en konto eller bruke FindNord godtar du disse vilkårene.</p>
  <h3>Kontoen din</h3>
  <p>Du må oppgi nøyaktig informasjon når du registrerer deg, og er ansvarlig for å holde passordet ditt sikkert. Du må være gammel nok til å inngå en bindende avtale i landet ditt for å bruke FindNord.</p>
  <h3>Annonser</h3>
  <p>Du kan bare legge ut annonser for varer du har lovlig rett til å selge, og beskrivelsen av annonsen din må være nøyaktig. Forbudte, stjålne, forfalskede eller ulovlige varer er aldri tillatt.</p>
  <h3>Oppførsel</h3>
  <p>Ingen trakassering, hatytringer eller krenkende språk mot andre medlemmer, heller ikke i anmeldelser -- se vår policy for <button type="button" class="link-button" data-static-page="contentModeration">Innhold og moderering</button> for hvordan dette håndheves.</p>
  <h3>Ingen betalinger eller depot</h3>
  <p>FindNord er et sted for å finne og avtale handler -- det behandler ikke betalinger, holder ikke tilbake penger, og garanterer ikke noen transaksjon. Kjøpere og selgere er selv fullt ansvarlige for å avtale og fullføre sine egne handler. Se våre <button type="button" class="link-button" data-static-page="safetyTips">Sikkerhetstips</button>.</p>
  <h3>Ansvar</h3>
  <p>FindNord tilbys "som det er". Vi er ikke ansvarlige for tilstanden til varer som legges ut, medlemmenes oppførsel, eller utfallet av noen transaksjon avtalt gjennom plattformen.</p>
  <h3>Oppsigelse</h3>
  <p>Vi kan suspendere eller fjerne en konto som bryter disse vilkårene, inkludert retningslinjene mot misbruk av anmeldelser beskrevet på vår side <button type="button" class="link-button" data-static-page="contentModeration">Innhold og moderering</button>.</p>
  <h3>Kontakt</h3>
  <p><a href="mailto:support@findnord.com">support@findnord.com</a></p>
`},
    da: { title: "Servicevilkår", body: `
  <p class="static-page-updated">Sidst opdateret: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.da} Ved at oprette en konto eller bruge FindNord accepterer du disse vilkår.</p>
  <h3>Din konto</h3>
  <p>Du skal give korrekte oplysninger, når du registrerer dig, og du er ansvarlig for at holde din adgangskode sikker. Du skal være gammel nok til at indgå en bindende aftale i dit land for at bruge FindNord.</p>
  <h3>Annoncer</h3>
  <p>Du må kun oprette annoncer for varer, du har lovlig ret til at sælge, og din annonces beskrivelse skal være korrekt. Forbudte, stjålne, forfalskede eller ulovlige varer er aldrig tilladt.</p>
  <h3>Adfærd</h3>
  <p>Ingen chikane, hadefuld tale eller krænkende sprog over for andre medlemmer, heller ikke i anmeldelser -- se vores <button type="button" class="link-button" data-static-page="contentModeration">Indhold og moderation</button>-politik for, hvordan dette håndhæves.</p>
  <h3>Ingen betalinger eller deponering</h3>
  <p>FindNord er et sted til at finde og aftale handler -- det behandler ikke betalinger, opbevarer ikke penge og garanterer ingen transaktioner. Købere og sælgere er alene ansvarlige for at aftale og gennemføre deres egne handler. Se vores <button type="button" class="link-button" data-static-page="safetyTips">Sikkerhedstips</button>.</p>
  <h3>Ansvar</h3>
  <p>FindNord leveres, "som det er og forefindes". Vi er ikke ansvarlige for tilstanden af de annoncerede varer, medlemmernes adfærd, eller resultatet af nogen transaktion aftalt via platformen.</p>
  <h3>Opsigelse</h3>
  <p>Vi kan suspendere eller fjerne en konto, der overtræder disse vilkår, herunder politikken mod misbrug af anmeldelser beskrevet på vores side <button type="button" class="link-button" data-static-page="contentModeration">Indhold og moderation</button>.</p>
  <h3>Kontakt</h3>
  <p><a href="mailto:support@findnord.com">support@findnord.com</a></p>
`},
    fi: { title: "Käyttöehdot", body: `
  <p class="static-page-updated">Viimeksi päivitetty: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.fi} Luomalla tilin tai käyttämällä FindNordia hyväksyt nämä ehdot.</p>
  <h3>Tilisi</h3>
  <p>Sinun on annettava tarkat tiedot rekisteröityessäsi, ja olet vastuussa salasanasi pitämisestä turvassa. Sinun on oltava tarpeeksi vanha tekemään sitova sopimus maassasi käyttääksesi FindNordia.</p>
  <h3>Ilmoitukset</h3>
  <p>Voit julkaista ilmoituksia vain tuotteista, joihin sinulla on laillinen myyntioikeus, ja ilmoituksesi kuvauksen on oltava paikkansapitävä. Kiellettyjä, varastettuja, väärennettyjä tai laittomia tuotteita ei koskaan sallita.</p>
  <h3>Käytös</h3>
  <p>Ei häirintää, vihapuhetta tai loukkaavaa kieltä muita jäseniä kohtaan, ei myöskään arvosteluissa -- katso <button type="button" class="link-button" data-static-page="contentModeration">Sisältö ja moderointi</button> -käytäntömme siitä, miten tätä valvotaan.</p>
  <h3>Ei maksuja eikä lukkotiliä</h3>
  <p>FindNord on paikka, jossa löydetään ja sovitaan kaupoista -- se ei käsittele maksuja, säilytä varoja eikä takaa mitään kauppaa. Ostajat ja myyjät ovat yksin vastuussa omien kauppojensa sopimisesta ja loppuun saattamisesta. Katso <button type="button" class="link-button" data-static-page="safetyTips">Turvallisuusvinkit</button>.</p>
  <h3>Vastuu</h3>
  <p>FindNord tarjotaan "sellaisenaan". Emme vastaa ilmoitettujen tuotteiden kunnosta, jäsenten käytöksestä tai minkään alustan kautta sovitun kaupan lopputuloksesta.</p>
  <h3>Irtisanominen</h3>
  <p>Voimme keskeyttää tai poistaa tilin, joka rikkoo näitä ehtoja, mukaan lukien arvostelujen väärinkäyttöä koskevan käytännön, joka on kuvattu <button type="button" class="link-button" data-static-page="contentModeration">Sisältö ja moderointi</button> -sivullamme.</p>
  <h3>Yhteystiedot</h3>
  <p><a href="mailto:support@findnord.com">support@findnord.com</a></p>
`},
    is: { title: "Notendaskilmálar", body: `
  <p class="static-page-updated">Síðast uppfært: 2026</p>
  <p>${COMPANY_LINE_BY_LANG.is} Með því að stofna aðgang eða nota FindNord samþykkir þú þessa skilmála.</p>
  <h3>Aðgangurinn þinn</h3>
  <p>Þú verður að gefa upp réttar upplýsingar við skráningu og berð ábyrgð á að halda lykilorðinu þínu öruggu. Þú verður að vera nógu gamall til að gera bindandi samning í þínu landi til að nota FindNord.</p>
  <h3>Auglýsingar</h3>
  <p>Þú mátt aðeins auglýsa hluti sem þú hefur löglegan rétt til að selja, og lýsing auglýsingarinnar þinnar verður að vera nákvæm. Bannaðir, stolnir, falsaðir eða ólöglegir hlutir eru aldrei leyfðir.</p>
  <h3>Hegðun</h3>
  <p>Engin áreitni, hatursorðræða eða móðgandi orðalag gagnvart öðrum meðlimum, þar á meðal í umsögnum -- sjá stefnu okkar um <button type="button" class="link-button" data-static-page="contentModeration">Efni og eftirlit</button> til að sjá hvernig þessu er framfylgt.</p>
  <h3>Engar greiðslur eða vörslufé</h3>
  <p>FindNord er staður til að finna og skipuleggja viðskipti -- það annast ekki greiðslur, varðveitir ekki fé og ábyrgist engin viðskipti. Kaupendur og seljendur bera ein ábyrgð á að skipuleggja og ljúka eigin viðskiptum. Skoðaðu <button type="button" class="link-button" data-static-page="safetyTips">Öryggisráð</button> okkar.</p>
  <h3>Ábyrgð</h3>
  <p>FindNord er veitt „eins og það kemur fyrir“. Við berum ekki ábyrgð á ástandi auglýstra hluta, hegðun meðlima, eða niðurstöðu neinna viðskipta sem skipulögð eru í gegnum vettvanginn.</p>
  <h3>Uppsögn</h3>
  <p>Við getum lokað fyrir eða fjarlægt aðgang sem brýtur þessa skilmála, þar á meðal stefnuna gegn misnotkun umsagna sem lýst er á síðunni okkar <button type="button" class="link-button" data-static-page="contentModeration">Efni og eftirlit</button>.</p>
  <h3>Hafa samband</h3>
  <p><a href="mailto:support@findnord.com">support@findnord.com</a></p>
`}
  },
  cookiePolicy: {
    en: { title: "Cookie Policy", body: `
  <p class="static-page-updated">Last updated: 2026</p>
  <p>FindNord uses the minimum necessary to run the site -- there is no third-party ad-tracking or analytics cookie of any kind.</p>
  <ul>
    <li><strong><code>fn_session</code></strong> (essential, httpOnly cookie) -- keeps you signed in. Set only when you log in; removed when you log out.</li>
    <li><strong><code>fn_lang</code></strong> (browser local storage, not a cookie) -- remembers your chosen language.</li>
    <li><strong><code>fn_cookie_consent</code></strong> (browser local storage) -- remembers that you've seen this notice, so it isn't shown again.</li>
  </ul>
  <p>You can clear these anytime through your browser's own settings, or by signing out (which removes the session cookie). Because <code>fn_session</code> is essential to staying signed in, clearing it will simply sign you out.</p>
`},
    sv: { title: "Cookiepolicy", body: `
  <p class="static-page-updated">Senast uppdaterad: 2026</p>
  <p>FindNord använder det absolut nödvändigaste för att driva sidan -- det finns ingen tredjeparts-annonsspårning eller analyscookie av något slag.</p>
  <ul>
    <li><strong><code>fn_session</code></strong> (nödvändig, httpOnly-cookie) -- håller dig inloggad. Sätts bara när du loggar in; tas bort när du loggar ut.</li>
    <li><strong><code>fn_lang</code></strong> (webbläsarens lokala lagring, inte en cookie) -- kommer ihåg vilket språk du har valt.</li>
    <li><strong><code>fn_cookie_consent</code></strong> (webbläsarens lokala lagring) -- kommer ihåg att du har sett den här notisen, så att den inte visas igen.</li>
  </ul>
  <p>Du kan rensa dessa när som helst via webbläsarens egna inställningar, eller genom att logga ut (vilket tar bort sessionscookien). Eftersom <code>fn_session</code> är nödvändig för att förbli inloggad, loggar du helt enkelt ut dig om du rensar den.</p>
`},
    no: { title: "Retningslinjer for cookies", body: `
  <p class="static-page-updated">Sist oppdatert: 2026</p>
  <p>FindNord bruker det aller nødvendigste for å drive nettstedet -- det finnes ingen tredjeparts annonsesporing eller analyseinformasjonskapsel av noe slag.</p>
  <ul>
    <li><strong><code>fn_session</code></strong> (nødvendig, httpOnly-informasjonskapsel) -- holder deg innlogget. Settes bare når du logger inn; fjernes når du logger ut.</li>
    <li><strong><code>fn_lang</code></strong> (nettleserens lokale lagring, ikke en informasjonskapsel) -- husker språket du har valgt.</li>
    <li><strong><code>fn_cookie_consent</code></strong> (nettleserens lokale lagring) -- husker at du har sett dette varselet, slik at det ikke vises igjen.</li>
  </ul>
  <p>Du kan når som helst slette disse via nettleserens egne innstillinger, eller ved å logge ut (som fjerner øktinformasjonskapselen). Siden <code>fn_session</code> er nødvendig for å forbli innlogget, vil sletting av den ganske enkelt logge deg ut.</p>
`},
    da: { title: "Cookiepolitik", body: `
  <p class="static-page-updated">Sidst opdateret: 2026</p>
  <p>FindNord bruger kun det allermest nødvendige til at drive siden -- der er ingen tredjeparts annoncesporing eller analysecookie af nogen art.</p>
  <ul>
    <li><strong><code>fn_session</code></strong> (essentiel, httpOnly-cookie) -- holder dig logget ind. Sættes kun, når du logger ind; fjernes, når du logger ud.</li>
    <li><strong><code>fn_lang</code></strong> (browserens lokale lagring, ikke en cookie) -- husker dit valgte sprog.</li>
    <li><strong><code>fn_cookie_consent</code></strong> (browserens lokale lagring) -- husker, at du har set denne meddelelse, så den ikke vises igen.</li>
  </ul>
  <p>Du kan til enhver tid rydde disse via din browsers egne indstillinger, eller ved at logge ud (hvilket fjerner session-cookien). Da <code>fn_session</code> er essentiel for at forblive logget ind, vil rydning af den blot logge dig ud.</p>
`},
    fi: { title: "Evästekäytäntö", body: `
  <p class="static-page-updated">Viimeksi päivitetty: 2026</p>
  <p>FindNord käyttää vain sivuston toiminnan kannalta välttämättömimpiä -- minkäänlaista kolmannen osapuolen mainosseurantaa tai analytiikkaevästettä ei ole.</p>
  <ul>
    <li><strong><code>fn_session</code></strong> (välttämätön, httpOnly-eväste) -- pitää sinut kirjautuneena. Asetetaan vain kirjautuessasi sisään; poistetaan, kun kirjaudut ulos.</li>
    <li><strong><code>fn_lang</code></strong> (selaimen paikallinen tallennustila, ei eväste) -- muistaa valitsemasi kielen.</li>
    <li><strong><code>fn_cookie_consent</code></strong> (selaimen paikallinen tallennustila) -- muistaa, että olet nähnyt tämän ilmoituksen, jottei sitä näytetä uudelleen.</li>
  </ul>
  <p>Voit tyhjentää nämä milloin tahansa selaimesi omista asetuksista, tai kirjautumalla ulos (mikä poistaa istuntoevästeen). Koska <code>fn_session</code> on välttämätön kirjautuneena pysymiselle, sen tyhjentäminen yksinkertaisesti kirjaa sinut ulos.</p>
`},
    is: { title: "Vafrakökustefna", body: `
  <p class="static-page-updated">Síðast uppfært: 2026</p>
  <p>FindNord notar aðeins það allra nauðsynlegasta til að reka síðuna -- engin þriðja aðila auglýsingarakning eða greiningarkaka (analytics cookie) er notuð.</p>
  <ul>
    <li><strong><code>fn_session</code></strong> (nauðsynleg, httpOnly-vefkaka) -- heldur þér skráðum inn. Sett aðeins þegar þú skráir þig inn; fjarlægð þegar þú skráir þig út.</li>
    <li><strong><code>fn_lang</code></strong> (staðbundin geymsla vafrans, ekki vefkaka) -- man hvaða tungumál þú hefur valið.</li>
    <li><strong><code>fn_cookie_consent</code></strong> (staðbundin geymsla vafrans) -- man að þú hefur séð þessa tilkynningu, svo hún birtist ekki aftur.</li>
  </ul>
  <p>Þú getur hreinsað þessar hvenær sem er í gegnum stillingar vafrans sjálfs, eða með því að skrá þig út (sem fjarlægir setukökuna). Þar sem <code>fn_session</code> er nauðsynleg til að vera áfram skráð(ur) inn, mun hreinsun hennar einfaldlega skrá þig út.</p>
`}
  }
};

// BL-A02: which static page is currently open, if any -- lets a language
// switch re-render it live (see applyTranslations()) the same way every
// other piece of UI text already updates immediately, instead of only on
// next open/reload.
let currentStaticPageId = null;

function openStaticPage(pageId) {
  const page = STATIC_PAGES[pageId];
  const container = document.getElementById("static-page-content");
  if (!page) {
    currentStaticPageId = null;
    container.innerHTML = `<p class="profile-empty">${t("profile.notFound")}</p>`;
    showView("static-page-view");
    return;
  }
  currentStaticPageId = pageId;
  // BL-A02: mirrors t()'s own `dict[key] ?? translations.en[key]` fallback
  // idiom -- every one of the 18 pages has all 6 languages today, but a
  // future page added with only English would still render (in English)
  // instead of crashing or showing nothing.
  const content = page[currentLanguage] || page.en;
  container.innerHTML = `
    <div class="static-page-body">
      <h2 id="static-page-title">${content.title}</h2>
      ${content.body}
    </div>
  `;
  showView("static-page-view");
}

// Hand-authored inline SVG Nordic-cross flags (no image assets) -- reuses
// the exact colors already defined in countryThemes, so a flag can never
// drift out of sync with that country's own theme color.
function nordicFlagIcon(country) {
  const theme = countryThemes[country] || countryThemes.Sweden;
  const field = theme.primary;
  const cross = country === "Finland" ? theme.primary : theme.accent;
  const fieldColor = country === "Finland" ? "#fff" : field;
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="12" fill="${fieldColor}" />
      <rect x="9" y="0" width="3.4" height="24" fill="${cross}" />
      <rect x="0" y="10.3" width="24" height="3.4" fill="${cross}" />
    </svg>
  `;
}

// Clicking a country re-themes the whole app (the existing, real
// applyCountryTheme mechanism from NM-A3/NM-A16's geolocation work) --
// reused as-is, not a new filtering dimension invented just for the footer.
function renderFooterCountryFlags() {
  const container = document.getElementById("footer-country-flags");
  if (!container) return;
  container.innerHTML = Object.keys(countryThemes)
    .map((country) => `<button type="button" class="footer-country-flag" data-browse-country="${country}">${nordicFlagIcon(country)}<span>${country}</span></button>`)
    .join("");
}

// NM-A19 (location depth): each country's capital region, used ONLY as a
// sensible default label when a user explicitly switches country with no
// GPS coordinates volunteered (a footer flag click) -- real geolocation
// (applyDetectedLocation) already sets a precise, actual nearest region and
// is untouched by this.
const CAPITAL_REGION_BY_COUNTRY = {
  Sweden: "Stockholm",
  Norway: "Oslo",
  Denmark: "Hovedstaden",
  Finland: "Uusimaa",
  Iceland: "Höfuðborgarsvæðið"
};

function handleFooterCountryClick(country) {
  applyCountryTheme(country);
  // Before this fix, clicking a country flag re-themed the whole app (Sell's
  // region suggestions, the new Country scope filter) but left the visible
  // location pill saying "Stockholm, Sweden" regardless -- a real
  // inconsistency between what Browse/Sell/Filters now show and what the
  // user is told their location is. This IS the explicit, clear intent the
  // requirement asks for (the user just clicked "Norway"), so updating the
  // pill here is the correct response, not a silent overwrite.
  const locationEl = document.getElementById("active-location");
  if (locationEl) locationEl.textContent = `${CAPITAL_REGION_BY_COUNTRY[country] || country}, ${country}`;
  renderSidebarLocation();
  updateFilterRegionSuggestions();
  showView("browse-view");
  // Real bug this fixes: `showView` is a no-op when Browse is ALREADY the
  // active view (e.g. the user is browsing and clicks a footer flag without
  // switching tabs first) -- without an explicit re-render here, the grid
  // would keep showing the OLD country's results (or the old Country-scope
  // filter outcome) even though the pill/theme/regions all just changed.
  renderListings();
  showToast(`${t("browse.heading")} — ${country}`);
}

// --- Cookie notice: shown once per browser (localStorage-backed), never a
// fixed/overlapping element -- see the CSS comment on .cookie-banner. ---
const COOKIE_CONSENT_KEY = "fn_cookie_consent";

function initCookieBanner() {
  const banner = document.getElementById("cookie-banner");
  if (!banner) return;
  let alreadyConsented = false;
  try {
    alreadyConsented = typeof localStorage !== "undefined" && localStorage.getItem(COOKIE_CONSENT_KEY) === "true";
  } catch (error) {
    alreadyConsented = false;
  }
  banner.hidden = alreadyConsented;
}

function dismissCookieBanner() {
  const banner = document.getElementById("cookie-banner");
  if (banner) banner.hidden = true;
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(COOKIE_CONSENT_KEY, "true");
  } catch (error) {
    // Storage unavailable (e.g. private browsing) -- the banner will simply
    // show again next visit, which is a safe, non-broken fallback.
  }
}

// --- NM-A25: Client-side routing (deep links) ---
// Layered ONTO the existing showView()/open*() mechanism, not a replacement
// for it -- showView() itself is completely untouched. Exactly 4
// navigations get a real, shareable URL (a listing, a seller profile, a
// static page, and NM-A23's password-reset flow); every other view switch
// in this app (Browse, Categories, Sell, Inbox, You, My Listings,
// Analytics, Settings, admin queue, Login, thread view, etc.) keeps working
// exactly as it did before this slice, with NO URL change -- giving every
// view its own URL is explicitly out of scope for this slice.
//
// parseRoute()/routeUrl() are the one place that knows these 4 URL shapes,
// so the path format only ever needs to change in one place. Path segments
// (not query strings) for all 4, including the reset-password token --
// consistent with each other, and matching scripts/server.js's own routes.
function parseRoute(pathname) {
  if (!pathname) return null;
  let match = /^\/listing\/([^/?#]+)\/?$/.exec(pathname);
  if (match) return { type: "listing", param: decodeURIComponent(match[1]) };
  match = /^\/profile\/([^/?#]+)\/?$/.exec(pathname);
  if (match) return { type: "profile", param: decodeURIComponent(match[1]) };
  match = /^\/page\/([^/?#]+)\/?$/.exec(pathname);
  if (match) return { type: "page", param: decodeURIComponent(match[1]) };
  match = /^\/reset-password\/([^/?#]+)\/?$/.exec(pathname);
  if (match) return { type: "reset-password", param: decodeURIComponent(match[1]) };
  return null;
}

function routeUrl(type, param) {
  if (type === "listing") return `/listing/${encodeURIComponent(param)}`;
  if (type === "profile") return `/profile/${encodeURIComponent(param)}`;
  if (type === "page") return `/page/${encodeURIComponent(param)}`;
  if (type === "reset-password") return `/reset-password/${encodeURIComponent(param)}`;
  return "/";
}

// Guarded the exact same defensive way every other real `window`/`history`
// access in this file already is, for the fake-window test sandbox.
function pushRoute(type, param) {
  if (typeof window === "undefined" || !window.history || typeof window.history.pushState !== "function") return;
  window.history.pushState({ fnRoute: type }, "", routeUrl(type, param));
}

// The 3 wrappers below are what every real, user-initiated navigation into
// one of these 4 routes calls (both the delegated click handler and the
// couple of direct call sites, e.g. landing on a listing right after
// publishing it) -- they push a real URL and then just call the existing
// open*() function, completely unchanged. `popstate` (a back/forward tap)
// calls the SAME open*()/openResetPasswordModal() functions directly,
// through applyRoute() below, without pushing a new entry -- the browser
// already moved the history pointer itself.
function navigateToListing(id) {
  pushRoute("listing", id);
  return openListing(id);
}

// openSellerProfile is async (it awaits a real DataService call) -- returning
// its promise here (instead of firing-and-forgetting it) lets a caller that
// needs to know when the profile has actually rendered `await` it, exactly
// like every other place in this file already awaits it directly.
function navigateToProfile(id) {
  pushRoute("profile", id);
  return openSellerProfile(id);
}

function navigateToStaticPage(pageId) {
  pushRoute("page", pageId);
  return openStaticPage(pageId);
}

function applyRoute(route) {
  if (!route) return false;
  if (route.type === "listing") {
    openListing(route.param);
    return true;
  }
  if (route.type === "profile") {
    // openSellerProfile is async (it awaits a real DataService call) --
    // returning its promise (resolving to `true`) lets bootstrap() await a
    // fresh page load actually finishing before it moves on, while a
    // popstate handler (which can't be awaited by the browser anyway) can
    // still just check truthiness exactly like the other 3 route types.
    return openSellerProfile(route.param).then(() => true);
  }
  if (route.type === "page") {
    openStaticPage(route.param);
    return true;
  }
  if (route.type === "reset-password") {
    openResetPasswordModal(route.param);
    return true;
  }
  return false;
}

// A back/forward tap. If the URL landed back on one of the 4 real routes,
// open that content directly (no pushState -- the browser already moved
// the history pointer). Otherwise (e.g. back to "/") there's nothing left
// to route to: close the reset-password modal if a back-tap is what's
// leaving it open, and fall back to Browse, this app's own default landing
// view -- the same "sensible back/forward" behavior a real multi-page site
// would have, without giving every OTHER view (Inbox, Sell, Settings, ...)
// a URL of its own.
function handlePopState() {
  if (typeof window === "undefined" || !window.location) return;
  const route = parseRoute(window.location.pathname);
  if (applyRoute(route)) return;
  const resetModal = typeof document !== "undefined" ? document.getElementById("reset-password-modal") : null;
  if (resetModal && !resetModal.hidden) closeResetPasswordModal();
  if (activeView !== "browse-view") showView("browse-view");
}

function handleCookieSettingsClick() {
  navigateToStaticPage("cookiePolicy");
  dismissCookieBanner();
}

// Bootstrap (NM-A7): the one place that awaits the data service before the
// first render. Everything it awaits resolves on a microtask today (no real
// network), but writing it as async now means swapping DataService for a
// real backend later needs no changes here.
async function bootstrap() {
  currentUser = await DataService.users.getCurrent();
  loadHomeLocation();
  await refreshSavedItemsCache();
  await refreshBlockedUsersCache();
  loadSavedLanguage();
  applyCountryTheme(activeCountry);
  categoryTaxonomy = await DataService.categories.getAll();
  await refreshListingsCache();
  await loadBoostConfig();
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
  renderFooterCountryFlags();
  initCookieBanner();
  bindEvents();
  applyTranslations();
  if (document.getElementById("language-select")) {
    document.getElementById("language-select").value = currentLanguage;
  }
  // Deliberately not awaited -- see applyDetectedLocation()'s own comment.
  applyDetectedLocation();
  // Deliberately not awaited -- see initGoogleSignIn()'s own comment.
  initGoogleSignIn();

  // NM-A25: land directly on a listing/profile/static-page/reset-password
  // route if the page loaded straight into one -- guarded the same
  // defensive way every other real `window`/`window.location` access in
  // this file already guards for the fake-window test sandbox. Replaces
  // NM-A23's own `?resetToken=` query-string stopgap (see that slice's
  // EVIDENCE.md entry): the token now arrives through this exact same
  // parseRoute()/applyRoute() mechanism every other deep link uses, not a
  // special-cased read of its own.
  if (typeof window !== "undefined" && window.location) {
    // Awaited so a fresh page load of /profile/:id (the one async route --
    // it awaits a real DataService call) has genuinely finished rendering
    // before bootstrap() itself resolves, not just been fired off.
    await applyRoute(parseRoute(window.location.pathname));
  }
  // A back/forward tap -- guarded the same way, since the test sandbox's
  // fake `window` doesn't always provide a real `addEventListener`.
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("popstate", handlePopState);
  }
}

bootstrap();
