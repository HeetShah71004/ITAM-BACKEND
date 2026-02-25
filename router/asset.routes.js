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

const router = express.Router();

router.route("/").post(uploadAssetImage, createAsset).get(getAllAssets);
router.route("/:id").get(getAssetById).put(uploadAssetImage, updateAsset).delete(deleteAsset);
router.route("/:id/image").post(uploadAssetImage, uploadAssetImageHandler);



export default router;