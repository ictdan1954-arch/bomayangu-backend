const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, adminOnly } = require('../middleware/auth');

// ---------- PUBLIC ROUTES (no authentication) ----------
// Admin login – accessible without a token
router.post('/login', adminController.login);

// ---------- PROTECTED ROUTES (authentication + admin role required) ----------
// All routes below require a valid JWT token and the admin role.
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

// Password change (admin only)
router.post('/change-password', adminController.changePassword);

// ---------- OPTIONAL: Admin profile (if needed) ----------
// router.get('/profile', adminController.getProfile);
// router.put('/profile', adminController.updateProfile);

module.exports = router;
