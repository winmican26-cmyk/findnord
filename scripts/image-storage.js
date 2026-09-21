// Real local file storage for listing photos (NM-A12: Backend Phase 2).
//
// Every real photo (uploaded or AI-generated) already arrives at the API as
// a CSS background value produced by app.js's photoToCss():
//   `url(data:image/jpeg;base64,AAAA...) center/cover no-repeat`
// A seed listing's gradient (`linear-gradient(...)`) never matches this
// shape, so it passes through unchanged -- this is what keeps old seed
// listings displaying correctly without any migration of their own.
//
// saveImageIfInline() writes the decoded bytes to disk under an uploads
// directory and returns the SAME kind of CSS background value, just
// pointing at a real file URL instead of an inline data URL -- so nothing
// downstream (listing cards, the detail gallery, Inbox thumbnails) needs to
// know the difference; they all just do `style="background: ${image.css}"`,
// same as before.
//
// A factory, not a singleton, so tests can point at an isolated temp
// directory (mirroring scripts/db.js's configurable dbPath) instead of
// littering the real project's uploads/ folder on every test run.

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_UPLOADS_DIR = path.join(__dirname, "..", "uploads");

const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const INLINE_DATA_URL_PATTERN = /^url\(data:([\w./+-]+);base64,([^)]+)\)(.*)$/;
const LOCAL_FILE_URL_PATTERN = /^url\(\/uploads\/([^)]+)\)/;

function createImageStorage(uploadsDir) {
  const resolvedDir = uploadsDir || DEFAULT_UPLOADS_DIR;

  function ensureUploadsDir() {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }

  // `filenameBase` should be unique per photo (callers pass `${listingId}-${index}`).
  function saveImageIfInline(css, filenameBase) {
    const match = INLINE_DATA_URL_PATTERN.exec(css || "");
    if (!match) return css; // a seed gradient, an already-file-backed value, or empty -- store as-is

    const [, mimeType, base64, suffix] = match;
    const extension = MIME_EXTENSIONS[mimeType] || "jpg";
    const fileName = `${filenameBase}.${extension}`;

    ensureUploadsDir();
    fs.writeFileSync(path.join(resolvedDir, fileName), Buffer.from(base64, "base64"));

    return `url(/uploads/${fileName})${suffix}`;
  }

  // NM-A13: called when a photo is removed (during an edit) or a listing is
  // deleted entirely -- unlinks the real file so edits/deletes don't leave
  // orphaned photos on disk forever. A seed gradient or any non-local value
  // never matches, so this is always a safe no-op for those.
  function deleteFileIfLocal(css) {
    const match = LOCAL_FILE_URL_PATTERN.exec(css || "");
    if (!match) return;
    try {
      fs.unlinkSync(path.join(resolvedDir, match[1]));
    } catch (error) {
      // Already gone, or never existed -- fine either way.
    }
  }

  return { uploadsDir: resolvedDir, ensureUploadsDir, saveImageIfInline, deleteFileIfLocal };
}

module.exports = { createImageStorage, DEFAULT_UPLOADS_DIR };
