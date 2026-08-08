import { describe, it, expect } from "vitest";
import {
  RESERVATION_WORKING_DAYS,
  addGhanaWorkingDays,
  dayKey,
  easterSunday,
  ghanaPublicHolidays,
  isGhanaWorkingDay,
  lunarHolidayYears,
  lunarHolidaysNeedAttention,
} from "./ghana-calendar";

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);
const names = (year: number) => ghanaPublicHolidays(year).map((h) => h.name);
const dates = (year: number) => ghanaPublicHolidays(year).map((h) => h.date);

describe("easterSunday", () => {
  it("matches known Gregorian Easters", () => {
    // Anchors for the Computus — if the algorithm is ever "simplified", these
    // catch it. Good Friday and Easter Monday both hang off this date.
    expect(dayKey(easterSunday(2024))).toBe("2024-03-31");
    expect(dayKey(easterSunday(2025))).toBe("2025-04-20");
    expect(dayKey(easterSunday(2026))).toBe("2026-04-05");
    expect(dayKey(easterSunday(2027))).toBe("2027-03-28");
    expect(dayKey(easterSunday(2030))).toBe("2030-04-21");
  });

  it("always lands on a Sunday", () => {
    for (let y = 2020; y <= 2040; y++) {
      expect(easterSunday(y).getUTCDay(), `Easter ${y}`).toBe(0);
    }
  });
});

describe("ghanaPublicHolidays", () => {
  it("includes the fixed national days", () => {
    const d = dates(2026);
    expect(d).toContain("2026-01-01"); // New Year
    expect(d).toContain("2026-03-06"); // Independence
    expect(d).toContain("2026-05-01"); // May Day
    expect(d).toContain("2026-08-04"); // Founders'
    expect(d).toContain("2026-09-21"); // Nkrumah Memorial
    expect(d).toContain("2026-12-25");
    expect(d).toContain("2026-12-26");
  });

  it("derives Good Friday and Easter Monday from Easter", () => {
    const d = dates(2026);
    expect(d).toContain("2026-04-03"); // Good Friday
    expect(d).toContain("2026-04-06"); // Easter Monday
    expect(names(2026)).toContain("Good Friday");
  });

  it("puts Farmers' Day on the first Friday of December", () => {
    // 2026-12-04 is a Friday; 2025-12-05 is a Friday.
    expect(dates(2026)).toContain("2026-12-04");
    expect(dates(2025)).toContain("2025-12-05");
    for (let y = 2024; y <= 2035; y++) {
      const farmers = ghanaPublicHolidays(y).find((h) => h.name === "Farmers' Day");
      expect(farmers, `Farmers' Day ${y}`).toBeDefined();
      const date = at(farmers!.date);
      expect(date.getUTCDay(), `${farmers!.date} should be a Friday`).toBe(5);
      expect(date.getUTCDate()).toBeLessThanOrEqual(7);
    }
  });

  it("observes the following Monday when a holiday falls on a weekend", () => {
    // 2027-03-06 (Independence Day) is a Saturday → Monday the 8th observed.
    const d = dates(2027);
    expect(d).toContain("2027-03-06");
    expect(d).toContain("2027-03-08");
    expect(names(2027)).toContain("Independence Day (observed)");
  });
});

describe("isGhanaWorkingDay", () => {
  it("rejects weekends", () => {
    expect(isGhanaWorkingDay(at("2026-08-08"))).toBe(false); // Saturday
    expect(isGhanaWorkingDay(at("2026-08-09"))).toBe(false); // Sunday
  });

  it("rejects public holidays", () => {
    expect(isGhanaWorkingDay(at("2026-03-06"))).toBe(false); // Independence Day
    expect(isGhanaWorkingDay(at("2026-12-25"))).toBe(false);
  });

  it("accepts an ordinary weekday", () => {
    expect(isGhanaWorkingDay(at("2026-08-10"))).toBe(true); // Monday
  });
});

