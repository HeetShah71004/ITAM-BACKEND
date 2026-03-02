import express from "express";
import { getActivityLogs, getEntityActivityLogs } from "../controllers/activityLog.controller.js";

const router = express.Router();

// @route   GET /api/activity-logs
router.get("/", getActivityLogs);

// @route   GET /api/activity-logs/:targetType/:targetId
router.get("/:targetType/:targetId", getEntityActivityLogs);

export default router;
