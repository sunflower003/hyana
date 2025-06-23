const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Lấy MongoDB URI từ file .env
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://huylee63897:4FBlld6wLLFy8OWT@cluster0.vlsc92v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    // Bỏ các option deprecated
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1); // Thoát ứng dụng nếu không kết nối được DB
  }
};

module.exports = connectDB;