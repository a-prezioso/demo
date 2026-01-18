"use strict";

// Application entrypoint
const { buildApp } = require("./src/api");

const PORT = parseInt(process.env.PORT || "3000", 10);

async function start() {
  const app = buildApp();
  app.listen(PORT, () => {
    console.log(JSON.stringify({ level: "info", msg: "server_started", port: PORT }));
  });
}

start().catch((err) => {
  console.error(JSON.stringify({ level: "error", msg: "server_start_error", err: err.message }));
  process.exit(1);
});
