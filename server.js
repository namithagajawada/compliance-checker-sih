import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// Serve static files
app.use(express.static("public"));

// Function to read and process report
function getReport() {
  const report = JSON.parse(
    fs.readFileSync("data/compliance_report.json", "utf-8")
  );

  const totalChecks = 10;

  const reportWithPercentages = report.map(r => {
    const score = Math.max(0, totalChecks - r.errors.length);
    const percentage = Math.round((score / totalChecks) * 100);
    return { ...r, compliancePercentage: percentage };
  });

  const compliant = reportWithPercentages.filter(r => r.compliancePercentage === 100).length;
  const nonCompliant = reportWithPercentages.length - compliant;

  return { report: reportWithPercentages, compliant, nonCompliant };
}

// Route: Dashboard
app.get("/", (req, res) => {
  const data = getReport();
  res.render("dashboard", data);
});

// SSE endpoint for real-time updates
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendData = () => {
    const data = getReport();
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial data
  sendData();

  // Watch file for changes
  const watcher = fs.watch("data/compliance_report.json", () => {
    sendData();
  });

  // Clean up watcher when client disconnects
  req.on("close", () => {
    watcher.close();
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Dashboard running at http://localhost:${PORT}`);
});
