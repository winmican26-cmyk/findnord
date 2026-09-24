-- FindNord backend schema (NM-A11: Backend Foundation).
-- Mirrors the entities DataService already defined in-memory (NM-A7):
-- User, Listing, Category/SubType, Conversation, Message, SavedItem, Report.
-- Categories/subtypes stay a static in-code taxonomy (db/seed-data.js), same
-- as before -- they were never a mutable entity, so they don't need a table.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  guest INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  google_id TEXT,
  review_strikes INTEGER NOT NULL DEFAULT 0,
  review_banned INTEGER NOT NULL DEFAULT 0,
  -- NM-A21 follow-up: a real contact number the account holder can set
  -- themselves under Settings (email is already the real account identifier).
  phone TEXT,
  -- BL-A06: the seller's real home country/region, distinct from
  -- `activeCountry` (app.js's purely transient browse-scope state, never
  -- persisted) -- set only via an explicit Settings save, defaults to
  -- Sweden/Stockholm like everything else in this app until then. A new
  -- listing is stamped with this, never with whatever country the seller
  -- merely happens to be browsing at publish time.
  home_country TEXT,
  home_region TEXT,
  -- NM-A21: a real, per-user flag -- checked on every admin-only request,
  -- not re-derived from ADMIN_EMAIL at request time -- see
  -- scripts/auth.js's syncAdminFlag for how it actually gets set.
  is_admin INTEGER NOT NULL DEFAULT 0,
  -- NM-A21: "optionally flag a user (simple status is enough)" -- a plain
  -- boolean an admin can toggle from the moderation queue, with no further
  -- workflow attached in this slice.
  flagged INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- NM-A14's unique email index (and NM-A15's unique google_id index) are both
-- created in scripts/db.js instead of here, wrapped in a try/catch -- a
-- database from the mocked-auth era could have duplicate non-empty emails
-- (every mocked sign-in minted a new row), and a CREATE UNIQUE INDEX that
-- fails partway through this file would abort every statement after it,
-- including table creation.

-- A real, server-verified login session (see scripts/auth.js). `id` is the
-- random session token itself -- the value stored in the httpOnly cookie --
-- so looking a session up is a single primary-key lookup.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  subtype TEXT,
  price TEXT,
  locality TEXT,
  region TEXT,
  country TEXT NOT NULL DEFAULT 'Sweden',
  distance TEXT,
  condition TEXT,
  posted TEXT,
  posted_at INTEGER,
  freshness TEXT,
  ai_photo INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  description TEXT,
  seller TEXT,
  seller_id TEXT,
  seller_type TEXT,
  trust TEXT,
  sponsored INTEGER NOT NULL DEFAULT 0,
  boost_expires_at INTEGER,
  boost_package TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  -- NM-A21: kept deliberately separate from `status` (active/reserved/sold,
  -- which the SELLER controls) -- an admin hiding a reported listing is a
  -- moderation action, not a change to the seller's own sale status. Either
  -- one hides the listing from Browse; they're independent and can coexist.
  admin_hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Deployment-readiness audit finding: rowToPublicProfile (scripts/api.js)
-- filters listings by seller_id on every public profile view, and this had
-- no index -- a full table scan per profile view once listing counts grow.
-- CREATE INDEX IF NOT EXISTS is idempotent and re-run on every startup (this
-- whole file is db.exec()'d unconditionally in scripts/db.js's
-- openDatabase()), so this retroactively applies to an existing database too
-- -- no separate migrate* function needed, unlike an ALTER TABLE ADD COLUMN.
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);

-- A listing's `images` array, decomposed one row per photo. `position`
-- preserves order (position 0 is always the cover/featured photo, matching
-- the existing "images[0] = cover" convention used throughout the frontend).
CREATE TABLE IF NOT EXISTS listing_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  css TEXT NOT NULL,
  ai_generated INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (listing_id) REFERENCES listings(id)
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);

CREATE TABLE IF NOT EXISTS saved_items (
  user_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, listing_id)
);

-- NM-A20: reason/details/reported_user_id/status added via
-- migrateReportsColumns in scripts/db.js for any database created before
-- this slice; a fresh install gets them straight from here.
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  listing_id TEXT,
  reported_user_id TEXT,
  reporter_id TEXT,
  reason TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL
);

-- NM-A20: a simple, symmetric-effect block -- (blocker_id, blocked_id) means
-- blocker_id no longer sees blocked_id's listings or messages. Only ONE row
-- is ever written per direction (unblocking deletes it outright, rather than
-- soft-flagging it), so "is this pair blocked at all" is a plain existence
-- check in either direction, not a status field to interpret.
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  listing_id TEXT,
  created_at INTEGER NOT NULL
);

-- A conversation's `participantIds` array, decomposed one row per
-- participant -- lets startOrGet() match "a conversation for this listing
-- with exactly this participant set" without ever parsing JSON.
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT,
  text TEXT,
  sent_at INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  listing_id TEXT,
  reviewer_id TEXT NOT NULL,
  reviewee_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE (listing_id, reviewer_id, reviewee_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- NM-A23: real, single-use, expiring password-reset tokens (see
-- scripts/auth.js's createPasswordResetToken and the /forgot-password and
-- /reset-password routes). `token` is the random value itself -- the same
-- "the id IS the secret" shape as `sessions.id` above -- so looking one up
-- is a single primary-key lookup. `used_at IS NULL` is what makes a token
-- single-use; `expires_at` bounds how long a leaked-in-transit reset link
-- stays exploitable before it's clicked. This table is new, not an added
-- column on an existing table, so (like `blocks`/`conversations`/`messages`
-- above) a plain `CREATE TABLE IF NOT EXISTS` here is the whole migration --
-- db.js's unconditional `db.exec(schema.sql)` on every startup already
-- covers a pre-NM-A23 database with no separate ALTER-TABLE-style migration
-- function needed.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
