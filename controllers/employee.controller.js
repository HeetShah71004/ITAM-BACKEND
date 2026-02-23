// controllers/employee.controller.js
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { deleteEmployeeImage, uploadImageFromUrl } from "../middleware/upload.middleware.js";

/**
 * Find an employee by either MongoDB _id or custom employeeId field.
 * This lets callers use either format in the :id route param.
 */
const findEmployeeByIdOrEmployeeId = async (identifier) => {
    // Try MongoDB _id first if it looks like a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        const employee = await Employee.findById(identifier);
        if (employee) return employee;
    }
    // Fall back to custom employeeId field (e.g. "EMP007")
    return Employee.findOne({ employeeId: identifier });
};

// @desc    Create a new employee
// @route   POST /api/employees
export const createEmployee = asyncHandler(async (req, res) => {
    const employee = await Employee.create(req.body);
    sendSuccess(res, employee, "Employee created successfully", 201);
});

// @desc    Get all employees
// @route   GET /api/employees
export const getAllEmployees = asyncHandler(async (req, res) => {
    const employees = await Employee.find();
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
    const employee = await Employee.findByIdAndUpdate(
        existing._id,
        req.body,
        { new: true, runValidators: true }
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
    // Clean up profile image from disk / Cloudinary
    if (existing.profileImage) {
        await deleteEmployeeImage(existing.profileImage);
    }
    sendSuccess(res, null, "Employee deleted successfully");
});

// @desc    Upload / replace employee profile image
// @route   POST /api/employees/:id/image
// @body    Option A — multipart/form-data, field: "profileImage"  (file upload)
//          Option B — application/json, body: { "profileImage": "<url>" }
export const uploadEmployeeImageHandler = asyncHandler(async (req, res) => {
    const employee = await findEmployeeByIdOrEmployeeId(req.params.id);
    if (!employee) {
        return sendError(res, "Employee not found", 404);
    }

    // Determine the new image source: uploaded file takes priority over a URL string
    let newProfileImage = null;

    if (req.file) {
        // File uploaded via multipart/form-data
        // In production: req.file.path is the Cloudinary HTTPS URL
        // In development: req.file.path is the local file path
        newProfileImage = req.file.path.replace(/\\/g, "/");
    } else if (req.body && req.body.profileImage) {
        // External URL provided as JSON → upload it to Cloudinary (prod) or disk (dev)
        newProfileImage = await uploadImageFromUrl(req.body.profileImage.trim(), "employees");
    }

    if (!newProfileImage) {
        return sendError(
            res,
            "Please provide an image — either upload a file (form-data field: 'profileImage') or send { \"profileImage\": \"<url>\" } as JSON",
            400
        );
    }

    // Delete the OLD image before saving the new one
    if (employee.profileImage && employee.profileImage !== newProfileImage) {
        await deleteEmployeeImage(employee.profileImage);
    }

    employee.profileImage = newProfileImage;
    await employee.save();

    sendSuccess(res, employee, "Employee profile image updated successfully");
});
