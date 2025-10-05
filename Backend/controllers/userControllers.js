const User = require("../models/User");
const bcrypt = require("bcrypt");

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
      // if (req.headers["content-type"] === "application/json") {
      return res.status(400).json({
        success: false,
        message: "Email is already used!",
      });
      // }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      // name,
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
      if (req.headers["content-type"] === "application/json") {
        return res
          .status(404)
          .json({ success: false, message: "User not found!" });
      }
      return res.status(404).send("User not found!");
    }

    // check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      if (req.headers["content-type"] === "application/json") {
        return res
          .status(400)
          .json({ success: false, message: "Incorrect password!" });
      }
      return res.status(400).send("Incorrect password!");
    }

    // If login is successful
    req.session.isAuthenticated = true;
    req.session.user = {
      // id: user._id,
      // name: user.name,
      email: user.email,
    };
    await req.session.save();

    if (req.headers["content-type"] === "application/json") {
      return res
        .status(200)
        .json({ success: true, message: "Login successful!" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createUser,
  loginUser,
};
