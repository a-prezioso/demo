"use strict";

// Helper to create and configure an in-memory pg database using pg-mem
// Currently not used directly by tests, but kept for future reuse
const { newDb } = require("pg-mem");

function createInMemoryDb() {
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  mem.public.registerFunction({ name: "now", returns: "timestamptz", implementation: () => new Date() });
  mem.public.registerFunction({ name: "gen_random_uuid", returns: "uuid", implementation: () => require("crypto").randomUUID() });
  return mem;
}

module.exports = { createInMemoryDb };
