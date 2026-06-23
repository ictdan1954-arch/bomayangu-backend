const express = require('express');
const router = express.Router();

// Import route modules
const jobRoutes = require('./job.routes');
const applicationRoutes = require('./application.routes');
const paymentRoutes = require('./payment.routes');
// const callbackRoutes = require('./callback.routes'); // ← REMOVED – handled inside paymentRoutes now
const adminRoutes = require('./admin.routes');

// Import Config model for public config route
const { Config } = require('../models');

// ---------- PUBLIC ROUTES (no authentication) ----------
// Public config endpoint – used by the frontend to fetch application settings
router.get('/config/public', async (req, res) => {
    try {
        const configs = await Config.findAll();
        const result = {};
        configs.forEach(c => result[c.key] = c.value);
        res.json(result);
    } catch (error) {
        console.error('Error fetching public config:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

// ---------- API ROUTES ----------
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/payments', paymentRoutes);          // ← includes /callback now
// router.use('/callback', callbackRoutes);     // ← REMOVED – no longer needed
router.use('/admin', adminRoutes);

// ---------- OPTIONAL: Root route (for API info) ----------
router.get('/', (req, res) => {
    res.json({
        name: 'Boma Yangu API',
        version: '1.0.0',
        endpoints: {
            jobs: '/api/jobs',
            applications: '/api/applications',
            payments: '/api/payments',
            callback: '/api/payments/callback',   // updated to reflect new location
            admin: '/api/admin',
            config_public: '/api/config/public'
        }
    });
});

module.exports = router;
