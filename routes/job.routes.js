const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');

router.get('/', jobController.getAll);
router.get('/:id', jobController.getOne);

module.exports = router;
