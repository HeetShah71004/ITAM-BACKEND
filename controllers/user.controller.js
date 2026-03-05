import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { logActivity } from "../utils/activityLogger.js";

// @desc    Create a new user (Admin only)
// @route   POST /api/users
export const createUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
        return sendError(res, "Please provide fullName, email, and password", 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return sendError(res, "User already exists", 400);
    }

    const user = await User.create({
        fullName,
        email,
        password,
        role: role || "Employee"
    });

    await logActivity({
        userId: req.user._id,
        action: "CREATE_EMPLOYEE", // Using existing enum or should we add CREATE_USER?
        targetType: "User",
        targetId: user._id,
        details: { email: user.email, role: user.role },
        ipAddress: req.ip
    });

    sendSuccess(res, {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
    }, "User created successfully", 201);
});

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
export const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!role || !["Admin", "Manager", "Employee", "Auditor"].includes(role)) {
        return sendError(res, "Please provide a valid role", 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return sendError(res, "User not found", 404);
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logActivity({
        userId: req.user._id,
        action: "UPDATE_EMPLOYEE", // Using existing enum
        targetType: "User",
        targetId: user._id,
        details: { email: user.email, oldRole, newRole: role },
        ipAddress: req.ip
    });

    sendSuccess(res, {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
    }, "User role updated successfully");
});
