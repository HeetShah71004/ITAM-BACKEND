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
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .post(verifyToken, authorizeRoles("Admin", "Manager"), uploadEmployeeImage, createEmployee)
    .get(getAllEmployees);

router.route("/:id")
    .get(getEmployeeById)
    .put(verifyToken, authorizeRoles("Admin", "Manager"), uploadEmployeeImage, updateEmployee)
    .delete(verifyToken, authorizeRoles("Admin"), deleteEmployee);

router.route("/:id/image")
    .post(verifyToken, authorizeRoles("Admin", "Manager"), uploadEmployeeImage, uploadEmployeeImageHandler);



export default router;