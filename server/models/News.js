const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'News title is required'],
    maxlength: [300, 'Title must be less than 300 characters'],
    trim: true
  },
  
  source: {
    type: String,
    required: [true, 'News source is required'],
    maxlength: [100, 'Source must be less than 100 characters'],
    trim: true
  },
  
  publishedAt: {
    type: Date,
    required: [true, 'Published date is required'],
    index: true
  },
  
  content: {
    type: String,
    required: [true, 'News content is required'],
    maxlength: [5000, 'Content must be less than 5000 characters']
  },
  
  url: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  
  // AI Analysis Results
  aiSentiment: {
    type: String,
    enum: [
      'bullish_gold',    // Tích cực cho vàng
      'bearish_gold',    // Tiêu cực cho vàng  
      'dovish_usd',      // USD yếu -> vàng tăng
      'hawkish_usd',     // USD mạnh -> vàng giảm
      'neutral',         // Trung tính
      'risk_on',         // Tăng rủi ro -> vàng giảm
      'risk_off'         // Giảm rủi ro -> vàng tăng
    ],
    required: [true, 'AI sentiment is required']
  },
  
  impactOnGold: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: [true, 'Impact on gold is required']
  },
  
  confidence: {
    type: Number,
    min: [0, 'Confidence must be between 0-100'],
    max: [100, 'Confidence must be between 0-100'],
    required: [true, 'AI confidence is required']
  },
  
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    maxlength: [300, 'Summary must be less than 300 characters']
  },
  
  // Categories
  category: {
    type: String,
    enum: [
      'fed_policy',        // Fed & monetary policy
      'inflation',         // CPI, PPI, inflation data
      'employment',        // Jobs, unemployment
      'economic_growth',   // GDP, recession, expansion
      'consumer_data',     // Retail sales, consumer confidence
      'geopolitical',      // Wars, conflicts, tensions
      'central_bank',      // Other central banks
      'market_sentiment',  // General market mood
      'currency',          // USD, DXY, forex
      'commodities',       // Gold, precious metals
      'other'
    ],
    default: 'other'
  },
  
  keywords: {
    type: [String],
    default: []
  },
  
  // Processing status
  isProcessed: {
    type: Boolean,
    default: false
  },
  
  processingError: {
    type: String
  },
  
  // Impact analysis fields
  impactReasons: {
    type: [String],
    default: []
  },
  
  contextScore: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

// Indexes
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ aiSentiment: 1, impactOnGold: 1 });
newsSchema.index({ category: 1, publishedAt: -1 });
newsSchema.index({ isProcessed: 1 });

// Static method để lấy tin tức theo sentiment
newsSchema.statics.getByImpact = function(impact, limit = 10) {
  return this.find({ 
    impactOnGold: impact,
    isProcessed: true,
    publishedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24h gần nhất
  })
  .sort({ publishedAt: -1, confidence: -1 })
  .limit(limit);
};

module.exports = mongoose.model('News', newsSchema);