describe("addGhanaWorkingDays", () => {
  it("counts plain weekdays", () => {
    // Monday + 2 working days = Wednesday.
    expect(dayKey(addGhanaWorkingDays(at("2026-08-10"), 2).date)).toBe("2026-08-12");
  });

  it("steps over a weekend", () => {
    // Reserve Thursday, and the window ends Monday — not Saturday.
    expect(dayKey(addGhanaWorkingDays(at("2026-08-13"), 2).date)).toBe("2026-08-17");
  });

  it("steps over a public holiday and says which", () => {
    // Wed 4 Mar 2026 + 2 working days: Thu 5th, then Fri 6th is Independence
    // Day, so it lands on Monday 9th.
    const result = addGhanaWorkingDays(at("2026-03-04"), 2);
    expect(dayKey(result.date)).toBe("2026-03-09");
    expect(result.skipped.map((h) => h.name)).toContain("Independence Day");
  });

  it("survives the Easter long weekend", () => {
    // Thu 2 Apr 2026: Good Friday, weekend, then Easter Monday — the first two
    // working days are Tue 7th and Wed 8th.
    const result = addGhanaWorkingDays(at("2026-04-02"), 2);
    expect(dayKey(result.date)).toBe("2026-04-08");
    const skipped = result.skipped.map((h) => h.name);
    expect(skipped).toContain("Good Friday");
    expect(skipped).toContain("Easter Monday");
  });

  it("preserves the time of day", () => {
    // Expiring at midnight would silently shorten every afternoon reservation.
    const from = new Date("2026-08-10T14:30:00Z");
    const end = addGhanaWorkingDays(from, 2).date;
    expect(end.toISOString()).toBe("2026-08-12T14:30:00.000Z");
  });

  it("crosses a year boundary", () => {
    // Tue 29 Dec 2026 + 2: Wed 30th, Thu 31st. Both working days.
    expect(dayKey(addGhanaWorkingDays(at("2026-12-29"), 2).date)).toBe("2026-12-31");
    // Wed 30 Dec 2026 + 2: Thu 31st, then Fri 1 Jan is New Year → Mon 4 Jan.
    expect(dayKey(addGhanaWorkingDays(at("2026-12-30"), 2).date)).toBe("2027-01-04");
  });

  it("never lands on a non-working day", () => {
    // Sweep a whole year of start dates: whatever the window, it must end on a
    // day the customer's bank is actually open.
    const start = at("2026-01-01");
    for (let i = 0; i < 365; i++) {
      const from = new Date(start.getTime());
      from.setUTCDate(start.getUTCDate() + i);
      const end = addGhanaWorkingDays(from, RESERVATION_WORKING_DAYS).date;
      expect(isGhanaWorkingDay(end), `window from ${dayKey(from)} ended on ${dayKey(end)}`).toBe(
        true,
      );
      expect(end.getTime()).toBeGreaterThan(from.getTime());
    }
  });

  it("grants a grace day when an unconfirmed lunar holiday is in the way", () => {
    // Eid al-Fitr 2026 sits in the table as an estimate. A window running into
    // it must widen rather than risk expiring a paid reservation early.
    const result = addGhanaWorkingDays(at("2026-03-18"), 2);
    expect(result.graceApplied).toBe(true);
    expect(result.skipped.some((h) => h.name.startsWith("Eid"))).toBe(true);
    // Three working days' worth of calendar, not two.
    expect(dayKey(result.date)).toBe("2026-03-24");
  });

  it("does not grant grace when nothing unconfirmed is involved", () => {
    expect(addGhanaWorkingDays(at("2026-08-10"), 2).graceApplied).toBe(false);
  });

  it("refuses a nonsense count rather than guessing", () => {
    expect(() => addGhanaWorkingDays(at("2026-08-10"), -1)).toThrow();
    expect(() => addGhanaWorkingDays(at("2026-08-10"), NaN)).toThrow();
  });
});

describe("the lunar holiday table", () => {
  it("is well formed", () => {
    for (const year of lunarHolidayYears()) {
      for (const h of ghanaPublicHolidays(year).filter((x) => x.name.startsWith("Eid"))) {
        expect(h.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number.isNaN(at(h.date).getTime())).toBe(false);
      }
    }
  });

  it("reports when a year needs a maintainer", () => {
    // Every entry currently ships unconfirmed — nobody has checked the gazette
    // yet — so the grace day is doing the work. Confirming them turns it off.
    expect(lunarHolidaysNeedAttention(2026)).toBe(true);
    // A year with no entries at all is also flagged, rather than silently
    // treating Eid as an ordinary working day.
    expect(lunarHolidaysNeedAttention(2099)).toBe(true);
  });
});
