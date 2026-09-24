// REST API mirroring DataService's interface as closely as possible (NM-A11),
// so data-service.js's rewrite is a thin fetch client and app.js needs zero
// changes. One Express Router factory per database, so tests can spin up an
// isolated in-memory/temp-file database per run.

const express = require("express");
const { categories } = require("../db/seed-data");
const { makeId } = require("./db");
const { createImageStorage } = require("./image-storage");
const { requireSession, requireAdmin } = require("./auth");
const { rateLimiter } = require("./rate-limit");
const { cleanReviewText } = require("./review-moderation");
const {
  BOOST_PACKAGES,
  findBoostPackage,
  boostDurationMs,
  isBoostPaymentsEnabled,
  createBoostCheckoutSession,
  stripeWebhookSecret,
  verifyStripeWebhookSignature
} = require("./boost");

// NM-A19: the five real Nordic currencies, one per FindNord country. Kept as
// a plain derived lookup (like NM-A18's `sponsored` being derived from a real
// expiry) rather than a second stored column on `listings` -- currency is a
// pure fact of a listing's country, so storing it separately would just be a
// second value that could drift out of sync with the first.
const VALID_COUNTRIES = new Set(["Sweden", "Norway", "Denmark", "Finland", "Iceland"]);
const CURRENCY_BY_COUNTRY = {
  Sweden: "SEK",
  Norway: "NOK",
  Denmark: "DKK",
  Finland: "EUR",
  Iceland: "ISK"
};

// NM-A20: a fixed, real set of report reasons -- an open free-text reason
// field alone would make even the "simple internal structure... an admin
// could later review" (requirement 3) hard to triage at a glance; a closed
// set plus an optional free-text `details` field gives both a scannable
// category AND room for real specifics.
const REPORT_REASONS = new Set(["prohibited_item", "scam_or_fraud", "inappropriate_content", "harassment", "spam", "other"]);

// A block's effect is symmetric regardless of who blocked whom -- if EITHER
// side has blocked the other, neither should be able to message the other.
// This mirrors real-world blocking (the blocked side never gets a special
// "you're blocked" error that would just invite arguing about it) and keeps
// the check a single, simple, real query rather than two directional ones
// scattered across every message-sending call site.
function isBlockedPair(db, userIdA, userIdB) {
  if (!userIdA || !userIdB) return false;
  const row = db
    .prepare(
      "SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?) LIMIT 1"
    )
    .get(userIdA, userIdB, userIdB, userIdA);
  return Boolean(row);
}

function ratingSummaryForUser(db, userId) {
  if (!userId) return { average: null, count: 0 };
  const row = db.prepare("SELECT COUNT(*) AS count, AVG(rating) AS average FROM reviews WHERE reviewee_id = ?").get(userId);
  return {
    average: row && row.count ? Number(row.average.toFixed(1)) : null,
    count: row ? row.count : 0
  };
}

function rowToReview(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title || "",
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name || "FindNord member",
    revieweeId: row.reviewee_id,
    rating: row.rating,
    text: row.text || "",
    createdAt: row.created_at
  };
}

function recentReviewsForUser(db, userId, limit = 5) {
  return db
    .prepare(
      `SELECT reviews.*, users.name AS reviewer_name, listings.title AS listing_title
       FROM reviews
       LEFT JOIN users ON users.id = reviews.reviewer_id
       LEFT JOIN listings ON listings.id = reviews.listing_id
       WHERE reviews.reviewee_id = ?
       ORDER BY reviews.created_at DESC
       LIMIT ?`
    )
    .all(userId, limit)
    .map(rowToReview);
}

function rowToListing(db, row) {
  const images = db
    .prepare("SELECT css, ai_generated FROM listing_images WHERE listing_id = ? ORDER BY position ASC")
    .all(row.id)
    .map((image) => ({ css: image.css, aiGenerated: Boolean(image.ai_generated) }));

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    subtype: row.subtype || undefined,
    price: row.price,
    locality: row.locality,
    region: row.region || "",
    country: row.country || "Sweden",
    currency: CURRENCY_BY_COUNTRY[row.country] || "SEK",
    distance: row.distance,
    condition: row.condition,
    posted: row.posted,
    postedAt: row.posted_at,
    freshness: row.freshness || "",
    aiPhoto: Boolean(row.ai_photo),
    image: row.image,
    description: row.description,
    seller: row.seller,
    sellerId: row.seller_id || null,
    sellerType: row.seller_type,
    trust: row.trust,
    sellerRating: ratingSummaryForUser(db, row.seller_id),
    // NM-A18: `sponsored` is now DERIVED from a real expiry, recomputed on
    // every read -- an expired boost stops being "Sponsored" the instant
    // its time is up, with no cron job or background task needed. The raw
    // `sponsored` column still exists (written alongside boost_expires_at
    // for any code that queries it directly in SQL, e.g. the profile's
    // active-listing lookups), but it is never trusted directly here.
    sponsored: Boolean(row.boost_expires_at && row.boost_expires_at > Date.now()),
    boostExpiresAt: row.boost_expires_at || null,
    boostPackage: row.boost_package || null,
    status: row.status || "active",
    // NM-A21: real, admin-moderation-driven hiding -- kept deliberately
    // separate from `status` (see schema.sql's own comment on this column).
    adminHidden: Boolean(row.admin_hidden),
    images
  };
}

