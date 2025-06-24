const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/database');
const authRoutes = require('./routes/authRoute');
const technicalRoutes = require('./routes/technicalRoute');
const newsRoutes = require('./routes/newsRoute');
const econRoutes = require('./routes/econRoute');
const signalRoutes = require('./routes/signalRoute');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://hyana.vercel.app',
        'https://*.vercel.app'
      ]
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ SIMPLIFIED: Only log POST requests and errors
app.use((req, res, next) => {
  if (req.method === 'POST' || process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/technical', technicalRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/econ', econRoutes);
app.use('/api/signal', signalRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HYANA Gold Analysis Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Error:', error.message);
  
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: messages[0]
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format'
    });
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// ✅ SIMPLIFIED: API key validation
const validateAPIKeys = () => {
  const requiredKeys = ['TWELVEDATA_API_KEY', 'FRED_API_KEY', 'HUGGINGFACE_API_KEY'];
  const missing = requiredKeys.filter(key => !process.env[key] || process.env[key] === 'demo');
  
  if (missing.length > 0) {
    console.error(`❌ Missing API keys: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ API keys validated');
};

validateAPIKeys();

module.exports = app;