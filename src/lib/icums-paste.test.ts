import { describe, expect, it } from "vitest";
import { cifFactor, effectiveTaxRate, parseIcumsTable, toIsoDate } from "@/lib/icums-paste";

// Exactly what the ICUMS checker put on screen for Toyota Camry 2025 (July
// 2026), as it lands on the clipboard when the table is copied.
const REAL_PASTE = `No.	Trim Level	Year of Manufacture	Make	Model	HDV	Currency	Origin Code	HS Code	Excange Rate	Receipt Date	Assessment Date	CIF NCY	Total Tax
1	SE	2025	TOYOTA	CAMRY	31,000	USD	US	8703402000	11.2981	06/07/2026	01/07/2026	309,985.86	154,717.49
2	XLE	2025	TOYOTA	CAMRY	33,700	USD	US	8703402000	11.5558	21/07/2026	20/07/2026	284,883.28	139,334.45
3	LE	2025	TOYOTA	CAMRY	28,700	USD	US	8703402000	11.0555	15/07/2026	15/07/2026	281,527.09	137,694.43
4	NA	2025	TOYOTA	CAMRY	32,525	USD	US	8703402000	11.2981	02/07/2026	02/07/2026	326,024.19	159,458.01`;

describe("toIsoDate", () => {
  it("converts the portal's dd/mm/yyyy and passes ISO through", () => {
    expect(toIsoDate("06/07/2026")).toBe("2026-07-06");
    expect(toIsoDate("2026-07-06")).toBe("2026-07-06");
    expect(toIsoDate("nonsense")).toBeNull();
    expect(toIsoDate(undefined)).toBeNull();
  });
});

describe("parseIcumsTable", () => {
  it("parses the real pasted Camry table", () => {
    const { rows, errors } = parseIcumsTable(REAL_PASTE);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(4);

    const se = rows[0];
    expect(se.trimLevel).toBe("SE");
    expect(se.yearOfManufacture).toBe(2025);
    expect(se.make).toBe("TOYOTA");
    expect(se.model).toBe("CAMRY");
    expect(se.hdv).toBe(31000);
    expect(se.currency).toBe("USD");
    expect(se.originCode).toBe("US");
    expect(se.hsCode).toBe("8703402000");
    expect(se.exchangeRate).toBe(11.2981);
    expect(se.assessmentDate).toBe("2026-07-01");
    expect(se.cifNcy).toBe(309985.86);
    expect(se.totalTax).toBe(154717.49);
  });

  it("treats the portal's 'NA' trim as unknown", () => {
    const { rows } = parseIcumsTable(REAL_PASTE);
    expect(rows[3].trimLevel).toBeNull();
  });

  it("works without a header row (canonical column order)", () => {
    const noHeader = REAL_PASTE.split("\n").slice(1).join("\n");
    const { rows, errors } = parseIcumsTable(noHeader);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(4);
    expect(rows[0].totalTax).toBe(154717.49);
  });

  it("honours a reordered header instead of assuming position", () => {
    const reordered = `Make\tModel\tYear of Manufacture\tTotal Tax\tCIF NCY
TOYOTA\tCOROLLA\t2018\t61,200.00\t125,000.00`;
    const { rows, errors } = parseIcumsTable(reordered);
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      make: "TOYOTA",
      model: "COROLLA",
      yearOfManufacture: 2018,
      totalTax: 61200,
      cifNcy: 125000,
    });
  });

  it("accepts multi-space separated text (some browsers don't emit tabs)", () => {
    const spaced =
      "1   SE   2025   TOYOTA   CAMRY   31,000   USD   US   8703402000   11.2981   06/07/2026   01/07/2026   309,985.86   154,717.49";
    const { rows } = parseIcumsTable(spaced);
    expect(rows).toHaveLength(1);
    expect(rows[0].cifNcy).toBe(309985.86);
  });

  it("skips noise and reports unusable data rows instead of throwing", () => {
    const messy = `Total : 4

Page : 1/1
1	SE	1899	TOYOTA	CAMRY	31,000	USD	US	8703402000	11.2981	06/07/2026	01/07/2026	309,985.86	154,717.49`;
    const { rows, errors, skipped } = parseIcumsTable(messy);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("Bad year");
    expect(skipped).toBeGreaterThan(0);
  });

  it("returns an empty result for empty input", () => {
    expect(parseIcumsTable("")).toEqual({ rows: [], errors: [], skipped: 0 });
  });
});

describe("derived ratios", () => {
  const { rows } = parseIcumsTable(REAL_PASTE);

  it("finds a near-constant effective tax rate per HS code", () => {
    // Rows 2-4 agree to within 0.001 percentage points — the finding that
    // makes prediction possible from a small reference table.
    const rates = rows.slice(1).map((r) => effectiveTaxRate(r)!);
    for (const rate of rates) expect(rate).toBeCloseTo(0.4891, 4);
    // Row 1 carries exactly one extra 1% levy.
    expect(effectiveTaxRate(rows[0])!).toBeCloseTo(0.4991, 4);
  });

  it("finds a consistent CIF-to-HDV factor, with one clear outlier", () => {
    expect(cifFactor(rows[0])!).toBeCloseTo(0.885, 2);
    expect(cifFactor(rows[2])!).toBeCloseTo(0.887, 2);
    expect(cifFactor(rows[3])!).toBeCloseTo(0.887, 2);
    // The XLE row is the anomaly the median rule exists to reject.
    expect(cifFactor(rows[1])!).toBeLessThan(0.8);
  });

  it("returns null when the inputs aren't there", () => {
    expect(effectiveTaxRate({ totalTax: 100, cifNcy: null })).toBeNull();
    expect(cifFactor({ cifNcy: 100, hdv: null, exchangeRate: 11 })).toBeNull();
  });
});
