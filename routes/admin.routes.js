const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, adminOnly } = require('../middleware/auth');

// ---------- PUBLIC ROUTES ----------
// Admin login (no authentication required)
router.post('/login', adminController.login);

// ---------- PROTECTED ROUTES ----------
// All routes below require a valid JWT token and admin role
router.use(authenticate, adminOnly);

// Job management
router.get('/jobs', adminController.getJobs);
router.post('/jobs', adminController.createJob);
router.put('/jobs/:id', adminController.updateJob);
router.delete('/jobs/:id', adminController.deleteJob);

// Application management
router.get('/applications', adminController.getApplications);
router.put('/applications/:id/verify', adminController.verifyPayment);

// Config management
router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);

// ---------- PASSWORD CHANGE ----------
// Admin can change their own password – requires authentication.
router.post('/change-password', adminController.changePassword || (async (req, res) => {
    // Fallback if the controller method is missing – for safety.
    res.status(501).json({ error: 'Password change not implemented' });
}));

module.exports = router;
