import AnalyticsService from "../services/analytics.service.js";

/**
 * Controller for advanced analytics
 */
export const getAssetsByCategory = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getAssetsByCategory();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAssetValueStats = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getAssetValueStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceCostStats = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getMaintenanceCostStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getVendorPerformanceStats = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getVendorPerformanceStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAssetStatusStats = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getAssetStatusStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getDepreciationSummary = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getDepreciationSummary();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyMaintenanceTrend = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getMonthlyMaintenanceTrend();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getDashboardSummary();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
