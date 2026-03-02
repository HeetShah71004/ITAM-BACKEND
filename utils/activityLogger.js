import mongoose from "mongoose";
import ActivityLog from "../models/ActivityLog.js";

/**
 * Centrally log an activity to the database.
 * 
 * @param {Object} params
 * @param {string} params.userId - The ID of the user performing the action.
 * @param {string} params.action - The action type (from ActivityLog.action enum).
 * @param {string} params.targetType - The entity type affected (Asset, Employee, etc.).
 * @param {string} [params.targetId] - The ID of the affected entity.
 * @param {Object} [params.details] - Additional details about the action (e.g., updated fields).
 * @param {string} [params.ipAddress] - The user's IP address.
 */
export const logActivity = async ({ userId, action, targetType, targetId, details = {}, ipAddress }) => {
    try {
        const isValidUser = mongoose.Types.ObjectId.isValid(userId);
        const isValidTarget = mongoose.Types.ObjectId.isValid(targetId);

        const logData = {
            action,
            targetType,
            targetId: isValidTarget ? targetId : null,
            details: { ...details },
            ipAddress
        };

        if (isValidUser) {
            logData.user = userId;
        } else {
            // If user is not a valid ObjectId (e.g. "System"), store it in details
            logData.details.performedBy = userId || "System";
        }

        const logEntry = new ActivityLog(logData);
        await logEntry.save();
    } catch (error) {
        console.error("Failed to log activity:", error);
        // We don't want to throw an error here as logging should not break the main flow
    }
};
