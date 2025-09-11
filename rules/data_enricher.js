//this file takes data from products_openfoodfacts.json and cut-shorts them smaller format. 
//That stuff is saved in data/products_enriched.json
import fs from "fs";
import path from "path";

function enrichProduct(p) {
  return {
    title: p.generic_name || p.product_name || "Unnamed Product",
    price: "₹" + (Math.floor(Math.random() * 200) + 100), // dummy price
    mrp: "₹" + (Math.floor(Math.random() * 300) + 200),   // dummy MRP
    rating: (Math.random() * (5 - 3) + 3).toFixed(1),     // random 3.0–5.0 rating
    seller: p.brands || "Unknown Seller",
    net_quantity: p.net_quantity || p.quantity || "",
    country_of_origin: p.countries || "",
    manufacturer: p.manufacturer || p.manufacturing_places || p.brands || "",
    link: `https://world.openfoodfacts.org/product/${p.code || "NA"}`
  };
}

function run() {
  const inputFile = path.join("data", "products_openfoodfacts.json");
  const outputFile = path.join("data", "products_enriched.json");

  if (!fs.existsSync(inputFile)) {
    console.error("❌ Input file not found:", inputFile);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  const enriched = raw.map(enrichProduct);

  fs.writeFileSync(outputFile, JSON.stringify(enriched, null, 2));
  console.log(`✅ Enriched products saved to ${outputFile}`);
}

run();
