"use strict";

// Example protected routes using the auth middleware
const express = require("express");
const router = express.Router();

const { requireAuth, requireRoles } = require("../middleware/auth");

// Basic protected route (any authenticated user)
router.get("/profile", requireAuth(), async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles,
    },
  });
});

// Admin-only route example
router.get("/admin/metrics", requireAuth({ roles: ["ADMIN"] }), requireRoles(["ADMIN"]), async (_req, res) => {
  return res.status(200).json({ metrics: { uptime: process.uptime() } });
});

module.exports = router;
