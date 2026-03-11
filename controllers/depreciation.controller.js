import Asset from "../models/Asset.js";
import { calculateStraightLineDepreciation } from "../services/depreciation.service.js";

/**
 * @desc    Get depreciation for a specific asset
 * @route   GET /api/depreciation/:assetId
 */
export const getAssetDepreciation = async (req, res) => {
    try {
        const { assetId } = req.params;
        const asset = await Asset.findById(assetId);

        if (!asset) {
            return res.status(404).json({ error: "Asset not found" });
        }

        const depreciationData = calculateStraightLineDepreciation(asset);

        // Standard API Response Format
        return res.status(200).json({
            assetId: asset._id,
            assetName: asset.name,
            depreciationMethod: asset.depreciationMethod,
            purchaseCost: asset.purchaseCost,
            salvageValue: asset.salvageValue,
            usefulLife: asset.usefulLife,
            annualDepreciation: depreciationData.annualDepreciation,
            yearsUsed: depreciationData.yearsUsed,
            currentValue: depreciationData.currentValue,
            isFullyDepreciated: depreciationData.isFullyDepreciated,
            calculatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Get Asset Depreciation Error:", error.message);
        return res.status(error.message.includes("missing") || error.message.includes("at least") ? 400 : 500).json({
            error: error.message
        });
    }
};

/**
 * @desc    Recalculate and save depreciation for a specific asset
 * @route   POST /api/depreciation/:assetId/recalculate
 */
export const recalcAndSave = async (req, res) => {
    try {
        const { assetId } = req.params;
        const asset = await Asset.findById(assetId);

        if (!asset) {
            return res.status(404).json({ error: "Asset not found" });
        }

        const depreciationData = calculateStraightLineDepreciation(asset);

        // Update asset.currentValue
        asset.currentValue = depreciationData.currentValue;
        await asset.save();

        // Standard API Response Format
        return res.status(200).json({
            assetId: asset._id,
            assetName: asset.name,
            depreciationMethod: asset.depreciationMethod,
            purchaseCost: asset.purchaseCost,
            salvageValue: asset.salvageValue,
            usefulLife: asset.usefulLife,
            annualDepreciation: depreciationData.annualDepreciation,
            yearsUsed: depreciationData.yearsUsed,
            currentValue: asset.currentValue,
            isFullyDepreciated: depreciationData.isFullyDepreciated,
            calculatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Recalculate and Save Depreciation Error:", error.message);
        return res.status(error.message.includes("missing") || error.message.includes("at least") ? 400 : 500).json({
            error: error.message
        });
    }
};
