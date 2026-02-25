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

router.route("/").post(uploadAssetImage, createAsset).get(getAllAssets);
router.route("/:id").get(getAssetById).put(uploadAssetImage, updateAsset).delete(deleteAsset);

export default router;