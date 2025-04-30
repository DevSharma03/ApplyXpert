const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect, generateToken } = require("../middlewares/auth");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

// Input validation middleware
const validateInput = (req, res, next) => {
  const { username, password, email, fullname } = req.body;

  // For registration
  if (req.path === "/register") {
    if (!username || !password || !email || !fullname) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }
    if (!email.includes("@")) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }
  }

  // For login
  if (req.path === "/login") {
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
  }

  next();
};

// Register route
router.post("/register", validateInput, async (req, res) => {
  try {
    const { fullname, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).maxTimeMS(5000); // Set maximum execution time to 5 seconds

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Create new user
    const newUser = new User({
      fullname: fullname.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    await newUser.save();

    // Generate token for immediate login
    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullname: newUser.fullname,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      // MongoDB duplicate key error
      res.status(400).json({ message: "Username or email already exists" });
    } else {
      res.status(500).json({ message: "Server error during registration" });
    }
  }
});

// Login route
router.post("/login", validateInput, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username (case insensitive)
    const user = await User.findOne({
      username: username.toLowerCase().trim(),
    }).maxTimeMS(5000); // Set maximum execution time to 5 seconds

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "Server error during login. Please try again." });
  }
});

// Verify token and get user data
router.get("/verify-token", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .maxTimeMS(5000); // Set maximum execution time to 5 seconds

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      isAuthenticated: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ message: "Server error during token verification" });
  }
});

module.exports = router;
