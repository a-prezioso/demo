"use strict";

// Public entry for client modules
module.exports = {
  components: require("./components"),
  api: {
    auth: require("./api/authClient"),
  },
  storage: {
    tokenStorage: require("./storage/tokenStorage"),
  },
};
