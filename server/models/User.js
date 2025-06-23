const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    minlength: [2, 'Họ tên phải có ít nhất 2 ký tự'],
    maxlength: [50, 'Họ tên không được quá 50 ký tự']
  },
  
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Email không hợp lệ']
  },
  
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false // Không trả về password khi query user
  },
  
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Tự động tạo createdAt và updatedAt
});

// Middleware: Mã hóa mật khẩu trước khi lưu vào DB
userSchema.pre('save', async function(next) {
  // Chỉ hash password khi password được thay đổi
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password với cost factor = 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Method: So sánh password khi đăng nhập
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method: Tạo object user không có sensitive data
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);