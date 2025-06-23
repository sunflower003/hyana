const mongoose = require('mongoose');

const signalSchema = new mongoose.Schema({
  timeframe: {
    type: String,
    default: '4H',
    enum: ['1H', '4H', '1D'],
    required: true
  },
  
  action: {
    type: String,
    enum: ['BUY', 'SELL', 'HOLD'],
    required: [true, 'Action is required']
  },
  
  confidence: {
    type: Number,
    min: [0, 'Confidence must be between 0-100'],
    max: [100, 'Confidence must be between 0-100'],
    required: [true, 'Confidence level is required']
  },
  
  entryZone: {
    type: [Number],
    validate: {
      validator: function(v) {
        return v && v.length === 2 && v[0] <= v[1];
      },
      message: 'Entry zone must have exactly 2 values [min, max]'
    },
    required: [true, 'Entry zone is required']
  },
  
  stopLoss: {
    type: Number,
    required: [true, 'Stop loss is required']
  },
  
  takeProfit: {
    type: Number,
    required: [true, 'Take profit is required']
  },
  
  reasoning: {
    type: [String],
    required: [true, 'Reasoning is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one reasoning must be provided'
    }
  },
  
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    maxlength: [500, 'Summary must be less than 500 characters']
  },
  
  // Thông tin bổ sung cho phân tích
  technicalScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  newsScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  macroScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Tracking
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Meta data
  priceAtSignal: {
    type: Number,
    required: true
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
signalSchema.virtual('riskRewardRatio').get(function() {
  const risk = Math.abs(this.priceAtSignal - this.stopLoss);
  const reward = Math.abs(this.takeProfit - this.priceAtSignal);
  return risk > 0 ? (reward / risk).toFixed(2) : 0;
});

// Index cho performance
signalSchema.index({ createdAt: -1 });
signalSchema.index({ action: 1, isActive: 1 });
signalSchema.index({ timeframe: 1, createdAt: -1 });

module.exports = mongoose.model('Signal', signalSchema);