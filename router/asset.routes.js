// router/asset.routes.js
import express from "express";
import {
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
    uploadAssetImageHandler,
} from "../controllers/asset.controller.js";
import { uploadAssetImage } from "../middleware/upload.middleware.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .post(protect, authorize("admin", "manager"), uploadAssetImage, createAsset)
    .get(protect, getAllAssets);

router.route("/:id")
    .get(protect, getAssetById)
    .put(protect, authorize("admin", "manager"), uploadAssetImage, updateAsset)
    .delete(protect, authorize("admin"), deleteAsset);

router.route("/:id/image")
    .post(protect, authorize("admin", "manager"), uploadAssetImage, uploadAssetImageHandler);




export default router;