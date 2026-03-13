import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../utils/emailService.js";

// Helper to create JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "30d",
    });
};

// Helper to generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * @desc    Signup — new user with OTP email verification
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please provide name, email, and password." });
        }

        // Check if user already exists and is verified
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }

        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (existingUser && !existingUser.isVerified) {
            // Re-use existing unverified account – just refresh OTP
            existingUser.fullName = name;
            existingUser.password = password;
            existingUser.verificationCode = otp;
            existingUser.verificationCodeExpires = otpExpires;
            await existingUser.save();
        } else {
            // Create new user
            await User.create({
                fullName: name,
                email,
                password,
                isVerified: false,
                verificationCode: otp,
                verificationCodeExpires: otpExpires,
            });
        }

        // Send OTP email (non-blocking — failure won't crash the response)
        await sendOtpEmail(email, otp);

        res.status(201).json({ message: "Verification code sent to email." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Verify email with OTP
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: "Email and verification code are required." });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email is already verified." });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({ message: "Invalid verification code." });
        }

        if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
            return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
        }

        // Mark verified and clear OTP fields
        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save();

        res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Resend OTP verification email
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email is already verified." });
        }

        const otp = generateOtp();
        user.verificationCode = otp;
        user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendOtpEmail(email, otp);

        res.json({ message: "Verification code resent to email." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Register a new user (legacy — no OTP; existing ITAM admin tool)
 * @route   POST /api/auth/register
 * @access  Public (or Admin only depending on requirements)
 */
export const register = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, role } = req.body;

        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "Please provide all required fields (fullName, email, password, confirmPassword)" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const user = await User.create({
            email,
            password,
            fullName,
            role: role || "Employee",
            isVerified: true,  // Admin-created accounts skip OTP verification
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

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Email not verified. Please verify your email before logging in.",
                notVerified: true,
            });
        }

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
            name: updatedUser.fullName,
            token: generateToken(updatedUser._id),
        });
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
        const user = await User.findById(req.user._id).select("-password -verificationCode -verificationCodeExpires");
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
