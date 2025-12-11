// userController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { log } = require("console");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");

// Store OTPs temporarily (in production, use Redis or a database)
const otpStore = new Map();

/**
 * Optional SMTP transporter kept for backward compatibility / other uses.
 * Not used by default if you use Resend.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  pool: true,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

// Helper: Send OTP via Resend (safe guard if API key missing)
const sendOtpWithResend = async (to, otp) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "RESEND_API_KEY missing. Set RESEND_API_KEY in environment variables."
    );
    err.code = "MISSING_RESEND_KEY";
    throw err;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_SENDER || "onboarding@resend.dev";
  return resend.emails.send({
    from: `Aura <${from}>`,
    to,
    subject: "Your Aura OTP",
    html: `
      <h2>Login Request</h2>
      <p>Your OTP for login is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
};

// Creating new user
const createUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required!" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already used!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    await user.save();

    return res.status(201).json({
      success: true,
      email: user.email,
      id: user._id,
      message: "User created successfully!",
    });
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required!" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect)
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password!" });

    req.session.isAuthenticated = true;
    req.session.user = { email: user.email };
    await req.session.save();

    return res
      .status(200)
      .json({ success: true, message: "Login successful!" });
  } catch (error) {
    console.error("loginUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("logout error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error logging out!" });
      }
      res.clearCookie("connect.sid");
      return res
        .status(200)
        .json({ success: true, message: "Logout successful!" });
    });
  } catch (error) {
    console.error("logoutUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Request OTP for password reset (using Resend)
const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Request OTP for email:", email);

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required!" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found with this email!" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);

    // Store OTP with expiration (10 minutes)
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min

    try {
      await sendOtpWithResend(email, otp);
      console.log("OTP sent successfully via Resend to:", email);
      return res
        .status(200)
        .json({
          success: true,
          message: "OTP sent successfully to your email!",
        });
    } catch (sendErr) {
      // Log useful info for debugging
      console.error("Resend send error:", sendErr);
      if (sendErr && sendErr.response) {
        console.error("Resend response body:", sendErr.response);
      }

      // If missing API key, return clear error (client-friendly)
      if (sendErr.code === "MISSING_RESEND_KEY") {
        return res.status(500).json({
          success: false,
          message:
            "Server configuration error (missing email API key). Contact admin.",
          error: sendErr.message,
        });
      }

      return res.status(502).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
        error: (sendErr && sendErr.message) || "Resend send failed",
      });
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

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required!" });
    }

    const storedOTP = otpStore.get(email);
    if (!storedOTP)
      return res
        .status(400)
        .json({ success: false, message: "OTP not found or expired!" });

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(email);
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired!" });
    }

    if (storedOTP.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP!" });

    // OTP is valid
    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully!" });
  } catch (error) {
    console.error("verifyOTP error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email, OTP, and new password are required!",
        });
    }

    const storedOTP = otpStore.get(email);
    if (
      !storedOTP ||
      storedOTP.otp !== otp ||
      Date.now() > storedOTP.expiresAt
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP!" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    otpStore.delete(email);

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully!" });
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
