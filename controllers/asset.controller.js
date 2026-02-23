// controllers/asset.controller.js
import Asset from "../models/Asset.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { deleteAssetImage, uploadImageFromUrl } from "../middleware/upload.middleware.js";

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

// @desc    Delete asset (also removes associated image)
// @route   DELETE /api/assets/:id
export const deleteAsset = asyncHandler(async (req, res) => {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }
    // Clean up image from disk / Cloudinary
    if (asset.imageUrl) {
        await deleteAssetImage(asset.imageUrl);
    }
    sendSuccess(res, null, "Asset deleted successfully");
});

// @desc    Upload / replace asset image
// @route   POST /api/assets/:id/image
// @body    Option A — multipart/form-data, field: "image"  (file upload)
//          Option B — application/json, body: { "imageUrl": "<url>" }
export const uploadAssetImageHandler = asyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }

    // Determine the new image source: uploaded file takes priority over a URL string
    let newImageUrl = null;

    if (req.file) {
        // File uploaded via multipart/form-data
        // In production: req.file.path is the Cloudinary HTTPS URL
        // In development: req.file.path is the local file path
        newImageUrl = req.file.path.replace(/\\/g, "/");
    } else if (req.body && req.body.imageUrl) {
        // External URL provided as JSON → upload it to Cloudinary (prod) or disk (dev)
        newImageUrl = await uploadImageFromUrl(req.body.imageUrl.trim(), "assets");
    }

    if (!newImageUrl) {
        return sendError(
            res,
            "Please provide an image — either upload a file (form-data field: 'image') or send { \"imageUrl\": \"<url>\" } as JSON",
            400
        );
    }

    // Delete the OLD image before saving the new one
    if (asset.imageUrl && asset.imageUrl !== newImageUrl) {
        await deleteAssetImage(asset.imageUrl);
    }

    asset.imageUrl = newImageUrl;
    await asset.save();

    sendSuccess(res, asset, "Asset image updated successfully");
});
