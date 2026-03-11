import express from "express";
import { getAssetDepreciation, recalcAndSave } from "../controllers/depreciation.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @desc    Get depreciation for a specific asset
 * @access  Private
 */
router.get("/:assetId", verifyToken, getAssetDepreciation);

/**
 * @desc    Recalculate and save depreciation for a specific asset
 * @access  Private (Admin, Manager)
 */
router.post(
    "/:assetId/recalculate",
    verifyToken,
    authorizeRoles("Admin", "Manager"),
    recalcAndSave
);

export default router;
