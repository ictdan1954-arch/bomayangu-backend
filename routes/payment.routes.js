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
// GET /api/payments/status/:applicationId
router.get('/status/:applicationId', paymentController.checkPaymentStatus);

// ---------- (REMOVED) PAYBILL ----------
// Paybill is no longer supported – removed.
// router.post('/paybill', paymentController.initiatePaybill);

module.exports = router;
