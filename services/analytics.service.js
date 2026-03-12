import Asset from "../models/Asset.js";
import MaintenanceRecord from "../models/MaintenanceRecord.js";
import Vendor from "../models/Vendor.js";
import mongoose from "mongoose";

/**
 * Service for advanced analytics using MongoDB Aggregation Framework
 */
class AnalyticsService {
  /**
   * 1. Asset Distribution by Category
   */
  async getAssetsByCategory() {
    return await Asset.aggregate([
      {
        $group: {
          _id: "$category",
          totalAssets: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalAssets: 1,
        },
      },
      { $sort: { totalAssets: -1 } },
    ]);
  }

  /**
   * 2. Asset Value Statistics
   */
  async getAssetValueStats() {
    const stats = await Asset.aggregate([
      {
        $group: {
          _id: null,
          totalAssetValue: { $sum: "$purchaseCost" },
          averageAssetCost: { $avg: "$purchaseCost" },
          minCost: { $min: "$purchaseCost" },
          maxCost: { $max: "$purchaseCost" },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
    return stats[0] || {
      totalAssetValue: 0,
      averageAssetCost: 0,
      minCost: 0,
      maxCost: 0,
    };
  }

  /**
   * 3. Maintenance Cost Analytics
   */
  async getMaintenanceCostStats() {
    return await MaintenanceRecord.aggregate([
      {
        $group: {
          _id: "$assetId",
          totalMaintenanceCost: { $sum: "$serviceCost" },
          serviceCount: { $sum: 1 },
          averageServiceCost: { $avg: "$serviceCost" },
        },
      },
      {
        $lookup: {
          from: "assets",
          localField: "_id",
          foreignField: "_id",
          as: "asset",
        },
      },
      { $unwind: "$asset" },
      {
        $project: {
          _id: 0,
          assetId: "$_id",
          assetName: "$asset.name",
          assetTag: "$asset.assetTag",
          totalMaintenanceCost: 1,
          serviceCount: 1,
          averageServiceCost: 1,
        },
      },
      { $sort: { totalMaintenanceCost: -1 } },
    ]);
  }

  /**
   * 4. Vendor Performance Analytics
   */
  async getVendorPerformanceStats() {
    return await MaintenanceRecord.aggregate([
      {
        $group: {
          _id: "$vendorId",
          totalServices: { $sum: 1 },
          totalMaintenanceCost: { $sum: "$serviceCost" },
          averageDowntime: { $avg: "$downtimeHours" },
        },
      },
      {
        $lookup: {
          from: "vendors",
          localField: "_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: "$vendor" },
      {
        $project: {
          _id: 0,
          vendorId: "$_id",
          vendorName: "$vendor.vendorName",
          totalServices: 1,
          totalMaintenanceCost: 1,
          averageDowntime: 1,
        },
      },
      { $sort: { totalServices: -1 } },
    ]);
  }

  /**
   * 5. Asset Status Statistics
   */
  async getAssetStatusStats() {
    return await Asset.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]);
  }

  /**
   * 6. Depreciation Analytics (Straight-Line)
   * yearlyDepreciation = (purchaseCost - salvageValue) / usefulLife
   */
  async getDepreciationSummary() {
    return await Asset.aggregate([
      {
        $project: {
          _id: 0,
          name: 1,
          purchaseCost: 1,
          salvageValue: 1,
          usefulLife: 1,
          yearlyDepreciation: {
            $divide: [
              { $subtract: ["$purchaseCost", "$salvageValue"] },
              "$usefulLife",
            ],
          },
        },
      },
    ]);
  }

  /**
   * 7. Monthly Maintenance Trend
   */
  async getMonthlyMaintenanceTrend() {
    return await MaintenanceRecord.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$startDate" },
            year: { $year: "$startDate" },
          },
          totalMaintenanceCost: { $sum: "$serviceCost" },
          totalServices: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          totalMaintenanceCost: 1,
          totalServices: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);
  }

  /**
   * Bonus: Dashboard Summary
   */
  async getDashboardSummary() {
    const totalAssets = await Asset.countDocuments();
    const totalVendors = await Vendor.countDocuments();

    const maintenanceStats = await MaintenanceRecord.aggregate([
      {
        $group: {
          _id: null,
          totalMaintenanceCost: { $sum: "$serviceCost" },
        },
      },
    ]);

    const assetStats = await Asset.aggregate([
      {
        $group: {
          _id: null,
          averageAssetCost: { $avg: "$purchaseCost" },
        },
      },
    ]);

    const assetsInMaintenance = await Asset.countDocuments({
      status: { $in: ["Under Repair", "Maintenance"] },
    });

    return {
      totalAssets,
      totalMaintenanceCost: maintenanceStats[0]?.totalMaintenanceCost || 0,
      totalVendors,
      assetsInMaintenance,
      averageAssetCost: assetStats[0]?.averageAssetCost || 0,
    };
  }
}

export default new AnalyticsService();
