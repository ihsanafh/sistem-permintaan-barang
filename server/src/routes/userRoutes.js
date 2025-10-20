const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const authMiddleware = require('../middleware/auth.js');
const adminAuthMiddleware = require('../middleware/adminAuth.js');

// Definisikan rute
// POST /api/users/create
router.post('/create', userController.createUser);
router.post('/login', userController.loginUser);
router.post('/change-password', authMiddleware, userController.changePassword);
router.get('/all', authMiddleware, adminAuthMiddleware, userController.getAllUsers);
router.put('/:id', authMiddleware, adminAuthMiddleware, userController.updateUser);

module.exports = router;