const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');

// Rute Publik (siapapun bisa akses)
// GET /api/items -> Melihat semua item
router.get('/', itemController.getAllItems);

// Rute Admin (memerlukan token login & role admin)
// POST /api/items -> Membuat item baru
router.post('/', authMiddleware, adminAuthMiddleware, itemController.createItem);

// PUT /api/items/:id -> Mengupdate item
router.put('/:id', authMiddleware, adminAuthMiddleware, itemController.updateItem);

// DELETE /api/items/:id -> Menghapus item
router.delete('/:id', authMiddleware, adminAuthMiddleware, itemController.deleteItem);

module.exports = router;