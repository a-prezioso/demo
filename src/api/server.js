"use strict";

// Minimal Express server to expose REST endpoints
// Only includes what's needed for signup endpoint

const express = require("express");

function createServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // Health
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  return app;
}

module.exports = { createServer };
