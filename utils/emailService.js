// utils/emailService.js
import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// Lazy transporter – created on first send, NOT at module load time.
// In ES modules, imports run before dotenv.config() in server.js,
// so transporter must be created lazily to pick up env vars correctly.
// ---------------------------------------------------------------------------
let transporter = null;

function getTransporter() {
  if (!transporter) {
    const service = process.env.EMAIL_SERVICE;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.error("[Email] EMAIL_USER or EMAIL_PASS is not set in .env");
    }

    transporter = nodemailer.createTransport({
      service,          // e.g. "gmail" from EMAIL_SERVICE in .env
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    console.log(`[Email] Transporter initialised (service=${service}, user=${user})`);
  }
  return transporter;
}

// ---------------------------------------------------------------------------
// Core send function – fire-and-forget.
// Errors are logged but never re-thrown so email failure never crashes the API.
// Emails are ONLY triggered after a successful DB update (called by controllers
// after session.commitTransaction()).
// ---------------------------------------------------------------------------
export const sendEmail = async (to, subject, html) => {
  try {
    console.log(`[Email] Attempting to send "${subject}" → ${to}`);

    const info = await getTransporter().sendMail({
      from: `"ITAM System" <${process.env.EMAIL_USER}>`,
      to,       // employee.email fetched from DB – never hardcoded
      subject,
      html,
    });

    console.log(`[Email] ✅ Sent to ${to} | Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email] ❌ Failed to send to ${to}`);
    console.error(`        Code   : ${error.code || "unknown"}`);
    console.error(`        Message: ${error.message || "unknown"}`);
    // NOT re-throwing – email failure must not affect the API response
  }
};

// ---------------------------------------------------------------------------
// HTML Email Templates
// ---------------------------------------------------------------------------

/**
 * Assignment Confirmation Email
 * @param {{ employeeName: string, assetName: string, assetTag: string, assignedDate: Date }} data
 */
export const assignmentEmailTemplate = ({ employeeName, assetName, assetTag, assignedDate }) => {
  const formattedDate = new Date(assignedDate).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Asset Assigned Successfully</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Asset Assigned Successfully</h1>
              <p style="color:#bbdefb;margin:8px 0 0;font-size:13px;">IT Asset Management System</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:16px;color:#333;margin:0 0 16px;">Hello ,<strong>${employeeName}</strong></p>
              <p style="font-size:15px;color:#555;margin:0 0 28px;line-height:1.6;">
                The following asset has been assigned to you:
              </p>

              <!-- Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;">
                <tr style="background:#f0f4ff;">
                  <td style="padding:14px 20px;font-weight:600;color:#1a73e8;font-size:13px;text-transform:uppercase;width:40%;">Asset Name</td>
                  <td style="padding:14px 20px;color:#333;font-size:15px;">${assetName}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-weight:600;color:#1a73e8;font-size:13px;text-transform:uppercase;border-top:1px solid #e0e7ef;">Asset Tag</td>
                  <td style="padding:14px 20px;color:#333;font-size:15px;border-top:1px solid #e0e7ef;">
                    <code style="background:#f0f4ff;padding:2px 8px;border-radius:4px;">${assetTag}</code>
                  </td>
                </tr>
                <tr style="background:#f0f4ff;">
                  <td style="padding:14px 20px;font-weight:600;color:#1a73e8;font-size:13px;text-transform:uppercase;border-top:1px solid #e0e7ef;">Assigned Date</td>
                  <td style="padding:14px 20px;color:#333;font-size:15px;border-top:1px solid #e0e7ef;">${formattedDate}</td>
                </tr>
              </table>

              <p style="font-size:14px;color:#777;margin:28px 0 0;line-height:1.7;">
                If you did not expect this assignment or have any concerns, please contact your IT department immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fb;padding:20px 40px;text-align:center;border-top:1px solid #e8edf3;">
              <p style="font-size:12px;color:#aaa;margin:0;">
                &copy; ${new Date().getFullYear()} IT Asset Management System &middot; Automated Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

/**
 * Return Confirmation Email
 * @param {{ employeeName: string, assetName: string, assetTag: string, returnedDate: Date }} data
 */
/**
 * License Expiry Alert Email
 * Sent to admin when one or more licenses are expiring soon.
 * @param {{ items: Array<{softwareName, licenseKey, vendor, expiryDate, daysLeft}>, windowLabel: string }} data
 *   windowLabel: "7" → critical (red), "30" → warning (orange)
 */
export const licenseExpiryEmailTemplate = ({ items, windowLabel = "30" }) => {
  const isCriticalEmail = windowLabel === "7";
  const headerGradient = isCriticalEmail
    ? "linear-gradient(135deg,#b71c1c,#7f0000)"
    : "linear-gradient(135deg,#e65100,#bf360c)";
  const headerEmoji = isCriticalEmail ? "🚨" : "⚠️";
  const headerTitle = isCriticalEmail
    ? "CRITICAL: License(s) Expiring Within 7 Days"
    : "License Expiry Warning – Within 30 Days";
  const bodyText = isCriticalEmail
    ? "The following software license(s) are expiring <strong>within the next 7 days</strong>. Immediate renewal is required to avoid service disruption."
    : "The following software license(s) are expiring within the next <strong>8–30 days</strong>. Please schedule renewal to avoid service interruption.";
  const accentColor = isCriticalEmail ? "#b71c1c" : "#e65100";
  const borderColor = isCriticalEmail ? "#fde8e8" : "#fce3cc";
  const headerBg = isCriticalEmail ? "#fff5f5" : "#fff3e0";

  const rows = items
    .map(({ softwareName, licenseKey, vendor, expiryDate, daysLeft }) => {
      const badgeBg = daysLeft <= 7 ? "#b71c1c" : "#e65100";
      const badgeText = daysLeft <= 7 ? "CRITICAL" : "WARNING";
      const formattedExpiry = new Date(expiryDate).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric",
      });
      return `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid ${borderColor};font-size:14px;color:#333;">${softwareName}</td>
          <td style="padding:14px 16px;border-bottom:1px solid ${borderColor};font-size:13px;color:#555;font-family:monospace;">${licenseKey}</td>
          <td style="padding:14px 16px;border-bottom:1px solid ${borderColor};font-size:14px;color:#555;">${vendor || "—"}</td>
          <td style="padding:14px 16px;border-bottom:1px solid ${borderColor};font-size:14px;color:#333;">${formattedExpiry}</td>
          <td style="padding:14px 16px;border-bottom:1px solid ${borderColor};text-align:center;">
            <span style="background:${badgeBg};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;">${badgeText} – ${daysLeft}d</span>
          </td>
        </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>License Expiry Alert</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${headerGradient};padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">${headerEmoji} ${headerTitle}</h1>
              <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:13px;">IT Asset Management System – Automated Daily Check</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="font-size:15px;color:#555;margin:0 0 24px;line-height:1.6;">
                ${bodyText}
              </p>

              <!-- Table -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border:1px solid ${borderColor};border-radius:8px;overflow:hidden;">
                <tr style="background:${headerBg};">
                  <th style="padding:12px 16px;text-align:left;font-size:12px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">Software</th>
                  <th style="padding:12px 16px;text-align:left;font-size:12px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">License Key</th>
                  <th style="padding:12px 16px;text-align:left;font-size:12px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">Vendor</th>
                  <th style="padding:12px 16px;text-align:left;font-size:12px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">Expiry Date</th>
                  <th style="padding:12px 16px;text-align:center;font-size:12px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">Status</th>
                </tr>
                ${rows}
              </table>

              <p style="font-size:13px;color:#888;margin:24px 0 0;line-height:1.7;">
                This is an automated alert generated by the ITAM system. Please take action before the expiry date.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fb;padding:20px 40px;text-align:center;border-top:1px solid #e8edf3;">
              <p style="font-size:12px;color:#aaa;margin:0;">
                &copy; ${new Date().getFullYear()} IT Asset Management System &middot; Automated Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

/**
 * Warranty Expiry Alert Email
 * Sent to admin when one or more asset warranties are expiring soon.
 * @param {{ items: Array<{assetName, assetTag, brand, warrantyExpiry, daysLeft}>, windowLabel: string }} data
 *   windowLabel: "7" → critical (dark red), "30" → warning (red)
 */
export const warrantyExpiryEmailTemplate = ({ items, windowLabel = "30" }) => {
  const isCriticalEmail = windowLabel === "7";
  const headerGradient = isCriticalEmail
    ? "linear-gradient(135deg,#7f0000,#4a0000)"
    : "linear-gradient(135deg,#c62828,#7f0000)";
  const headerEmoji = isCriticalEmail ? "🚨" : "🛡️";
  const headerTitle = isCriticalEmail
    ? "CRITICAL: Asset Warranty Expiring Within 7 Days"
    : "Asset Warranty Expiry Warning – Within 30 Days";
  const bodyText = isCriticalEmail
    ? "The following asset warranty/warranties are expiring <strong>within the next 7 days</strong>. Immediate action is required to arrange renewal or additional coverage."
    : "The following asset warranty/warranties are expiring within the next <strong>8–30 days</strong>. Please arrange renewal or additional coverage before expiry.";
  const accentColor = isCriticalEmail ? "#7f0000" : "#c62828";

  const rows = items
    .map(({ assetName, assetTag, brand, warrantyExpiry, daysLeft }) => {
      const badgeBg = daysLeft <= 7 ? "#7f0000" : "#c62828";
      const badgeText = daysLeft <= 7 ? "CRITICAL" : "EXPIRING SOON";
      const formattedExpiry = new Date(warrantyExpiry).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric",
      });
      return `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #fde8e8;font-size:14px;color:#333;">${assetName}</td>
          <td style="padding:14px 16px;border-bottom:1px solid #fde8e8;font-size:13px;color:#555;font-family:monospace;">${assetTag}</td>
          <td style="padding:14px 16px;border-bottom:1px solid #fde8e8;font-size:14px;color:#555;">${brand || "—"}</td>
          <td style="padding:14px 16px;border-bottom:1px solid #fde8e8;font-size:14px;color:#333;">${formattedExpiry}</td>
          <td style="padding:14px 16px;border-bottom:1px solid #fde8e8;text-align:center;">
            <span style="background:${badgeBg};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;">${badgeText} – ${daysLeft}d</span>
          </td>
        </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Warranty Expiry Alert</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${headerGradient};padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">${headerEmoji} ${headerTitle}</h1>
              <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:13px;">IT Asset Management System – Automated Daily Check</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="font-size:15px;color:#555;margin:0 0 24px;line-height:1.6;">
                ${bodyText}
              </p>

              <!-- Table -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border:1px solid #fde8e8;border-radius:8px;overflow:hidden;">
                <tr style="background:#fff5f5;">
                  <th style="padding:12px 16px;text-align:left;font-size:12px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">Asset Name</th>
                  <th style="padding:12px 16px;text-align:left;font-size:12px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">Asset Tag</th>
                  <th style="padding:12px 16px;text-align:left;font-size:12px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">Brand</th>
                  <th style="padding:12px 16px;text-align:left;font-size:12px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">Warranty Expiry</th>
                  <th style="padding:12px 16px;text-align:center;font-size:12px;color:${accentColor};text-transform:uppercase;letter-spacing:.5px;">Status</th>
                </tr>
                ${rows}
              </table>

              <p style="font-size:13px;color:#888;margin:24px 0 0;line-height:1.7;">
                This is an automated alert generated by the ITAM system. Assets out of warranty may incur higher repair costs.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fb;padding:20px 40px;text-align:center;border-top:1px solid #e8edf3;">
              <p style="font-size:12px;color:#aaa;margin:0;">
                &copy; ${new Date().getFullYear()} IT Asset Management System &middot; Automated Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

export const returnEmailTemplate = ({ employeeName, assetName, assetTag, returnedDate }) => {
  const formattedDate = new Date(returnedDate).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Asset Returned Successfully</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2e7d32,#1b5e20);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Asset Returned Successfully</h1>
              <p style="color:#c8e6c9;margin:8px 0 0;font-size:13px;">IT Asset Management System</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:16px;color:#333;margin:0 0 16px;">Hello ,<strong>${employeeName}</strong></p>
              <p style="font-size:15px;color:#555;margin:0 0 28px;line-height:1.6;">
                The following asset has been marked as returned:
              </p>

              <!-- Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;">
                <tr style="background:#f0fff4;">
                  <td style="padding:14px 20px;font-weight:600;color:#2e7d32;font-size:13px;text-transform:uppercase;width:40%;">Asset Name</td>
                  <td style="padding:14px 20px;color:#333;font-size:15px;">${assetName}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-weight:600;color:#2e7d32;font-size:13px;text-transform:uppercase;border-top:1px solid #e0e7ef;">Asset Tag</td>
                  <td style="padding:14px 20px;color:#333;font-size:15px;border-top:1px solid #e0e7ef;">
                    <code style="background:#f0fff4;padding:2px 8px;border-radius:4px;">${assetTag}</code>
                  </td>
                </tr>
                <tr style="background:#f0fff4;">
                  <td style="padding:14px 20px;font-weight:600;color:#2e7d32;font-size:13px;text-transform:uppercase;border-top:1px solid #e0e7ef;">Return Date</td>
                  <td style="padding:14px 20px;color:#333;font-size:15px;border-top:1px solid #e0e7ef;">${formattedDate}</td>
                </tr>
              </table>

              <p style="font-size:14px;color:#777;margin:28px 0 0;line-height:1.7;">
                If you believe this is a mistake or the asset was not returned by you, please contact the IT department immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fb;padding:20px 40px;text-align:center;border-top:1px solid #e8edf3;">
              <p style="font-size:12px;color:#aaa;margin:0;">
                &copy; ${new Date().getFullYear()} IT Asset Management System &middot; Automated Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
