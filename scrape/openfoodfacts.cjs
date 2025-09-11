// openfoodfacts_fetch.cjs
// this file fetches all data from openfoodfacts and stores as a big file in data/products_openfoodfacts.json

const fs = require('fs');

(async () => {
  try {
    const query = 'edible oil';
    const pageSize = 50; // increase if you want more results
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${pageSize}`;

    const res = await fetch(url, { headers: { 'User-Agent': 'Node.js (OpenFoodFacts fetch)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const products = (json.products || []).map(p => ({
      source: 'OpenFoodFacts',
      code: p.code || null,
      generic_name: p.product_name || p.generic_name || null,
      brand: p.brands || null,
      net_quantity: p.quantity || null,
      manufacturer: p.manufacturing_places || p.manufacturing_places_tags?.join(', ') || p.brands || null,
      manufacture_date: p.manufacturing_date || p.packaging_date || null,
      mrp: null, // OpenFoodFacts rarely contains MRP
      customer_care: p.contact || null,
      dimensions: p.packaging || null,
      principal_display_panel_image: p.image_front_small_url || p.image_front_url || null,
      raw: p // optional: keep raw product data if you want to inspect additional fields
    }));

    fs.writeFileSync(
  '../data/products_openfoodfacts.json',
  JSON.stringify(products, null, 2),
  'utf-8'
);

    console.log(`✅ Saved ${products.length} products to products_openfoodfacts.json`);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
