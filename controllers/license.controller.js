// controllers/license.controller.js
import mongoose from "mongoose";
import SoftwareLicense from "../models/SoftwareLicense.js";
import Employee from "../models/Employee.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

/**
 * Find an employee by MongoDB _id OR custom employeeId field (e.g. "EMP007").
 */
const findEmployeeByIdOrEmployeeId = async (identifier) => {
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        const emp = await Employee.findById(identifier);
        if (emp) return emp;
    }
    return Employee.findOne({ employeeId: identifier });
}; 

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Create a new software license
// @route   POST /api/licenses
export const createLicense = asyncHandler(async (req, res) => {
    const license = await SoftwareLicense.create(req.body);
    sendSuccess(res, license, "Software license created successfully", 201);
});

// @desc    Get all software licenses
// @route   GET /api/licenses?status=Active&licenseType=Subscription
export const getAllLicenses = asyncHandler(async (req, res) => {
    const { status, licenseType, category, platform } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (licenseType) filter.licenseType = licenseType;
    if (category) filter.category = category;
    if (platform) filter.platform = platform;

    const licenses = await SoftwareLicense.find(filter)
        .populate("assignedTo.employee", "employeeId firstName lastName email department")
        .sort({ createdAt: -1 });

    sendSuccess(res, licenses, `Retrieved ${licenses.length} license(s)`, 200);
});

// @desc    Get a single software license by ID
// @route   GET /api/licenses/:id
export const getLicenseById = asyncHandler(async (req, res) => {
    const license = await SoftwareLicense.findById(req.params.id).populate(
        "assignedTo.employee",
        "employeeId firstName lastName email department"
    );

    if (!license) {
        return sendError(res, "Software license not found", 404);
    }

    sendSuccess(res, license, "Software license retrieved successfully", 200);
});

// @desc    Update a software license
// @route   PUT /api/licenses/:id
export const updateLicense = asyncHandler(async (req, res) => {
    // Prevent direct mutation of seat/assignment arrays via this endpoint
    const { usedSeats, assignedTo, ...allowedUpdates } = req.body;

    const license = await SoftwareLicense.findByIdAndUpdate(
        req.params.id,
        allowedUpdates,
        { new: true, runValidators: true }
    ).populate("assignedTo.employee", "employeeId firstName lastName email department");

    if (!license) {
        return sendError(res, "Software license not found", 404);
    }

    sendSuccess(res, license, "Software license updated successfully", 200);
});

// @desc    Delete a software license
// @route   DELETE /api/licenses/:id
export const deleteLicense = asyncHandler(async (req, res) => {
    const license = await SoftwareLicense.findById(req.params.id);

    if (!license) {
        return sendError(res, "Software license not found", 404);
    }

    if (license.usedSeats > 0) {
        return sendError(
            res,
            `Cannot delete license with active assignments. Please revoke all ${license.usedSeats} assigned seat(s) first.`,
            400
        );
    }

    await SoftwareLicense.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, "Software license deleted successfully", 200);
});

// ─────────────────────────────────────────────────────────────────────────────
// SEAT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Assign a license seat to an employee
// @route   POST /api/licenses/assign
// @body    { licenseId, employeeId, assignedBy?, notes? }
export const assignLicense = asyncHandler(async (req, res) => {
    const { licenseId, employeeId, assignedBy, notes } = req.body;

    if (!licenseId || !employeeId) {
        return sendError(res, "licenseId and employeeId are required", 400);
    }

    // Validate license exists
    const license = await SoftwareLicense.findById(licenseId);
    if (!license) {
        return sendError(res, "Software license not found", 404);
    }

    // Check license is active
    if (license.status !== "Active") {
        return sendError(
            res,
            `License is not active. Current status: ${license.status}`,
            400
        );
    }

    // Check expiry
    if (license.expiryDate && license.expiryDate < new Date()) {
        return sendError(res, "Cannot assign an expired license", 400);
    }

    // Check available seats
    if (license.usedSeats >= license.totalSeats) {
        return sendError(
            res,
            `No available seats. Total: ${license.totalSeats}, Used: ${license.usedSeats}`,
            400
        );
    }

    // Validate employee exists and is active
    // Supports both MongoDB _id and custom employeeId string (e.g. "EMP007")
    const employeeDoc = await findEmployeeByIdOrEmployeeId(employeeId);
    if (!employeeDoc) {
        return sendError(res, "Employee not found", 404);
    }
    if (employeeDoc.status !== "Active") {
        return sendError(
            res,
            `Employee is not active. Current status: ${employeeDoc.status}`,
            400
        );
    }

    const employeeMongoId = employeeDoc._id;

    // Check employee doesn't already hold a seat for this license
    const alreadyAssigned = license.assignedTo.some(
        (a) => a.employee.toString() === employeeMongoId.toString()
    );
    if (alreadyAssigned) {
        return sendError(
            res,
            "Employee already has a seat assigned for this license",
            400
        );
    }

    // Add assignment and increment used seats
    license.assignedTo.push({
        employee: employeeMongoId,
        assignedDate: new Date(),
        assignedBy: assignedBy || "System",
        notes: notes || "",
    });
    license.usedSeats += 1;

    await license.save();

    // Return populated document
    const populated = await SoftwareLicense.findById(license._id).populate(
        "assignedTo.employee",
        "employeeId firstName lastName email department"
    );

    sendSuccess(res, populated, "License seat assigned successfully", 200);
});

