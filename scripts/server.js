// FindNord server (NM-A11: Backend Foundation, NM-A12: real file storage for
// images, NM-A14: real email + password auth). Express replaces the old raw
// http.createServer; the app's data lives in a real SQLite database
// (scripts/db.js + scripts/api.js), every real (uploaded or AI-generated)
// photo is a real file under uploads/ (scripts/image-storage.js), served
// here at /uploads, and every request gets a real session attached
// (scripts/auth.js) via a cookie -- no more client-trusted identity.

const path = require("node:path");
const express = require("express");
const { openDatabase } = require("./db");
const { createApiRouter } = require("./api");
const { createImageStorage } = require("./image-storage");
const { attachSession, requireSession, createAuthRouter } = require("./auth");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);

const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const OPENAI_IMAGE_SIZE = "1024x1024";
const MAX_PROMPT_LENGTH = 300;

// Real OpenAI image generation, proxied server-side so the API key never
// reaches the browser. Gated behind sign-in both in the frontend (NM-A4's
// requireAuth) and now server-side too (requireSession, NM-A14) -- the
// client-side gate alone never stopped a crafted request straight to this
// endpoint from spending the site owner's real OpenAI credits.
async function handleGenerateImage(req, res) {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim().slice(0, MAX_PROMPT_LENGTH) : "";
  if (!prompt) {
    res.status(400).json({ error: "A prompt is required to generate an image." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "OPENAI_API_KEY is not set on the server. Set it as an environment variable before running npm run serve, then try again."
    });
    return;
  }

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt: `Candid, natural amateur photo taken by a phone camera for a classifieds listing, slightly imperfect framing and everyday home lighting, not a professional or stock photo: ${prompt}`,
        size: OPENAI_IMAGE_SIZE,
        n: 1
      })
    });

    const data = await openaiResponse.json().catch(() => null);

    if (!openaiResponse.ok) {
      const message = (data && data.error && data.error.message) || `OpenAI request failed (${openaiResponse.status}).`;
      res.status(openaiResponse.status).json({ error: message });
      return;
    }

    const item = data && data.data && data.data[0];
    const image = item && item.b64_json ? `data:image/png;base64,${item.b64_json}` : item && item.url ? item.url : null;

    if (!image) {
      res.status(502).json({ error: "OpenAI did not return an image." });
      return;
    }

    res.status(200).json({ image });
  } catch (error) {
    res.status(502).json({ error: `Could not reach OpenAI: ${error.message}` });
  }
}

function createApp(db, uploadsDir) {
  const imageStorage = createImageStorage(uploadsDir);
  imageStorage.ensureUploadsDir();

  const app = express();
  app.disable("x-powered-by");

  app.use(attachSession(db));
  app.use("/api/auth", createAuthRouter(db));
  app.post("/api/generate-image", express.json({ limit: "10kb" }), requireSession, handleGenerateImage);
  app.use("/api", createApiRouter(db, { uploadsDir: imageStorage.uploadsDir }));
  app.use("/uploads", express.static(imageStorage.uploadsDir));
  app.use(express.static(root));

  return app;
}

function startServer(options = {}) {
  const db = openDatabase(options.dbPath, { uploadsDir: options.uploadsDir });
  const app = createApp(db, options.uploadsDir);
  const server = app.listen(options.port ?? port, () => {
    if (!options.silent) {
      console.log(`FindNord running at http://127.0.0.1:${server.address().port}`);
      if (!process.env.OPENAI_API_KEY) {
        console.log("Note: OPENAI_API_KEY is not set — /api/generate-image will return a clear error until it is.");
      }
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.log(
          "Note: GOOGLE_CLIENT_ID is not set — \"Continue with Google\" will show as unavailable until it is. " +
            "GOOGLE_CLIENT_SECRET is NOT needed by this app at all (see scripts/google-auth.js)."
        );
      }
    }
  });
  return { server, db, app };
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
