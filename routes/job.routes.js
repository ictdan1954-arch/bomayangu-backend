const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');

// ---------- PUBLIC ROUTES (no authentication) ----------

// Get all active jobs (optionally filtered by category via query param)
// Example: GET /api/jobs?category=driver
router.get('/', jobController.getAll);

// Get all jobs in a specific category (alternative endpoint)
// Example: GET /api/jobs/category/driver
router.get('/category/:category', jobController.getByCategory);

// Get a single job by ID
// Example: GET /api/jobs/101
router.get('/:id', jobController.getOne);

module.exports = router;
