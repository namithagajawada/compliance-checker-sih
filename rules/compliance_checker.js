import fs from "fs";

// ✅ Utility: clean numbers like ₹399 → 399
function parsePrice(value) {
  if (!value) return null;
  const num = value.replace(/[^\d.]/g, ""); // remove ₹, spaces
  return num ? parseFloat(num) : null;
}

// ✅ Rule checks
function validateProduct(product) {
  const errors = [];

  // Title check
  if (!product.title || product.title.trim() === "") {
    errors.push("❌ Missing product title");
  }

  // Price check
  const price = parsePrice(product.price);
  const mrp = parsePrice(product.mrp);

  if (!price) errors.push("❌ Missing price");
  if (!mrp) errors.push("❌ Missing MRP");

  if (price && mrp && price > mrp) {
    errors.push(`❌ Price (${price}) is greater than MRP (${mrp})`);
  }

  // Net quantity check
  if (!product.net_quantity || product.net_quantity.trim() === "") {
    errors.push("❌ Missing net quantity");
  } else if (!/[0-9]+(ml|g|kg|L|pcs)$/i.test(product.net_quantity)) {
    errors.push("❌ Invalid net quantity format (use ml, g, kg, L, pcs)");
  }

  // Manufacturer check
  if (!product.manufacturer || product.manufacturer.trim() === "") {
    errors.push("❌ Missing manufacturer details");
  }

  // Country of origin check
  if (!product.country_of_origin || product.country_of_origin.trim() === "") {
    errors.push("❌ Missing country of origin");
  }

  return {
    product: product.title || "Unnamed Product",
    errors,
    isCompliant: errors.length === 0
  };
}

// ✅ Main function
function runComplianceCheck() {
  const data = JSON.parse(fs.readFileSync("data/amazon_products.json", "utf-8"));
  const results = data.map(validateProduct);

  // Save results
  fs.writeFileSync("data/compliance_report.json", JSON.stringify(results, null, 2));

  console.log("✅ Compliance report saved to data/compliance_report.json");
  console.log("📊 Summary:");
  console.log(`  Total products: ${results.length}`);
  console.log(`  Compliant: ${results.filter(r => r.isCompliant).length}`);
  console.log(`  Non-compliant: ${results.filter(r => !r.isCompliant).length}`);
}

runComplianceCheck();
