import QRCode from "qrcode";

/**
 * Generates a QR code as a Base64 encoded string.
 * @param {string} text - The text to encode in the QR code (e.g., asset URL).
 * @returns {Promise<string>} - A promise that resolves to the Base64 QR code string.
 */
export const generateQRCode = async (text) => {
    try {
        if (!text) {
            throw new Error("Text is required to generate a QR code");
        }
        const qrCodeBase64 = await QRCode.toDataURL(text);
        return qrCodeBase64;
    } catch (error) {
        console.error("Error generating QR code:", error);
        throw new Error("Failed to generate QR code");
    }
};
