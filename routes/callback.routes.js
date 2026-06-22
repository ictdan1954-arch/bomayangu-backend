const express = require('express');
const router = express.Router();
const callbackController = require('../controllers/callback.controller');

// ---------- PAYHERO CALLBACK ----------
// PayHero sends payment confirmation to this endpoint after STK Push
router.post('/payhero', callbackController.payheroCallback);

// ---------- (REMOVED) M-PESA AND PAYBILL CALLBACKS ----------
// These are no longer used – we've migrated to PayHero.
// router.post('/mpesa', callbackController.mpesaCallback);
// router.post('/paybill', callbackController.paybillCallback);

module.exports = router;
