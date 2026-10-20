
const express = require("express");
const router = express.Router();

const authenticateUser = require("../middelware/auth");
const groupMessageController = require("../controllers/groupMessageController");

router.post(
    "/send",
    authenticateUser,
    groupMessageController.sendGroupMessage
);

module.exports = router;
