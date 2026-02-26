// router/employee.routes.js
import express from "express";
import {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
} from "../controllers/employee.controller.js";
import { uploadEmployeeImage } from "../middleware/upload.middleware.js";

const router = express.Router();

// Image upload is handled directly inside create/update via multer middleware.
// Field name expected by multer: "profileImage"
router.route("/").post(uploadEmployeeImage, createEmployee).get(getAllEmployees);
router.route("/:id").get(getEmployeeById).put(uploadEmployeeImage, updateEmployee).delete(deleteEmployee);

export default router;