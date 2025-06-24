const mongoose = require('mongoose');
const TechnicalSnapshot = require('./models/TechnicalSnapshot');
const Signal = require('./models/Signal');
require('dotenv').config();

const cleanFakeData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete snapshots with fake prices (under $3000 or over $4000)
    const deletedSnapshots = await TechnicalSnapshot.deleteMany({
      $or: [
        { 'price.close': { $lt: 3000 } },  // Delete prices under $3000
        { 'price.close': { $gt: 4000 } },  // Delete prices over $4000
        { dataSource: { $ne: 'twelvedata' } } // Delete non-twelvedata sources
      ]
    });
    
    console.log(`❌ Deleted ${deletedSnapshots.deletedCount} fake technical snapshots`);

    // Delete signals based on fake prices
    const deletedSignals = await Signal.deleteMany({
      $or: [
        { priceAtSignal: { $lt: 3000 } },
        { priceAtSignal: { $gt: 4000 } }
      ]
    });
    
    console.log(`❌ Deleted ${deletedSignals.deletedCount} signals with fake prices`);

    // Force regenerate new data
    console.log('\n🔄 Triggering fresh data generation...');
    
    const TechnicalService = require('./services/technicalService');
    const SignalService = require('./services/signalService');
    
    // Generate fresh technical snapshot
    const techService = new TechnicalService();
    const techResult = await techService.updateTechnicalAnalysis();
    
    if (techResult.success) {
      console.log(`✅ New technical snapshot: $${techResult.snapshot.price.close.toFixed(2)}`);
      
      // Generate fresh signal
      const signalService = new SignalService();
      const signalResult = await signalService.generateSignal();
      
      if (signalResult.success) {
        console.log(`✅ New signal: ${signalResult.signal.action} at $${signalResult.signal.priceAtSignal.toFixed(2)}`);
      }
    }

    await mongoose.connection.close();
    console.log('\n🎯 Cleanup completed! Frontend should now show real data.');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
};

cleanFakeData();