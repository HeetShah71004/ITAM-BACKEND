// controllers/employee.controller.js
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { deleteEmployeeImage } from "../middleware/upload.middleware.js";

const findEmployeeByIdOrEmployeeId = async (identifier) => {
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        const employee = await Employee.findById(identifier);
        if (employee) return employee;
    }
    return Employee.findOne({ employeeId: identifier });
};

/**
 * Extract image fields from req.file (Cloudinary or local disk).
 *
 * Cloudinary (production):
 *   req.file.path      → secure_url   (https://res.cloudinary.com/...)
 *   req.file.filename  → public_id    (itam/employees/employees-xxxx)
 *
 * Local disk (development):
 *   req.file.path      → file path    (uploads/employees/employees-xxxx.jpg)
 *   req.file.filename  → filename only
 *
 * @returns {{ profileImage: string, profileImagePublicId: string }}
 */
const extractImageFields = (file) => {
    const isCloudinary =
        file.path && file.path.startsWith("https://res.cloudinary.com");

    if (isCloudinary) {
        return {
            profileImage: file.path,           // secure_url
            profileImagePublicId: file.filename, // public_id
        };
    }

    // Local disk — store the normalised path; no public_id needed
    return {
        profileImage: file.path.replace(/\\/g, "/"),
        profileImagePublicId: null,
    };
};

// @desc    Create a new employee
// @route   POST /api/employees
export const createEmployee = asyncHandler(async (req, res) => {
    const data = { ...req.body };

    if (req.file) {
        // multipart/form-data → Multer already uploaded to Cloudinary (prod) or disk (dev)
        Object.assign(data, extractImageFields(req.file));
    }
    // If no file, profileImage stays whatever the body sent (or undefined)

    const employee = await Employee.create(data);
    sendSuccess(res, employee, "Employee created successfully", 201);
});

// @desc    Get all employees
// @route   GET /api/employees
export const getAllEmployees = asyncHandler(async (req, res) => {
    const employees = await Employee.find().sort({ updatedAt: -1 });
    sendSuccess(res, employees, "Employees retrieved successfully");
});

// @desc    Get employee by ID
// @route   GET /api/employees/:id  (accepts _id or employeeId)
export const getEmployeeById = asyncHandler(async (req, res) => {
    const employee = await findEmployeeByIdOrEmployeeId(req.params.id);
    if (!employee) {
        return sendError(res, "Employee not found", 404);
    }
    sendSuccess(res, employee, "Employee details retrieved successfully");
});

// @desc    Update employee
// @route   PUT /api/employees/:id  (accepts _id or employeeId)
export const updateEmployee = asyncHandler(async (req, res) => {
    const existing = await findEmployeeByIdOrEmployeeId(req.params.id);
    if (!existing) {
        return sendError(res, "Employee not found", 404);
    }

    const data = { ...req.body };

    if (req.file) {
        // A new file was uploaded — delete the old image first, then set new fields
        if (existing.profileImagePublicId) {
            // Production: delete from Cloudinary by public_id
            await deleteEmployeeImage(existing.profileImagePublicId);
        } else if (existing.profileImage && !existing.profileImage.startsWith("http")) {
            // Development: delete local file
            await deleteEmployeeImage(existing.profileImage);
        }
        Object.assign(data, extractImageFields(req.file));
    } else {
        // No new file — remove any image-related keys from body to avoid accidental overwrite
        delete data.profileImage;
        delete data.profileImagePublicId;
    }

    const employee = await Employee.findByIdAndUpdate(
        existing._id,
        data,
        { new: true, runValidators: true, context: "query" }
    );
    sendSuccess(res, employee, "Employee updated successfully");
});

// @desc    Delete employee (also removes associated profile image)
// @route   DELETE /api/employees/:id  (accepts _id or employeeId)
export const deleteEmployee = asyncHandler(async (req, res) => {
    const existing = await findEmployeeByIdOrEmployeeId(req.params.id);
    if (!existing) {
        return sendError(res, "Employee not found", 404);
    }
    await Employee.findByIdAndDelete(existing._id);

    // Clean up image: use public_id (Cloudinary) or path (local)
    if (existing.profileImagePublicId) {
        await deleteEmployeeImage(existing.profileImagePublicId);
    } else if (existing.profileImage && !existing.profileImage.startsWith("http")) {
        await deleteEmployeeImage(existing.profileImage);
    }

    sendSuccess(res, null, "Employee deleted successfully");
});
