// REST API mirroring DataService's interface as closely as possible (NM-A11),
// so data-service.js's rewrite is a thin fetch client and app.js needs zero
// changes. One Express Router factory per database, so tests can spin up an
// isolated in-memory/temp-file database per run.

const express = require("express");
const { categories } = require("../db/seed-data");
const { makeId } = require("./db");
const { createImageStorage } = require("./image-storage");
const { requireSession } = require("./auth");

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
    sponsored: Boolean(row.sponsored),
    status: row.status || "active",
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

function createApiRouter(db, options = {}) {
  const { saveImageIfInline, deleteFileIfLocal } = createImageStorage(options.uploadsDir);
  const router = express.Router();
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

  // --- Listings ---
  router.get("/listings", (req, res) => {
    const rows = db.prepare("SELECT * FROM listings ORDER BY rowid ASC").all();
    res.json(rows.map((row) => rowToListing(db, row)));
  });

  router.get("/listings/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
    res.json(row ? rowToListing(db, row) : null);
  });

  router.post("/listings", requireSession, (req, res) => {
    const fields = req.body || {};
    const id = makeId("listing");
    const rawImages = Array.isArray(fields.images) ? fields.images : [];

    // Every real (uploaded or AI-generated) photo arrives here as an inline
    // `url(data:...)` CSS value; saveImageIfInline() writes it to a real file
    // under uploads/ and rewrites the value to point at that file instead.
    // A seed-style gradient (never produced by the real Sell form) passes
    // through unchanged. `fields.image` (the cover field on `listings`
    // itself) is always identical to `images[0].css` from the client, so it
    // reuses the same already-saved file rather than writing the bytes twice.
    const images = rawImages.map((image, index) => ({
      css: saveImageIfInline(image.css, `${id}-${index}`),
      aiGenerated: Boolean(image.aiGenerated)
    }));
    const coverCss = images[0] ? images[0].css : saveImageIfInline(fields.image || "", `${id}-cover`);

    db.prepare(
      `INSERT INTO listings
        (id, title, category, subtype, price, locality, region, distance, condition, posted, posted_at, freshness, ai_photo, image, description, seller, seller_id, seller_type, trust, sponsored, status, created_at)
       VALUES
        (@id, @title, @category, @subtype, @price, @locality, @region, @distance, @condition, @posted, @postedAt, @freshness, @aiPhoto, @image, @description, @seller, @sellerId, @sellerType, @trust, @sponsored, @status, @createdAt)`
    ).run({
      id,
      title: fields.title || "",
      category: fields.category || null,
      subtype: fields.subtype || null,
      price: fields.price || "",
      locality: fields.locality || "",
      region: fields.region || "",
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

    const insertImage = db.prepare("INSERT INTO listing_images (listing_id, position, css, ai_generated) VALUES (?, ?, ?, ?)");
    images.forEach((image, index) => insertImage.run(id, index, image.css, image.aiGenerated ? 1 : 0));

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
      const newImages = rawImages.slice(0, 6).map((image, index) => ({
        css: saveImageIfInline(image.css, `${req.params.id}-${index}-${Date.now()}`),
        aiGenerated: Boolean(image.aiGenerated)
      }));
      const newCssSet = new Set(newImages.map((image) => image.css));
      oldImages.forEach((old) => {
        if (!newCssSet.has(old.css)) deleteFileIfLocal(old.css);
      });

      db.prepare("DELETE FROM listing_images WHERE listing_id = ?").run(req.params.id);
      const insertImage = db.prepare("INSERT INTO listing_images (listing_id, position, css, ai_generated) VALUES (?, ?, ?, ?)");
      newImages.forEach((image, index) => insertImage.run(req.params.id, index, image.css, image.aiGenerated ? 1 : 0));

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

    db.prepare("DELETE FROM listing_images WHERE listing_id = ?").run(req.params.id);
    db.prepare("DELETE FROM saved_items WHERE listing_id = ?").run(req.params.id);
    db.prepare("DELETE FROM listings WHERE id = ?").run(req.params.id);

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

  // --- Reports ---
  // NM-A14: reporting requires a real account -- reporterId is the session's.
  router.post("/reports", requireSession, (req, res) => {
    const fields = req.body || {};
    const record = { id: makeId("report"), listingId: fields.listingId || null, reporterId: req.currentUser.id, createdAt: Date.now() };
    db.prepare("INSERT INTO reports (id, listing_id, reporter_id, created_at) VALUES (?, ?, ?, ?)").run(
      record.id,
      record.listingId,
      record.reporterId,
      record.createdAt
    );
    res.json(record);
  });

  router.get("/reports", (req, res) => {
    const rows = db.prepare("SELECT * FROM reports").all();
    res.json(rows.map((row) => ({ id: row.id, listingId: row.listing_id, reporterId: row.reporter_id, createdAt: row.created_at })));
  });

  // --- Conversations & messages ---
  // NM-A14: messaging requires a real account -- the acting user must
  // genuinely be one of the participants, not merely claimed as one.
  router.post("/conversations/start-or-get", requireSession, (req, res) => {
    const { listingId, participantIds } = req.body || {};
    const ids = Array.isArray(participantIds) ? participantIds : [];
    if (!ids.includes(req.currentUser.id)) ids.push(req.currentUser.id);

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
    db.prepare("INSERT INTO conversations (id, listing_id, created_at) VALUES (?, ?, ?)").run(id, listingId, createdAt);
    const insertParticipant = db.prepare("INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)");
    ids.forEach((userId) => insertParticipant.run(id, userId));

    res.json({ id, listingId, participantIds: ids.slice(), createdAt });
  });

  router.get("/conversations", (req, res) => {
    const rows = db
      .prepare(
        `SELECT DISTINCT c.* FROM conversations c
         JOIN conversation_participants p ON p.conversation_id = c.id
         WHERE p.user_id = ?`
      )
      .all(req.query.userId);
    res.json(rows.map((row) => rowToConversation(db, row)));
  });

  router.get("/conversations/all", (req, res) => {
    const rows = db.prepare("SELECT * FROM conversations").all();
    res.json(rows.map((row) => rowToConversation(db, row)));
  });

  router.post("/conversations/:id/messages", requireSession, (req, res) => {
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

  router.get("/conversations/:id/messages", (req, res) => {
    const rows = db.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC").all(req.params.id);
    res.json(rows.map(rowToMessage));
  });

  return router;
}

module.exports = { createApiRouter };