// @desc    Revoke a license seat from an employee
// @route   POST /api/licenses/revoke
// @body    { licenseId, employeeId }
export const revokeLicense = asyncHandler(async (req, res) => {
    const { licenseId, employeeId } = req.body;

    if (!licenseId || !employeeId) {
        return sendError(res, "licenseId and employeeId are required", 400);
    }

    // Validate license exists
    const license = await SoftwareLicense.findById(licenseId);
    if (!license) {
        return sendError(res, "Software license not found", 404);
    }

    // Resolve employee by _id or custom employeeId string (e.g. "EMP007")
    const employeeDoc = await findEmployeeByIdOrEmployeeId(employeeId);
    if (!employeeDoc) {
        return sendError(res, "Employee not found", 404);
    }

    // Find the assignment entry for this employee
    const assignmentIndex = license.assignedTo.findIndex(
        (a) => a.employee.toString() === employeeDoc._id.toString()
    );

    if (assignmentIndex === -1) {
        return sendError(
            res,
            "This employee does not have a seat assigned for this license",
            404
        );
    }

    // Remove employee from assignedTo and decrement used seats
    license.assignedTo.splice(assignmentIndex, 1);
    license.usedSeats = Math.max(0, license.usedSeats - 1);

    await license.save();

    // Return populated document
    const populated = await SoftwareLicense.findById(license._id).populate(
        "assignedTo.employee",
        "employeeId firstName lastName email department"
    );

    sendSuccess(res, populated, "License seat revoked successfully", 200);
});

// ─────────────────────────────────────────────────────────────────────────────
// REPORTING
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Get licenses expiring within N days (default: 30)
// @route   GET /api/licenses/expiring?days=30
export const getExpiringLicenses = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 30;

    if (days < 1 || days > 365) {
        return sendError(res, "days must be between 1 and 365", 400);
    }

    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const licenses = await SoftwareLicense.find({
        expiryDate: { $gte: now, $lte: threshold },
        status: "Active",
    })
        .populate("assignedTo.employee", "employeeId firstName lastName email department")
        .sort({ expiryDate: 1 });

    sendSuccess(
        res,
        licenses,
        `Found ${licenses.length} license(s) expiring within ${days} day(s)`,
        200
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Read-only compliance audit report
// @route   GET /api/licenses/compliance?days=30
export const getLicenseCompliance = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 30;

    const now = new Date();
    const soonThreshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Fetch all licenses (no pagination – compliance is a full audit)
    const all = await SoftwareLicense.find({}).populate(
        "assignedTo.employee",
        "employeeId firstName lastName email department"
    );

    const total = all.length;

    // ── Buckets ───────────────────────────────────────────────────────────────

    // 1. Expired – status is Expired OR expiryDate is in the past
    const expired = all.filter(
        (l) =>
            l.status === "Expired" ||
            (l.expiryDate && l.expiryDate < now)
    );

    // 2. Expiring soon – Active, has an expiryDate within the threshold window
    const expiringSoon = all.filter(
        (l) =>
            l.status === "Active" &&
            l.expiryDate &&
            l.expiryDate >= now &&
            l.expiryDate <= soonThreshold
    );

    // 3. Over-assigned – usedSeats exceeds totalSeats (data integrity violation)
    const overAssigned = all.filter((l) => l.usedSeats > l.totalSeats);

    // 4. Unassigned – Active license with zero seats in use
    const unassigned = all.filter(
        (l) => l.status === "Active" && l.usedSeats === 0
    );

    // ── Compliance percentage ─────────────────────────────────────────────────
    // A license is "compliant" when:
    //   • status is Active
    //   • not expired
    //   • usedSeats <= totalSeats
    const compliantCount = all.filter(
        (l) =>
            l.status === "Active" &&
            !(l.expiryDate && l.expiryDate < now) &&
            l.usedSeats <= l.totalSeats
    ).length;

    const compliancePercentage =
        total === 0 ? 100 : Math.round((compliantCount / total) * 100);

    // ── Summary helper ────────────────────────────────────────────────────────
    const summarise = (list) =>
        list.map((l) => ({
            _id: l._id,
            softwareName: l.softwareName,
            licenseKey: l.licenseKey,
            licenseType: l.licenseType,
            status: l.status,
            totalSeats: l.totalSeats,
            usedSeats: l.usedSeats,
            expiryDate: l.expiryDate || null,
            daysUntilExpiry: l.daysUntilExpiry,
            assignedTo: l.assignedTo,
        }));

    const report = {
        generatedAt: now,
        windowDays: days,
        summary: {
            total,
            compliant: compliantCount,
            compliancePercentage,
            expiredCount: expired.length,
            expiringSoonCount: expiringSoon.length,
            overAssignedCount: overAssigned.length,
            unassignedCount: unassigned.length,
        },
        expired: summarise(expired),
        expiringSoon: summarise(expiringSoon),
        overAssigned: summarise(overAssigned),
        unassigned: summarise(unassigned),
    };

    sendSuccess(res, report, "License compliance report generated", 200);
});
