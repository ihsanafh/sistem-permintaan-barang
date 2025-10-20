const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');

// POST /api/reports/generate -> Membuat laporan
router.post('/generate', authMiddleware, adminAuthMiddleware, reportController.generateReport);

module.exports = router;