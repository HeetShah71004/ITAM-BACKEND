// router/license.routes.js
import express from "express";
import {
    createLicense,
    getAllLicenses,
    getLicenseById,
    updateLicense,
    deleteLicense,
    assignLicense,
    revokeLicense,
    getExpiringLicenses,
    getLicenseCompliance,
} from "../controllers/license.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Static routes (must come before /:id) ────────────────────────────────────
router.get("/compliance", verifyToken, authorizeRoles("Admin", "Manager", "Auditor"), getLicenseCompliance);
router.get("/expiring", verifyToken, authorizeRoles("Admin", "Manager", "Auditor"), getExpiringLicenses);
router.post("/assign", verifyToken, authorizeRoles("Admin", "Manager"), assignLicense);
router.post("/revoke", verifyToken, authorizeRoles("Admin", "Manager"), revokeLicense);

// ── CRUD routes ───────────────────────────────────────────────────────────────
router.route("/")
    .post(verifyToken, authorizeRoles("Admin", "Manager"), createLicense)
    .get(verifyToken, authorizeRoles("Admin", "Manager", "Auditor", "Employee"), getAllLicenses);

router.route("/:id")
    .get(verifyToken, authorizeRoles("Admin", "Manager", "Auditor", "Employee"), getLicenseById)
    .put(verifyToken, authorizeRoles("Admin", "Manager"), updateLicense)
    .delete(verifyToken, authorizeRoles("Admin"), deleteLicense);

export default router;
