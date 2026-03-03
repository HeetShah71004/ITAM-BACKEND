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
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Static routes (must come before /:id) ────────────────────────────────────
router.get("/compliance", getLicenseCompliance);
router.get("/expiring", getExpiringLicenses);
router.post("/assign", assignLicense);
router.post("/revoke", revokeLicense);

// ── CRUD routes ───────────────────────────────────────────────────────────────
router.route("/").post(createLicense).get(getAllLicenses);
router.route("/:id").get(getLicenseById).put(updateLicense).delete(deleteLicense);

export default router;
