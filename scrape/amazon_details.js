import { chromium } from "playwright";
import fs from "fs";

const products = JSON.parse(fs.readFileSync("amazon_products.json", "utf-8"));

function cleanText(text) {
  return text?.replace(/\s+/g, " ").trim() || "";
}

async function scrapeProductDetails(product) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(product.link, { timeout: 60000 });

  await page.waitForTimeout(3000);

  const details = await page.evaluate(() => {
    const text = (sel) => document.querySelector(sel)?.innerText?.trim() || "";

    // Try common fields
    const mrp = document.querySelector("span.a-price.a-text-price span.a-offscreen")?.innerText || "";
    const price = document.querySelector("span.a-price span.a-offscreen")?.innerText || "";

    // Feature bullets
    const bullets = Array.from(document.querySelectorAll("#feature-bullets ul li")).map(li => li.innerText.trim());

    // Product info table
    const infoTable = {};
    document.querySelectorAll("#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr")
      .forEach(row => {
        const key = row.querySelector("th, td:nth-child(1)")?.innerText?.trim();
        const value = row.querySelector("td:nth-child(2)")?.innerText?.trim();
        if (key && value) infoTable[key] = value;
      });

    return { mrp, price, bullets, infoTable };
  });

  await browser.close();
  return { ...product, ...details };
}

async function run() {
  const enriched = [];
  for (let i = 0; i < Math.min(products.length, 5); i++) {  // limit for testing
    console.log(`🔎 Scraping details for: ${products[i].title}`);
    const result = await scrapeProductDetails(products[i]);
    enriched.push(result);
  }

  fs.writeFileSync("amazon_enriched.json", JSON.stringify(enriched, null, 2));
  console.log("✅ Saved detailed product data to amazon_enriched.json");
}

run();
