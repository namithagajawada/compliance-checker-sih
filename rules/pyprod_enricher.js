import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Ensure we can resolve paths relative to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, ".."); // one level up from /rules

function enrichProduct(rawData) {
  try {
    let cleanJson = rawData.product.raw_response.replace(/```json|```/g, "").trim();
    let parsed = JSON.parse(cleanJson);

    return {
      title: parsed.common_name || "Unknown Product",
      price: parsed.mrp ? `₹${parsed.mrp}` : "",
      mrp: parsed.mrp ? `₹${parsed.mrp}` : "",
      rating: parsed.rating || "N/A",
      seller: parsed.manufacturer_packer_importer?.split("\n")[0] || "Unknown Seller",
      date_of_manufacture: parsed.manufacture_month_year || "",
      net_quantity: parsed.net_quantity || "",
      country_of_origin: parsed.country_of_origin || "India",
      manufacturer: parsed.manufacturer_packer_importer || "",
      link: parsed.link || "https://example.com"
    };
  } catch (err) {
    console.error("❌ Error enriching product:", err.message);
    return null;
  }
}

function run() {
  const inputFile = path.join(projectRoot, "webcam", "product_output.json");
  const outputFile = path.join(projectRoot, "data", "cam_products.json");

  if (!fs.existsSync(inputFile)) {
    console.error("❌ Input file not found:", inputFile);
    return;
  }

  const inputData = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  const enriched = enrichProduct(inputData);

  if (enriched) {
    fs.writeFileSync(outputFile, JSON.stringify([enriched], null, 2));
    console.log(`✅ Enriched product saved to ${outputFile}`);
  }
}

run();
