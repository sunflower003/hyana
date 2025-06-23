const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// Đăng ký user mới
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng'
      });
    }

    // Tạo user mới
    const user = await User.create({
      fullName,
      email,
      password
    });

    // Tạo JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    
    // Xử lý validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] // Lấy lỗi đầu tiên
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại'
    });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm user và include password để so sánh
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra tài khoản có bị khóa không
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // Tạo token
    const token = generateToken(user._id);

    // Xóa password khỏi response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại'
    });
  }
};

// Lấy thông tin user hiện tại
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại'
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};