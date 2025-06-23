const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const authenticate = require('../utils/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (cần đăng nhập)
router.get('/me', authenticate, getMe);

module.exports = router;