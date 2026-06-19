const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.post('/stk-push', paymentController.initiateSTKPush);
router.post('/paybill', paymentController.initiatePaybill);

module.exports = router;
