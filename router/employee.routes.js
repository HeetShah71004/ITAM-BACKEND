// router/employee.routes.js
import express from "express";
import {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    uploadEmployeeImageHandler,
} from "../controllers/employee.controller.js";
import { uploadEmployeeImage } from "../middleware/upload.middleware.js";

const router = express.Router();

router.route("/").post(uploadEmployeeImage, createEmployee).get(getAllEmployees);
router.route("/:id").get(getEmployeeById).put(uploadEmployeeImage, updateEmployee).delete(deleteEmployee);

// Image upload — multer runs first, then the controller
router.post("/:id/image", uploadEmployeeImage, uploadEmployeeImageHandler);

export default router;
