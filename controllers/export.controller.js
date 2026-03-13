// controllers/export.controller.js
import convertToCSV from "../utils/csvExport.utils.js";
import {
    getAssetsForExport, ASSET_FIELDS,
    getEmployeesForExport, EMPLOYEE_FIELDS,
    getLicensesForExport, LICENSE_FIELDS,
} from "../services/export.service.js";

// Map of valid types to their service-fetcher + CSV fields
const EXPORT_CONFIG = {
    assets: { fetcher: getAssetsForExport, fields: ASSET_FIELDS },
    employees: { fetcher: getEmployeesForExport, fields: EMPLOYEE_FIELDS },
    licenses: { fetcher: getLicensesForExport, fields: LICENSE_FIELDS },
};

/**
 * GET /api/export/:type
 *
 * Query params (all optional):
 *  - status        : filter by document status
 *  - category      : (assets / licenses) filter by category
 *  - licenseType   : (licenses only)
 *  - department    : (employees only)
 *  - startDate     : ISO date string — filters createdAt >= startDate
 *  - endDate       : ISO date string — filters createdAt <= endDate (end of day)
 */
export const exportData = async (req, res) => {
    try {
        const { type } = req.params;
        const config = EXPORT_CONFIG[type?.toLowerCase()];

        if (!config) {
            return res.status(400).json({
                success: false,
                message: `Invalid export type "${type}". Valid types: assets, employees, licenses.`,
            });
        }

        // Pull all supported filter params from query string
        const { status, category, licenseType, department, startDate, endDate } = req.query;

        // Validate date strings if provided
        if (startDate && isNaN(Date.parse(startDate))) {
            return res.status(400).json({
                success: false,
                message: "Invalid startDate format. Use ISO 8601 (e.g. 2024-01-01).",
            });
        }
        if (endDate && isNaN(Date.parse(endDate))) {
            return res.status(400).json({
                success: false,
                message: "Invalid endDate format. Use ISO 8601 (e.g. 2024-12-31).",
            });
        }

        const filters = { status, category, licenseType, department, startDate, endDate };
        const data = await config.fetcher(filters, req.user?._id);
        const csv = convertToCSV(data, config.fields);

        res.header("Content-Type", "text/csv; charset=utf-8");
        res.attachment(`${type.toLowerCase()}-export.csv`);
        return res.send(csv);
    } catch (err) {
        console.error(`[export] Error exporting ${req.params.type}:`, err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate CSV export.",
            error: process.env.NODE_ENV !== "production" ? err.message : undefined,
        });
    }
};
