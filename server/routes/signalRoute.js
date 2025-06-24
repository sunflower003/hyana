const express = require('express');
const {
  getLatestSignal,
  getSignalHistory,
  getSignalStats,
  triggerSignalUpdate,
  forceSignalGeneration // Import the new controller function
} = require('../controllers/signalController');

const authenticate = require('../utils/authMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Public routes (authenticated users)
router.get('/latest', getLatestSignal);                // GET /api/signal/latest
router.get('/history', getSignalHistory);             // GET /api/signal/history?limit=10
router.get('/stats', getSignalStats);                 // GET /api/signal/stats

// Manual update routes (for testing and manual triggers)
router.post('/update', triggerSignalUpdate);          // POST /api/signal/update
router.post('/force', forceSignalGeneration);          // POST /api/signal/force

module.exports = router;