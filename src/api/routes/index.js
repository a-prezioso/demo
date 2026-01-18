"use strict";

const express = require("express");
const auth = require("./auth");
const secure = require("./secure");

const router = express.Router();

router.use("/auth", auth);
router.use("/secure", secure);

module.exports = router;
