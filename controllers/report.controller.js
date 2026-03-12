import reportService from "../services/report.service.js";

class ReportController {
  /**
   * Get system summary PDF report
   */
  async getSystemSummaryReport(req, res) {
    try {
      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=ITAM_Summary_Report_${new Date().toISOString().split("T")[0]}.pdf`
      );

      // Generate the report as a buffer
      const pdfBuffer = await reportService.generateSystemSummaryReport(req.user);
      
      // Send the buffer
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error("Error in getSystemSummaryReport:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate PDF report",
        error: error.message,
      });
    }
  }
}

export default new ReportController();
