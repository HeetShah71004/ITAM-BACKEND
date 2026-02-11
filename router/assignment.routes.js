// router/assignment.routes.js
import express from "express";
import {
    assignAsset,
    returnAsset,
    getAllAssignments,
    getAssetAssignmentHistory,
    getEmployeeAssignmentHistory,
} from "../controllers/assignment.controller.js";

const router = express.Router();

// Assignment operations
router.post("/assign", assignAsset);
router.post("/return", returnAsset);

// Query assignment history
router.get("/", getAllAssignments);
router.get("/asset/:assetId", getAssetAssignmentHistory);
router.get("/employee/:employeeId", getEmployeeAssignmentHistory);

export default router;
