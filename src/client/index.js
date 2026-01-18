"use strict";

// Public entry for client modules
module.exports = {
  components: require("./components"),
  api: {
    auth: require("./api/authClient"),
    http: require("./api/httpClient"),
  },
  storage: {
    tokenStorage: require("./storage/tokenStorage"),
  },
  context: require("./context/AuthContext.jsx"),
  utils: {
    jwt: require("./utils/jwt"),
  },
};
