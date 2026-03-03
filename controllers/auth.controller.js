import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Helper to create JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "30d",
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public (or Admin only depending on requirements)
 */
export const register = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body;

        // Validation
        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "Please provide all required fields (fullName, email, password, confirmPassword)" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // Split fullName into firstName and lastName for backward compatibility
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // Create user
        const user = await User.create({
            username: email, // Use email as username
            email,
            password,
            fullName,
            firstName,
            lastName,
            role: 'user' // Default role
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.fullName || user.displayFullName,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            // Update last login
            user.lastLogin = Date.now();
            await user.save();

            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.displayFullName,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
