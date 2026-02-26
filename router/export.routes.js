// router/export.routes.js
import express from "express";
import { exportData } from "../controllers/export.controller.js";

const router = express.Router();

/**
 * GET /api/export/:type
 * type → "assets" | "employees" | "licenses"
 *
 * Optional query params:
 *   status, category, licenseType, department, startDate, endDate
 */
router.get("/:type", exportData);

export default router;
