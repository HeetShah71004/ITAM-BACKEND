// router/asset.routes.js
import express from "express";
import {
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
} from "../controllers/asset.controller.js";
import { uploadAssetImage } from "../middleware/upload.middleware.js";

const router = express.Router();

// Image upload is handled directly inside create/update via multer middleware.
// Field name expected by multer: "image"
router.route("/").post(uploadAssetImage, createAsset).get(getAllAssets);
router.route("/:id").get(getAssetById).put(uploadAssetImage, updateAsset).delete(deleteAsset);

export default router;