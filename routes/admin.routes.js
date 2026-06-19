const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, adminOnly } = require('../middleware/auth');

router.post('/login', adminController.login);

router.use(authenticate, adminOnly);

router.get('/jobs', adminController.getJobs);
router.post('/jobs', adminController.createJob);
router.put('/jobs/:id', adminController.updateJob);
router.delete('/jobs/:id', adminController.deleteJob);

router.get('/applications', adminController.getApplications);
router.put('/applications/:id/verify', adminController.verifyPayment);

router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);

module.exports = router;
