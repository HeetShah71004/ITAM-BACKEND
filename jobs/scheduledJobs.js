// jobs/scheduledJobs.js
import cron from "node-cron";
import SoftwareLicense from "../models/SoftwareLicense.js";
import Asset from "../models/Asset.js";
import {
    sendEmail,
    licenseExpiryEmailTemplate,
    warrantyExpiryEmailTemplate,
} from "../utils/emailService.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helper – build & send an expiry alert email for a given window
// ─────────────────────────────────────────────────────────────────────────────
const sendLicenseAlert = async (items, windowLabel, adminEmail) => {
    if (items.length === 0) return;
    const subject =
        windowLabel === "7"
            ? `🚨 CRITICAL: ${items.length} License(s) Expiring Within 7 Days`
            : `⚠️ License Expiry Warning: ${items.length} License(s) Expiring Within 30 Days`;
    const html = licenseExpiryEmailTemplate({ items, windowLabel });
    await sendEmail(adminEmail, subject, html);
    console.log(`[Scheduler] ✅ License ${windowLabel}-day alert sent → ${adminEmail} (${items.length} license(s))`);
};

const sendWarrantyAlert = async (items, windowLabel, adminEmail) => {
    if (items.length === 0) return;
    const subject =
        windowLabel === "7"
            ? `🚨 CRITICAL: ${items.length} Asset Warranty/Warranties Expiring Within 7 Days`
            : `⚠️ Warranty Expiry Warning: ${items.length} Asset(s) Warranty Expiring Within 30 Days`;
    const html = warrantyExpiryEmailTemplate({ items, windowLabel });
    await sendEmail(adminEmail, subject, html);
    console.log(`[Scheduler] ✅ Warranty ${windowLabel}-day alert sent → ${adminEmail} (${items.length} asset(s))`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper – resolve the admin recipient address
// ─────────────────────────────────────────────────────────────────────────────
const getAdminEmail = () =>
    process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

// ─────────────────────────────────────────────────────────────────────────────
// Job 1 – Check expiring software licenses (within 30 days)
// ─────────────────────────────────────────────────────────────────────────────
export const checkExpiringLicenses = async () => {
    console.log("[Scheduler] 🔍 Running license expiry check…");

    try {
        const now = new Date();
        const in7Days = new Date(now); in7Days.setDate(in7Days.getDate() + 7);
        const in30Days = new Date(now); in30Days.setDate(in30Days.getDate() + 30);

        // Fetch Active licenses whose expiryDate falls within the next 30 days
        const licenses = await SoftwareLicense.find({
            status: "Active",
            expiryDate: { $gt: now, $lte: in30Days },
        })
            .select("softwareName licenseKey vendor expiryDate")
            .lean();

        if (licenses.length === 0) {
            console.log("[Scheduler] ✅ No licenses expiring in the next 30 days.");
            return;
        }

        // Build items array with daysLeft for each license
        const allItems = licenses.map((lic) => {
            const msLeft = new Date(lic.expiryDate) - now;
            const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
            return {
                softwareName: lic.softwareName,
                licenseKey: lic.licenseKey,
                vendor: lic.vendor,
                expiryDate: lic.expiryDate,
                daysLeft,
            };
        });

        // Split into two buckets
        const critical = allItems.filter((i) => i.daysLeft <= 7).sort((a, b) => a.daysLeft - b.daysLeft);
        const warning = allItems.filter((i) => i.daysLeft > 7).sort((a, b) => a.daysLeft - b.daysLeft);

        const adminEmail = getAdminEmail();

        // Email 1 – 7-day critical alert
        await sendLicenseAlert(critical, "7", adminEmail);

        // Email 2 – 30-day warning alert (only items NOT already in the 7-day bucket)
        await sendLicenseAlert(warning, "30", adminEmail);

        if (critical.length === 0 && warning.length === 0) {
            console.log("[Scheduler] ✅ No license alerts to send.");
        }
    } catch (err) {
        console.error("[Scheduler] ❌ License expiry check failed:", err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Job 2 – Check expiring asset warranties (within 30 days)
// ─────────────────────────────────────────────────────────────────────────────
export const checkExpiringWarranties = async () => {
    console.log("[Scheduler] 🔍 Running warranty expiry check…");

    try {
        const now = new Date();
        const in7Days = new Date(now); in7Days.setDate(in7Days.getDate() + 7);
        const in30Days = new Date(now); in30Days.setDate(in30Days.getDate() + 30);

        // Fetch assets whose warrantyExpiry falls within the next 30 days
        const assets = await Asset.find({
            warrantyExpiry: { $gt: now, $lte: in30Days },
        })
            .select("name assetTag brand warrantyExpiry")
            .lean();

        if (assets.length === 0) {
            console.log("[Scheduler] ✅ No asset warranties expiring in the next 30 days.");
            return;
        }

        // Build items array with daysLeft for each asset
        const allItems = assets.map((asset) => {
            const msLeft = new Date(asset.warrantyExpiry) - now;
            const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
            return {
                assetName: asset.name,
                assetTag: asset.assetTag,
                brand: asset.brand,
                warrantyExpiry: asset.warrantyExpiry,
                daysLeft,
            };
        });

        // Split into two buckets
        const critical = allItems.filter((i) => i.daysLeft <= 7).sort((a, b) => a.daysLeft - b.daysLeft);
        const warning = allItems.filter((i) => i.daysLeft > 7).sort((a, b) => a.daysLeft - b.daysLeft);

        const adminEmail = getAdminEmail();

        // Email 1 – 7-day critical alert
        await sendWarrantyAlert(critical, "7", adminEmail);

        // Email 2 – 30-day warning alert (only items NOT already in the 7-day bucket)
        await sendWarrantyAlert(warning, "30", adminEmail);

        if (critical.length === 0 && warning.length === 0) {
            console.log("[Scheduler] ✅ No warranty alerts to send.");
        }
    } catch (err) {
        console.error("[Scheduler] ❌ Warranty expiry check failed:", err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Register all cron jobs – call this once after DB connects
// Schedule: every day at 05:00 PM (server local time)
// ─────────────────────────────────────────────────────────────────────────────
export const initScheduledJobs = () => {
    // Daily at 05:00 PM – license expiry check
    cron.schedule("0 17 * * *", checkExpiringLicenses, {
        scheduled: true,
        timezone: "Asia/Kolkata", // Change to your server's timezone if needed
    });
    console.log("[Scheduler] ✅ License expiry job registered (daily 17:00)");

    // Daily at 05:00 PM – warranty expiry check
    cron.schedule("0 17 * * *", checkExpiringWarranties, {
        scheduled: true,
        timezone: "Asia/Kolkata", // Change to your server's timezone if needed
    });
    console.log("[Scheduler] ✅ Warranty expiry job registered (daily 17:00)");
};
