// Using native fetch in Node 18+

const BASE_URL = "http://localhost:5000/api/analytics";

const endpoints = [
  "assets-by-category",
  "asset-value",
  "maintenance-costs",
  "vendor-performance",
  "asset-status",
  "depreciation-summary",
  "monthly-maintenance",
  "dashboard-summary",
];

async function verifyEndpoints() {
  console.log("Starting verification of Analytics APIs...");
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}/${endpoint}`);
      const data = await response.json();
      if (response.ok && data.success === true) {
        console.log(`✅ ${endpoint}: SUCCESS`);
      } else {
        console.error(`❌ ${endpoint}: FAILED`, data);
      }
    } catch (error) {
      console.error(`❌ ${endpoint}: ERROR`, error.message);
    }
  }
}

verifyEndpoints();
