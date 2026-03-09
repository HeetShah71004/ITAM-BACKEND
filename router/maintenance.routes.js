import express from "express";
import {
    createMaintenance,
    getAllMaintenance,
    getMaintenanceByAsset,
    updateMaintenance,
    deleteMaintenance,
    getServiceCostByAsset,
    getDowntimeByAsset
} from "../controllers/maintenance.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Maintenance routes
router.post("/", authorizeRoles("Admin", "Manager"), createMaintenance);
router.get("/", authorizeRoles("Admin", "Manager", "Auditor"), getAllMaintenance);
router.get("/asset/:assetId", authorizeRoles("Admin", "Manager", "Auditor", "Employee"), getMaintenanceByAsset);
router.put("/:id", authorizeRoles("Admin", "Manager"), updateMaintenance);
router.delete("/:id", authorizeRoles("Admin"), deleteMaintenance);

// Aggregation routes
router.get("/cost/:assetId", authorizeRoles("Admin", "Manager", "Auditor"), getServiceCostByAsset);
router.get("/downtime/:assetId", authorizeRoles("Admin", "Manager", "Auditor"), getDowntimeByAsset);

export default router;
