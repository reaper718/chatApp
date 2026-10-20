const express = require("express");
const router = express.Router();

const groupController = require("../controllers/groupController");
const authenticateUser = require("../middelware/auth");

router.post("/create", authenticateUser, groupController.createGroup);
router.get("/my-groups", authenticateUser, groupController.getMyGroups);

module.exports = router;
