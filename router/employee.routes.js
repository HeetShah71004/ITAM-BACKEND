// router/employee.routes.js
import express from "express";
import {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
} from "../controllers/employee.controller.js";

const router = express.Router();

router.route("/").post(createEmployee).get(getAllEmployees);
router.route("/:id").get(getEmployeeById).put(updateEmployee).delete(deleteEmployee);

export default router;
