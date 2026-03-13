import express from "express";
import {
    signup,
    verifyEmail,
    resendOtp,
    register,
    login,
    getMe,
    updateProfile,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── OTP-based auth flow ──────────────────────────────────────────────
router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);

// ── Legacy / admin account creation (no OTP) ────────────────────────
router.post("/register", register);

// ── Login & profile ──────────────────────────────────────────────────
router.post("/login", login);
router.get("/me", verifyToken, getMe);
router.put("/profile", verifyToken, updateProfile);

export default router;
