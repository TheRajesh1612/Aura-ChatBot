// userController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// In-memory OTP store (dev). Use Redis for prod.
const otpStore = new Map();

// Check env vars early
if (!process.env.EMAIL_USER) console.error("❌ EMAIL_USER missing in env");
if (!process.env.EMAIL_PASSWORD) console.error("❌ EMAIL_PASSWORD missing in env");

// Gmail transporter using App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  pool: true,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

// Utility: send OTP mail
const sendOtpMail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Your Aura OTP",
    html: `
      <h2>Password Reset</h2>
      <p>Your OTP: <strong>${otp}</strong></p>
      <p>This OTP expires in 10 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  };
  return transporter.sendMail(mailOptions);
};

// Create user
const createUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required!" });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: "Email is already used!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    await user.save();

    return res.status(201).json({ success: true, email: user.email, id: user._id, message: "User created successfully!" });
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required!" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found!" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ success: false, message: "Incorrect password!" });

    req.session.isAuthenticated = true;
    req.session.user = { email: user.email };
    await req.session.save();

    return res.status(200).json({ success: true, message: "Login successful!" });
  } catch (error) {
    console.error("loginUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Logout
const logoutUser = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("logout error:", err);
        return res.status(500).json({ success: false, message: "Error logging out!" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ success: true, message: "Logout successful!" });
    });
  } catch (error) {
    console.error("logoutUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Request OTP
const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Request OTP for:", email);
    if (!email) return res.status(400).json({ success: false, message: "Email is required!" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found with this email!" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min
    console.log("Generated OTP for", email);

    try {
      await sendOtpMail(email, otp);
      console.log("OTP sent to:", email);
      return res.status(200).json({ success: true, message: "OTP sent successfully to your email!" });
    } catch (sendErr) {
      console.error("sendOtpMail error:", sendErr);
      // Provide useful error to client for debugging
      return res.status(502).json({ success: false, message: "Failed to send OTP. Please try again.", error: sendErr && sendErr.message });
    }
  } catch (error) {
    console.error("requestOTP error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required!" });

    const stored = otpStore.get(email);
    if (!stored) return res.status(400).json({ success: false, message: "OTP not found or expired!" });

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: "OTP has expired!" });
    }

    if (stored.otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP!" });

    return res.status(200).json({ success: true, message: "OTP verified successfully!" });
  } catch (error) {
    console.error("verifyOTP error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: "Email, OTP, and new password are required!" });

    const stored = otpStore.get(email);
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP!" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found!" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    otpStore.delete(email);

    return res.status(200).json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createUser,
  loginUser,
  logoutUser,
  requestOTP,
  verifyOTP,
  resetPassword,
};