// NM-A16: a PUBLIC seller profile -- deliberately never includes email,
// password_hash, or the raw google_id (only a derived `verified` boolean),
// since this is served to anyone, including signed-out guests (requirement
// 6), not just the account's own owner.
function rowToPublicProfile(db, row) {
  const activeListings = db
    .prepare("SELECT * FROM listings WHERE seller_id = ? AND status = 'active' ORDER BY posted_at DESC")
    .all(row.id)
    .map((listingRow) => rowToListing(db, listingRow));
  const rating = ratingSummaryForUser(db, row.id);
  return {
    id: row.id,
    name: row.name,
    memberSince: row.created_at,
    // "Simple for now" verification (NM-A16 requirement 2): a Google
    // sign-in already guarantees Google itself verified the email
    // (scripts/google-auth.js rejects email_verified: false at login) --
    // real signal, not a fabricated badge. A fuller verification system
    // (documents, phone, manual review) is explicitly deferred to NM-A17.
    verified: Boolean(row.google_id),
    rating,
    reviews: recentReviewsForUser(db, row.id),
    activeListingCount: activeListings.length,
    listings: activeListings
  };
}

function conversationParticipantIds(db, conversationId) {
  return db
    .prepare("SELECT user_id FROM conversation_participants WHERE conversation_id = ?")
    .all(conversationId)
    .map((row) => row.user_id);
}

function rowToConversation(db, row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    participantIds: conversationParticipantIds(db, row.id),
    createdAt: row.created_at
  };
}

function rowToMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.text,
    sentAt: row.sent_at
  };
}

// Columns a listing update is allowed to touch, camelCase field -> column.
// Boost (the only caller today) only ever sends { sponsored }, but this
// stays generic so a future caller isn't blocked on a one-field allowlist.
// NM-A19: `country` is deliberately NOT listed here -- a listing's country
// (and therefore its currency) is fixed at publish time and can never be
// changed via edit, so a listing never silently changes currency underneath
// a buyer who saw it in one currency and reopens it later.
const LISTING_UPDATE_COLUMNS = {
  title: "title",
  category: "category",
  subtype: "subtype",
  price: "price",
  locality: "locality",
  region: "region",
  distance: "distance",
  condition: "condition",
  posted: "posted",
  postedAt: "posted_at",
  freshness: "freshness",
  aiPhoto: "ai_photo",
  image: "image",
  description: "description",
  seller: "seller",
  sellerId: "seller_id",
  sellerType: "seller_type",
  trust: "trust",
  sponsored: "sponsored",
  status: "status"
};
const LISTING_BOOLEAN_FIELDS = new Set(["aiPhoto", "sponsored"]);
const LISTING_STATUSES = new Set(["active", "reserved", "sold"]);
// Mirrors app.js's own MAX_LISTING_PHOTOS (frontend-only, not shared across
// the browser/server boundary) -- the real server-side enforcement a direct
// API call can't bypass. See PATCH /listings/:id below for the edit path,
// which already enforced this; POST /listings previously didn't.
const MAX_LISTING_PHOTOS = 6;

