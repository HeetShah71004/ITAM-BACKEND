import mongoose from "mongoose";
import MaintenanceRecord from "../models/MaintenanceRecord.js";
import Asset from "../models/Asset.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { logActivity } from "../utils/activityLogger.js";

/**
 * @desc    Create a new maintenance record
 * @route   POST /api/maintenance
 * @access  Private (Admin, Manager)
 */
export const createMaintenance = asyncHandler(async (req, res) => {
    const {
        assetId,
        vendorId,
        issueDescription,
        maintenanceType,
        startDate,
        endDate,
        serviceCost,
        status,
        notes
    } = req.body;

    // Validate asset existence
    const asset = await Asset.findById(assetId);
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }

    const maintenanceEntry = await MaintenanceRecord.create({
        assetId,
        vendorId,
        issueDescription,
        maintenanceType,
        reportedBy: req.user._id,
        startDate,
        endDate,
        serviceCost,
        status,
        notes
    });

    // Update asset status if maintenance is in progress or completed
    if (status === "In Progress") {
        asset.status = "Under Repair";
        await asset.save();
    }

    await logActivity({
        userId: req.user._id,
        action: "CREATE_MAINTENANCE",
        targetType: "MaintenanceRecord",
        targetId: maintenanceEntry._id,
        details: { assetId, maintenanceType, status },
        ipAddress: req.ip
    });

    return sendSuccess(res, maintenanceEntry, "Maintenance record created successfully", 201);
});

/**
 * @desc    Get all maintenance records with filters
 * @route   GET /api/maintenance
 * @access  Private
 */
export const getAllMaintenance = asyncHandler(async (req, res) => {
    const { status, assetId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (assetId) query.assetId = assetId;

    const records = await MaintenanceRecord.find(query)
        .populate("assetId", "assetTag name category")
        .populate("vendorId", "vendorName contactPerson email")
        .populate("reportedBy", "firstName lastName email")
        .sort({ createdAt: -1 });

    return sendSuccess(res, records, "Maintenance records retrieved successfully");
});

/**
 * @desc    Get maintenance history for a specific asset
 * @route   GET /api/maintenance/asset/:assetId
 * @access  Private
 */
export const getMaintenanceByAsset = asyncHandler(async (req, res) => {
    const records = await MaintenanceRecord.find({ assetId: req.params.assetId })
        .populate("vendorId", "vendorName")
        .populate("reportedBy", "firstName lastName")
        .sort({ startDate: -1 });

    return sendSuccess(res, records, "Asset maintenance history retrieved successfully");
});

/**
 * @desc    Update maintenance record
 * @route   PUT /api/maintenance/:id
 * @access  Private (Admin, Manager)
 */
export const updateMaintenance = asyncHandler(async (req, res) => {
    let record = await MaintenanceRecord.findById(req.params.id);

    if (!record) {
        return sendError(res, "Maintenance record not found", 404);
    }

    const updateData = { ...req.body };

    // Calculate downtimeHours if endDate is updated or added
    if (updateData.endDate || updateData.startDate) {
        const start = updateData.startDate ? new Date(updateData.startDate) : new Date(record.startDate);
        const end = updateData.endDate ? new Date(updateData.endDate) : (record.endDate ? new Date(record.endDate) : null);

        if (start && end) {
            const diffMs = end - start;
            updateData.downtimeHours = Math.max(0, diffMs / (1000 * 60 * 60)); // Convert ms to hours
        }
    }

    record = await MaintenanceRecord.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
    });

    // If status changed to Completed, we might want to update asset status back to Available
    if (updateData.status === "Completed") {
        const asset = await Asset.findById(record.assetId);
        if (asset && asset.status === "Under Repair") {
            asset.status = "Available";
            await asset.save();
        }
    }

    await logActivity({
        userId: req.user._id,
        action: "UPDATE_MAINTENANCE",
        targetType: "MaintenanceRecord",
        targetId: record._id,
        details: { updatedFields: Object.keys(updateData) },
        ipAddress: req.ip
    });

    return sendSuccess(res, record, "Maintenance record updated successfully");
});

/**
 * @desc    Delete maintenance record
 * @route   DELETE /api/maintenance/:id
 * @access  Private (Admin)
 */
export const deleteMaintenance = asyncHandler(async (req, res) => {
    const record = await MaintenanceRecord.findById(req.params.id);

    if (!record) {
        return sendError(res, "Maintenance record not found", 404);
    }

    await MaintenanceRecord.findByIdAndDelete(req.params.id);

    await logActivity({
        userId: req.user._id,
        action: "DELETE_MAINTENANCE",
        targetType: "MaintenanceRecord",
        targetId: record._id,
        details: { assetId: record.assetId },
        ipAddress: req.ip
    });

    return sendSuccess(res, null, "Maintenance record deleted successfully");
});

/**
 * @desc    Calculate total maintenance cost for an asset
 * @route   GET /api/maintenance/cost/:assetId
 * @access  Private
 */
export const getServiceCostByAsset = asyncHandler(async (req, res) => {
    const { assetId } = req.params;

    const stats = await MaintenanceRecord.aggregate([
        { $match: { assetId: new mongoose.Types.ObjectId(assetId) } },
        {
            $group: {
                _id: "$assetId",
                totalCost: { $sum: "$serviceCost" },
                recordCount: { $sum: 1 }
            }
        }
    ]);

    const result = stats.length > 0 ? stats[0] : { _id: assetId, totalCost: 0, recordCount: 0 };

    return sendSuccess(res, result, "Total maintenance cost retrieved successfully");
});

/**
 * @desc    Calculate total downtime hours for an asset
 * @route   GET /api/maintenance/downtime/:assetId
 * @access  Private
 */
export const getDowntimeByAsset = asyncHandler(async (req, res) => {
    const { assetId } = req.params;

    const stats = await MaintenanceRecord.aggregate([
        { $match: { assetId: new mongoose.Types.ObjectId(assetId) } },
        {
            $group: {
                _id: "$assetId",
                totalDowntime: { $sum: "$downtimeHours" },
                recordCount: { $sum: 1 }
            }
        }
    ]);

    const result = stats.length > 0 ? stats[0] : { _id: assetId, totalDowntime: 0, recordCount: 0 };

    return sendSuccess(res, result, "Total downtime hours retrieved successfully");
});
