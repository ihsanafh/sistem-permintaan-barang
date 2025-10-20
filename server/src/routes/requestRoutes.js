const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/auth'); // Middleware untuk otentikasi
const adminAuthMiddleware = require('../middleware/adminAuth');

// Semua rute di file ini memerlukan login, jadi kita gunakan middleware di awal
router.use(authMiddleware);

// Rute Karyawan
router.post('/', requestController.createRequest);
router.get('/my-requests', requestController.getMyRequests);

// --- Rute Khusus Admin ---
// GET /api/requests -> Melihat SEMUA permintaan
router.get('/', adminAuthMiddleware, requestController.getAllRequests);

// PUT /api/requests/:requestId/process -> Memproses permintaan
router.put('/:requestId/process', adminAuthMiddleware, requestController.processRequest);


module.exports = router;