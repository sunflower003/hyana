const express = require('express');
const router = express.Router();
const {
  getLatestNews,
  getNewsByCategory,
  getSentimentSummary,
  triggerNewsUpdate,
  getNewsById
} = require('../controllers/newsController');

// Middleware auth (nếu cần)
// const { authenticateToken } = require('../utils/authMiddleware');

/**
 * News Routes
 * /api/news/*
 */

// GET /api/news/latest - Lấy tin tức mới nhất
router.get('/latest', getLatestNews);

// GET /api/news/category/:category - Lấy tin theo danh mục
router.get('/category/:category', getNewsByCategory);

// GET /api/news/sentiment - Lấy tổng quan sentiment
router.get('/sentiment', getSentimentSummary);

// GET /api/news/:id - Lấy một bài tin cụ thể
router.get('/:id', getNewsById);

// POST /api/news/update - Trigger manual update (for testing)
router.post('/update', triggerNewsUpdate);

module.exports = router;