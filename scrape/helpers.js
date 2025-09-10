import fs from "fs";

export function saveJSON(filename, data) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), "utf-8");
}

export function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}
