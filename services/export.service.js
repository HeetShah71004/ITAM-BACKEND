// services/export.service.js
import Asset from "../models/Asset.js";
import Employee from "../models/Employee.js";
import SoftwareLicense from "../models/SoftwareLicense.js";

// ─── Helper: build a createdAt date-range filter ─────────────────────────────
const dateRangeFilter = (startDate, endDate) => {
    const filter = {};
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // include the full end day
            filter.createdAt.$lte = end;
        }
    }
    return filter;
};

// ─── Assets ───────────────────────────────────────────────────────────────────
/**
 * Returns an array of plain asset objects safe for CSV export.
 * Supported filters: status, category, startDate, endDate
 */
export const getAssetsForExport = async (filters = {}, userId = null) => {
    const { status, category, startDate, endDate } = filters;

    const query = { ...dateRangeFilter(startDate, endDate) };
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (category) query.category = category;

    const assets = await Asset.find(query)
        .select(
            "assetTag name category brand model serialNumber purchaseDate purchaseCost warrantyExpiry status location notes createdAt updatedAt"
        )
        .populate("currentAssignedTo", "employeeId firstName lastName email department")
        .lean();

    // Flatten the populated assignee into flat columns
    return assets.map((a) => ({
        assetTag: a.assetTag ?? "",
        name: a.name ?? "",
        category: a.category ?? "",
        brand: a.brand ?? "",
        model: a.model ?? "",
        serialNumber: a.serialNumber ?? "",
        purchaseDate: a.purchaseDate ? a.purchaseDate.toISOString().split("T")[0] : "",
        purchaseCost: a.purchaseCost ?? "",
        warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.toISOString().split("T")[0] : "",
        status: a.status ?? "",
        assignedToId: a.currentAssignedTo?.employeeId ?? "",
        assignedToName: a.currentAssignedTo
            ? `${a.currentAssignedTo.firstName} ${a.currentAssignedTo.lastName ?? ""}`.trim()
            : "",
        assignedToEmail: a.currentAssignedTo?.email ?? "",
        location: a.location ?? "",
        notes: a.notes ?? "",
        createdAt: a.createdAt ? a.createdAt.toISOString() : "",
        updatedAt: a.updatedAt ? a.updatedAt.toISOString() : "",
    }));
};

export const ASSET_FIELDS = [
    "assetTag", "name", "category", "brand", "model", "serialNumber",
    "purchaseDate", "purchaseCost", "warrantyExpiry", "status",
    "assignedToId", "assignedToName", "assignedToEmail",
    "location", "notes", "createdAt", "updatedAt",
];

// ─── Employees ────────────────────────────────────────────────────────────────
/**
 * Returns an array of plain employee objects safe for CSV export.
 * Supported filters: department, status, startDate, endDate
 * NOTE: password and profileImage (internal URL) are intentionally excluded.
 */
export const getEmployeesForExport = async (filters = {}, userId = null) => {
    const { department, status, startDate, endDate } = filters;

    const query = { ...dateRangeFilter(startDate, endDate) };
    if (userId) query.userId = userId;
    if (department) query.department = department;
    if (status) query.status = status;

    const employees = await Employee.find(query)
        .select(
            "employeeId firstName lastName email phone department designation joiningDate status createdAt updatedAt"
        )
        .lean();

    return employees.map((e) => ({
        employeeId: e.employeeId ?? "",
        firstName: e.firstName ?? "",
        lastName: e.lastName ?? "",
        email: e.email ?? "",
        phone: e.phone ?? "",
        department: e.department ?? "",
        designation: e.designation ?? "",
        joiningDate: e.joiningDate ? e.joiningDate.toISOString().split("T")[0] : "",
        status: e.status ?? "",
        createdAt: e.createdAt ? e.createdAt.toISOString() : "",
        updatedAt: e.updatedAt ? e.updatedAt.toISOString() : "",
    }));
};

export const EMPLOYEE_FIELDS = [
    "employeeId", "firstName", "lastName", "email", "phone",
    "department", "designation", "joiningDate", "status",
    "createdAt", "updatedAt",
];

// ─── Licenses ─────────────────────────────────────────────────────────────────
/**
 * Returns an array of plain license objects safe for CSV export.
 * Supported filters: status, licenseType, startDate, endDate
 * NOTE: licenseKey is included since it is a business identifier, not a secret.
 *       assignedTo sub-array is flattened to a comma-separated count.
 */
export const getLicensesForExport = async (filters = {}, userId = null) => {
    const { status, licenseType, startDate, endDate } = filters;

    const query = { ...dateRangeFilter(startDate, endDate) };
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (licenseType) query.licenseType = licenseType;

    const licenses = await SoftwareLicense.find(query)
        .select(
            "licenseKey softwareName vendor version licenseType totalSeats usedSeats purchaseDate expiryDate supportEndDate cost status platform category notes createdAt updatedAt"
        )
        .lean();

    return licenses.map((l) => ({
        licenseKey: l.licenseKey ?? "",
        softwareName: l.softwareName ?? "",
        vendor: l.vendor ?? "",
        version: l.version ?? "",
        licenseType: l.licenseType ?? "",
        totalSeats: l.totalSeats ?? "",
        usedSeats: l.usedSeats ?? "",
        availableSeats: (l.totalSeats ?? 0) - (l.usedSeats ?? 0),
        purchaseDate: l.purchaseDate ? l.purchaseDate.toISOString().split("T")[0] : "",
        expiryDate: l.expiryDate ? l.expiryDate.toISOString().split("T")[0] : "",
        supportEndDate: l.supportEndDate ? l.supportEndDate.toISOString().split("T")[0] : "",
        cost: l.cost ?? "",
        status: l.status ?? "",
        platform: l.platform ?? "",
        category: l.category ?? "",
        notes: l.notes ?? "",
        createdAt: l.createdAt ? l.createdAt.toISOString() : "",
        updatedAt: l.updatedAt ? l.updatedAt.toISOString() : "",
    }));
};

export const LICENSE_FIELDS = [
    "licenseKey", "softwareName", "vendor", "version", "licenseType",
    "totalSeats", "usedSeats", "availableSeats",
    "purchaseDate", "expiryDate", "supportEndDate", "cost",
    "status", "platform", "category", "notes",
    "createdAt", "updatedAt",
];
