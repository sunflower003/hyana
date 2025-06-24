const express = require('express');
const {
  getLatestSignal,
  getSignalHistory,
  getSignalStats,
  triggerSignalUpdate
} = require('../controllers/signalController');

const authenticate = require('../utils/authMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Public routes (authenticated users)
router.get('/latest', getLatestSignal);                // GET /api/signal/latest
router.get('/history', getSignalHistory);             // GET /api/signal/history?limit=10
router.get('/stats', getSignalStats);                 // GET /api/signal/stats

// Manual update route (for testing and manual triggers)
router.post('/update', triggerSignalUpdate);          // POST /api/signal/update

module.exports = router;