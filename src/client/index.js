"use strict";

// Public entry for client modules. Avoid requiring React-bound modules at top-level
// to keep Node-only environments (e.g., backend tests) free from react/react-router dependencies.

const api = {
  auth: require("./api/authClient"),
  http: require("./api/httpClient"),
};

const storage = { tokenStorage: require("./storage/tokenStorage") };

const utils = { jwt: require("./utils/jwt") };

const exported = { api, storage, utils };

Object.defineProperty(exported, "components", {
  enumerable: true,
  get() {
    return require("./components");
  },
});

Object.defineProperty(exported, "context", {
  enumerable: true,
  get() {
    return require("./context/AuthContext.jsx");
  },
});

Object.defineProperty(exported, "router", {
  enumerable: true,
  get() {
    return require("./components/router");
  },
});

module.exports = exported;
