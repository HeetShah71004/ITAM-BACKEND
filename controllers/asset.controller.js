// controllers/asset.controller.js
import mongoose from "mongoose";
import Asset from "../models/Asset.js";
import Employee from "../models/Employee.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { deleteAssetImage, uploadImageFromUrl } from "../middleware/upload.middleware.js";
import { logActivity } from "../utils/activityLogger.js";
import { generateQRCode } from "../utils/qrGenerator.js";


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
const findAssetByIdOrAssetTag = async (identifier, userId = null) => {
    const query = userId ? { userId } : {};
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        const asset = await Asset.findOne({ _id: identifier, ...query });
        if (asset) return asset;
    }
    return Asset.findOne({ assetTag: identifier.toUpperCase(), ...query });
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
        // Cloudinary storage provides the full secure URL in req.file.path
        data.imageUrl = req.file.path;
    } else if (data.imageUrl && data.imageUrl.startsWith("http")) {
        // JSON body with a remote URL — download/upload it
        data.imageUrl = await uploadImageFromUrl(data.imageUrl.trim(), "assets");
    }

    // Set owner
    data.userId = req.user._id;

    const asset = await Asset.create(data);

    // Generate QR Code
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const qrText = `${baseUrl}/assets/${asset._id}`;
    const qrCode = await generateQRCode(qrText);
    
    // Save QR code to asset
    asset.qrCode = qrCode;
    await asset.save();

    // Activity Log
    await logActivity({
        userId: req.user._id, // req.user is populated by auth middleware
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
    let query = {};

    // Permission Matrix: Employee can only view their own assigned assets
    if (req.user && req.user.role === "Employee") {
        const employee = await Employee.findOne({ email: req.user.email, userId: req.user._id });
        if (employee) {
            query.currentAssignedTo = employee._id;
        } else {
            return sendSuccess(res, [], "No assets assigned to your employee profile");
        }
    } else {
        // Manager/Admin can only see assets they own/created
        query.userId = req.user._id;
    }

    const assets = await Asset.find(query).sort({ updatedAt: -1 }).populate("currentAssignedTo", "firstName lastName employeeId");
    sendSuccess(res, assets, "Assets retrieved successfully");
});

// @desc    Get asset by ID
// @route   GET /api/assets/:id  (accepts _id or assetTag)
export const getAssetById = asyncHandler(async (req, res) => {
    const asset = await findAssetByIdOrAssetTag(req.params.id, req.user._id);
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }
    await asset.populate("currentAssignedTo", "firstName lastName employeeId");
    sendSuccess(res, asset, "Asset details retrieved successfully");
});

