"use strict";

// JWT authentication middleware/guard
// - Extracts Bearer token from Authorization header
// - Verifies signature and expiration via jwtService.verify
// - Attaches req.user (id/email/roles) and req.auth (token/payload)
// - Supports optional revocation hook and role-based authorization
// - Sends 401 on missing/invalid/expired/revoked; 403 on insufficient roles

const { jwtService } = require("../../security");

function getTokenFromHeader(req) {
  const header = req.headers && (req.headers["authorization"] || req.headers["Authorization"]);
  if (!header || typeof header !== "string") return null;
  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (/^Bearer$/i.test(scheme)) return token;
  return null;
}

function send(res, code, message) {
  return res.status(code).json({ error: message });
}

function hasRequiredRoles(userRoles, required, { requireAll = false } = {}) {
  const roles = Array.isArray(userRoles) ? userRoles : [];
  const reqd = Array.isArray(required) ? required : [];
  if (reqd.length === 0) return true;
  if (requireAll) {
    return reqd.every((r) => roles.includes(r));
  }
  return reqd.some((r) => roles.includes(r));
}

// requireAuth(options)
// options:
// - roles: array of required roles (any-match by default)
// - requireAll: boolean (if true, require all roles)
// - isTokenRevoked: async function(payload, token, req) -> boolean (optional)
function requireAuth(options = {}) {
  const { roles, requireAll = false, isTokenRevoked } = options;

  return async function authMiddleware(req, res, next) {
    try {
      const token = getTokenFromHeader(req);
      if (!token) return send(res, 401, "Missing or invalid Authorization header");

      const result = jwtService.verify(token);
      if (!result || !result.valid) {
        const err = (result && result.error) || "invalid_token";
        if (err === "token_expired") return send(res, 401, "Token expired");
        if (err === "token_not_yet_valid") return send(res, 401, "Token not yet valid");
        if (err === "invalid_issuer" || err === "invalid_audience") return send(res, 401, "Invalid token");
        return send(res, 401, "Invalid token");
      }

      const payload = result.payload || {};

      // Optional revocation hook
      if (typeof isTokenRevoked === "function") {
        try {
          const revoked = await Promise.resolve(isTokenRevoked(payload, token, req));
          if (revoked) return send(res, 401, "Token revoked");
        } catch (_e) {
          // Fail safe: if the revocation check fails unexpectedly, deny
          return send(res, 401, "Invalid token");
        }
      }

      const { sub, email, roles: userRoles } = payload;
      req.user = {
        id: sub,
        email: email,
        roles: Array.isArray(userRoles) ? userRoles : [],
        // expose remaining claims if needed by downstream handlers
        ...payload,
      };
      req.auth = { token, payload };

      // Role enforcement if configured
      if (Array.isArray(roles) && roles.length > 0) {
        if (!hasRequiredRoles(req.user.roles, roles, { requireAll })) {
          return send(res, 403, "Forbidden");
        }
      }

      return next();
    } catch (_err) {
      return send(res, 401, "Unauthorized");
    }
  };
}

// Separate role-check helper to be used after requireAuth()
function requireRoles(requiredRoles, { requireAll = false } = {}) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!hasRequiredRoles(req.user.roles, requiredRoles, { requireAll })) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRoles,
};
