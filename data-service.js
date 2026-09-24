// --- FindNord Data Service (NM-A11: Backend Foundation, NM-A14: real auth) ---
//
// This file is the ONLY place that talks to the backend API for application
// data. Every UI file (app.js) talks to `DataService`, never to `fetch`
// directly. Every method here still returns a Promise -- now a REAL one,
// backed by a real network call to the Express + SQLite backend
// (scripts/api.js, scripts/auth.js) -- which is exactly why NM-A7 made every
// method Promise-based from day one: swapping the in-memory store for a real
// backend, and later mocked auth for real auth, required ZERO changes to any
// UI call site in app.js that already did `await DataService.x.y(...)`.
//
// NM-A14 replaces every mocked-auth assumption: `users.getCurrent()` is now
// a real `GET /api/auth/me` call, verified server-side against a real,
// httpOnly session cookie the browser manages automatically -- not a
// client-cached guess. There is no more localStorage user cache; the cookie
// (survives a browser restart) and the session row in SQLite (survives a
// server restart) are the only sources of truth, which is what makes "stay
// logged in across a server restart" genuinely true rather than assumed.
//
// Entities: User, Listing, Category/SubType, Conversation, Message,
// SavedItem, Report, Review.

const DataService = (() => {
  const API_BASE = "/api";

  async function request(path, options) {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(body.error || `Request to ${path} failed (${response.status}).`);
      error.code = body.code;
      error.status = response.status;
      // NM-A24: a 429 from scripts/rate-limit.js always carries a real
      // Retry-After header (seconds until the caller's window resets) --
      // surfaced here on the thrown error so any UI catch block can show a
      // real "try again in X minutes" message instead of a generic one.
      const retryAfterHeader = response.headers.get("retry-after");
      if (retryAfterHeader) error.retryAfter = Number(retryAfterHeader);
      throw error;
    }
    return response.json();
  }

  function get(path) {
    return request(path);
  }

  function post(path, body) {
    return request(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  }

  function patch(path, body) {
    return request(path, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  }

  function del(path, body) {
    return request(
      path,
      body === undefined ? { method: "DELETE" } : { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
    );
  }

  return {
    users: {
      // A real server check every time, via the httpOnly session cookie the
      // browser already sends -- not a cached guess.
      getCurrent() {
        return get("/auth/me");
      },
      register(fields) {
        return post("/auth/register", fields);
      },
      login(fields) {
        return post("/auth/login", fields);
      },
      // NM-A15: `credential` is the ID token Google Identity Services hands
      // back after a successful account picker flow -- verified server-side
      // (see scripts/google-auth.js), never stored.
      loginWithGoogle(credential) {
        return post("/auth/google", { credential });
      },
      // NM-A23: always resolves (the server itself always answers 200 for a
      // well-formed request, whether or not the email is a real account --
      // see scripts/auth.js's /forgot-password route) unless the request
      // itself fails (network error, or a real 429 from rate limiting).
      requestPasswordReset(email) {
        return post("/auth/forgot-password", { email });
      },
      resetPassword(token, password) {
        return post("/auth/reset-password", { token, password });
      },
      googleConfig() {
        return get("/auth/google/config");
      },
      // NM-A16: a public profile -- no session required, same as browsing
      // listings. Returns null for an id that doesn't resolve to a real user.
      getProfile(id) {
        return get(`/users/${encodeURIComponent(id)}/profile`);
      },
      async signOut() {
        await post("/auth/logout", {});
        return null;
      },
      // NM-A21 follow-up: Settings under Profile -- currently just phone;
      // email stays the real account identifier, shown but not editable here.
      updateSettings(fields) {
        return patch("/auth/me", fields);
      },
      // Deployment-readiness audit / Data Subject Rights: a real,
      // self-service export of everything this account's own id/email
      // touches -- see scripts/auth.js's GET /auth/me/export.
      exportData() {
        return get("/auth/me/export");
      },
      // A real, self-service account deletion (anonymizes the account's
      // personal data server-side) -- see scripts/auth.js's DELETE
      // /auth/me. `password` is required for a real (non-Google-only)
      // account, as a safety check on this irreversible action.
      deleteAccount(password) {
        return del("/auth/me", { password });
      }
    },

    // NM-A21: the internal moderation queue's own data calls -- every one of
    // these 403s server-side for a non-admin regardless of what the
    // frontend does, so this is a thin client, not where access control
    // actually lives.
    admin: {
      getReports() {
        return get("/reports");
      },
      updateReportStatus(id, status) {
        return patch(`/reports/${encodeURIComponent(id)}`, { status });
      },
      hideListing(id) {
        return post(`/admin/listings/${encodeURIComponent(id)}/hide`, {});
      },
      unhideListing(id) {
        return post(`/admin/listings/${encodeURIComponent(id)}/unhide`, {});
      },
      flagUser(id) {
        return post(`/admin/users/${encodeURIComponent(id)}/flag`, {});
      },
      unflagUser(id) {
        return post(`/admin/users/${encodeURIComponent(id)}/unflag`, {});
      }
    },

    categories: {
      getAll() {
        return get("/categories");
      },
      findById(id) {
        return get(`/categories/${encodeURIComponent(id)}`);
      }
    },

    listings: {
      getAll() {
        return get("/listings");
      },
      findById(id) {
        return get(`/listings/${encodeURIComponent(id)}`);
      },
      create(fields) {
        return post("/listings", fields);
      },
      // NM-A9 addition, preserved: a mutation to an EXISTING listing
      // (originally just Boost; NM-A13 adds Edit and status changes through
      // the same method). Ownership is verified server-side from the real
      // session now (NM-A14), not a client-supplied id.
      update(id, fields) {
        return patch(`/listings/${encodeURIComponent(id)}`, fields);
      },
      // NM-A13: Delete/Unpublish. Server-side ownership-checked from the
      // real session, same as update().
      delete(id) {
        return del(`/listings/${encodeURIComponent(id)}`);
      }
    },

    // NM-A18: Boost / Premium. `activate`/`cancel` are the free path (only
    // reachable while boost.config's paymentsEnabled is false); `checkout`
    // is the Stripe test-mode integration point, only meaningful once it's
    // true and the server has real Stripe keys configured.
    boost: {
      config() {
        return get("/boost/config");
      },
      activate(listingId, packageId) {
        return post(`/listings/${encodeURIComponent(listingId)}/boost`, { packageId });
      },
      cancel(listingId) {
        return post(`/listings/${encodeURIComponent(listingId)}/unboost`, {});
      },
      checkout(listingId, packageId, returnUrl) {
        return post(`/listings/${encodeURIComponent(listingId)}/boost/checkout`, { packageId, returnUrl });
      }
    },

    savedItems: {
      isSaved(userId, listingId) {
        return get(`/saved-items/status?userId=${encodeURIComponent(userId)}&listingId=${encodeURIComponent(listingId)}`);
      },
      toggle(userId, listingId) {
        return post("/saved-items/toggle", { userId, listingId });
      },
      getForUser(userId) {
        return get(`/saved-items?userId=${encodeURIComponent(userId)}`);
      },
      // NM-A9: Analytics needs "who saved MY listings," which is the mirror
      // image of getForUser's "what did I save" -- both read the same store.
      getAll() {
        return get("/saved-items/all");
      }
    },

    reports: {
      create(fields) {
        return post("/reports", fields);
      },
      getAll() {
        return get("/reports");
      }
    },

    // NM-A20: a block is entirely from the blocker's own side -- these three
    // methods are all the frontend ever needs (create, remove, list-mine).
    blocks: {
      create(blockedUserId) {
        return post("/blocks", { blockedUserId });
      },
      remove(blockedUserId) {
        return del(`/blocks/${encodeURIComponent(blockedUserId)}`);
      },
      getMine() {
        return get("/blocks");
      }
    },

    reviews: {
      create(fields) {
        return post("/reviews", fields);
      }
    },

    conversations: {
      // Finds or creates a conversation for a listing + participant set.
      startOrGet(listingId, participantIds) {
        return post("/conversations/start-or-get", { listingId, participantIds });
      },
      getForUser(userId) {
        return get(`/conversations?userId=${encodeURIComponent(userId)}`);
      },
      // NM-A9: Analytics needs "conversations ABOUT my listings," which is
      // keyed by listingId, not by participation -- a seller is never a
      // participantId in this data model (see NM-A7/A8 residual risks), so
      // this can't reuse getForUser and reads everything instead.
      getAll() {
        return get("/conversations/all");
      },
      addMessage(conversationId, fields) {
        return post(`/conversations/${encodeURIComponent(conversationId)}/messages`, fields);
      },
      getMessages(conversationId) {
        return get(`/conversations/${encodeURIComponent(conversationId)}/messages`);
      }
    }
  };
})();
