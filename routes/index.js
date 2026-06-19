const express = require('express');
const router = express.Router();

const jobRoutes = require('./job.routes');
const applicationRoutes = require('./application.routes');
const paymentRoutes = require('./payment.routes');
const callbackRoutes = require('./callback.routes');
const adminRoutes = require('./admin.routes');

router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/payments', paymentRoutes);
router.use('/callback', callbackRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
