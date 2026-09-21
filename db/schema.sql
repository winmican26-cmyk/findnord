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
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

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

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  listing_id TEXT,
  reporter_id TEXT,
  created_at INTEGER NOT NULL
);

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
