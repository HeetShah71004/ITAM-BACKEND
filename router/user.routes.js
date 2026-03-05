import express from "express";
import { createUser, updateUserRole } from "../controllers/user.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// All user management routes are Admin only
router.use(verifyToken);
router.use(authorizeRoles("Admin"));

router.post("/", createUser);
router.put("/:id/role", updateUserRole);

export default router;
