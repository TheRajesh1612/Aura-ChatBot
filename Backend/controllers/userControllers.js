const User = require("../models/User");
const bcrypt = require("bcrypt");
const { log } = require("console");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

// Store OTPs temporarily (in production, use Redis or a database)
const otpStore = new Map();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  // service: "gmail", // or your email service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASSWORD, // your email password or app password
  },
});

// Creating new user
const createUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required!",
      });
    }

    // Check if the user already exists or not
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Email is already used!",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({
      success: true,
      email: user.email,
      id: user._id,
      message: "User created successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required!" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    // check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password!" });
    }

    // If login is successful
    req.session.isAuthenticated = true;
    req.session.user = {
      email: user.email,
    };
    await req.session.save();

    return res
      .status(200)
      .json({ success: true, message: "Login successful!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request OTP for password reset
// const requestOTP = async (req, res) => {
//   try {
//     const { email } = req.body;
//     console.log("Request OTP for email:", email);

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required!",
//       });
//     }

//     // Check if user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found with this email!",
//       });
//     }

//     // Generate 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     console.log("Generated OTP:", otp);

//     // Store OTP with expiration (10 minutes)
//     otpStore.set(email, {
//       otp: otp,
//       expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
//     });

//     console.log("Attempting to send OTP email to:", email);
//     console.log("EMAIL_USER:", process.env.EMAIL_USER);
//     console.log("EMAIL_PASSWORD exists:", !!process.env.EMAIL_PASSWORD);

//     // Send OTP via email
//     // const mailOptions = {
//     //   from: "no-reply@aura.com",
//     //   to: email,
//     //   subject: "Login OTP",
//     //   html: `
//     //     <h2>Login Request</h2>
//     //     <p>Your OTP for login is: <strong>${otp}</strong></p>
//     //     <p>This OTP will expire in 10 minutes.</p>
//     //     <p>If you didn't request this, please ignore this email.</p>
//     //   `,
//     // };

//     const sendOtpWithResend = async (to, otp) => {
//       const from = process.env.RESEND_SENDER || "onboarding@resend.dev";
//       return resend.emails.send({
//         from: `Aura <${from}>`,
//         to,
//         subject: "Your Aura OTP",
//         html: `
//       <h2>Login Request</h2>
//       <p>Your OTP for login is: <strong>${otp}</strong></p>
//       <p>This OTP will expire in 10 minutes.</p>
//       <p>If you didn't request this, please ignore this email.</p>
//     `,
//       });
//     };

//     await transporter.sendMail(mailOptions);
//     console.log("OTP sent successfully to:", email);

//     res.status(200).json({
//       success: true,
//       message: "OTP sent successfully to your email!",
//     });
//   } catch (error) {
//     console.error("Error sending OTP:", error);
//     console.log("Error code:", error.code);
//     console.log("Error message:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Failed to send OTP. Please try again.",
//       error: error.message,
//     });
//   }
// };

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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);

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
      console.error(
        "Resend send error:",
        sendErr && sendErr.response ? sendErr.response : sendErr
      );
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
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required!",
      });
    }

    const storedOTP = otpStore.get(email);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired!",
      });
    }

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "OTP has expired!",
      });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP!",
      });
    }

    // OTP is valid
    res.status(200).json({
      success: true,
      message: "OTP verified successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required!",
      });
    }

    // Verify OTP again
    const storedOTP = otpStore.get(email);

    if (
      !storedOTP ||
      storedOTP.otp !== otp ||
      Date.now() > storedOTP.expiresAt
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP!",
      });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Clear OTP from store
    otpStore.delete(email);

    res.status(200).json({
      success: true,
      message: "Password reset successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
