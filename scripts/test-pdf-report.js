import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "itam_backend_123";

// DYNAMIC: Take from command line, env, or fallback
const userId = process.argv[2] || process.env.TEST_USER_ID || "69b0ef77faca95b2f3aa74db"; 
const fileName = process.argv[3] || `test_report_${new Date().toISOString().split('T')[0]}.pdf`;

async function testPdfReport() {
  console.log("Starting PDF Report Verification...");

  // 1. Generate Token
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });
  console.log("Generated Token:", token.substring(0, 20) + "...");

  // 2. Call PDF Endpoint
  try {
    const response = await fetch("http://localhost:5000/api/reports/summary", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok && response.headers.get("content-type") === "application/pdf") {
      console.log("✅ PDF Endpoint: SUCCESS");
      console.log("Content-Type:", response.headers.get("content-type"));
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      fs.writeFileSync(fileName, buffer);
      console.log(`✅ PDF saved to ${fileName} (${buffer.length} bytes)`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ PDF Endpoint: FAILED", response.status, errorData);
    }
  } catch (error) {
    console.error("❌ PDF Endpoint: ERROR", error.message);
  }
}

testPdfReport();
