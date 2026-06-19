const express = require('express');
const router = express.Router();
const callbackController = require('../controllers/callback.controller');

router.post('/mpesa', callbackController.mpesaCallback);
router.post('/paybill', callbackController.paybillCallback);

module.exports = router;
