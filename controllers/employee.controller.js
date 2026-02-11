// controllers/employee.controller.js
import Employee from "../models/Employee.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

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
// @route   GET /api/employees/:id
export const getEmployeeById = asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
        return sendError(res, "Employee not found", 404);
    }
    sendSuccess(res, employee, "Employee details retrieved successfully");
});

// @desc    Update employee
// @route   PUT /api/employees/:id
export const updateEmployee = asyncHandler(async (req, res) => {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!employee) {
        return sendError(res, "Employee not found", 404);
    }
    sendSuccess(res, employee, "Employee updated successfully");
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
export const deleteEmployee = asyncHandler(async (req, res) => {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
        return sendError(res, "Employee not found", 404);
    }
    sendSuccess(res, null, "Employee deleted successfully");
});
