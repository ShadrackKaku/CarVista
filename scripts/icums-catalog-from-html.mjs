// Build ICUMS make/model catalogue JSON from SAVED popup pages.
//
// The ICUMS used-vehicle checker exposes its coded vehicle taxonomy in two
// popups (Vehicle Make: ~691 makes; Vehicle Make & Model: models per make).
// This sandboxed repo can't reach unipassghana.com, but anyone on a normal
// connection can: open the popup in a browser, set the page size high / page
// through, and save each page (Ctrl+S → "Webpage, HTML Only") into a folder.
//
// Usage:
//   node scripts/icums-catalog-from-html.mjs makes  <folder-of-saved-pages> > makes.json
//   node scripts/icums-catalog-from-html.mjs models <folder-of-saved-pages> > models.json
//
// Output is exactly the payload for POST /api/admin/icums-catalog:
//   { "makes":  [{ "code": "00042", "name": "Toyota" }, …] }
//   { "models": [{ "code": "00856", "name": "Camry", "makeCode": "00042" }, …] }
//
// Upload (as an admin, paged automatically under the API's row caps):
//   curl -X POST https://<your-domain>/api/admin/icums-catalog \
//     -H "Content-Type: application/json" -H "Cookie: <admin session cookie>" \
//     -d @makes.json
//
// The parser is deliberately dumb-but-robust: it scans every <tr> for <td>
// cells and keeps rows where the expected columns look right (a 5-digit code
// next to a non-empty name). If ICUMS changes its markup and this stops
// matching, save one page and share it so the parser can be adapted.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const mode = process.argv[2];
const dir = process.argv[3];
if (!["makes", "models"].includes(mode ?? "") || !dir) {
  console.error("Usage: node scripts/icums-catalog-from-html.mjs <makes|models> <folder>");
  process.exit(1);
}

const CODE = /^\d{5}$/;

/** Strip tags/entities from a table cell's inner HTML. */
function cellText(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** All <td> texts per <tr> in a chunk of HTML. */
function tableRows(html) {
  const rows = [];
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = (tr.match(/<td[\s\S]*?<\/td>/gi) ?? []).map(cellText);
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

const files = readdirSync(dir)
  .map((f) => join(dir, f))
  .filter((f) => statSync(f).isFile() && /\.html?$/i.test(f));

if (files.length === 0) {
  console.error(`No .html files found in ${dir}`);
  process.exit(1);
}

const makes = new Map();
const models = new Map();

for (const file of files) {
  const html = readFileSync(file, "utf8");
  for (const cells of tableRows(html)) {
    if (mode === "makes") {
      // Make popup rows: [No., Code, Make Description, Country Code, Country Desc]
      const [, code, name] = cells;
      if (CODE.test(code ?? "") && name) makes.set(code, name);
    } else {
      // Model popup rows: [No., Model, Model Description, Make, Make Description, …]
      const [, code, name, makeCode] = cells;
      if (CODE.test(code ?? "") && name && CODE.test(makeCode ?? "")) {
        models.set(code, { code, name, makeCode });
      }
    }
  }
}

if (mode === "makes") {
  const list = [...makes].map(([code, name]) => ({ code, name }));
  console.error(`Parsed ${list.length} makes from ${files.length} file(s).`);
  console.log(JSON.stringify({ makes: list }, null, 2));
} else {
  const list = [...models.values()];
  console.error(`Parsed ${list.length} models from ${files.length} file(s).`);
  console.log(JSON.stringify({ models: list }, null, 2));
}
