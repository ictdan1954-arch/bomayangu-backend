const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');

// ---------- PUBLIC ROUTES (no authentication required) ----------
// Create a new job application
router.post('/', applicationController.create);

// ---------- FUTURE ROUTES (commented out for now) ----------
// Get a single application by ID (for status checking)
// router.get('/:id', applicationController.getOne);

// Get applications for a specific user (would require authentication)
// router.get('/user/:userId', applicationController.getByUser);

// Update application status (admin only – handled in admin.routes.js)

module.exports = router;
