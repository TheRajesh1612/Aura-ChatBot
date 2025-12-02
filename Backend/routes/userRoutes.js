const express = require("express");
const router = express.Router();

const { createUser, loginUser, logoutUser, requestOTP, verifyOTP, resetPassword } = require("../controllers/userControllers");

router.post("/signup", createUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;