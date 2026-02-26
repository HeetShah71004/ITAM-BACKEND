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

// @desc    Create a new employee
// @route   POST /api/employees
export const createEmployee = asyncHandler(async (req, res) => {
    const data = { ...req.body };

    if (req.file) {
        // multipart/form-data file upload (dev: local path, prod: Cloudinary secure_url)
        data.profileImage = req.file.path.replace(/\\/g, "/");
    }
    // If no file provided, profileImage field is simply omitted (stays null/undefined in DB)

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
        // multipart/form-data file upload — delete old image first
        if (existing.profileImage) {
            await deleteEmployeeImage(existing.profileImage);
        }
        data.profileImage = req.file.path.replace(/\\/g, "/");
    } else {
        // No new file uploaded — preserve the existing profileImage as-is
        delete data.profileImage;
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
    // Clean up profile image from disk / Cloudinary
    if (existing.profileImage) {
        await deleteEmployeeImage(existing.profileImage);
    }
    sendSuccess(res, null, "Employee deleted successfully");
});

