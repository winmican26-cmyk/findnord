// NM-A18: Monetization Foundation -- Boost / Premium (free-first, Stripe-ready).
//
// Per the PRD's launch policy, boosting stays free for the first 6 months
// after public launch (or until a deployer explicitly flips the feature
// flag). BOOST_PAYMENTS_ENABLED defaults OFF -- no env var, no code change,
// means "still free," which is the safe default for a fresh deployment.
//
// No `stripe` npm dependency: the same "avoid an unnecessary dependency"
// instinct that shaped NM-A14's scrypt-over-bcrypt and NM-A15's hand-rolled
// JWT verification. Stripe's Checkout Sessions and webhook signatures are
// both plain, well-documented HTTP/HMAC contracts -- calling them with the
// built-in `fetch` and `crypto` needs no SDK. This module is real,
// correctly-shaped integration code; it has never been exercised against a
// real Stripe account because this project has no Stripe test keys (see
// EVIDENCE.md) -- exactly what "prepare the integration points... do not
// require live keys yet" asks for.

const crypto = require("node:crypto");

// Duration in days is the unit the PRD itself specifies (24 hours, 7/30
// days, 6/12 months) -- months are approximated as 30-day blocks, an
// intentional, documented simplification (a "6 month" boost is exactly 182
// days here, not calendar-aware), consistent with this project's other
// "close enough for a prototype, documented" choices (e.g. approximate
// region centroids in the geolocation slice).
const BOOST_PACKAGES = [
  { id: "24h", label: "24 hours", days: 1, priceSek: 19 },
  { id: "7d", label: "7 days", days: 7, priceSek: 49 },
  { id: "30d", label: "30 days", days: 30, priceSek: 99 },
  { id: "6m", label: "6 months", days: 182, priceSek: 399 },
  { id: "12m", label: "12 months", days: 365, priceSek: 699 }
];

function findBoostPackage(packageId) {
  return BOOST_PACKAGES.find((pkg) => pkg.id === packageId) || null;
}

function boostDurationMs(pkg) {
  return pkg.days * 24 * 60 * 60 * 1000;
}

// A real env-var feature flag, not a hardcoded constant -- flippable per
// deployment with zero code changes, exactly like OPENAI_API_KEY/
// GOOGLE_CLIENT_ID already are in this project. Defaults OFF (free/sealed),
// matching the PRD's 6-month launch policy.
function isBoostPaymentsEnabled() {
  return process.env.BOOST_PAYMENTS_ENABLED === "true";
}

function stripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || null;
}

function stripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

// Real Stripe REST call (Checkout Sessions), via plain fetch -- no SDK. Only
// ever invoked when isBoostPaymentsEnabled() AND a real secret key are both
// present, neither of which is true anywhere this project runs today.
// `successUrl`/`cancelUrl` both carry the listing id so the frontend can
// reopen the right listing either way; `metadata` is what the webhook
// handler below reads to know which listing/package to actually apply.
async function createBoostCheckoutSession({ listingId, packageId, successUrl, cancelUrl }) {
  const pkg = findBoostPackage(packageId);
  const secretKey = stripeSecretKey();
  if (!secretKey) {
    throw Object.assign(new Error("Stripe is not configured on this server."), { code: "STRIPE_NOT_CONFIGURED" });
  }
  if (!pkg) {
    throw Object.assign(new Error("Unknown boost package."), { code: "INVALID_BOOST_PACKAGE" });
  }

  const body = new URLSearchParams({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "sek",
    "line_items[0][price_data][unit_amount]": String(pkg.priceSek * 100),
    "line_items[0][price_data][product_data][name]": `FindNord Boost — ${pkg.label}`,
    "metadata[listingId]": listingId,
    "metadata[packageId]": packageId
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (data && data.error && data.error.message) || `Stripe request failed (${response.status}).`;
    throw Object.assign(new Error(message), { code: "STRIPE_REQUEST_FAILED" });
  }
  return { id: data.id, url: data.url };
}

// Stripe signs webhooks as `t=<timestamp>,v1=<hex hmac>` in the
// Stripe-Signature header, over the string `${timestamp}.${rawBody}`, using
// HMAC-SHA256 with the webhook signing secret -- documented, not
// SDK-specific, so Node's own crypto.timingSafeEqual verifies it exactly as
// correctly as the official SDK would.
function verifyStripeWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  if (!parts.t || !parts.v1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(parts.v1, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

module.exports = {
  BOOST_PACKAGES,
  findBoostPackage,
  boostDurationMs,
  isBoostPaymentsEnabled,
  stripeSecretKey,
  stripeWebhookSecret,
  createBoostCheckoutSession,
  verifyStripeWebhookSignature
};
