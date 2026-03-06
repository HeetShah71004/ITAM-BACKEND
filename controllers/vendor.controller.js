import Vendor from "../models/Vendor.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { logActivity } from "../utils/activityLogger.js";

/**
 * @desc    Create a new vendor
 * @route   POST /api/vendors
 * @access  Private (Admin, Manager)
 */
export const createVendor = asyncHandler(async (req, res) => {
    const {
        vendorName,
        contactPerson,
        email,
        phone,
        address,
        servicesProvided,
        rating,
        status
    } = req.body;

    const vendor = await Vendor.create({
        vendorName,
        contactPerson,
        email,
        phone,
        address,
        servicesProvided,
        rating,
        status,
        createdBy: req.user._id
    });

    await logActivity({
        userId: req.user._id,
        action: "CREATE_VENDOR",
        targetType: "Vendor",
        targetId: vendor._id,
        details: { vendorName: vendor.vendorName },
        ipAddress: req.ip
    });

    return sendSuccess(res, vendor, "Vendor created successfully", 201);
});

/**
 * @desc    Get all vendors with pagination, search and filter
 * @route   GET /api/vendors
 * @access  Private
 */
export const getVendors = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by status
    if (req.query.status) {
        query.status = req.query.status;
    }

    // Search by vendorName
    if (req.query.search) {
        query.vendorName = { $regex: req.query.search, $options: "i" };
    }

    const vendors = await Vendor.find(query)
        .populate("createdBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Vendor.countDocuments(query);

    const pagination = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
    };

    return sendSuccess(res, { vendors, pagination }, "Vendors retrieved successfully");
});

/**
 * @desc    Get vendor by ID
 * @route   GET /api/vendors/:id
 * @access  Private
 */
export const getVendorById = asyncHandler(async (req, res) => {
    const vendor = await Vendor.findById(req.params.id).populate("createdBy", "firstName lastName email");

    if (!vendor) {
        return sendError(res, "Vendor not found", 404);
    }

    return sendSuccess(res, vendor, "Vendor retrieved successfully");
});

/**
 * @desc    Update vendor details
 * @route   PUT /api/vendors/:id
 * @access  Private (Admin, Manager)
 */
export const updateVendor = asyncHandler(async (req, res) => {
    let vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
        return sendError(res, "Vendor not found", 404);
    }

    vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    await logActivity({
        userId: req.user._id,
        action: "UPDATE_VENDOR",
        targetType: "Vendor",
        targetId: vendor._id,
        details: { updatedFields: Object.keys(req.body) },
        ipAddress: req.ip
    });

    return sendSuccess(res, vendor, "Vendor updated successfully");
});

/**
 * @desc    Soft delete vendor (change status to Inactive)
 * @route   DELETE /api/vendors/:id
 * @access  Private (Admin)
 */
export const deleteVendor = asyncHandler(async (req, res) => {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
        return sendError(res, "Vendor not found", 404);
    }

    vendor.status = "Inactive";
    await vendor.save();

    await logActivity({
        userId: req.user._id,
        action: "DELETE_VENDOR",
        targetType: "Vendor",
        targetId: vendor._id,
        details: { action: "Soft delete (status set to Inactive)" },
        ipAddress: req.ip
    });

    return sendSuccess(res, null, "Vendor deactivated successfully");
});
