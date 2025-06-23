const express = require('express');
const {
  getLatestSnapshot,
  getRecentSnapshots,
  triggerUpdate,
  getTechnicalStats
} = require('../controllers/technicalController');
const authenticate = require('../utils/authMiddleware');

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticate);

// GET /api/technical/latest - Lấy snapshot mới nhất
router.get('/latest', getLatestSnapshot);

// GET /api/technical/recent?limit=20 - Lấy snapshots gần nhất
router.get('/recent', getRecentSnapshots);

// GET /api/technical/stats - Lấy thống kê tổng quan
router.get('/stats', getTechnicalStats);

// POST /api/technical/update - Manual trigger update (for testing)
router.post('/update', triggerUpdate);

module.exports = router;