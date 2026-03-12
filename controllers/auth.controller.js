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
        const { fullName, email, password, confirmPassword, role } = req.body;

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

        // Create user
        const user = await User.create({
            email,
            password,
            fullName,
            role: role || 'Employee' // Use provided role or default to Employee
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
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
            // Update last login using findByIdAndUpdate to avoid triggering full validation
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { lastLogin: Date.now() },
                { new: true }
            );

            res.json({
                _id: updatedUser._id,
                email: updatedUser.email,
                role: updatedUser.role,
                fullName: updatedUser.fullName,
                token: generateToken(updatedUser._id),
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

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
    try {
        const { fullName, name, email, avatar } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Handle both name (frontend) and fullName (backend)
        if (fullName) user.fullName = fullName;
        if (name) user.fullName = name;
        if (email) user.email = email;
        if (avatar !== undefined) user.avatar = avatar;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            email: updatedUser.email,
            role: updatedUser.role,
            fullName: updatedUser.fullName,
            name: updatedUser.fullName,
            avatar: updatedUser.avatar,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
