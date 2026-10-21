const express = require("express");
const router = express.Router();

const authenticateUser = require("../middelware/auth");
const { sendMediaMessage } = require("../controllers/mediaMessageController");

router.post("/send", authenticateUser, sendMediaMessage);

module.exports = router;
