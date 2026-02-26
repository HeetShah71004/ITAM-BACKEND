// controllers/employee.controller.js
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { deleteEmployeeImage, uploadImageFromUrl } from "../middleware/upload.middleware.js";

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
        // multipart/form-data file upload
        data.profileImage = req.file.path.replace(/\\/g, "/");
    } else if (data.profileImage && data.profileImage.startsWith("http")) {
        // JSON body with a remote URL — download/upload it
        data.profileImage = await uploadImageFromUrl(data.profileImage.trim(), "employees");
    }

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

// Helper: returns true if the URL is already stored in our system (Cloudinary or local uploads/)
const isAlreadyStoredUrl = (url) => {
    if (!url) return false;
    // Cloudinary URLs contain 'cloudinary.com'
    if (url.includes("cloudinary.com")) return true;
    // Local relative paths (e.g. "uploads/employees/...")
    if (!url.startsWith("http")) return true;
    return false;
};

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
    } else if (data.profileImage) {
        if (isAlreadyStoredUrl(data.profileImage)) {
            // Already stored in our system — just keep it as-is, no re-upload
            // If the URL is genuinely different from the existing one, update it directly
            if (data.profileImage === existing.profileImage) {
                // Same image — remove from data so we don't overwrite unnecessarily
                delete data.profileImage;
            }
        } else if (data.profileImage.startsWith("http")) {
            // External/remote URL — download and store it
            if (existing.profileImage && existing.profileImage !== data.profileImage) {
                await deleteEmployeeImage(existing.profileImage);
            }
            data.profileImage = await uploadImageFromUrl(data.profileImage.trim(), "employees");
        }
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

// @desc    Upload / replace employee profile image
// @route   POST /api/employees/:id/image
export const uploadEmployeeImageHandler = asyncHandler(async (req, res) => {
    const employee = await findEmployeeByIdOrEmployeeId(req.params.id);
    if (!employee) {
        return sendError(res, "Employee not found", 404);
    }

    let newProfileImage = null;

    if (req.file) {
        newProfileImage = req.file.path.replace(/\\/g, "/");
    } else if (req.body && req.body.profileImage) {
        newProfileImage = await uploadImageFromUrl(req.body.profileImage.trim(), "employees");
    }

    if (!newProfileImage) {
        return sendError(
            res,
            "Please provide an image !",
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