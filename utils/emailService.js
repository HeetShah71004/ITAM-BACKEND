// utils/emailService.js
import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// Lazy transporter – created on first send, NOT at module load time.
// This solves the ESM import-hoisting problem: in ES modules all imports run
// before any code in the importing file, so module-level transporter creation
// happens BEFORE dotenv.config() in server.js, leaving env vars undefined.
// ---------------------------------------------------------------------------
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,          // STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

// ---------------------------------------------------------------------------
// Core send function
// Fire-and-forget: errors are logged but never re-thrown
// ---------------------------------------------------------------------------
export const sendEmail = async (to, subject, html) => {
  try {
    const info = await getTransporter().sendMail({
      from: `"ITAM System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to} | Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`);
    console.error(`        Code   : ${error.code || "unknown"}`);
    console.error(`        Message: ${error.message}`);
    // Intentionally NOT re-throwing – email failure must not crash the API
  }
};

// ---------------------------------------------------------------------------
// HTML Templates
// ---------------------------------------------------------------------------

/**
 * Assignment Confirmation Email Template
 * @param {{ employeeName: string, assetName: string, assetTag: string, assignedDate: Date }} data
 */
export const assignmentEmailTemplate = ({ employeeName, assetName, assetTag, assignedDate }) => {
  const formattedDate = new Date(assignedDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Asset Assignment Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                Asset Assigned to You
              </h1>
              <p style="color:#bbdefb;margin:8px 0 0;font-size:13px;">IT Asset Management System</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:16px;color:#333;margin:0 0 8px;">Hi <strong>${employeeName}</strong>,</p>
              <p style="font-size:15px;color:#555;margin:0 0 28px;line-height:1.6;">
                An IT asset has been officially assigned to you. Please find the details below and ensure the asset is kept safe and in good condition.
              </p>

              <!-- Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;">
                <tr style="background:#f0f4ff;">
                  <td style="padding:14px 20px;font-weight:600;color:#1a73e8;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;width:40%;">Asset Name</td>
                  <td style="padding:14px 20px;color:#333;font-size:15px;">${assetName}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-weight:600;color:#1a73e8;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e0e7ef;">Asset Tag</td>
                  <td style="padding:14px 20px;color:#333;font-size:15px;border-top:1px solid #e0e7ef;"><code style="background:#f0f4ff;padding:2px 8px;border-radius:4px;">${assetTag}</code></td>
                </tr>
                <tr style="background:#f0f4ff;">
                  <td style="padding:14px 20px;font-weight:600;color:#1a73e8;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e0e7ef;">Assignment Date</td>
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
 * Return Confirmation Email Template
 * @param {{ employeeName: string, assetName: string, assetTag: string, returnedDate: Date }} data
 */
export const returnEmailTemplate = ({ employeeName, assetName, assetTag, returnedDate }) => {
  const formattedDate = new Date(returnedDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Asset Return Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2e7d32,#1b5e20);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                Asset Return Confirmed
              </h1>
              <p style="color:#c8e6c9;margin:8px 0 0;font-size:13px;">IT Asset Management System</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:16px;color:#333;margin:0 0 8px;">Hi <strong>${employeeName}</strong>,</p>
              <p style="font-size:15px;color:#555;margin:0 0 28px;line-height:1.6;">
                We have successfully recorded the return of the following IT asset. Thank you for returning it promptly.
              </p>

              <!-- Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;">
                <tr style="background:#f0fff4;">
                  <td style="padding:14px 20px;font-weight:600;color:#2e7d32;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;width:40%;">Asset Name</td>
                  <td style="padding:14px 20px;color:#333;font-size:15px;">${assetName}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-weight:600;color:#2e7d32;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e0e7ef;">Asset Tag</td>
                  <td style="padding:14px 20px;color:#333;font-size:15px;border-top:1px solid #e0e7ef;"><code style="background:#f0fff4;padding:2px 8px;border-radius:4px;">${assetTag}</code></td>
                </tr>
                <tr style="background:#f0fff4;">
                  <td style="padding:14px 20px;font-weight:600;color:#2e7d32;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e0e7ef;">Return Date</td>
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
