/**
 * ICUMS results-table paste parser.
 *
 * The official used-vehicle duty checker returns a table of REAL assessments
 * (one row per cleared car: trim, HDV, HS code, the customs exchange rate
 * applied, CIF and total tax). Copying that rendered table puts tab-separated
 * columns on the clipboard — so an operator can search a model, select the
 * table, and paste it straight into our admin importer. No scraping: a person
 * drives the public tool and we simply save what was on their screen.
 *
 * The parser is header-aware (so a column reorder doesn't break it) and falls
 * back to the canonical column order when no header row is pasted. It is pure
 * and total: unparseable lines are skipped and reported, never thrown.
 */

export interface ParsedIcumsRow {
  trimLevel: string | null;
  yearOfManufacture: number;
  make: string;
  model: string;
  hdv: number | null;
  currency: string;
  originCode: string | null;
  hsCode: string | null;
  exchangeRate: number | null;
  /** ISO yyyy-mm-dd. */
  receiptDate: string | null;
  assessmentDate: string | null;
  cifNcy: number | null;
  totalTax: number;
}

export interface IcumsParseResult {
  rows: ParsedIcumsRow[];
  /** Lines that looked like data but couldn't be parsed, with the reason. */
  errors: string[];
  /** Non-data lines skipped (headers, pagination, blanks). */
  skipped: number;
}

/** Canonical column order of the checker's results table. */
const CANONICAL = [
  "no",
  "trim",
  "year",
  "make",
  "model",
  "hdv",
  "currency",
  "origin",
  "hs",
  "fx",
  "receipt",
  "assessment",
  "cif",
  "tax",
] as const;
type ColumnKey = (typeof CANONICAL)[number];

/** Header text → column key. ICUMS ships a typo ("Excange Rate") — match both. */
function headerToKey(raw: string): ColumnKey | null {
  const h = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (h === "no" || h === "sn") return "no";
  if (h.startsWith("trim")) return "trim";
  if (h.startsWith("year")) return "year";
  if (h === "make") return "make";
  if (h === "model" || h === "modeltype") return "model";
  if (h === "hdv") return "hdv";
  if (h.startsWith("currency")) return "currency";
  if (h.startsWith("origin")) return "origin";
  if (h.startsWith("hscode") || h === "hs") return "hs";
  // "Exchange Rate" and the portal's "Excange Rate".
  if (h.includes("changerate") || h === "rate") return "fx";
  if (h.startsWith("receipt")) return "receipt";
  if (h.startsWith("assessment")) return "assessment";
  if (h.startsWith("cif")) return "cif";
  if (h.startsWith("totaltax") || h === "tax") return "tax";
  return null;
}

/** Split a pasted line into cells: tabs when present, else runs of 2+ spaces. */
function splitCells(line: string): string[] {
  const parts = line.includes("\t") ? line.split("\t") : line.split(/ {2,}|\s*\|\s*/);
  return parts.map((c) => c.trim());
}

/** "309,985.86" → 309985.86; blanks/dashes → null. */
function toNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** "06/07/2026" (dd/mm/yyyy) → "2026-07-06". Also accepts yyyy-mm-dd. */
export function toIsoDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!dmy) return null;
  const [, d, m, y] = dmy;
  const day = Number(d);
  const month = Number(m);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** ICUMS writes "NA" for an unspecified trim — treat it as unknown. */
function cleanTrim(raw: string | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t || /^(na|n\/a|-|--)$/i.test(t)) return null;
  return t;
}

const CURRENT_YEAR = new Date().getFullYear();

/** Parse a copied ICUMS results table into structured observations. */
export function parseIcumsTable(text: string): IcumsParseResult {
  const rows: ParsedIcumsRow[] = [];
  const errors: string[] = [];
  let skipped = 0;

  const lines = text.split(/\r?\n/);
  // Default to the canonical layout; a pasted header row overrides it.
  let layout: ColumnKey[] = [...CANONICAL];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const cells = splitCells(trimmed);
    // Pagination/footer noise ("Total : 4", "Page : 1/1") never splits this wide.
    if (cells.length < 4) {
      skipped++;
      continue;
    }

    // Header row? Adopt its ordering and move on.
    const asKeys = cells.map(headerToKey);
    const recognised = asKeys.filter(Boolean).length;
    if (recognised >= 5 && toNumber(cells[0]) === null) {
      layout = asKeys.map((k, i) => k ?? (CANONICAL[i] ?? "no"));
      skipped++;
      continue;
    }

    const get = (key: ColumnKey): string | undefined => {
      const idx = layout.indexOf(key);
      return idx === -1 ? undefined : cells[idx];
    };

    const year = toNumber(get("year"));
    const totalTax = toNumber(get("tax"));
    const make = (get("make") ?? "").trim();
    const model = (get("model") ?? "").trim();

    // Every real row names a vehicle; a line without one is layout noise, not
    // a data problem worth showing the operator.
    if (!make || !model) {
      skipped++;
      continue;
    }
    if (year === null || year < 1980 || year > CURRENT_YEAR + 1) {
      errors.push(`Bad year for ${make} ${model}: "${get("year") ?? ""}"`);
      continue;
    }
    if (totalTax === null || totalTax <= 0) {
      errors.push(`Bad total tax for ${make} ${model}: "${get("tax") ?? ""}"`);
      continue;
    }

    rows.push({
      trimLevel: cleanTrim(get("trim")),
      yearOfManufacture: year,
      make,
      model,
      hdv: toNumber(get("hdv")),
      currency: (get("currency") || "USD").trim().toUpperCase(),
      originCode: (get("origin") || "").trim().toUpperCase() || null,
      hsCode: (get("hs") || "").trim() || null,
      exchangeRate: toNumber(get("fx")),
      receiptDate: toIsoDate(get("receipt")),
      assessmentDate: toIsoDate(get("assessment")),
      cifNcy: toNumber(get("cif")),
      totalTax,
    });
  }

  return { rows, errors, skipped };
}

/**
 * Effective tax rate for a row: TotalTax / CIF.
 *
 * Observed ICUMS rows show this is essentially constant per HS code (four real
 * Camry rows agreed to within 0.001 percentage points across CIFs differing by
 * 16%), which is what makes accurate prediction possible from a small
 * reference table rather than a live feed.
 */
export function effectiveTaxRate(row: {
  totalTax: number;
  cifNcy: number | null;
}): number | null {
  if (!row.cifNcy || row.cifNcy <= 0) return null;
  return row.totalTax / row.cifNcy;
}

/** CIF as a multiple of the new-value HDV: captures depreciation + freight. */
export function cifFactor(row: {
  cifNcy: number | null;
  hdv: number | null;
  exchangeRate: number | null;
}): number | null {
  if (!row.cifNcy || !row.hdv || !row.exchangeRate) return null;
  const hdvInGhs = row.hdv * row.exchangeRate;
  if (hdvInGhs <= 0) return null;
  return row.cifNcy / hdvInGhs;
}
