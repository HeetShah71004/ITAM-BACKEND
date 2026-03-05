// router/assignment.routes.js
import express from "express";
import {
    assignAsset,
    returnAsset,
    getAllAssignments,
    getAssetAssignmentHistory,
    getEmployeeAssignmentHistory,
} from "../controllers/assignment.controller.js";

import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Assignment operations
router.post("/assign", verifyToken, authorizeRoles("Admin", "Manager"), assignAsset);
router.post("/return", verifyToken, authorizeRoles("Admin", "Manager"), returnAsset);

// Query assignment history
router.get("/", verifyToken, authorizeRoles("Admin", "Manager", "Auditor"), getAllAssignments);
router.get("/asset/:assetId", verifyToken, authorizeRoles("Admin", "Manager", "Auditor"), getAssetAssignmentHistory);
router.get("/employee/:employeeId", verifyToken, authorizeRoles("Admin", "Manager", "Auditor"), getEmployeeAssignmentHistory);

export default router;
