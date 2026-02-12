// router/dashboard.routes.js
import express from "express";
import {
    getDashboardStats,
    getAssetUtilization,
    getAssignmentTrends
} from "../controllers/dashboard.controller.js";

const router = express.Router();

// Dashboard routes
router.get("/stats", getDashboardStats);
router.get("/utilization", getAssetUtilization);
router.get("/trends", getAssignmentTrends);

export default router;