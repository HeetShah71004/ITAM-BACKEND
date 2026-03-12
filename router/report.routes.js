import express from "express";
import reportController from "../controllers/report.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all report routes
router.use(verifyToken);
router.use(authorizeRoles("Admin", "Manager", "Auditor"));

/**
 * @route   GET /api/reports/summary
 * @desc    Generate a comprehensive system summary PDF report
 * @access  Private (Admin, Manager, Auditor)
 */
router.get("/summary", reportController.getSystemSummaryReport);

export default router;
