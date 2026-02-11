// controllers/asset.controller.js
import Asset from "../models/Asset.js";
import Employee from "../models/Employee.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

// @desc    Create a new asset
// @route   POST /api/assets
export const createAsset = asyncHandler(async (req, res) => {
    const asset = await Asset.create(req.body);
    sendSuccess(res, asset, "Asset created successfully", 201);
});

// @desc    Get all assets
// @route   GET /api/assets
export const getAllAssets = asyncHandler(async (req, res) => {
    const assets = await Asset.find().populate("currentAssignedTo", "firstName lastName employeeId");
    sendSuccess(res, assets, "Assets retrieved successfully");
});

// @desc    Get asset by ID
// @route   GET /api/assets/:id
export const getAssetById = asyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id).populate("currentAssignedTo", "firstName lastName employeeId");
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }
    sendSuccess(res, asset, "Asset details retrieved successfully");
});

// @desc    Update asset
// @route   PUT /api/assets/:id
export const updateAsset = asyncHandler(async (req, res) => {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }
    sendSuccess(res, asset, "Asset updated successfully");
});

// @desc    Delete asset
// @route   DELETE /api/assets/:id
export const deleteAsset = asyncHandler(async (req, res) => {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }
    sendSuccess(res, null, "Asset deleted successfully");
});
