//Non useful file right now
//serves the process of scraping data from amazon and save in data/amazon_products.json
import { chromium } from "playwright";
import fs from "fs";

function saveJSON(filename, data) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

function cleanText(text) {
  return text?.replace(/\s+/g, " ").trim() || "";
}

async function scrapeAmazon(searchQuery) {
  const browser = await chromium.launch({
    headless: false, // run with UI to debug (set to true later)
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  console.log(`🔍 Searching Amazon for "${searchQuery}"...`);
  await page.goto(`https://www.amazon.in/s?k=${encodeURIComponent(searchQuery)}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  // wait for results
  await page.waitForSelector(".s-main-slot");

  const products = await page.$$eval(".s-main-slot .s-result-item[data-asin]", (items) =>
    items.map((item) => {
      const title = item.querySelector("h2 a span")?.innerText || "";
      const price = item.querySelector(".a-price span.a-offscreen")?.innerText || "";
      const rating = item.querySelector("span.a-icon-alt")?.innerText || "";
      let link = item.querySelector("h2 a")?.getAttribute("href") || "";

      if (link && !link.startsWith("http")) {
        link = "https://www.amazon.in" + link;
      }

      return { title, price, rating, link };
    })
  );

  await browser.close();

  const cleaned = products
    .filter((p) => p.title && p.link) // only valid
    .map((p) => ({
      title: cleanText(p.title),
      price: cleanText(p.price),
      rating: cleanText(p.rating),
      link: p.link,
    }));

  saveJSON("amazon_products.json", cleaned);
  console.log(`✅ Saved ${cleaned.length} Amazon products to amazon_products.json`);
}

scrapeAmazon("shampoo");
