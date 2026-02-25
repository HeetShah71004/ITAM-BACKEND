// controllers/asset.controller.js
import mongoose from "mongoose";
import Asset from "../models/Asset.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { deleteAssetImage } from "../middleware/upload.middleware.js";

const findAssetByIdOrAssetTag = async (identifier) => {
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        const asset = await Asset.findById(identifier);
        if (asset) return asset;
    }
    return Asset.findOne({ assetTag: identifier.toUpperCase() });
};

/**
 * Extract image fields from req.file (Cloudinary or local disk).
 *
 * Cloudinary (production):
 *   req.file.path      → secure_url   (https://res.cloudinary.com/...)
 *   req.file.filename  → public_id    (itam/assets/assets-xxxx)
 *
 * Local disk (development):
 *   req.file.path      → file path    (uploads/assets/assets-xxxx.jpg)
 *   req.file.filename  → filename only
 *
 * @returns {{ imageUrl: string, imagePublicId: string|null }}
 */
const extractImageFields = (file) => {
    const isCloudinary =
        file.path && file.path.startsWith("https://res.cloudinary.com");

    if (isCloudinary) {
        return {
            imageUrl: file.path,           // secure_url
            imagePublicId: file.filename,  // public_id
        };
    }

    // Local disk — store the normalised path; no public_id needed
    return {
        imageUrl: file.path.replace(/\\/g, "/"),
        imagePublicId: null,
    };
};

// @desc    Create a new asset
// @route   POST /api/assets
export const createAsset = asyncHandler(async (req, res) => {
    const data = { ...req.body };

    if (req.file) {
        // multipart/form-data → Multer already uploaded to Cloudinary (prod) or disk (dev)
        Object.assign(data, extractImageFields(req.file));
    }
    // If no file, imageUrl stays whatever the body sent (or undefined)

    const asset = await Asset.create(data);
    sendSuccess(res, asset, "Asset created successfully", 201);
});

// @desc    Get all assets
// @route   GET /api/assets
export const getAllAssets = asyncHandler(async (req, res) => {
    const assets = await Asset.find()
        .sort({ updatedAt: -1 })
        .populate("currentAssignedTo", "firstName lastName employeeId");
    sendSuccess(res, assets, "Assets retrieved successfully");
});

// @desc    Get asset by ID
// @route   GET /api/assets/:id  (accepts _id or assetTag)
export const getAssetById = asyncHandler(async (req, res) => {
    const asset = await findAssetByIdOrAssetTag(req.params.id);
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }
    await asset.populate("currentAssignedTo", "firstName lastName employeeId");
    sendSuccess(res, asset, "Asset details retrieved successfully");
});

// @desc    Update asset
// @route   PUT /api/assets/:id  (accepts _id or assetTag)
export const updateAsset = asyncHandler(async (req, res) => {
    const existing = await findAssetByIdOrAssetTag(req.params.id);
    if (!existing) {
        return sendError(res, "Asset not found", 404);
    }

    const data = { ...req.body };

    if (req.file) {
        // A new file was uploaded — delete the old image first, then set new fields
        if (existing.imagePublicId) {
            // Production: delete from Cloudinary by public_id
            await deleteAssetImage(existing.imagePublicId);
        } else if (existing.imageUrl && !existing.imageUrl.startsWith("http")) {
            // Development: delete local file
            await deleteAssetImage(existing.imageUrl);
        }
        Object.assign(data, extractImageFields(req.file));
    } else {
        // No new file — remove any image-related keys from body to avoid accidental overwrite
        delete data.imageUrl;
        delete data.imagePublicId;
    }

    const asset = await Asset.findByIdAndUpdate(
        existing._id,
        data,
        { new: true, runValidators: true, context: "query" }
    );
    sendSuccess(res, asset, "Asset updated successfully");
});

// @desc    Delete asset (also removes associated image)
// @route   DELETE /api/assets/:id  (accepts _id or assetTag)
export const deleteAsset = asyncHandler(async (req, res) => {
    const existing = await findAssetByIdOrAssetTag(req.params.id);
    if (!existing) {
        return sendError(res, "Asset not found", 404);
    }
    await Asset.findByIdAndDelete(existing._id);

    // Clean up image: use public_id (Cloudinary) or path (local)
    if (existing.imagePublicId) {
        await deleteAssetImage(existing.imagePublicId);
    } else if (existing.imageUrl && !existing.imageUrl.startsWith("http")) {
        await deleteAssetImage(existing.imageUrl);
    }

    sendSuccess(res, null, "Asset deleted successfully");
});
