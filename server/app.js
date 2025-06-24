const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/database');
const authRoutes = require('./routes/authRoute');
const technicalRoutes = require('./routes/technicalRoute');
const newsRoutes = require('./routes/newsRoute'); // ✅ Add news routes
const econRoutes = require('./routes/econRoute'); // ✅ Add economic routes

// ✅ Fix: Import correct function names from cron jobs
const { startTechnicalCron } = require('./cron/updateTechnical'); // ✅ Fixed function name
const { startNewsUpdateCron } = require('./cron/updateNews'); // ✅ Add news cron
const { startMacroUpdateCron } = require('./cron/updateMacro'); // ✅ Add macro cron

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://hyana.vercel.app', // ✅ Your actual Vercel frontend URL
        'https://*.vercel.app' // ✅ Allow all Vercel preview deployments
      ]
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/technical', technicalRoutes);
app.use('/api/news', newsRoutes); // ✅ Add news routes
app.use('/api/econ', econRoutes); // ✅ Add economic routes

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HYANA Gold Analysis Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      auth: 'active',
      technical: 'active',
      news: 'active',
      economic: 'active' // ✅ Updated
    }
  });
});

// API Info route
app.get('/api/info', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'HYANA Gold Analysis API',
      version: '1.0.0',
      description: 'AI-powered gold trading analysis platform',
      endpoints: {
        auth: '/api/auth/*',
        technical: '/api/technical/*',
        news: '/api/news/*', // ✅ Add news endpoints
        health: '/api/health',
        info: '/api/info'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/info', 
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/me',
      'GET /api/technical/latest',
      'GET /api/technical/recent',
      'GET /api/technical/stats',
      'POST /api/technical/update',
      'GET /api/news/latest',
      'GET /api/news/sentiment',
      'POST /api/news/update',
      'GET /api/econ/latest', // ✅ Add economic routes
      'GET /api/econ/summary',
      'GET /api/econ/dxy',
      'POST /api/econ/update'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global Error:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: messages[0],
      errors: messages
    });
  }
  
  // Mongoose cast error
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format'
    });
  }
  
  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// ✅ Start cron jobs with correct function names
console.log('\n🕒 Starting cron jobs...');
startTechnicalCron(); // ✅ Fixed function name
startNewsUpdateCron(); // ✅ Start news cron
startMacroUpdateCron(); // ✅ Start macro cron
console.log('✅ All cron jobs started\n');

module.exports = app;