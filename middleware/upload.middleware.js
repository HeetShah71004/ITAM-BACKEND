// middleware/upload.middleware.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";



/**
 * Extract a Cloudinary public_id from a full secure URL.
 * e.g. "https://res.cloudinary.com/demo/image/upload/v123456/itam/assets/abc.jpg"
 *   →  "itam/assets/abc"
 * If identifier is already a public_id (no "http"), it is returned as-is.
 */
const extractPublicId = (url) => {
    try {
        // Handle full URLs
        if (url.startsWith("http")) {
            // Updated regex to better capture public_id from various Cloudinary URL formats
            // Matches anything after /upload/ (skipping version like v12345/) and before the extension
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
            return match ? match[1] : null;
        }
        // If it's already a public_id (no protocol), return as is
        return url;
    } catch (err) {
        return null;
    }
};

/**
 * Build a multer instance that streams directly to Cloudinary (folder: "itam/<subfolder>").
 *
 * Also exports a `deleteImage(identifier)` helper for cleanup.
 *
 * @param {string} subfolder  - e.g. "assets" or "employees"
 * @param {string} fieldName  - the form-data key expected in the request
 */
const createUploader = (subfolder, fieldName) => {
    // ── Cloudinary storage ────────────────────────────────────────────────
    const storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: `itam/${subfolder}`,
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
    });

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
     * Delete an image from Cloudinary by its stored identifier.
     *
     * @param {string} identifier - Cloudinary public_id or secure URL
     */
    const deleteImage = async (identifier) => {
        if (!identifier) return;
        try {
            // identifier may be a full Cloudinary URL or already a public_id
            const publicId = extractPublicId(identifier);

            if (publicId) {
                console.log(`[upload] Attempting to delete Cloudinary image: ${publicId}`);
                const result = await cloudinary.uploader.destroy(publicId);
                console.log(`[upload] Cloudinary deletion result:`, result.result);
            }
        } catch (err) {
            // Log but don't throw — image cleanup should never crash the request
            console.warn(`[upload] Failed to delete Cloudinary image "${identifier}":`, err.message);
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
 * Fetch a remote image URL and upload to Cloudinary.
 *
 * @param {string} remoteUrl   - Public HTTP/HTTPS image URL
 * @param {string} subfolder   - e.g. "assets" or "employees"
 * @returns {Promise<string>}  - The stored image URL
 */
export const uploadImageFromUrl = async (remoteUrl, subfolder = "assets") => {
    // Cloudinary can fetch & upload a public URL directly
    const result = await cloudinary.uploader.upload(remoteUrl, {
        folder: `itam/${subfolder}`,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    return result.secure_url;
};
