// controllers/assignment.controller.js
import mongoose from "mongoose";
import Asset from "../models/Asset.js";
import Employee from "../models/Employee.js";
import AssignmentHistory from "../models/AssignmentHistory.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { sendEmail, assignmentEmailTemplate, returnEmailTemplate } from "../utils/emailService.js";

// @desc    Assign an asset to an employee
// @route   POST /api/assignments/assign
export const assignAsset = asyncHandler(async (req, res) => {
    // Accept both 'asset'/'employee', 'assetId'/'employeeId', and '_id' field names
    const {
        asset,
        employee,
        assetId: assetIdParam,
        employeeId: employeeIdParam,
        _id: employeeMongoIdParam,
        assignedBy,
        notes
    } = req.body;

    // Use whichever format was provided
    const assetId = asset || assetIdParam;
    // Support _id, employee (ObjectId), or custom employeeId string (e.g. "EMP007")
    const employeeIdentifier = employeeMongoIdParam || employee || employeeIdParam;

    // Validate required fields
    if (!assetId || !employeeIdentifier) {
        return sendError(res, "Asset ID and Employee ID are required", 400);
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Check if asset exists and is available
        const asset = await Asset.findOne({ _id: assetId, userId: req.user._id }).session(session);
        if (!asset) {
            await session.abortTransaction();
            return sendError(res, "Asset not found", 404);
        }

        if (asset.status !== "Available") {
            await session.abortTransaction();
            return sendError(
                res,
                `Asset is not available for assignment. Current status: ${asset.status}`,
                400
            );
        }

        // Check if employee exists and is active
        let employeeDoc = null;
        if (mongoose.Types.ObjectId.isValid(employeeIdentifier)) {
            employeeDoc = await Employee.findOne({ _id: employeeIdentifier, userId: req.user._id }).session(session);
        }

        if (!employeeDoc) {
            employeeDoc = await Employee.findOne({ employeeId: employeeIdentifier, userId: req.user._id }).session(session);
        }

        if (!employeeDoc) {
            await session.abortTransaction();
            return sendError(res, "Employee not found", 404);
        }

        if (employeeDoc.status !== "Active") {
            await session.abortTransaction();
            return sendError(
                res,
                `Employee is not active. Current status: ${employeeDoc.status}`,
                400
            );
        }

        const employeeMongoId = employeeDoc._id;

        // Update asset status and assignment
        asset.status = "Assigned";
        asset.currentAssignedTo = employeeMongoId;
        await asset.save({ session });

        // Create assignment history record
        const assignmentHistory = await AssignmentHistory.create(
            [
                {
                    asset: assetId,
                    employee: employeeMongoId,
                    assignedBy: assignedBy || "System",
                    notes: notes || "",
                    userId: req.user._id,
                },
            ],
            { session }
        );

        // Commit the transaction
        await session.commitTransaction();

        // Populate the assignment history for response
        const populatedAssignment = await AssignmentHistory.findOne({
            _id: assignmentHistory[0]._id,
            userId: req.user._id
        })
            .populate("asset", "assetTag name category brand model")
            .populate("employee", "employeeId firstName lastName email department");

        sendSuccess(
            res,
            populatedAssignment,
            "Asset assigned successfully",
            201
        );

        // Must await on Vercel to ensure completion
        if (employeeDoc?.email) {
            await sendEmail(
                employeeDoc.email,
                "Asset Assignment Confirmation – ITAM",
                assignmentEmailTemplate({
                    employeeName: `${employeeDoc.firstName} ${employeeDoc.lastName}`,
                    assetName: asset.name,
                    assetTag: asset.assetTag,
                    assignedDate: populatedAssignment.assignedDate,
                })
            );
        }
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

// @desc    Return an asset from an employee
// @route   POST /api/assignments/return
export const returnAsset = asyncHandler(async (req, res) => {
    const { asset, assetId: assetIdParam, returnCondition, notes, newStatus } = req.body;

    const assetId = asset || assetIdParam;

    if (!assetId) {
        return sendError(res, "Asset ID is required", 400);
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Check if asset exists and is assigned
        const asset = await Asset.findOne({ _id: assetId, userId: req.user._id }).session(session);
        if (!asset) {
            await session.abortTransaction();
            return sendError(res, "Asset not found", 404);
        }

        if (asset.status !== "Assigned") {
            await session.abortTransaction();
            return sendError(
                res,
                `Asset is not currently assigned. Current status: ${asset.status}`,
                400
            );
        }

        // Find the active assignment (no returnedDate)
        const activeAssignment = await AssignmentHistory.findOne({
            asset: assetId,
            returnedDate: null,
            userId: req.user._id,
        }).session(session);

        if (!activeAssignment) {
            await session.abortTransaction();
            return sendError(res, "No active assignment found for this asset", 404);
        }

        // Update asset status and clear assignment
        const targetStatus = newStatus === "Under Repair" ? "Under Repair" : "Available";
        asset.status = targetStatus;
        asset.currentAssignedTo = null;
        await asset.save({ session });

        // Update assignment history with return information
        activeAssignment.returnedDate = new Date();
        activeAssignment.returnCondition = returnCondition || "";
        if (notes) {
            activeAssignment.notes = activeAssignment.notes
                ? `${activeAssignment.notes}\nReturn Notes: ${notes}`
                : `Return Notes: ${notes}`;
        }
        await activeAssignment.save({ session });

        // Commit the transaction
        await session.commitTransaction();

        // Populate the assignment history for response
        const populatedAssignment = await AssignmentHistory.findOne({
            _id: activeAssignment._id,
            userId: req.user._id
        })
            .populate("asset", "assetTag name category brand model status")
            .populate("employee", "employeeId firstName lastName email department");

        sendSuccess(res, populatedAssignment, "Asset returned successfully", 200);

        // Must await on Vercel to ensure completion
        if (populatedAssignment.employee?.email) {
            await sendEmail(
                populatedAssignment.employee.email,
                "Asset Return Confirmation – ITAM",
                returnEmailTemplate({
                    employeeName: `${populatedAssignment.employee.firstName} ${populatedAssignment.employee.lastName}`,
                    assetName: populatedAssignment.asset.name,
                    assetTag: populatedAssignment.asset.assetTag,
                    returnedDate: populatedAssignment.returnedDate,
                })
            );
        }
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

// @desc    Get all assignment history
// @route   GET /api/assignments
export const getAllAssignments = asyncHandler(async (req, res) => {
    const { status } = req.query; // Optional: 'active' or 'returned'

    let filter = {};
    if (status === "active") {
        filter.returnedDate = null;
    } else if (status === "returned") {
        filter.returnedDate = { $ne: null };
    }
    
    // Ownership check
    filter.userId = req.user._id;

    const assignments = await AssignmentHistory.find(filter)
        .populate("asset", "assetTag name category brand model status")
        .populate("employee", "employeeId firstName lastName email department")
        .sort({ assignedDate: -1 });

    sendSuccess(
        res,
        assignments,
        `Retrieved ${assignments.length} assignment record(s)`,
        200
    );
});

// @desc    Get assignment history for a specific asset
// @route   GET /api/assignments/asset/:assetId
export const getAssetAssignmentHistory = asyncHandler(async (req, res) => {
    const { assetId } = req.params;

    // Validate asset exists
    const asset = await Asset.findOne({ _id: assetId, userId: req.user._id });
    if (!asset) {
        return sendError(res, "Asset not found", 404);
    }

    const assignments = await AssignmentHistory.find({ asset: assetId, userId: req.user._id })
        .populate("employee", "employeeId firstName lastName email department")
        .sort({ assignedDate: -1 });

    sendSuccess(
        res,
        {
            asset: {
                _id: asset._id,
                assetTag: asset.assetTag,
                name: asset.name,
                category: asset.category,
                status: asset.status,
            },
            assignments,
        },
        `Retrieved ${assignments.length} assignment record(s) for asset`,
        200
    );
});

// @desc    Get assignment history for a specific employee
// @route   GET /api/assignments/employee/:employeeId
export const getEmployeeAssignmentHistory = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;

    // Validate employee exists
    const employee = await Employee.findOne({ _id: employeeId, userId: req.user._id });
    if (!employee) {
        return sendError(res, "Employee not found", 404);
    }

    const assignments = await AssignmentHistory.find({ employee: employeeId, userId: req.user._id })
        .populate("asset", "assetTag name category brand model status")
        .sort({ assignedDate: -1 });

    sendSuccess(
        res,
        {
            employee: {
                _id: employee._id,
                employeeId: employee.employeeId,
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                department: employee.department,
            },
            assignments,
        },
        `Retrieved ${assignments.length} assignment record(s) for employee`,
        200
    );
});
