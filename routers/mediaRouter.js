const express = require("express");
const router = express.Router();

const authenticateUser = require("../middelware/auth");
const upload = require("../middelware/mediaUpload");
const mediaController = require("../controllers/mediaController");

router.post("/upload",authenticateUser,upload.single("file"),mediaController.uploadMedia);
router.get("/url", authenticateUser, mediaController.getMediaUrl);

module.exports = router;
