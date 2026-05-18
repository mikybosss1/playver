// node scripts/upload-sport-presets.mjs
// Uploads sport preset images to UploadThing and rewrites src/lib/sport-presets.ts

import { UTApi } from "uploadthing/server";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
const UPLOADTHING_TOKEN = env.match(/^UPLOADTHING_TOKEN=(.+)$/m)?.[1]?.trim();

if (!UPLOADTHING_TOKEN) {
  console.error("UPLOADTHING_TOKEN not found in .env.local");
  process.exit(1);
}

const utapi = new UTApi({ token: UPLOADTHING_TOKEN });

const SPORTS = ["baseball", "basketball", "cricket", "hockey", "other", "pickleball", "rugby", "soccer", "tennis", "volleyball"];
const FOLDERS = [
  "/Users/miky.baril/Downloads/sport_default_images",
  "/Users/miky.baril/Downloads/sport_default_images_2",
  "/Users/miky.baril/Downloads/sport_default_images_3",
];

// Collect all files grouped by sport
const bySport = {};
for (const sport of SPORTS) {
  bySport[sport] = [];
  for (let i = 0; i < FOLDERS.length; i++) {
    const filePath = `${FOLDERS[i]}/default${sport}${i + 1}.png`;
    const buffer = readFileSync(filePath);
    const blob = new Blob([buffer], { type: "image/png" });
    const file = new File([blob], `default${sport}${i + 1}.png`, { type: "image/png" });
    bySport[sport].push(file);
  }
}

// Upload all 30 files
console.log("Uploading 30 images to UploadThing...\n");
const urls = {};

for (const sport of SPORTS) {
  process.stdout.write(`  ${sport}... `);
  const res = await utapi.uploadFiles(bySport[sport]);
  urls[sport] = res.map((r) => {
    if (r.error) throw new Error(`Upload failed for ${sport}: ${r.error.message}`);
    return r.data.ufsUrl ?? r.data.url;
  });
  console.log(`✓  (${urls[sport].length} images)`);
}

// Map lowercase sport key to the exact key used in sport-presets.ts
const KEY_MAP = {
  baseball:   "Baseball",
  basketball: "Basketball",
  cricket:    "Cricket",
  hockey:     "Hockey",
  other:      "Other",
  pickleball: "Pickleball",
  rugby:      "Rugby",
  soccer:     "Soccer",
  tennis:     "Tennis",
  volleyball: "Volleyball",
};

// Build the new presets file content
const lines = [
  "// Sport preset cover images — hosted on UploadThing.",
  "// To add/replace images: upload new files and update the URLs below.",
  "",
  "export const SPORT_PRESETS: Record<string, string[]> = {",
];

for (const sport of SPORTS) {
  const key = KEY_MAP[sport];
  lines.push(`  ${key}: [`);
  for (const url of urls[sport]) {
    lines.push(`    "${url}",`);
  }
  lines.push(`  ],`);
}

lines.push("};", "");

const outPath = resolve(__dirname, "../src/lib/sport-presets.ts");
writeFileSync(outPath, lines.join("\n"), "utf8");

console.log(`\nDone! sport-presets.ts updated with ${SPORTS.length * 3} URLs.`);
