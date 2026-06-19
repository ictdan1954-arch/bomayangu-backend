const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');

router.post('/', applicationController.create);

module.exports = router;
