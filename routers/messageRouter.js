const express = require('express');
const router = express.Router();

const auth = require('../middelware/auth');
const messageController = require('../controllers/messageController');

router.post('/send', auth, messageController.sendMessage);
router.get('/getAllMessages', auth, messageController.getAllMessages);

module.exports = router;