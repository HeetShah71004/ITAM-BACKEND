// router/dashboard.routes.js
import express from "express";
import {
    getDashboardStats,
    getAssetUtilization,
    getAssignmentTrends
} from "../controllers/dashboard.controller.js";

import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Dashboard routes
router.get("/stats", verifyToken, getDashboardStats);
router.get("/utilization", verifyToken, getAssetUtilization);
router.get("/trends", verifyToken, getAssignmentTrends);

export default router;