import express from "express";
import cors from "cors";
import assetRoutes from "../router/asset.routes.js";
import employeeRoutes from "../router/employee.routes.js";
import assignmentRoutes from "../router/assignment.routes.js";
import dashboardRoutes from "../router/dashboard.routes.js";
import licenseRoutes from "../router/license.routes.js";
import exportRoutes from "../router/export.routes.js";
import activityLogRoutes from "../router/activityLog.routes.js";
import authRoutes from "../router/auth.routes.js";
import userRoutes from "../router/user.routes.js";
import vendorRoutes from "../router/vendor.routes.js";
import maintenanceRoutes from "../router/maintenance.routes.js";
import depreciationRoutes from "../router/depreciation.routes.js";

const app = express();

// Middleware
app.use(cors({
    origin: true, // reflect origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);

// Public Asset View (for QR scans)
import { getAssetPublicView } from "../controllers/asset.controller.js";
app.get("/assets/:id", getAssetPublicView);

app.use("/api/employees", employeeRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/licenses", licenseRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/depreciation", depreciationRoutes);

// Helper for root path
app.get("/", (req, res) => {
    res.send("ITAM Backend API is running...");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle Mongoose Validation Error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(", ");
    }

    // Handle Mongoose Duplicate Key Error (e.g. unique field violated)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate field value entered for: ${field}`;
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
});

export default app;
