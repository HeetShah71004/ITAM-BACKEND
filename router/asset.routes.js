// router/asset.routes.js
import express from "express";
import {
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
} from "../controllers/asset.controller.js";

const router = express.Router();

router.route("/").post(createAsset).get(getAllAssets);
router.route("/:id").get(getAssetById).put(updateAsset).delete(deleteAsset);

export default router;