// router/export.routes.js
import express from "express";
import { exportData } from "../controllers/export.controller.js";

import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * GET /api/export/:type
 * type → "assets" | "employees" | "licenses"
 *
 * Optional query params:
 *   status, category, licenseType, department, startDate, endDate
 */
router.get("/:type", verifyToken, authorizeRoles("Admin"), exportData);

export default router;
