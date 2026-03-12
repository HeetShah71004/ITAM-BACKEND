import PDFDocument from "pdfkit-table";
import analyticsService from "./analytics.service.js";
import path from "path";

class ReportService {
  /**
   * Generate a comprehensive system summary PDF report
   * @param {Object} user - The user object who requested the report
   */
  async generateSystemSummaryReport(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: "A4" });
        const chunks = [];

        // Collect chunks of PDF data
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const result = Buffer.concat(chunks);
          resolve(result);
        });
        doc.on("error", (err) => reject(err));

        // --- Header Section ---
        doc.fontSize(20).text("IT Asset Management System", { align: "center", font: "Helvetica-Bold" });
        doc.fontSize(14).text("Analytics & Inventory Summary Report", { align: "center" });
        doc.moveDown();
        
        // Dynamic Requester Info
        doc.fontSize(10).text(`Requested By: ${user.fullName} (${user.email})`, { align: "left" });
        doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });
        doc.moveDown(2);

        // --- 1. Dashboard Summary (High-Level Stats) ---
        const summaryData = await analyticsService.getDashboardSummary();
        const valueStats = await analyticsService.getAssetValueStats();
        
        const summaryTable = {
          title: "Executive Summary",
          headers: ["Metric", "Value"],
          rows: [
            ["Total Assets", summaryData.totalAssets.toString()],
            ["Total Asset Value", `$${(valueStats.totalAssetValue || 0).toLocaleString()}`],
            ["Average Asset Cost", `$${(valueStats.averageAssetCost || 0).toFixed(2)}`],
            ["Total Maintenance Cost", `$${summaryData.totalMaintenanceCost.toLocaleString()}`],
            ["Assets under Maintenance", summaryData.assetsInMaintenance.toString()],
            ["Total Vendors", summaryData.totalVendors.toString()],
          ],
        };
        await doc.table(summaryTable, { width: 500 });
        doc.moveDown(2);

        // --- 2. Asset Distribution by Category ---
        const categoryStats = await analyticsService.getAssetsByCategory();
        const categoryTable = {
          title: "Asset Distribution by Category",
          headers: ["Category", "Total Assets"],
          rows: categoryStats.map(item => [item.category, item.totalAssets.toString()]),
        };
        await doc.table(categoryTable, { width: 500 });
        doc.moveDown(2);

        // --- 3. Maintenance Cost by Asset ---
        const maintenanceStats = await analyticsService.getMaintenanceCostStats();
        const maintenanceTable = {
          title: "Top Maintenance Costs by Asset",
          headers: ["Asset Tag", "Name", "Total cost", "Services"],
          rows: maintenanceStats.slice(0, 10).map(item => [
            item.assetTag,
            item.assetName,
            `$${item.totalMaintenanceCost.toLocaleString()}`,
            item.serviceCount.toString()
          ]),
        };
        await doc.table(maintenanceTable, { width: 500 });
        doc.moveDown(2);

        // --- Footer ---
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          let oldBottomMargin = doc.page.margins.bottom;
          doc.page.margins.bottom = 0;
          doc.text(
            `Page ${i + 1} of ${pages.count}`,
            0,
            doc.page.height - 20,
            { align: "center" }
          );
          doc.page.margins.bottom = oldBottomMargin;
        }

        // Finalize the PDF
        doc.end();

      } catch (error) {
        console.error("PDF Generation Error:", error);
        reject(error);
      }
    });
  }
}

export default new ReportService();
