// Opens (creating + seeding on first run) the SQLite database backing the
// FindNord API (NM-A11). Kept separate from api.js so tests can open an
// isolated database (a temp file, or ":memory:") without touching the
// server's real data/findnord.db.

const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { listings: seedListings } = require("../db/seed-data");
const { createImageStorage } = require("./image-storage");

const DEFAULT_DB_PATH = path.join(__dirname, "..", "data", "findnord.db");
const SCHEMA_PATH = path.join(__dirname, "..", "db", "schema.sql");

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function seedIfEmpty(db) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM listings").get();
  if (count > 0) return;

  const insertListing = db.prepare(`
    INSERT INTO listings
      (id, title, category, subtype, price, locality, region, distance, condition, posted, posted_at, freshness, ai_photo, image, description, seller, seller_id, seller_type, trust, sponsored, created_at)
    VALUES
      (@id, @title, @category, @subtype, @price, @locality, @region, @distance, @condition, @posted, @postedAt, @freshness, @aiPhoto, @image, @description, @seller, @sellerId, @sellerType, @trust, @sponsored, @createdAt)
  `);
  const insertImage = db.prepare(`
    INSERT INTO listing_images (listing_id, position, css, ai_generated) VALUES (?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    for (const listing of seedListings) {
      insertListing.run({
        id: listing.id,
        title: listing.title,
        category: listing.category,
        subtype: listing.subtype || null,
        price: listing.price,
        locality: listing.locality,
        region: listing.region || null,
        distance: listing.distance,
        condition: listing.condition,
        posted: listing.posted,
        postedAt: listing.postedAt,
        freshness: listing.freshness || "",
        aiPhoto: 0,
        image: listing.images[0].css,
        description: listing.description,
        seller: listing.seller,
        sellerId: null,
        sellerType: listing.sellerType,
        trust: listing.trust,
        sponsored: listing.sponsored ? 1 : 0,
        createdAt: listing.postedAt
      });
      listing.images.forEach((image, index) => {
        insertImage.run(listing.id, index, image.css, image.aiGenerated ? 1 : 0);
      });
    }
  });
  seedAll();
}

// NM-A12: defensive, idempotent migration for any database created before
// real file storage existed (NM-A11's short-lived phase where a listing's
// photos were inline `url(data:...)` values stored directly in SQLite).
// Runs on every startup but only touches rows that still have inline data --
// a fresh or already-migrated database does nothing here. Seed listings'
// gradients never match the inline pattern, so they pass through untouched.
function migrateInlineImagesToFiles(db, uploadsDir) {
  const { saveImageIfInline } = createImageStorage(uploadsDir);
  const inlineImageRows = db.prepare("SELECT id, listing_id, position, css FROM listing_images WHERE css LIKE 'url(data:%'").all();
  const inlineListingRows = db.prepare("SELECT id, image FROM listings WHERE image LIKE 'url(data:%'").all();
  if (inlineImageRows.length === 0 && inlineListingRows.length === 0) return;

  const updateImage = db.prepare("UPDATE listing_images SET css = ? WHERE id = ?");
  const updateListingCover = db.prepare("UPDATE listings SET image = ? WHERE id = ?");

  const migrate = db.transaction(() => {
    for (const row of inlineImageRows) {
      updateImage.run(saveImageIfInline(row.css, `${row.listing_id}-${row.position}-migrated`), row.id);
    }
    for (const row of inlineListingRows) {
      updateListingCover.run(saveImageIfInline(row.image, `${row.id}-cover-migrated`), row.id);
    }
  });
  migrate();
}

// NM-A13: defensive, idempotent migration for any database created before
// listing status (active/reserved/sold) existed as a column. schema.sql's
// `CREATE TABLE IF NOT EXISTS` never retroactively adds columns to an
// existing table, so a database from NM-A11/NM-A12 needs this once; a fresh
// database already has the column from schema.sql and this is a no-op.
function migrateListingStatusColumn(db) {
  const columns = db.prepare("PRAGMA table_info(listings)").all();
  const hasStatus = columns.some((column) => column.name === "status");
  if (!hasStatus) db.exec("ALTER TABLE listings ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
}

// NM-A14: defensive, idempotent migration for any database created before
// real auth existed -- adds the password_hash column a mocked-auth-era
// database is missing. A pre-NM-A14 database's rows simply can't be logged
// into again afterward (they have no password): acceptable for a prototype,
// and the clean path is a fresh data/findnord.db, same as every prior
// additive migration in this project.
function migrateUsersAuthColumn(db) {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const hasPasswordHash = columns.some((column) => column.name === "password_hash");
  if (!hasPasswordHash) db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");

  // "Same email = same user" needs a real uniqueness guarantee. Wrapped in a
  // try/catch, not run inline in schema.sql: a mocked-auth-era database can
  // have duplicate non-empty emails (every sign-in minted a new row), which
  // would make this fail -- and a fresh/already-migrated database (the
  // common case) just creates it successfully once and is a no-op after.
  try {
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email != ''");
  } catch (error) {
    console.warn(
      "Could not create a unique index on users.email (likely duplicate emails from the pre-NM-A14 mocked-auth era). " +
        "New signups still work; a fresh data/findnord.db is the clean fix. Details:",
      error.message
    );
  }
}

// Defensive, idempotent migration for any database created before the
// select-or-type State/Region field existed -- same pattern as every prior
// additive column (status, password_hash): a fresh database already has the
// column from schema.sql and this is a no-op; an older one gets it added
// with existing rows left NULL (rendered as "" by the API, matching how a
// listing published before this slice would have no region set).
function migrateListingRegionColumn(db) {
  const columns = db.prepare("PRAGMA table_info(listings)").all();
  const hasRegion = columns.some((column) => column.name === "region");
  if (!hasRegion) db.exec("ALTER TABLE listings ADD COLUMN region TEXT");
}

// NM-A15: defensive, idempotent migration for any database created before
// Google Sign-In existed -- adds the google_id column and its unique index
// the same way migrateUsersAuthColumn added password_hash + its own unique
// index. A user row can have password_hash, google_id, both, or (only for a
// pre-NM-A14 row) neither.
function migrateUsersGoogleIdColumn(db) {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const hasGoogleId = columns.some((column) => column.name === "google_id");
  if (!hasGoogleId) db.exec("ALTER TABLE users ADD COLUMN google_id TEXT");

  try {
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL");
  } catch (error) {
    console.warn("Could not create a unique index on users.google_id. New Google sign-ins still work. Details:", error.message);
  }
}

function openDatabase(dbPath, options = {}) {
  const resolvedPath = dbPath || process.env.DB_PATH || DEFAULT_DB_PATH;
  if (resolvedPath !== ":memory:") fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

  const db = new Database(resolvedPath);
  db.pragma("foreign_keys = ON");
  if (resolvedPath !== ":memory:") db.pragma("journal_mode = WAL");

  db.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
  migrateListingStatusColumn(db);
  migrateUsersAuthColumn(db);
  migrateListingRegionColumn(db);
  migrateUsersGoogleIdColumn(db);
  seedIfEmpty(db);
  migrateInlineImagesToFiles(db, options.uploadsDir);

  return db;
}

module.exports = { openDatabase, makeId, DEFAULT_DB_PATH };
