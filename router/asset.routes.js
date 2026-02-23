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

router.route("/").post(createAsset).get(getAllAssets);
router.route("/:id").get(getAssetById).put(updateAsset).delete(deleteAsset);

// Image upload — multer runs first, then the controller
router.post("/:id/image", uploadAssetImage, uploadAssetImageHandler);

export default router;