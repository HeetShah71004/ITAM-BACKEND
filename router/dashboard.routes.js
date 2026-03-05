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
router.get("/stats", verifyToken, authorizeRoles("Admin", "Manager", "Auditor"), getDashboardStats);
router.get("/utilization", verifyToken, authorizeRoles("Admin", "Manager", "Auditor"), getAssetUtilization);
router.get("/trends", verifyToken, authorizeRoles("Admin", "Manager", "Auditor"), getAssignmentTrends);

export default router;