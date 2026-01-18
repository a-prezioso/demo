"use strict";

const express = require("express");
const auth = require("./auth");
const secure = require("./secure");
const priv = require("./private");

const router = express.Router();

router.use("/auth", auth);
router.use("/secure", secure);
router.use("/private", priv);

module.exports = router;
