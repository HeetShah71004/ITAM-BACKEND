// middleware/upload.middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Build a multer instance that:
 *   - In PRODUCTION  → streams directly to Cloudinary (folder: "itam/<subfolder>")
 *   - In DEVELOPMENT → saves to disk under uploads/<subfolder>/
 *
 * Also exports a `deleteImage(identifier)` helper for cleanup.
 *
 * @param {string} subfolder  - e.g. "assets" or "employees"
 * @param {string} fieldName  - the form-data key expected in the request
 */
const createUploader = (subfolder, fieldName) => {
    let storage;

    if (IS_PROD) {
        // ── Cloudinary storage ────────────────────────────────────────────────
        storage = new CloudinaryStorage({
            cloudinary,
            params: {
                folder: `itam/${subfolder}`,
                allowed_formats: ["jpg", "jpeg", "png", "webp"],
                transformation: [{ quality: "auto", fetch_format: "auto" }],
            },
        });
    } else {
        // ── Local disk storage ────────────────────────────────────────────────
        const uploadDir = path.resolve("uploads", subfolder);
        fs.mkdirSync(uploadDir, { recursive: true });

        storage = multer.diskStorage({
            destination: (_req, _file, cb) => cb(null, uploadDir),
            filename: (_req, file, cb) => {
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                const ext = path.extname(file.originalname).toLowerCase();
                cb(null, `${subfolder}-${uniqueSuffix}${ext}`);
            },
        });
    }

    const fileFilter = (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                Object.assign(new Error("Only JPEG, PNG, and WebP images are allowed"), {
                    statusCode: 400,
                }),
                false
            );
        }
    };

    // Accept both "<fieldName>" and "<fieldName>File" to handle mismatched frontend field names
    const multerInstance = multer({
        storage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }).fields([
        { name: fieldName, maxCount: 1 },
        { name: `${fieldName}File`, maxCount: 1 },
    ]);

    /**
     * Conditional wrapper:
     * - multipart/form-data → run Multer (file upload)
     * - Otherwise          → skip Multer (JSON URL mode, req.body untouched)
     *
     * After Multer runs, req.files is normalised back to req.file so that
     * all downstream controllers can keep using req.file unchanged.
     */
    const middleware = (req, res, next) => {
        const contentType = req.headers["content-type"] || "";
        if (contentType.includes("multipart/form-data")) {
            multerInstance(req, res, (err) => {
                if (err) return next(err);
                // Normalize: pick the uploaded file from either accepted field name
                if (req.files) {
                    const file = (req.files[fieldName] || req.files[`${fieldName}File`] || [])[0];
                    if (file) req.file = file;
                }
                next();
            });
        } else {
            next();
        }
    };

    /**
     * Delete an image by its stored identifier.
     *
     * @param {string} identifier
     *   - PRODUCTION  : Cloudinary public_id  (e.g. "itam/assets/assets-1234567890")
     *   - DEVELOPMENT : local file path       (e.g. "uploads/assets/assets-1234567890.jpg")
     */
    const deleteImage = async (identifier) => {
        if (!identifier) return;
        try {
            if (IS_PROD) {
                let publicId = identifier;
                // If a full Cloudinary URL was stored, extract the public_id from it.
                // Use a greedy match so dots inside the public_id are captured correctly.
                // URL format: https://res.cloudinary.com/{cloud}/{type}/upload/{version}/public_id.ext
                if (identifier.startsWith("https://res.cloudinary.com/")) {
                    const match = identifier.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
                    if (match) publicId = match[1];
                }
                await cloudinary.uploader.destroy(publicId);
            } else {
                const localPath = path.resolve(identifier);
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
            }
        } catch (err) {
            // Log but don't throw — image cleanup should never crash the request
            console.warn(`[upload] Failed to delete image "${identifier}":`, err.message);
        }
    };

    return { middleware, deleteImage };
};

// ── Asset uploader ────────────────────────────────────────────────────────────
const assetUploader = createUploader("assets", "image");
/** Multer middleware for asset images (form-data field: "image") */
export const uploadAssetImage = assetUploader.middleware;
/** Delete an asset image by its stored path / public_id */
export const deleteAssetImage = assetUploader.deleteImage;

// ── Employee uploader ─────────────────────────────────────────────────────────
const employeeUploader = createUploader("employees", "profileImage");
/** Multer middleware for employee profile images (form-data field: "profileImage") */
export const uploadEmployeeImage = employeeUploader.middleware;
/** Delete an employee profile image by its stored path / public_id */
export const deleteEmployeeImage = employeeUploader.deleteImage;

// ── Upload-from-URL helper ────────────────────────────────────────────────────
/**
 * Fetch a remote image URL and:
 *   - PRODUCTION  → upload to Cloudinary, return the secure Cloudinary URL
 *   - DEVELOPMENT → download to disk under uploads/<subfolder>/, return local path
 *
 * @param {string} remoteUrl   - Public HTTP/HTTPS image URL
 * @param {string} subfolder   - e.g. "assets" or "employees"
 * @returns {Promise<string>}  - The stored image URL / path
 */
export const uploadImageFromUrl = async (remoteUrl, subfolder = "assets") => {
    if (IS_PROD) {
        // Cloudinary can fetch & upload a public URL directly
        const result = await cloudinary.uploader.upload(remoteUrl, {
            folder: `itam/${subfolder}`,
            transformation: [{ quality: "auto", fetch_format: "auto" }],
        });
        return result.secure_url;
    }

    // ── Development: download the file and save it locally ────────────────────
    const uploadDir = path.resolve("uploads", subfolder);
    fs.mkdirSync(uploadDir, { recursive: true });

    // Derive a simple extension from the URL
    const urlPath = new URL(remoteUrl).pathname;
    const ext = path.extname(urlPath).split("?")[0] || ".jpg";
    const filename = `${subfolder}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const localPath = path.join(uploadDir, filename);

    await new Promise((resolve, reject) => {
        const protocol = remoteUrl.startsWith("https") ? https : http;
        const file = fs.createWriteStream(localPath);
        protocol.get(remoteUrl, (res) => {
            res.pipe(file);
            file.on("finish", () => file.close(resolve));
        }).on("error", (err) => {
            fs.unlink(localPath, () => { });
            reject(err);
        });
    });

    // Return relative path (forward slashes) so it's consistent with req.file.path
    return localPath.replace(/\\/g, "/");
};
