// controllers/dashboard.controller.js
import Asset from "../models/Asset.js";
import Employee from "../models/Employee.js";
import AssignmentHistory from "../models/AssignmentHistory.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
export const getDashboardStats = asyncHandler(async (req, res) => {
    // Asset Statistics
    const totalAssets = await Asset.countDocuments();
    const assetsByStatus = await Asset.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    const assetsByCategory = await Asset.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    // Employee Statistics
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: "Active" });
    const inactiveEmployees = await Employee.countDocuments({ status: "Inactive" });

    const employeesByDepartment = await Employee.aggregate([
        {
            $match: { status: "Active" }
        },
        {
            $group: {
                _id: "$department",
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    // Assignment Statistics
    const totalAssignments = await AssignmentHistory.countDocuments();
    const activeAssignments = await AssignmentHistory.countDocuments({ returnedDate: null });
    const returnedAssignments = await AssignmentHistory.countDocuments({ returnedDate: { $ne: null } });

    // Recent Assignments (last 5)
    const recentAssignments = await AssignmentHistory.find()
        .populate("asset", "assetTag name category")
        .populate("employee", "employeeId firstName lastName")
        .sort({ assignedDate: -1 })
        .limit(5);

    // Assets with upcoming warranty expiry (within next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingWarrantyExpiry = await Asset.find({
        warrantyExpiry: {
            $gte: new Date(),
            $lte: thirtyDaysFromNow
        }
    }).select("assetTag name category warrantyExpiry").sort({ warrantyExpiry: 1 });

    // Total asset value
    const assetValueStats = await Asset.aggregate([
        {
            $group: {
                _id: null,
                totalValue: { $sum: "$purchaseCost" },
                averageValue: { $avg: "$purchaseCost" }
            }
        }
    ]);

    // Format asset status data
    const assetStatusMap = {
        Available: 0,
        Assigned: 0,
        "Under Repair": 0,
        Retired: 0
    };

    assetsByStatus.forEach(item => {
        assetStatusMap[item._id] = item.count;
    });

    // Prepare response
    const stats = {
        assets: {
            total: totalAssets,
            byStatus: assetStatusMap,
            byCategory: assetsByCategory.map(item => ({
                category: item._id || "Uncategorized",
                count: item.count
            })),
            totalValue: assetValueStats[0]?.totalValue || 0,
            averageValue: assetValueStats[0]?.averageValue || 0,
            upcomingWarrantyExpiry: upcomingWarrantyExpiry.length
        },
        employees: {
            total: totalEmployees,
            active: activeEmployees,
            inactive: inactiveEmployees,
            byDepartment: employeesByDepartment.map(item => ({
                department: item._id || "Unassigned",
                count: item.count
            }))
        },
        assignments: {
            total: totalAssignments,
            active: activeAssignments,
            returned: returnedAssignments
        },
        recentActivity: {
            recentAssignments: recentAssignments.map(assignment => ({
                _id: assignment._id,
                asset: assignment.asset,
                employee: assignment.employee,
                assignedDate: assignment.assignedDate,
                returnedDate: assignment.returnedDate,
                status: assignment.returnedDate ? "Returned" : "Active"
            }))
        },
        alerts: {
            upcomingWarrantyExpiry: upcomingWarrantyExpiry.map(asset => ({
                _id: asset._id,
                assetTag: asset.assetTag,
                name: asset.name,
                category: asset.category,
                warrantyExpiry: asset.warrantyExpiry,
                daysRemaining: Math.ceil((asset.warrantyExpiry - new Date()) / (1000 * 60 * 60 * 24))
            }))
        }
    };

    sendSuccess(res, stats, "Dashboard statistics retrieved successfully", 200);
});

// @desc    Get asset utilization rate
// @route   GET /api/dashboard/utilization
export const getAssetUtilization = asyncHandler(async (req, res) => {
    const totalAssets = await Asset.countDocuments();
    const assignedAssets = await Asset.countDocuments({ status: "Assigned" });

    const utilizationRate = totalAssets > 0
        ? ((assignedAssets / totalAssets) * 100).toFixed(2)
        : 0;

    const data = {
        totalAssets,
        assignedAssets,
        availableAssets: totalAssets - assignedAssets,
        utilizationRate: parseFloat(utilizationRate)
    };

    sendSuccess(res, data, "Asset utilization data retrieved successfully", 200);
});

// @desc    Get monthly assignment trends (last 6 months)
// @route   GET /api/dashboard/trends
export const getAssignmentTrends = asyncHandler(async (req, res) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trends = await AssignmentHistory.aggregate([
        {
            $match: {
                assignedDate: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$assignedDate" },
                    month: { $month: "$assignedDate" }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { "_id.year": 1, "_id.month": 1 }
        }
    ]);

    const formattedTrends = trends.map(item => ({
        year: item._id.year,
        month: item._id.month,
        monthName: new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'long' }),
        assignmentCount: item.count
    }));

    sendSuccess(res, formattedTrends, "Assignment trends retrieved successfully", 200);
});