// --- NM-A24: real per-account rate limiting for listing creation, messaging,
// and reporting -- the 3 remaining exploitable gaps PRD_AUDIT.md flagged
// after NM-A23 front-loaded scripts/rate-limit.js's reusable factory for
// exactly this. All 3 routes below already require a real session
// (`requireSession`), so -- unlike the 4 unauthenticated auth endpoints,
// which had to key on IP(+email) -- these key on the real, authenticated
// `req.currentUser.id`. A shared IP (a household, an office, a shared campus
// network) must never share one global creation/messaging/reporting budget:
// that would let one abusive housemate lock out everyone else on the same
// connection, and (in the other direction) let one account dodge its own
// limit just by switching IPs. Defined once at module scope, like NM-A23's
// own 4 auth limiters, so they're created once for the process, not
// re-instantiated (and their sliding-window logs discarded) on every
// createApiRouter() call a test happens to make.
function accountRateLimitKey(req) {
  return req.currentUser ? req.currentUser.id : req.ip || "unknown";
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// 20/day: generous enough for a genuine active seller listing several items
// in a day, tight enough that a script can no longer flood Browse with
// hundreds of fake listings in minutes.
const listingCreateRateLimiter = rateLimiter({
  scope: "listings-create",
  windowMs: ONE_DAY_MS,
  max: 20,
  keyFn: accountRateLimitKey,
  message: "You're publishing listings too quickly. Please try again later.",
  code: "RATE_LIMITED"
});

// 40/hour: messaging is normal high-frequency activity -- a real, fast-moving
// buyer/seller negotiation ("is this still available?" / "would you take
// X?" / "yes, when can you collect?" / ...) can easily produce a dozen-plus
// short messages inside a few minutes, and a genuinely engaged user might be
// running more than one such conversation at once. 40/hour comfortably
// covers that (roughly one message every 90 seconds sustained, PLUS room for
// bursts, since this is a sliding window not a flat per-minute cap) while
// still stopping a scripted flood of hundreds of harassment messages into
// one inbox in the same hour. Deliberately at the middle of the task's own
// suggested 30-60/hour range rather than either edge, for the same reason:
// tight enough to matter, loose enough that no real negotiation should ever
// notice it.
const messageCreateRateLimiter = rateLimiter({
  scope: "messages-send",
  windowMs: ONE_HOUR_MS,
  max: 40,
  keyFn: accountRateLimitKey,
  message: "You're sending messages too quickly. Please slow down.",
  code: "RATE_LIMITED"
});

// 15/day: comfortably covers a genuine user reporting several real bad
// listings/sellers they happen to run into in one day, while stopping a
// script from flooding NM-A21's moderation queue with junk faster than an
// admin could ever triage it.
const reportCreateRateLimiter = rateLimiter({
  scope: "reports-create",
  windowMs: ONE_DAY_MS,
  max: 15,
  keyFn: accountRateLimitKey,
  message: "You're submitting reports too quickly. Please try again later.",
  code: "RATE_LIMITED"
});

function createApiRouter(db, options = {}) {
  const { saveImageIfInline, deleteFileIfLocal } = createImageStorage(options.uploadsDir);
  const router = express.Router();

  // NM-A18: the Stripe webhook needs the RAW request body to verify its
  // signature (HMAC over the exact bytes Stripe sent) -- registered here,
  // BEFORE the generic express.json() parser below, with its own raw-body
  // middleware, so this one route never gets JSON-parsed-and-re-serialized
  // (which would no longer match the signature) like everything after it does.
  router.post("/boost/stripe-webhook", express.raw({ type: "application/json" }), (req, res) => {
    const secret = stripeWebhookSecret();
    if (!secret) {
      res.status(503).json({ error: "Stripe webhook is not configured on this server.", code: "STRIPE_NOT_CONFIGURED" });
      return;
    }
    const rawBody = req.body.toString("utf8");
    const signatureValid = verifyStripeWebhookSignature(rawBody, req.headers["stripe-signature"], secret);
    if (!signatureValid) {
      res.status(400).json({ error: "Invalid Stripe webhook signature.", code: "INVALID_STRIPE_SIGNATURE" });
      return;
    }

    const event = JSON.parse(rawBody);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const listingId = session.metadata && session.metadata.listingId;
      const packageId = session.metadata && session.metadata.packageId;
      const pkg = findBoostPackage(packageId);
      if (listingId && pkg) {
        const expiresAt = Date.now() + boostDurationMs(pkg);
        db.prepare("UPDATE listings SET sponsored = 1, boost_expires_at = ?, boost_package = ? WHERE id = ?").run(expiresAt, pkg.id, listingId);
      }
    }
    res.json({ received: true });
  });

  router.use(express.json({ limit: "12mb" })); // photos are data URLs, up to ~1MB each, up to 6 per listing

  // --- Categories (static taxonomy, not a table) ---
  router.get("/categories", (req, res) => {
    res.json(categories);
  });

  router.get("/categories/:id", (req, res) => {
    const found = categories.find((category) => category.id === req.params.id);
    res.json(found || null);
  });

  // Real registration/login/logout/session-check now live at /api/auth (see
  // scripts/auth.js) -- the old mocked /users/sign-in (which minted a new
  // row on every call, real password never involved) is gone.

  // --- Public seller profiles (NM-A16). No requireSession: guests can view
  // any real seller's public profile (requirement 6), same as browsing
  // listings needs no account. ---
  router.get("/users/:id/profile", (req, res) => {
    const row = db.prepare("SELECT id, name, created_at, google_id FROM users WHERE id = ?").get(req.params.id);
    res.json(row ? rowToPublicProfile(db, row) : null);
  });

  // Once a reviewer's strike count reaches this, they are permanently
  // (until some future manual/admin reversal -- out of scope here)
  // prohibited from submitting any further review, clean or not.
  const REVIEW_BAN_STRIKE_THRESHOLD = 2;

  // --- Reviews & Ratings (NM-A17). Guests can read them through public
  // listings/profiles, but writes are tied to the real session user. ---
  router.post("/reviews", requireSession, (req, res) => {
    const fields = req.body || {};
    const rating = Number(fields.rating);
    const rawText = String(fields.text || "").trim().slice(0, 240);
    const listing = db.prepare("SELECT id, seller_id FROM listings WHERE id = ?").get(fields.listingId);
    const reviewee = db.prepare("SELECT id FROM users WHERE id = ?").get(fields.revieweeId);

    if (!listing || !reviewee) {
      res.status(404).json({ error: "Review target could not be found.", code: "REVIEW_TARGET_NOT_FOUND" });
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be between 1 and 5.", code: "INVALID_RATING" });
      return;
    }
    if (req.currentUser.id === reviewee.id) {
      res.status(400).json({ error: "You cannot review yourself.", code: "REVIEW_NOT_FOR_SELF" });
      return;
    }

    // A user already banned from reviewing is rejected outright, before
    // even looking at this submission's content -- the ban is about the
    // ACCOUNT, not this specific piece of text.
    const reviewerAccount = db.prepare("SELECT review_banned FROM users WHERE id = ?").get(req.currentUser.id);
    if (reviewerAccount && reviewerAccount.review_banned) {
      res.status(403).json({ error: "You are no longer allowed to leave reviews.", code: "REVIEW_BANNED" });
      return;
    }

    // Abusive words are always removed from what gets stored (never
    // silently let through) -- see scripts/review-moderation.js. A first
    // offense still posts (cleaned) with a warning; a second escalates to a
    // permanent ban and this submission itself is rejected, not saved.
    const { cleaned: text, matched } = cleanReviewText(rawText);
    let moderated = false;
    if (matched) {
      const currentStrikes = db.prepare("SELECT review_strikes FROM users WHERE id = ?").get(req.currentUser.id).review_strikes || 0;
      const newStrikes = currentStrikes + 1;
      if (newStrikes >= REVIEW_BAN_STRIKE_THRESHOLD) {
        db.prepare("UPDATE users SET review_strikes = ?, review_banned = 1 WHERE id = ?").run(newStrikes, req.currentUser.id);
        res.status(403).json({
          error: "Your review contained inappropriate language. Repeated violations have blocked your account from leaving reviews.",
          code: "REVIEW_BANNED_NOW"
        });
        return;
      }
      db.prepare("UPDATE users SET review_strikes = ? WHERE id = ?").run(newStrikes, req.currentUser.id);
      moderated = true;
    }

    const id = makeId("review");
    const createdAt = Date.now();
    try {
      db.prepare(
        `INSERT INTO reviews (id, listing_id, reviewer_id, reviewee_id, rating, text, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(id, listing.id, req.currentUser.id, reviewee.id, rating, text, createdAt);
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        res.status(409).json({ error: "You already reviewed this user for this listing.", code: "DUPLICATE_REVIEW" });
        return;
      }
      throw error;
    }

    const row = db
      .prepare(
        `SELECT reviews.*, users.name AS reviewer_name, listings.title AS listing_title
         FROM reviews
         LEFT JOIN users ON users.id = reviews.reviewer_id
         LEFT JOIN listings ON listings.id = reviews.listing_id
         WHERE reviews.id = ?`
      )
      .get(id);
    res.status(201).json({ ...rowToReview(row), moderated });
  });

  // --- NM-A18: Boost / Premium (free-first, Stripe-ready) ---

  // Public: the frontend needs this before a seller even signs in, to show
  // real package/pricing info and whether payments are currently required.
  router.get("/boost/config", (req, res) => {
    res.json({ paymentsEnabled: isBoostPaymentsEnabled(), packages: BOOST_PACKAGES });
  });

  // Free-path activation -- only while payments are OFF (the PRD's 6-month
  // free/sealed launch policy, or any deployment that simply never flips
  // the flag). Real ownership-checked, same pattern as every other listing
  // mutation in this file.
  router.post("/listings/:id/boost", requireSession, (req, res) => {
    const listing = db.prepare("SELECT id, seller_id FROM listings WHERE id = ?").get(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found.", code: "LISTING_NOT_FOUND" });
      return;
    }
    if (listing.seller_id !== req.currentUser.id) {
      res.status(403).json({ error: "You can only boost your own listings.", code: "NOT_YOUR_LISTING" });
      return;
    }
    const pkg = findBoostPackage(req.body && req.body.packageId);
    if (!pkg) {
      res.status(400).json({ error: "Unknown boost package.", code: "INVALID_BOOST_PACKAGE" });
      return;
    }
    if (isBoostPaymentsEnabled()) {
      res.status(402).json({ error: "Boost payments are enabled -- use checkout instead of direct activation.", code: "PAYMENT_REQUIRED" });
      return;
    }

    const expiresAt = Date.now() + boostDurationMs(pkg);
    db.prepare("UPDATE listings SET sponsored = 1, boost_expires_at = ?, boost_package = ? WHERE id = ?").run(expiresAt, pkg.id, listing.id);
    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(listing.id);
    res.json(rowToListing(db, row));
  });

  // A seller can always cancel their own boost early, regardless of the
  // payments flag -- this is not itself a payment action, just turning the
  // feature off.
  router.post("/listings/:id/unboost", requireSession, (req, res) => {
    const listing = db.prepare("SELECT id, seller_id FROM listings WHERE id = ?").get(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found.", code: "LISTING_NOT_FOUND" });
      return;
    }
    if (listing.seller_id !== req.currentUser.id) {
      res.status(403).json({ error: "You can only unboost your own listings.", code: "NOT_YOUR_LISTING" });
      return;
    }
    db.prepare("UPDATE listings SET sponsored = 0, boost_expires_at = NULL, boost_package = NULL WHERE id = ?").run(listing.id);
    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(listing.id);
    res.json(rowToListing(db, row));
  });

  // Paid-path: creates a real Stripe Checkout Session (test-mode is simply
  // "which secret key the deployer configured" -- Stripe has no separate
  // test-mode flag in the API itself). Only reachable at all when the
  // payments flag is on; gracefully explains what's missing otherwise,
  // matching the OPENAI_API_KEY/GOOGLE_CLIENT_ID "clear error, never a
  // crash" pattern already established in this project.
  router.post("/listings/:id/boost/checkout", requireSession, async (req, res) => {
    if (!isBoostPaymentsEnabled()) {
      res.status(400).json({ error: "Boost payments are not enabled on this server.", code: "PAYMENTS_DISABLED" });
      return;
    }
    const listing = db.prepare("SELECT id, seller_id FROM listings WHERE id = ?").get(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found.", code: "LISTING_NOT_FOUND" });
      return;
    }
    if (listing.seller_id !== req.currentUser.id) {
      res.status(403).json({ error: "You can only boost your own listings.", code: "NOT_YOUR_LISTING" });
      return;
    }
    const packageId = req.body && req.body.packageId;
    try {
      const session = await createBoostCheckoutSession({
        listingId: listing.id,
        packageId,
        successUrl: `${req.body.returnUrl || ""}?boost=success`,
        cancelUrl: `${req.body.returnUrl || ""}?boost=cancelled`
      });
      res.json(session);
    } catch (error) {
      const code = error.code || "STRIPE_REQUEST_FAILED";
      const status = code === "STRIPE_NOT_CONFIGURED" ? 503 : code === "INVALID_BOOST_PACKAGE" ? 400 : 502;
      res.status(status).json({ error: error.message, code });
    }
  });

  // --- Listings ---
  router.get("/listings", (req, res) => {
    const rows = db.prepare("SELECT * FROM listings ORDER BY rowid ASC").all();
    res.json(rows.map((row) => rowToListing(db, row)));
  });

  router.get("/listings/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
    res.json(row ? rowToListing(db, row) : null);
  });

  router.post("/listings", requireSession, listingCreateRateLimiter, (req, res) => {
    const fields = req.body || {};
    const id = makeId("listing");
    // Deployment-readiness audit finding: the PATCH (edit) path already caps
    // images at MAX_LISTING_PHOTOS via .slice(0, 6) below; the create path
    // never did, so a request that bypassed the client's own cap (a direct
    // API call, not the real Sell form) could attach unlimited images to one
    // listing. Same cap, same place, on create too.
    const rawImages = (Array.isArray(fields.images) ? fields.images : []).slice(0, MAX_LISTING_PHOTOS);

    // Every real (uploaded or AI-generated) photo arrives here as an inline
    // `url(data:...)` CSS value; saveImageIfInline() writes it to a real file
    // under uploads/ and rewrites the value to point at that file instead.
    // A seed-style gradient (never produced by the real Sell form) passes
    // through unchanged. `fields.image` (the cover field on `listings`
    // itself) is always identical to `images[0].css` from the client, so it
    // reuses the same already-saved file rather than writing the bytes twice.
    // File writes happen here, OUTSIDE the DB transaction below -- a
    // transaction can't roll back bytes already written to disk, so there's
    // nothing to gain by including them, and every DB write immediately
    // below is what actually needs to be atomic.
    const images = rawImages.map((image, index) => ({
      css: saveImageIfInline(image.css, `${id}-${index}`),
      aiGenerated: Boolean(image.aiGenerated)
    }));
    const coverCss = images[0] ? images[0].css : saveImageIfInline(fields.image || "", `${id}-cover`);

    const insertListing = db.prepare(
      `INSERT INTO listings
        (id, title, category, subtype, price, locality, region, country, distance, condition, posted, posted_at, freshness, ai_photo, image, description, seller, seller_id, seller_type, trust, sponsored, status, created_at)
       VALUES
        (@id, @title, @category, @subtype, @price, @locality, @region, @country, @distance, @condition, @posted, @postedAt, @freshness, @aiPhoto, @image, @description, @seller, @sellerId, @sellerType, @trust, @sponsored, @status, @createdAt)`
    );
    const insertImage = db.prepare("INSERT INTO listing_images (listing_id, position, css, ai_generated) VALUES (?, ?, ?, ?)");
    // Deployment-readiness audit finding: the listing INSERT and its image
    // INSERTs ran as separate, unguarded statements -- a crash mid-way left
    // a listing with zero/partial images. db.transaction(...) makes this one
    // real all-or-nothing unit, the same pattern seedIfEmpty() and
    // migrateInlineImagesToFiles() (scripts/db.js) already use.
    const createListing = db.transaction((listingFields) => {
      insertListing.run(listingFields);
      images.forEach((image, index) => insertImage.run(id, index, image.css, image.aiGenerated ? 1 : 0));
    });

    createListing({
      id,
      title: fields.title || "",
      category: fields.category || null,
      subtype: fields.subtype || null,
      price: fields.price || "",
      locality: fields.locality || "",
      region: fields.region || "",
      // A listing's country/currency is fixed at publish time from the
      // seller's own real country (never trusted blindly from the client
      // beyond validating it's one of the five real ones) and can never be
      // changed via an edit afterward -- see LISTING_UPDATE_COLUMNS below,
      // which deliberately has no `country` entry. This is the "changing
      // country should not silently overwrite" requirement applied to the
      // data itself, not just the UI: a listing keeps the currency it was
      // actually published under for its whole lifetime.
      country: VALID_COUNTRIES.has(fields.country) ? fields.country : "Sweden",
      distance: fields.distance || "",
      condition: fields.condition || "",
      posted: fields.posted || "",
      postedAt: fields.postedAt || Date.now(),
      freshness: fields.freshness || "",
      aiPhoto: fields.aiPhoto ? 1 : 0,
      image: coverCss,
      description: fields.description || "",
      // NM-A14: seller identity is server-derived from the real session, not
      // trusted from the client -- a signed-in user can no longer publish a
      // listing under a spoofed name/id.
      seller: req.currentUser.name,
      sellerId: req.currentUser.id,
      sellerType: fields.sellerType || "",
      trust: fields.trust || "",
      sponsored: fields.sponsored ? 1 : 0,
      status: LISTING_STATUSES.has(fields.status) ? fields.status : "active",
      createdAt: Date.now()
    });

    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
    res.json(rowToListing(db, row));
  });

  // NM-A13 required a client-supplied `requesterId`, checked against the
  // listing's real sellerId. NM-A14 upgrades this: the acting user now comes
  // from the real session (req.currentUser), not a body field a crafted
  // request could simply set to someone else's real user id and pass the
  // same check. requireSession also means an anonymous guest can't reach
  // this at all.
  router.patch("/listings/:id", requireSession, (req, res) => {
    const { requesterId, images: rawImages, ...columnFields } = req.body || {};
    void requesterId; // no longer trusted -- kept out of columnFields, never read
    const existing = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.json(null);
      return;
    }
    if (existing.seller_id !== req.currentUser.id) {
      res.status(403).json({ error: "You can only edit your own listings." });
      return;
    }

    // Editing photos replaces the whole set: new inline (uploaded/AI) photos
    // are written to real files, already-file-backed photos pass through
    // unchanged, and any OLD file no longer present in the new set is
    // unlinked from disk so editing doesn't leave orphaned photos behind.
    if (Array.isArray(rawImages)) {
      const oldImages = db.prepare("SELECT css FROM listing_images WHERE listing_id = ?").all(req.params.id);
      const newImages = rawImages.slice(0, MAX_LISTING_PHOTOS).map((image, index) => ({
        css: saveImageIfInline(image.css, `${req.params.id}-${index}-${Date.now()}`),
        aiGenerated: Boolean(image.aiGenerated)
      }));
      const newCssSet = new Set(newImages.map((image) => image.css));
      oldImages.forEach((old) => {
        if (!newCssSet.has(old.css)) deleteFileIfLocal(old.css);
      });

      // Deployment-readiness audit finding: this replace-the-whole-set DELETE
      // + INSERT loop ran unguarded -- a crash mid-way left a listing with no
      // images or a mismatched cover. Real file deletes above are
      // deliberately outside this transaction (not rollback-able either way);
      // the DB writes below are what actually needs to be atomic.
      const replaceImages = db.transaction((imagesToInsert) => {
        db.prepare("DELETE FROM listing_images WHERE listing_id = ?").run(req.params.id);
        const insertImage = db.prepare("INSERT INTO listing_images (listing_id, position, css, ai_generated) VALUES (?, ?, ?, ?)");
        imagesToInsert.forEach((image, index) => insertImage.run(req.params.id, index, image.css, image.aiGenerated ? 1 : 0));
      });
      replaceImages(newImages);

      columnFields.image = newImages[0] ? newImages[0].css : "";
      columnFields.aiPhoto = Boolean(newImages[0] && newImages[0].aiGenerated);
    }

    if (columnFields.status && !LISTING_STATUSES.has(columnFields.status)) delete columnFields.status;

    const setClauses = [];
    const params = {};
    for (const [field, value] of Object.entries(columnFields)) {
      const column = LISTING_UPDATE_COLUMNS[field];
      if (!column) continue;
      setClauses.push(`${column} = @${field}`);
      params[field] = LISTING_BOOLEAN_FIELDS.has(field) ? (value ? 1 : 0) : value;
    }

    if (setClauses.length > 0) {
      params.id = req.params.id;
      db.prepare(`UPDATE listings SET ${setClauses.join(", ")} WHERE id = @id`).run(params);
    }

    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
    res.json(rowToListing(db, row));
  });

  router.delete("/listings/:id", requireSession, (req, res) => {
    const existing = db.prepare("SELECT seller_id, image FROM listings WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.json(null);
      return;
    }
    if (existing.seller_id !== req.currentUser.id) {
      res.status(403).json({ error: "You can only delete your own listings." });
      return;
    }

    const images = db.prepare("SELECT css FROM listing_images WHERE listing_id = ?").all(req.params.id);
    images.forEach((image) => deleteFileIfLocal(image.css));
    deleteFileIfLocal(existing.image);

    // Deployment-readiness audit finding: these 3 deletes ran as separate,
    // unguarded statements -- a crash between them could leave orphaned
    // listing_images rows referencing a since-deleted listing_id.
    const deleteListing = db.transaction(() => {
      db.prepare("DELETE FROM listing_images WHERE listing_id = ?").run(req.params.id);
      db.prepare("DELETE FROM saved_items WHERE listing_id = ?").run(req.params.id);
      db.prepare("DELETE FROM listings WHERE id = ?").run(req.params.id);
    });
    deleteListing();

    res.json({ id: req.params.id, deleted: true });
  });

  // --- Saved items ---
  router.get("/saved-items/status", (req, res) => {
    const row = db
      .prepare("SELECT 1 FROM saved_items WHERE user_id = ? AND listing_id = ?")
      .get(req.query.userId, req.query.listingId);
    res.json(Boolean(row));
  });

  // NM-A14: saving requires a real account -- userId is the session's, not
  // whatever the client's body claims.
  router.post("/saved-items/toggle", requireSession, (req, res) => {
    const userId = req.currentUser.id;
    const { listingId } = req.body || {};
    const existing = db.prepare("SELECT 1 FROM saved_items WHERE user_id = ? AND listing_id = ?").get(userId, listingId);
    if (existing) {
      db.prepare("DELETE FROM saved_items WHERE user_id = ? AND listing_id = ?").run(userId, listingId);
      res.json(false);
    } else {
      db.prepare("INSERT INTO saved_items (user_id, listing_id, created_at) VALUES (?, ?, ?)").run(userId, listingId, Date.now());
      res.json(true);
    }
  });

  router.get("/saved-items", (req, res) => {
    const rows = db.prepare("SELECT listing_id FROM saved_items WHERE user_id = ?").all(req.query.userId);
    res.json(rows.map((row) => row.listing_id));
  });

  router.get("/saved-items/all", (req, res) => {
    const rows = db.prepare("SELECT user_id, listing_id FROM saved_items").all();
    res.json(rows.map((row) => ({ userId: row.user_id, listingId: row.listing_id })));
  });

  // --- Reports (NM-A20: a real reason + optional details + target-user
  // support, and a `status` field a future admin review pass can update --
  // "a simple internal structure... an admin could later review", not a
  // full admin console). ---
  // NM-A14: reporting requires a real account -- reporterId is the session's.
  router.post("/reports", requireSession, reportCreateRateLimiter, (req, res) => {
    const fields = req.body || {};
    const listingId = fields.listingId || null;
    const reportedUserId = fields.reportedUserId || null;
    if (!listingId && !reportedUserId) {
      res.status(400).json({ error: "A report must target a listing or a user.", code: "REPORT_TARGET_REQUIRED" });
      return;
    }
    if (reportedUserId === req.currentUser.id) {
      res.status(400).json({ error: "You cannot report yourself.", code: "REPORT_NOT_FOR_SELF" });
      return;
    }
    if (listingId) {
      const listing = db.prepare("SELECT seller_id FROM listings WHERE id = ?").get(listingId);
      if (listing && listing.seller_id === req.currentUser.id) {
        res.status(400).json({ error: "You cannot report your own listing.", code: "REPORT_NOT_FOR_SELF" });
        return;
      }
    }
    const reason = REPORT_REASONS.has(fields.reason) ? fields.reason : "other";
    const record = {
      id: makeId("report"),
      listingId,
      reportedUserId,
      reporterId: req.currentUser.id,
      reason,
      details: String(fields.details || "").trim().slice(0, 500),
      status: "open",
      createdAt: Date.now()
    };
    db.prepare(
      "INSERT INTO reports (id, listing_id, reported_user_id, reporter_id, reason, details, status, created_at) VALUES (@id, @listingId, @reportedUserId, @reporterId, @reason, @details, @status, @createdAt)"
    ).run(record);
    res.json(record);
  });

  const REPORT_STATUSES = new Set(["open", "reviewed", "dismissed"]);

  // NM-A21: this used to have no access control at all -- fine while
  // nothing real consumed it, but a real internal moderation queue is
  // exactly the kind of "reports contain reasons/details about real
  // people" data that should never have been publicly readable. Admin-only
  // from here on, enriched with the reporter/target names/titles the queue
  // needs to display, so the frontend never has to separately re-fetch a
  // listing or profile just to show a reviewer what a report is about.
  router.get("/reports", requireAdmin, (req, res) => {
    const rows = db.prepare("SELECT * FROM reports ORDER BY created_at DESC").all();
    res.json(
      rows.map((row) => {
        const reporter = db.prepare("SELECT name, email FROM users WHERE id = ?").get(row.reporter_id);
        const reportedUser = row.reported_user_id ? db.prepare("SELECT name, email, flagged FROM users WHERE id = ?").get(row.reported_user_id) : null;
        const listing = row.listing_id ? db.prepare("SELECT title, admin_hidden FROM listings WHERE id = ?").get(row.listing_id) : null;
        return {
          id: row.id,
          listingId: row.listing_id,
          listingTitle: listing ? listing.title : null,
          listingAdminHidden: listing ? Boolean(listing.admin_hidden) : null,
          reportedUserId: row.reported_user_id,
          reportedUserName: reportedUser ? reportedUser.name : null,
          reportedUserFlagged: reportedUser ? Boolean(reportedUser.flagged) : null,
          reporterId: row.reporter_id,
          reporterName: reporter ? reporter.name : "Unknown",
          reporterEmail: reporter ? reporter.email : "",
          reason: row.reason || "other",
          details: row.details || "",
          status: row.status || "open",
          createdAt: row.created_at
        };
      })
    );
  });

  // Admin-only report triage -- "Mark report as Reviewed / Dismissed"
  // (requirement 3). Deliberately narrow: only `status` can change here,
  // never the report's own content (reason/details/who-reported-whom stay
  // exactly as originally filed, an honest record of what was reported).
  router.patch("/reports/:id", requireAdmin, (req, res) => {
    const status = (req.body || {}).status;
    if (!REPORT_STATUSES.has(status)) {
      res.status(400).json({ error: "Invalid report status.", code: "INVALID_REPORT_STATUS" });
      return;
    }
    const result = db.prepare("UPDATE reports SET status = ? WHERE id = ?").run(status, req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: "Report not found.", code: "REPORT_NOT_FOUND" });
      return;
    }
    res.json({ id: req.params.id, status });
  });

  // --- Admin moderation actions on listings/users (NM-A21). Deliberately
  // minimal -- hide/unhide a listing, flag/unflag a user -- no broader
  // admin console or workflow beyond this, per the task's own scope limit. ---
  router.post("/admin/listings/:id/hide", requireAdmin, (req, res) => {
    const result = db.prepare("UPDATE listings SET admin_hidden = 1 WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: "Listing not found.", code: "LISTING_NOT_FOUND" });
      return;
    }
    res.json({ id: req.params.id, adminHidden: true });
  });

  router.post("/admin/listings/:id/unhide", requireAdmin, (req, res) => {
    const result = db.prepare("UPDATE listings SET admin_hidden = 0 WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: "Listing not found.", code: "LISTING_NOT_FOUND" });
      return;
    }
    res.json({ id: req.params.id, adminHidden: false });
  });

  router.post("/admin/users/:id/flag", requireAdmin, (req, res) => {
    const result = db.prepare("UPDATE users SET flagged = 1 WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: "User not found.", code: "USER_NOT_FOUND" });
      return;
    }
    res.json({ id: req.params.id, flagged: true });
  });

  router.post("/admin/users/:id/unflag", requireAdmin, (req, res) => {
    const result = db.prepare("UPDATE users SET flagged = 0 WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: "User not found.", code: "USER_NOT_FOUND" });
      return;
    }
    res.json({ id: req.params.id, flagged: false });
  });

  // --- Blocks (NM-A20). A block's effect is entirely from the BLOCKER's own
  // side -- it removes what they see (the other user's listings, and any
  // ability to message each other), never a punitive action visible to or
  // reversible only by the blocked user. requireSession throughout: blocking
  // is meaningless for a guest with no persistent identity to attach it to. ---
  router.post("/blocks", requireSession, (req, res) => {
    const blockedId = (req.body || {}).blockedUserId;
    if (!blockedId || blockedId === req.currentUser.id) {
      res.status(400).json({ error: "You cannot block yourself.", code: "BLOCK_NOT_FOR_SELF" });
      return;
    }
    const target = db.prepare("SELECT id FROM users WHERE id = ?").get(blockedId);
    if (!target) {
      res.status(404).json({ error: "That user could not be found.", code: "BLOCK_TARGET_NOT_FOUND" });
      return;
    }
    db.prepare("INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)").run(req.currentUser.id, blockedId, Date.now());
    res.json({ blockedUserId: blockedId });
  });

  router.delete("/blocks/:userId", requireSession, (req, res) => {
    db.prepare("DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?").run(req.currentUser.id, req.params.userId);
    res.json({ blockedUserId: req.params.userId, removed: true });
  });

  // A guest has nothing to fetch (no session, no blocks) -- requireSession
  // keeps this consistent with every other per-user read in this app.
  router.get("/blocks", requireSession, (req, res) => {
    const rows = db.prepare("SELECT blocked_id FROM blocks WHERE blocker_id = ?").all(req.currentUser.id);
    res.json(rows.map((row) => row.blocked_id));
  });

  // --- Conversations & messages ---
  // NM-A14: messaging requires a real account -- the acting user must
  // genuinely be one of the participants, not merely claimed as one.
  router.post("/conversations/start-or-get", requireSession, (req, res) => {
    const { listingId, participantIds } = req.body || {};
    // Deployment-readiness audit finding (confirmed live, reproducible): a
    // seed listing's sellerId is null (see db/seed-data.js), and this route
    // had no validation before inserting participantIds directly into
    // conversation_participants.user_id (NOT NULL) -- a null/non-string
    // participant crashed with an unhandled SqliteError, returned as a raw
    // 500 HTML stack trace (see the new generic error handler in
    // scripts/server.js for the other half of this fix). Reject cleanly
    // instead of ever reaching the INSERT with bad data.
    const rawIds = Array.isArray(participantIds) ? participantIds : [];
    if (rawIds.some((value) => typeof value !== "string" || !value)) {
      res.status(400).json({ error: "Every participant must be a real account id.", code: "INVALID_PARTICIPANT" });
      return;
    }
    // NM-A20: deduped defensively -- a seller messaging their OWN listing
    // (the app doesn't prevent that click) would otherwise send the same id
    // twice (self, plus that same self as the listing's sellerId), which
    // used to crash the participant-insert with a UNIQUE constraint error.
    const ids = Array.from(new Set(rawIds));
    if (!ids.includes(req.currentUser.id)) ids.push(req.currentUser.id);

    // NM-A20: a block stops a new conversation from ever starting, in
    // either direction -- checked against every OTHER participant being
    // added, not just a single seller, so this stays correct if this ever
    // grows beyond 1:1 conversations.
    const blockedWithSomeone = ids.some((id) => id !== req.currentUser.id && isBlockedPair(db, req.currentUser.id, id));
    if (blockedWithSomeone) {
      res.status(403).json({ error: "You can't message this user.", code: "BLOCKED" });
      return;
    }

    const candidates = db.prepare("SELECT id FROM conversations WHERE listing_id = ?").all(listingId);
    const existing = candidates.find((candidate) => {
      const existingIds = conversationParticipantIds(db, candidate.id);
      return ids.every((id) => existingIds.includes(id));
    });

    if (existing) {
      const row = db.prepare("SELECT * FROM conversations WHERE id = ?").get(existing.id);
      res.json(rowToConversation(db, row));
      return;
    }

    const id = makeId("conversation");
    const createdAt = Date.now();
    // Deployment-readiness audit finding: the conversation INSERT and its
    // participant INSERTs ran as separate, unguarded statements -- same
    // partial-write risk as the listing writes above.
    const createConversation = db.transaction(() => {
      db.prepare("INSERT INTO conversations (id, listing_id, created_at) VALUES (?, ?, ?)").run(id, listingId, createdAt);
      const insertParticipant = db.prepare("INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)");
      ids.forEach((userId) => insertParticipant.run(id, userId));
    });
    createConversation();

    res.json({ id, listingId, participantIds: ids.slice(), createdAt });
  });

  // Deployment-readiness audit finding: this route had no requireSession and
  // trusted a client-supplied ?userId= query param -- anyone could spoof it
  // to dump any other user's conversation list. The frontend (data-service.js)
  // only ever calls this with the signed-in user's own id, so deriving it
  // server-side from the real session instead is a pure hardening change,
  // not a behavior change for any real caller.
  router.get("/conversations", requireSession, (req, res) => {
    const rows = db
      .prepare(
        `SELECT DISTINCT c.* FROM conversations c
         JOIN conversation_participants p ON p.conversation_id = c.id
         WHERE p.user_id = ?`
      )
      .all(req.currentUser.id);
    res.json(rows.map((row) => rowToConversation(db, row)));
  });

  // Deployment-readiness audit finding: this route had NO auth check at all
  // (not even requireSession), dumping every conversation site-wide to
  // anyone, signed in or not. requireSession closes that -- the app's own
  // Analytics feature (app.js renderAnalytics, NM-A9) legitimately needs
  // every signed-in user to be able to call this (it filters client-side to
  // "conversations about MY listings", the mirror of /saved-items/all's same
  // pattern), so this intentionally stays session-gated rather than
  // admin-only. Narrowing this to a real server-side per-user filter (so a
  // signed-in user can't see every OTHER user's conversations, not just
  // guests) is a real follow-up, deliberately out of this small fix's scope
  // -- see DEPLOYMENT_READINESS_PLAN.md.
  router.get("/conversations/all", requireSession, (req, res) => {
    const rows = db.prepare("SELECT * FROM conversations").all();
    res.json(rows.map((row) => rowToConversation(db, row)));
  });

  router.post("/conversations/:id/messages", requireSession, messageCreateRateLimiter, (req, res) => {
    // Deployment-readiness audit finding: this route required a session but
    // never checked the caller was actually a participant of conversation
    // :id -- any signed-in user could post into any conversation. Real
    // object-level authorization, not just authentication.
    const participantIds = conversationParticipantIds(db, req.params.id);
    if (!participantIds.includes(req.currentUser.id)) {
      res.status(403).json({ error: "You're not part of this conversation.", code: "NOT_A_PARTICIPANT" });
      return;
    }
    // NM-A20: a block already in place (either side) also stops any FURTHER
    // message in an existing conversation -- not just new conversations --
    // otherwise blocking would only prevent messaging strangers, doing
    // nothing about someone already mid-conversation, which is the more
    // realistic case a block actually needs to handle.
    const otherParticipants = participantIds.filter((id) => id !== req.currentUser.id);
    if (otherParticipants.some((id) => isBlockedPair(db, req.currentUser.id, id))) {
      res.status(403).json({ error: "You can't message this user.", code: "BLOCKED" });
      return;
    }
    const fields = req.body || {};
    const record = {
      id: makeId("message"),
      conversationId: req.params.id,
      senderId: req.currentUser.id,
      text: fields.text || "",
      sentAt: Date.now()
    };
    db.prepare("INSERT INTO messages (id, conversation_id, sender_id, text, sent_at) VALUES (?, ?, ?, ?, ?)").run(
      record.id,
      record.conversationId,
      record.senderId,
      record.text,
      record.sentAt
    );
    res.json(record);
  });

  // Deployment-readiness audit finding: this route had no requireSession and
  // no participant check at all -- anyone who knew/guessed a conversation id
  // could read its full message history. Same real object-level
  // authorization as the POST route above.
  router.get("/conversations/:id/messages", requireSession, (req, res) => {
    if (!conversationParticipantIds(db, req.params.id).includes(req.currentUser.id)) {
      res.status(403).json({ error: "You're not part of this conversation.", code: "NOT_A_PARTICIPANT" });
      return;
    }
    const rows = db.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC").all(req.params.id);
    res.json(rows.map(rowToMessage));
  });

  return router;
}

// NM-A25: `rowToListing` is also used directly by scripts/server.js's
// `/listing/:id` route handler, which needs the exact same real listing
// shape (title/description/images) the JSON API already returns, to build
// that page's server-side og:*/twitter:* meta tags.
module.exports = { createApiRouter, rowToListing };
