// controllers/employee.controller.js
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

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

// @desc    Delete employee
// @route   DELETE /api/employees/:id  (accepts _id or employeeId)
export const deleteEmployee = asyncHandler(async (req, res) => {
    const existing = await findEmployeeByIdOrEmployeeId(req.params.id);
    if (!existing) {
        return sendError(res, "Employee not found", 404);
    }
    await Employee.findByIdAndDelete(existing._id);
    sendSuccess(res, null, "Employee deleted successfully");
});
