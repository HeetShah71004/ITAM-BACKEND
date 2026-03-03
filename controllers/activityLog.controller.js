import ActivityLog from "../models/ActivityLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/responseHandler.js";

// @desc    Get all activity logs
// @route   GET /api/activity-logs
export const getActivityLogs = asyncHandler(async (req, res) => {
    const { user, action, targetType, targetId, limit = 50, skip = 0 } = req.query;

    const query = {};
    if (user) query.user = user;
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;

    const logs = await ActivityLog.find(query)
        .populate("user", "fullName firstName lastName username email")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip));

    const total = await ActivityLog.countDocuments(query);

    sendSuccess(res, {
        logs,
        pagination: {
            total,
            limit: Number(limit),
            skip: Number(skip)
        }
    }, "Activity logs retrieved successfully");
});

// @desc    Get activity logs for a specific entity
// @route   GET /api/activity-logs/:targetType/:targetId
export const getEntityActivityLogs = asyncHandler(async (req, res) => {
    const { targetType, targetId } = req.params;

    const logs = await ActivityLog.find({ targetType, targetId })
        .populate("user", "fullName firstName lastName username email")
        .sort({ createdAt: -1 });

    sendSuccess(res, logs, `Activity logs for ${targetType} retrieved successfully`);
});
