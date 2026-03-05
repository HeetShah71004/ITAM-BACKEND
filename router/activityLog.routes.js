import express from "express";
import { getActivityLogs, getEntityActivityLogs } from "../controllers/activityLog.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// @route   GET /api/activity-logs
router.get("/", verifyToken, authorizeRoles("Admin", "Auditor"), getActivityLogs);

// @route   GET /api/activity-logs/:targetType/:targetId
router.get("/:targetType/:targetId", verifyToken, authorizeRoles("Admin", "Auditor"), getEntityActivityLogs);

export default router;
