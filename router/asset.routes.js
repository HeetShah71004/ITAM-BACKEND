// router/asset.routes.js
import express from "express";
import {
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
    uploadAssetImageHandler,
    getMyAssets,
} from "../controllers/asset.controller.js";
import { uploadAssetImage } from "../middleware/upload.middleware.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/my-assets", verifyToken, getMyAssets);

router.route("/")
    .post(verifyToken, authorizeRoles("Admin", "Manager"), uploadAssetImage, createAsset)
    .get(verifyToken, authorizeRoles("Admin", "Manager", "Auditor"), getAllAssets);

router.route("/:id")
    .get(verifyToken, authorizeRoles("Admin", "Manager", "Auditor"), getAssetById)
    .put(verifyToken, authorizeRoles("Admin", "Manager"), uploadAssetImage, updateAsset)
    .delete(verifyToken, authorizeRoles("Admin"), deleteAsset);

router.route("/:id/image")
    .post(verifyToken, authorizeRoles("Admin", "Manager"), uploadAssetImage, uploadAssetImageHandler);




export default router;