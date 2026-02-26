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
 * Extract a Cloudinary public_id from a full secure URL.
 * e.g. "https://res.cloudinary.com/demo/image/upload/v123456/itam/assets/abc.jpg"
 *   →  "itam/assets/abc"
 * If identifier is already a public_id (no "http"), it is returned as-is.
 */
const extractPublicId = (url) => {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
    return match ? match[1] : null;
};

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

    const multerInstance = multer({
        storage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }).single(fieldName);

    /**
     * Conditional wrapper:
     * - multipart/form-data → run Multer (file upload)
     * - Otherwise          → skip Multer (JSON URL mode, req.body untouched)
     */
    const middleware = (req, res, next) => {
        const contentType = req.headers["content-type"] || "";
        if (contentType.includes("multipart/form-data")) {
            multerInstance(req, res, next);
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
                // identifier may be a full Cloudinary URL or already a public_id
                const publicId = identifier.startsWith("http")
                    ? extractPublicId(identifier)
                    : identifier;
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`[upload] Deleted Cloudinary image: ${publicId}`);
                }
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

// ── Upload-file-to-Cloudinary helper ─────────────────────────────────────────
/**
 * Upload a local file (req.file.path) to Cloudinary and return the
 * ORIGINAL filename the user uploaded (e.g. "laptop.jpg"), NOT the
 * Cloudinary-generated name.
 *
 * @param {string} filePath     - Absolute/relative path to the local temp file
 * @param {string} subfolder    - e.g. "assets" or "employees"
 * @param {string} originalName - req.file.originalname (the user's actual filename)
 * @returns {Promise<string>}   - e.g. "laptop.jpg"
 */
export const uploadFileToCloudinary = async (filePath, subfolder = "assets", originalName) => {
    await cloudinary.uploader.upload(filePath, {
        folder: `itam/${subfolder}`,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    // Clean up the local temp file after a successful upload
    try { fs.unlinkSync(filePath); } catch (_) { }
    // Return the original filename the user uploaded
    return originalName || path.basename(filePath);
};

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
