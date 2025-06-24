const express = require('express');
const {
  getLatestEconomicData,
  getMacroSummary,
  getEconomicDataByCategory,
  getCurrentDXY,
  triggerMacroUpdate,
  getEconomicEventById
} = require('../controllers/econController');

const authenticate = require('../utils/authMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Public routes (authenticated users)
router.get('/latest', getLatestEconomicData);           // GET /api/econ/latest?limit=10&category=fed_policy&impact=positive
router.get('/summary', getMacroSummary);               // GET /api/econ/summary
router.get('/category/:category', getEconomicDataByCategory); // GET /api/econ/category/fed_policy
router.get('/dxy', getCurrentDXY);                     // GET /api/econ/dxy
router.get('/event/:id', getEconomicEventById);        // GET /api/econ/event/:id

// Manual update route (for testing and manual triggers)
router.post('/update', triggerMacroUpdate);            // POST /api/econ/update

module.exports = router;