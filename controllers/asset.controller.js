// controllers/asset.controller.js
import mongoose from "mongoose";
import Asset from "../models/Asset.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { deleteAssetImage, uploadImageFromUrl } from "../middleware/upload.middleware.js";
import { logActivity } from "../utils/activityLogger.js";


// Helper: normalize frontend field names to match the Mongoose schema
// e.g. frontend sends "warrantyExpiryDate" but schema field is "warrantyExpiry"
const normalizeFields = (data) => {
    if ("warrantyExpiryDate" in data) {
        data.warrantyExpiry = data.warrantyExpiryDate;
        delete data.warrantyExpiryDate;
    }
    return data;
};

// Helper: strip empty-string values so Mongoose doesn't try to cast "" to Number/Date
const stripEmptyFields = (data) => {
    Object.keys(data).forEach((key) => {
        if (data[key] === "" || data[key] === "null" || data[key] === "undefined") {
            delete data[key];
        }
    });
    return data;
};


// Helper: find asset by MongoDB _id OR custom assetTag (e.g. "AST001")
const findAssetByIdOrAssetTag = async (identifier) => {
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        const asset = await Asset.findById(identifier);
        if (asset) return asset;
    }
    return Asset.findOne({ assetTag: identifier.toUpperCase() });
};

// Helper: returns true if the URL is already stored in our system (Cloudinary or local uploads/)
const isAlreadyStoredUrl = (url) => {
    if (!url) return false;
    if (url.includes("cloudinary.com")) return true;
    if (!url.startsWith("http")) return true;
    return false;
};

// @desc    Create a new asset
// @route   POST /api/assets
export const createAsset = asyncHandler(async (req, res) => {
    const data = stripEmptyFields(normalizeFields({ ...req.body }));

    if (req.file) {
        // multipart/form-data file upload — relative path e.g. uploads/assets/filename.png
        data.imageUrl = req.file.path.replace(/\\/g, "/");
    } else if (data.imageUrl && data.imageUrl.startsWith("http")) {
        // JSON body with a remote URL — download/upload it
        data.imageUrl = await uploadImageFromUrl(data.imageUrl.trim(), "assets");
    }

    const asset = await Asset.create(data);

    // Activity Log
    await logActivity({
        userId: req.user?._id || data.createdBy || "System", // Assuming req.user is populated by auth middleware
        action: "CREATE_ASSET",
        targetType: "Asset",
        targetId: asset._id,
        details: { assetTag: asset.assetTag, model: asset.model },
        ipAddress: req.ip
    });

    sendSuccess(res, asset, "Asset created successfully", 201);
});


// @desc    Get all assets
// @route   GET /api/assets
export const getAllAssets = asyncHandler(async (req, res) => {
    const assets = await Asset.find().sort({ updatedAt: -1 }).populate("currentAssignedTo", "firstName lastName employeeId");
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

    const data = stripEmptyFields(normalizeFields({ ...req.body }));

    if (req.file) {
        // multipart/form-data file upload — delete old image first
        if (existing.imageUrl) {
            await deleteAssetImage(existing.imageUrl);
        }
        data.imageUrl = req.file.path.replace(/\\/g, "/");
    } else if (data.imageUrl) {
        if (isAlreadyStoredUrl(data.imageUrl)) {
            // Already stored in our system — keep as-is, no re-upload
            if (data.imageUrl === existing.imageUrl) {
                delete data.imageUrl;
            }
        } else if (data.imageUrl.startsWith("http")) {
            // External/remote URL — download and store it
            if (existing.imageUrl && existing.imageUrl !== data.imageUrl) {
                await deleteAssetImage(existing.imageUrl);
            }
            data.imageUrl = await uploadImageFromUrl(data.imageUrl.trim(), "assets");
        }
    }

    const asset = await Asset.findByIdAndUpdate(
        existing._id,
        data,
        { new: true, runValidators: true, context: "query" }
    );

    // Activity Log
    await logActivity({
        userId: req.user?._id || "System",
        action: "UPDATE_ASSET",
        targetType: "Asset",
        targetId: asset._id,
        details: { assetTag: asset.assetTag, updatedFields: Object.keys(data) },
        ipAddress: req.ip
    });

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

    // Activity Log
    await logActivity({
        userId: req.user?._id || "System",
        action: "DELETE_ASSET",
        targetType: "Asset",
        targetId: existing._id,
        details: { assetTag: existing.assetTag },
        ipAddress: req.ip
    });

    // Clean up image from disk / Cloudinary

    if (existing.imageUrl) {
        await deleteAssetImage(existing.imageUrl);
    }
    sendSuccess(res, null, "Asset deleted successfully");
});

// @desc    Upload / replace asset image
// @route   POST /api/assets/:id/image  (accepts _id or assetTag)
export const uploadAssetImageHandler = asyncHandler(async (req, res) => {
    const asset = await findAssetByIdOrAssetTag(req.params.id);
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }

    let newImageUrl = null;

    if (req.file) {
        newImageUrl = req.file.path.replace(/\\/g, "/");
    } else if (req.body && req.body.imageUrl) {
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