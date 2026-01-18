"use strict";

// Private routes protected by JWT middleware
const express = require("express");
const router = express.Router();

const { requireAuth, requireRoles } = require("../middleware/auth");

// Apply auth middleware to all /private routes
router.use(requireAuth());

// Health-like private endpoint
router.get("/me", async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles,
    },
  });
});

// Example of role-protected endpoint
router.get("/admin/overview", requireRoles(["ADMIN"]), async (_req, res) => {
  return res.status(200).json({ status: "ok", scope: "admin" });
});

module.exports = router;
