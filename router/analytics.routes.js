import express from "express";
import {
  getAssetsByCategory,
  getAssetValueStats,
  getMaintenanceCostStats,
  getVendorPerformanceStats,
  getAssetStatusStats,
  getDepreciationSummary,
  getMonthlyMaintenanceTrend,
  getDashboardSummary,
} from "../controllers/analytics.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all analytics routes
router.use(verifyToken);
router.use(authorizeRoles("Admin", "Manager", "Auditor"));

/**
 * @route   GET /api/analytics/assets-by-category
 * @desc    Get asset distribution by category
 * @access  Private (Admin) - assuming middleware handles this
 */
router.get("/assets-by-category", getAssetsByCategory);

/**
 * @route   GET /api/analytics/asset-value
 * @desc    Get asset value statistics
 */
router.get("/asset-value", getAssetValueStats);

/**
 * @route   GET /api/analytics/maintenance-costs
 * @desc    Get maintenance cost analytics per asset
 */
router.get("/maintenance-costs", getMaintenanceCostStats);

/**
 * @route   GET /api/analytics/vendor-performance
 * @desc    Get vendor performance analytics
 */
router.get("/vendor-performance", getVendorPerformanceStats);

/**
 * @route   GET /api/analytics/asset-status
 * @desc    Get asset status statistics
 */
router.get("/asset-status", getAssetStatusStats);

/**
 * @route   GET /api/analytics/depreciation-summary
 * @desc    Get straight-line depreciation summary
 */
router.get("/depreciation-summary", getDepreciationSummary);

/**
 * @route   GET /api/analytics/monthly-maintenance
 * @desc    Get monthly maintenance trend
 */
router.get("/monthly-maintenance", getMonthlyMaintenanceTrend);

/**
 * @route   GET /api/analytics/dashboard-summary
 * @desc    Get overall dashboard analytics summary
 */
router.get("/dashboard-summary", getDashboardSummary);

export default router;
