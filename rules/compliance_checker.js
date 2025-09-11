//this file takes up data amazon_products.json and products_enriched.json and runs the check
//the output of check is saved in data/compliance_report.json
import fs from "fs";
import path from "path";

// ✅ Utility: clean numbers like ₹399 → 399
function parsePrice(value) {
  if (!value) return null;
  const num = value.replace(/[^\d.]/g, "");
  return num ? parseFloat(num) : null;
}

// ✅ Rule checks
function validateProduct(product) {
  const errors = [];

  if (!product.title || product.title.trim() === "") {
    errors.push("❌ Missing product title");
  }

  const price = parsePrice(product.price);
  const mrp = parsePrice(product.mrp);

  if (!price) errors.push("❌ Missing price");
  if (!mrp) errors.push("❌ Missing MRP");
  if (price && mrp && price > mrp) {
    errors.push(`❌ Price (${price}) is greater than MRP (${mrp})`);
  }

  if (!product.net_quantity || product.net_quantity.trim() === "") {
    errors.push("❌ Missing net quantity");
  } else if (!/[0-9]+(ml|g|kg|L|pcs)$/i.test(product.net_quantity)) {
    errors.push("❌ Invalid net quantity format (use ml, g, kg, L, pcs)");
  }

  if (!product.manufacturer || product.manufacturer.trim() === "") {
    errors.push("❌ Missing manufacturer details");
  }

  if (!product.country_of_origin || product.country_of_origin.trim() === "") {
    errors.push("❌ Missing country of origin");
  }

  return {
    product: product.title || "Unnamed Product",
    errors,
    isCompliant: errors.length === 0,
  };
}

// ✅ Main function
function runComplianceCheck() {
  const inputFiles = [
    path.join("data", "amazon_products.json"),
    path.join("data", "products_enriched.json"),
  ];

  let allResults = [];

  for (const file of inputFiles) {
    if (!fs.existsSync(file)) {
      console.warn(`⚠️ Skipping missing file: ${file}`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    const results = data.map(validateProduct);
    allResults = allResults.concat(results);
  }

  const outputFile = path.join("data", "compliance_report.json");
  fs.writeFileSync(outputFile, JSON.stringify(allResults, null, 2));

  console.log(`✅ Compliance report saved to ${outputFile}`);
  console.log("📊 Summary:");
  console.log(`  Total products: ${allResults.length}`);
  console.log(
    `  Compliant: ${allResults.filter((r) => r.isCompliant).length}`
  );
  console.log(
    `  Non-compliant: ${allResults.filter((r) => !r.isCompliant).length}`
  );
}

runComplianceCheck();
