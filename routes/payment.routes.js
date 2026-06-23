const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// ---------- STK PUSH ----------
// Initiate STK Push payment via PayHero
// POST /api/payments/stk-push
// Body: { applicationId, phoneNumber }
router.post('/stk-push', paymentController.initiateSTKPush);

// ---------- PAYMENT STATUS ----------
// Check the status of a payment for a given application
// GET /api/payments/status/:reference (or applicationId)
router.get('/status/:reference', paymentController.getPaymentStatus);

// ---------- PAYHERO CALLBACK ----------
// Public endpoint that PayHero calls to confirm payment status
// POST /api/payments/callback
// Body: PayHero's callback payload
router.post('/callback', paymentController.handleCallback);

// ---------- (REMOVED) PAYBILL ----------
// Paybill is no longer supported – removed.
// router.post('/paybill', paymentController.initiatePaybill);

module.exports = router;
