import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// Serve static files (CSS/JS)
app.use(express.static("public"));

// Route: Dashboard
app.get("/", (req, res) => {
  const report = JSON.parse(fs.readFileSync("data/compliance_report.json", "utf-8"));
  const compliant = report.filter(r => r.isCompliant).length;
  const nonCompliant = report.filter(r => !r.isCompliant).length;

  res.render("dashboard", { report, compliant, nonCompliant });
});

app.listen(PORT, () => {
  console.log(`✅ Dashboard running at http://localhost:${PORT}`);
});