// @desc    Update asset
// @route   PUT /api/assets/:id  (accepts _id or assetTag)
export const updateAsset = asyncHandler(async (req, res) => {
    const existing = await findAssetByIdOrAssetTag(req.params.id, req.user._id);
    if (!existing) {
        return sendError(res, "Asset not found", 404);
    }

    const data = stripEmptyFields(normalizeFields({ ...req.body }));

    if (req.file) {
        // multipart/form-data file upload — delete old image first
        if (existing.imageUrl) {
            await deleteAssetImage(existing.imageUrl);
        }
        data.imageUrl = req.file.path;
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

    // Update QR Code if it doesn't exist
    if (!asset.qrCode) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const qrText = `${baseUrl}/assets/${asset._id}`;
        asset.qrCode = await generateQRCode(qrText);
        await asset.save();
    }

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
    const existing = await findAssetByIdOrAssetTag(req.params.id, req.user._id);
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

// @desc    Get assets assigned to me (Employee)
// @route   GET /api/assets/my-assets
export const getMyAssets = asyncHandler(async (req, res) => {
    // Assuming Employee model stores user reference or we match by employee email/id
    // For now, if req.user is an Employee, we might need a link between User and Employee
    // If not, we can find by email if they match

    // Check if req.user exists (from verifyToken)
    if (!req.user) {
        return sendError(res, "User context not found", 401);
    }

    // Usually Employee table links to User table. 
    // Let's check how assignments are stored in Asset model.
    // currentAssignedTo in Asset.js refers to Employee model (usually).

    // Let's find the Employee record for this User
    const employee = await Employee.findOne({ email: req.user.email, userId: req.user._id });

    if (!employee) {
        return sendSuccess(res, [], "No employee record found for user");
    }

    const assets = await Asset.find({ currentAssignedTo: employee._id })
        .sort({ updatedAt: -1 })
        .populate("currentAssignedTo", "firstName lastName employeeId");

    sendSuccess(res, assets, "Your assets retrieved successfully");
});

export const uploadAssetImageHandler = asyncHandler(async (req, res) => {
    const asset = await findAssetByIdOrAssetTag(req.params.id, req.user._id);
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }

    let newImageUrl = null;

    if (req.file) {
        newImageUrl = req.file.path;
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

// @desc    Regenerate QR code
// @route   POST /api/assets/:id/generate-qr
export const regenerateQRCode = asyncHandler(async (req, res) => {
    const asset = await findAssetByIdOrAssetTag(req.params.id, req.user._id);
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const qrText = `${baseUrl}/assets/${asset._id}`;
    const qrCode = await generateQRCode(qrText);

    asset.qrCode = qrCode;
    await asset.save();

    sendSuccess(res, {
        message: "QR Code regenerated successfully",
        assetId: asset._id,
        qrCode: asset.qrCode
    }, "QR Code regenerated successfully");
});

// @desc    Get public asset view for QR scanning
// @route   GET /assets/:id
export const getAssetPublicView = asyncHandler(async (req, res) => {
    const asset = await findAssetByIdOrAssetTag(req.params.id);
    if (!asset) {
        return res.status(404).send(`
            <html>
                <head>
                    <title>Asset Not Found</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f4f7f6; color: #333; }
                        .container { text-align: center; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                        h1 { color: #e74c3c; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Asset Not Found</h1>
                        <p>The asset you are looking for does not exist or has been removed.</p>
                    </div>
                </body>
            </html>
        `);
    }

    await asset.populate("currentAssignedTo", "firstName lastName");

    // Premium HTML Template
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Details | ${asset.assetTag}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --success: #10b981;
            --warning: #f59e0b;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .card {
            background: var(--card-bg);
            max-width: 500px;
            width: 100%;
            border-radius: 24px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.04);
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.05);
            animation: slideUp 0.6s ease-out;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.02em;
        }

        .tag {
            background: rgba(255, 255, 255, 0.2);
            padding: 6px 16px;
            border-radius: 100px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
            margin-top: 10px;
            backdrop-filter: blur(4px);
        }

        .content {
            padding: 30px;
        }

        .image-container {
            width: 100%;
            height: 200px;
            background: #f1f5f9;
            border-radius: 16px;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .image-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .label {
            color: var(--text-muted);
            font-size: 14px;
            font-weight: 400;
        }

        .value {
            font-weight: 600;
            font-size: 15px;
        }

        .status {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-available { background: #ecfdf5; color: #065f46; }
        .status-assigned { background: #eff6ff; color: #1e40af; }
        .status-repair { background: #fffbeb; color: #92400e; }
        .status-retired { background: #fef2f2; color: #991b1b; }

        .footer {
            padding: 20px 30px;
            background: #f8fafc;
            text-align: center;
            font-size: 12px;
            color: var(--text-muted);
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>Asset Details</h1>
            <div class="tag">${asset.assetTag}</div>
        </div>
        <div class="content">
            ${asset.imageUrl ? `
            <div class="image-container">
                <img src="${asset.imageUrl}" alt="${asset.name}">
            </div>
            ` : ''}
            
            <div class="detail-row">
                <span class="label">Name</span>
                <span class="value">${asset.name}</span>
            </div>
            <div class="detail-row">
                <span class="label">Category</span>
                <span class="value">${asset.category}</span>
            </div>
            <div class="detail-row">
                <span class="label">Status</span>
                <span class="status status-${asset.status.toLowerCase().replace(' ', '-')}">${asset.status}</span>
            </div>
            <div class="detail-row">
                <span class="label">Assigned To</span>
                <span class="value">${asset.currentAssignedTo ? asset.currentAssignedTo.firstName + ' ' + asset.currentAssignedTo.lastName : 'Not Assigned'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Model</span>
                <span class="value">${asset.model || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Warranty Status</span>
                <span class="value">${asset.isUnderWarranty ? '✅ In Warranty' : '❌ Expired/No Warranty'}</span>
            </div>
        </div>
        <div class="footer">
            IT Asset Management System &copy; ${new Date().getFullYear()}
        </div>
    </div>
</body>
</html>
    `;
    res.send(html);
});