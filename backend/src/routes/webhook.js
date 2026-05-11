const express = require('express');
const intakeController = require('../controllers/intakeController');

const router = express.Router();

router.post('/whatsapp', intakeController.handleWhatsAppWebhook);

module.exports = router;
