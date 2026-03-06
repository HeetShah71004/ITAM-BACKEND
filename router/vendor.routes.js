import express from "express";
import { body, validationResult } from "express-validator";
import {
    createVendor,
    getVendors,
    getVendorById,
    updateVendor,
    deleteVendor
} from "../controllers/vendor.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Validation middleware
const validateVendor = [
    body("vendorName")
        .if((value, { req }) => req.method === "POST" || req.body.vendorName !== undefined)
        .notEmpty().withMessage("Vendor name is required").trim(),
    body("email").optional({ checkFalsy: true }).isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("phone").optional({ checkFalsy: true }).isNumeric().withMessage("Phone should be numeric"),
    body("rating").optional().isFloat({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

// Routes
router.use(verifyToken);

router.route("/")
    .get(getVendors)
    .post(authorizeRoles("Admin", "Manager"), validateVendor, createVendor);

router.route("/:id")
    .get(getVendorById)
    .put(authorizeRoles("Admin", "Manager"), validateVendor, updateVendor)
    .delete(authorizeRoles("Admin"), deleteVendor);

export default router;
