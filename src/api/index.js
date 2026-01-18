"use strict";

const { createServer } = require("./server");
const routes = require("./routes");

function buildApp() {
  const app = createServer();
  app.use("/api", routes);
  return app;
}

module.exports = { buildApp };
