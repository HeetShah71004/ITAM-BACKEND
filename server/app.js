// server/app.js
import express from "express";
import cors from "cors";
import path from "path";
import assetRoutes from "../router/asset.routes.js";
import employeeRoutes from "../router/employee.routes.js";
import assignmentRoutes from "../router/assignment.routes.js";
import dashboardRoutes from "../router/dashboard.routes.js";
import licenseRoutes from "../router/license.routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.resolve("uploads")));


// Routes
app.use("/api/assets", assetRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/licenses", licenseRoutes);

// Helper for root path
app.get("/", (req, res) => {
    res.send("ITAM Backend API is running...");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
});

export default app;
