const mongoose = require('mongoose');

const signalSchema = new mongoose.Schema({
  timeframe: {
    type: String,
    required: [true, 'Timeframe is required'],
    enum: ['1H', '4H', '1D'],
    default: '4H'
  },
  
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['BUY', 'SELL', 'HOLD'],
    index: true
  },
  
  confidence: {
    type: Number,
    required: [true, 'Confidence is required'],
    min: [0, 'Confidence must be between 0-100'],
    max: [100, 'Confidence must be between 0-100']
  },
  
  // Price levels
  priceAtSignal: {
    type: Number,
    required: [true, 'Price at signal is required']
  },
  
  entryZone: {
    type: [Number],
    validate: {
      validator: function(v) {
        return !v || v.length === 0 || v.length === 2;
      },
      message: 'Entry zone must be empty or have exactly 2 values [low, high]'
    }
  },
  
  stopLoss: {
    type: Number,
    default: null
  },
  
  takeProfit: {
    type: Number,
    default: null
  },
  
  riskRewardRatio: {
    type: Number,
    default: null
  },
  
  // Analysis scores
  technicalScore: {
    type: Number,
    required: [true, 'Technical score is required'],
    min: [0, 'Technical score must be between 0-100'],
    max: [100, 'Technical score must be between 0-100']
  },
  
  newsScore: {
    type: Number,
    required: [true, 'News score is required'],
    min: [0, 'News score must be between 0-100'],
    max: [100, 'News score must be between 0-100']
  },
  
  macroScore: {
    type: Number,
    required: [true, 'Macro score is required'],
    min: [0, 'Macro score must be between 0-100'],
    max: [100, 'Macro score must be between 0-100']
  },
  
  overallScore: {
    type: Number,
    required: [true, 'Overall score is required'],
    min: [0, 'Overall score must be between 0-100'],
    max: [100, 'Overall score must be between 0-100']
  },
  
  // Reasoning and summary
  reasoning: {
    type: [String],
    default: []
  },
  
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    maxlength: [5000, 'Summary must be less than 500 characters']
  },
  
  signals: {
    type: [String],
    default: []
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'expired', 'triggered', 'cancelled'],
    default: 'active'
  },
  
  // Performance tracking (optional, for future use)
  result: {
    type: String,
    enum: ['win', 'loss', 'breakeven', 'pending'],
    default: 'pending'
  },
  
  actualEntryPrice: {
    type: Number,
    default: null
  },
  
  exitPrice: {
    type: Number,
    default: null
  },
  
  pnl: {
    type: Number,
    default: null
  }
  
}, {
  timestamps: true
});

// Indexes for better query performance
signalSchema.index({ createdAt: -1 });
signalSchema.index({ action: 1, createdAt: -1 });
signalSchema.index({ confidence: -1, createdAt: -1 });
signalSchema.index({ status: 1, createdAt: -1 });

// Virtual for age in hours
signalSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Static method to get latest signal
signalSchema.statics.getLatest = function() {
  return this.findOne()
    .sort({ createdAt: -1 })
    .limit(1);
};

// Static method to get signals by action
signalSchema.statics.getByAction = function(action, limit = 10) {
  return this.find({ action })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Instance method to check if signal is fresh (within 6 hours)
signalSchema.methods.isFresh = function() {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return this.createdAt >= sixHoursAgo;
};

module.exports = mongoose.model('Signal', signalSchema);