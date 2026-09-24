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

// Deployment-readiness audit finding: this used to run unconditionally,
// meaning a genuinely empty PRODUCTION database (first real boot) would get
// silently filled with fake demo listings from db/seed-data.js. Local dev
// and the test suite never set NODE_ENV=production (confirmed -- neither
// does anywhere else in this repo), so they're completely unaffected and
// keep seeding by default, same as always. Only a real NODE_ENV=production
// deploy skips it, unless SEED_DEMO_DATA=true explicitly opts back in (e.g.
// a staging environment that wants demo data).
function shouldSeedDemoData() {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.SEED_DEMO_DATA === "true";
}

function seedIfEmpty(db) {
  if (!shouldSeedDemoData()) return;
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM listings").get();
  if (count > 0) return;

  const insertListing = db.prepare(`
    INSERT INTO listings
      (id, title, category, subtype, price, locality, region, country, distance, condition, posted, posted_at, freshness, ai_photo, image, description, seller, seller_id, seller_type, trust, sponsored, created_at)
    VALUES
      (@id, @title, @category, @subtype, @price, @locality, @region, @country, @distance, @condition, @posted, @postedAt, @freshness, @aiPhoto, @image, @description, @seller, @sellerId, @sellerType, @trust, @sponsored, @createdAt)
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
        country: listing.country || "Sweden",
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

// NM-A19: defensive, idempotent migration for any database created before a
// listing carried its own real country (and therefore currency -- see
// CURRENCY_BY_COUNTRY in scripts/api.js, which derives currency from this
// column the same way NM-A18 derives `sponsored` from a real expiry, rather
// than storing a second field that could drift out of sync). A database
// already on this schema gets the column from schema.sql and this is a
// no-op; an older one gets every existing row grandfathered as Sweden/SEK --
// the same country the app already defaulted to everywhere before this
// column existed, so no existing listing's displayed currency changes.
function migrateListingCountryColumn(db) {
  const columns = db.prepare("PRAGMA table_info(listings)").all();
  const hasCountry = columns.some((column) => column.name === "country");
  if (!hasCountry) db.exec("ALTER TABLE listings ADD COLUMN country TEXT NOT NULL DEFAULT 'Sweden'");
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

function migrateReviewsTable(db) {
  db.exec(`
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
  `);
}

// NM-A17: defensive, idempotent migration for any database created before
// review-abuse moderation existed -- same additive pattern as every prior
// column (status, password_hash, google_id, region). `review_strikes` counts
// how many times a user's review text has tripped the blocked-word filter
// (scripts/review-moderation.js); `review_banned` permanently blocks further
// review submissions once that count reaches the threshold.
function migrateUsersReviewModerationColumns(db) {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  if (!columns.some((column) => column.name === "review_strikes")) {
    db.exec("ALTER TABLE users ADD COLUMN review_strikes INTEGER NOT NULL DEFAULT 0");
  }
  if (!columns.some((column) => column.name === "review_banned")) {
    db.exec("ALTER TABLE users ADD COLUMN review_banned INTEGER NOT NULL DEFAULT 0");
  }
}

// NM-A18: defensive, idempotent migration for any database created before
// package-based, time-limited boosts existed -- adds the two new columns the
// same additive way every prior column has been added. A pre-existing
// sponsored=1 row (the old, permanent, binary boost from NM-A9) has no real
// expiry to infer, so it's grandfathered with a generous 365-day boost from
// the moment of THIS migration, rather than silently losing its boosted
// status or being treated as permanently sponsored forever with no
// expiry-driven code path to manage it.
function migrateListingBoostColumns(db) {
  const columns = db.prepare("PRAGMA table_info(listings)").all();
  if (!columns.some((column) => column.name === "boost_expires_at")) {
    db.exec("ALTER TABLE listings ADD COLUMN boost_expires_at INTEGER");
  }
  if (!columns.some((column) => column.name === "boost_package")) {
    db.exec("ALTER TABLE listings ADD COLUMN boost_package TEXT");
  }
  const legacyBoostedGrandfatherMs = 365 * 24 * 60 * 60 * 1000;
  db.prepare("UPDATE listings SET boost_expires_at = ?, boost_package = 'legacy' WHERE sponsored = 1 AND boost_expires_at IS NULL").run(
    Date.now() + legacyBoostedGrandfatherMs
  );
}

// NM-A20: defensive, idempotent migration for any database created before
// reports carried a real reason/target-user/status -- same additive pattern
// as every prior column. A pre-existing report row (listing-only, no reason)
// is left as-is: `reason`/`details` simply read as empty and `status`
// defaults to 'open', same as a report filed today with no reason typed.
function migrateReportsColumns(db) {
  const columns = db.prepare("PRAGMA table_info(reports)").all();
  if (!columns.some((column) => column.name === "reported_user_id")) {
    db.exec("ALTER TABLE reports ADD COLUMN reported_user_id TEXT");
  }
  if (!columns.some((column) => column.name === "reason")) {
    db.exec("ALTER TABLE reports ADD COLUMN reason TEXT");
  }
  if (!columns.some((column) => column.name === "details")) {
    db.exec("ALTER TABLE reports ADD COLUMN details TEXT");
  }
  if (!columns.some((column) => column.name === "status")) {
    db.exec("ALTER TABLE reports ADD COLUMN status TEXT NOT NULL DEFAULT 'open'");
  }
}

// NM-A21: defensive, idempotent migration for any database created before
// per-user contact info / admin flags existed -- same additive pattern as
// every prior column. `is_admin`/`flagged` both default to 0/false, so an
// existing account is never silently promoted to admin or flagged by this
// migration itself -- see scripts/auth.js's syncAdminFlag for the one real
// place `is_admin` ever actually gets set to 1.
function migrateUsersContactAndAdminColumns(db) {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  if (!columns.some((column) => column.name === "phone")) {
    db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
  }
  if (!columns.some((column) => column.name === "is_admin")) {
    db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
  }
  if (!columns.some((column) => column.name === "flagged")) {
    db.exec("ALTER TABLE users ADD COLUMN flagged INTEGER NOT NULL DEFAULT 0");
  }
}

// NM-A21: defensive, idempotent migration for any database created before
// admin-hide existed on a listing -- same additive pattern as every prior
// column, deliberately separate from the seller-controlled `status` column
// (see schema.sql's own comment on this column).
function migrateListingsAdminHiddenColumn(db) {
  const columns = db.prepare("PRAGMA table_info(listings)").all();
  if (!columns.some((column) => column.name === "admin_hidden")) {
    db.exec("ALTER TABLE listings ADD COLUMN admin_hidden INTEGER NOT NULL DEFAULT 0");
  }
}

// BL-A06: defensive, idempotent migration for any database created before
// a saved home location existed -- same additive pattern as every prior
// column. Existing rows are left NULL (rowToAuthUser/app.js both already
// treat a null/missing home location as the Sweden/Stockholm default, the
// same default a brand-new account gets).
function migrateUsersHomeLocationColumns(db) {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  if (!columns.some((column) => column.name === "home_country")) {
    db.exec("ALTER TABLE users ADD COLUMN home_country TEXT");
  }
  if (!columns.some((column) => column.name === "home_region")) {
    db.exec("ALTER TABLE users ADD COLUMN home_region TEXT");
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
  migrateListingCountryColumn(db);
  migrateUsersGoogleIdColumn(db);
  migrateReviewsTable(db);
  migrateUsersReviewModerationColumns(db);
  migrateReportsColumns(db);
  migrateUsersContactAndAdminColumns(db);
  migrateUsersHomeLocationColumns(db);
  migrateListingsAdminHiddenColumn(db);
  seedIfEmpty(db);
  // Runs AFTER seeding: fresh seed data itself includes sponsored=1 rows
  // (see db/seed-data.js) with no boost_expires_at, same as any pre-NM-A18
  // database would -- backfilling here, not before seeding, catches both.
  migrateListingBoostColumns(db);
  migrateInlineImagesToFiles(db, options.uploadsDir);

  return db;
}

module.exports = { openDatabase, makeId, DEFAULT_DB_PATH };
