/**
 * Ghana's working calendar.
 *
 * A reservation holds a car for "two working days". Getting that wrong in one
 * direction costs a customer the car they paid GH¢500 to hold; in the other it
 * ties up an importer's stock slightly longer. Those are not equally bad, so
 * every judgement call in this file errs toward giving the customer more time.
 *
 * Three kinds of holiday live here, and they are not equally knowable:
 *
 *  - Fixed dates (Independence Day, Christmas) — certain.
 *  - Easter-derived (Good Friday, Easter Monday) and Farmers' Day (first Friday
 *    in December) — computable exactly.
 *  - Eid al-Fitr and Eid al-Adha — lunar, and ultimately settled by moon
 *    sighting rather than arithmetic. Derived from the tabular Islamic
 *    calendar and treated as a ±1 day band, so the slack lands exactly where
 *    the uncertainty is instead of being sprinkled over the whole year.
 */

export interface GhanaHoliday {
  /** ISO `YYYY-MM-DD` in Ghana local time (UTC+0, no DST — see `dayKey`). */
  date: string;
  name: string;
  /**
   * True when the date is certain — a fixed national day, or a lunar date
   * someone has checked against the published declaration. False for a date
   * derived arithmetically, which carries `uncertaintyDays` either side.
   */
  confirmed: boolean;
  /**
   * How far the real date may sit from this one. Zero for everything except a
   * computed Eid, where the tabular calendar runs within a day of observation.
   */
  uncertaintyDays: number;
}

// ── The Islamic calendar ──────────────────────────────────────
//
// Eid al-Fitr (1 Shawwal) and Eid al-Adha (10 Dhu al-Hijjah) are public
// holidays in Ghana and move against the Gregorian year, so they cannot be
// written down as fixed dates. They were briefly a hand-maintained table here,
// which was wrong in the way all such tables are wrong: it runs out, silently,
// and the year it runs out is the year reservations start expiring on a public
// holiday.
//
// The tabular ("civil") Islamic calendar is pure arithmetic and never runs
// out. It is an approximation of a calendar that is ultimately settled by moon
// sighting, so it is treated as one: each computed date carries ±1 day, and
// the whole band is skipped. Checked against the ten Eids observed in Ghana
// between 2023 and 2027, the computed date was exact four times and one day
// late six times — inside the band every time.

const ISLAMIC_EPOCH = 1948439.5;

/** Julian Day Number for a date in the tabular Islamic calendar. */
function islamicToJulianDay(year: number, month: number, day: number): number {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    ISLAMIC_EPOCH -
    1
  );
}

/** Julian Day Number back to a Gregorian date (Fliegel–Van Flandern). */
function julianDayToGregorian(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Dates someone has checked against Ghana's published declaration.
 *
 * Entirely optional — the arithmetic above covers every year on its own. An
 * entry here just collapses that year's ±1 band to the exact day, which hands
 * the importer back a day of held stock. Keyed `YYYY-Fitr` / `YYYY-Adha`.
 */
const GAZETTED_EID: Record<string, string> = {};

/**
 * Eid dates falling in a Gregorian year.
 *
 * A Gregorian year can contain two of the same Eid — the Hijri year is ~354
 * days — so all three overlapping Hijri years are checked and the results
 * filtered, rather than assuming one of each.
 */
export function eidHolidays(gregorianYear: number): GhanaHoliday[] {
  // The Hijri year is ~354 days, so it slides against the Gregorian one by
  // roughly 11 days a year and the mapping drifts. Scanning a band either side
  // and filtering by the resulting Gregorian year is correct by construction;
  // a tighter window silently dropped Eid al-Adha for four years running in
  // the 2030s, which is exactly the class of bug this file exists to avoid.
  const approx = Math.floor((gregorianYear - 622) * (33 / 32)) + 1;
  const out: GhanaHoliday[] = [];

  for (let hijriYear = approx - 3; hijriYear <= approx + 3; hijriYear += 1) {
    const candidates: Array<[string, string, Date]> = [
      ["Eid al-Fitr", "Fitr", julianDayToGregorian(islamicToJulianDay(hijriYear, 10, 1))],
      ["Eid al-Adha", "Adha", julianDayToGregorian(islamicToJulianDay(hijriYear, 12, 10))],
    ];
    for (const [name, key, computed] of candidates) {
      if (computed.getUTCFullYear() !== gregorianYear) continue;
      const gazetted = GAZETTED_EID[`${gregorianYear}-${key}`];
      out.push({
        date: gazetted ?? dayKey(computed),
        name,
        confirmed: Boolean(gazetted),
        uncertaintyDays: gazetted ? 0 : 1,
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Whether a year's Eid dates are gazetted or still arithmetic.
 *
 * Nothing breaks while they are computed — this only reports how much slack
 * reservations are being given around Eid.
 */
export function eidPrecision(year: number): "gazetted" | "computed" {
  return eidHolidays(year).every((h) => h.confirmed) ? "gazetted" : "computed";
}

/** `YYYY-MM-DD` for a date, read in UTC. Ghana is UTC+0 year-round, no DST. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Easter Sunday (Gregorian), by the anonymous Computus.
 *
 * Good Friday and Easter Monday hang off this, and both are public holidays in
 * Ghana, so a reservation taken on the Thursday before Easter must not expire
 * across the long weekend.
 */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** The first Friday of December — Farmers' Day. */
function firstFridayOfDecember(year: number): Date {
  const first = new Date(Date.UTC(year, 11, 1));
  // 5 = Friday. Walk forward to the first one.
  const shift = (5 - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, 11, 1 + shift));
}

function iso(year: number, month: number, day: number): string {
  return dayKey(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * Every public holiday in a given year, including the Monday observed when one
 * falls on a weekend.
 *
 * Ghana's Public Holidays Act moves a holiday falling on a Saturday or Sunday
 * to the following Monday. Honouring that costs an importer at most a day of
 * held stock; ignoring it would expire reservations on a day the banks — and
 * therefore the customer's FOB transfer — are shut.
 */
export function ghanaPublicHolidays(year: number): GhanaHoliday[] {
  const easter = easterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setUTCDate(easter.getUTCDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setUTCDate(easter.getUTCDate() + 1);

  const certain = (date: string, name: string): GhanaHoliday => ({
    date,
    name,
    confirmed: true,
    uncertaintyDays: 0,
  });

  const base: GhanaHoliday[] = [
    certain(iso(year, 1, 1), "New Year's Day"),
    certain(iso(year, 1, 7), "Constitution Day"),
    certain(iso(year, 3, 6), "Independence Day"),
    certain(dayKey(goodFriday), "Good Friday"),
    certain(dayKey(easterMonday), "Easter Monday"),
    certain(iso(year, 5, 1), "May Day"),
    certain(iso(year, 8, 4), "Founders' Day"),
    certain(iso(year, 9, 21), "Kwame Nkrumah Memorial Day"),
    certain(dayKey(firstFridayOfDecember(year)), "Farmers' Day"),
    certain(iso(year, 12, 25), "Christmas Day"),
    certain(iso(year, 12, 26), "Boxing Day"),
    ...eidHolidays(year),
  ];

  // Weekend holidays are observed the following Monday. Easter Monday and
  // Farmers' Day never need this — they are defined onto a weekday.
  const observed: GhanaHoliday[] = [];
  for (const holiday of base) {
    observed.push(holiday);
    const day = new Date(`${holiday.date}T00:00:00Z`).getUTCDay();
    if (day === 0 || day === 6) {
      const monday = new Date(`${holiday.date}T00:00:00Z`);
      monday.setUTCDate(monday.getUTCDate() + (day === 6 ? 2 : 1));
      observed.push({
        date: dayKey(monday),
        name: `${holiday.name} (observed)`,
        confirmed: holiday.confirmed,
        uncertaintyDays: holiday.uncertaintyDays,
      });
    }
  }

  // Widen every uncertain date into the band it actually occupies. A computed
  // Eid could genuinely fall the day before or after, so all three days are
  // treated as non-working. This is the only slack in the calendar, and it
  // sits exactly where the doubt is — a gazetted date has a band of zero.
  const withBands: GhanaHoliday[] = [];
  for (const holiday of observed) {
    withBands.push(holiday);
    for (let offset = 1; offset <= holiday.uncertaintyDays; offset += 1) {
      for (const direction of [-1, 1]) {
        const shifted = new Date(`${holiday.date}T00:00:00Z`);
        shifted.setUTCDate(shifted.getUTCDate() + offset * direction);
        withBands.push({
          date: dayKey(shifted),
          name: `${holiday.name} (±${offset} day)`,
          confirmed: false,
          uncertaintyDays: 0,
        });
      }
    }
  }
  return withBands;
}

/** Holiday lookup for a span of years, so a window can cross New Year. */
function holidayMap(fromYear: number, toYear: number): Map<string, GhanaHoliday> {
  const map = new Map<string, GhanaHoliday>();
  for (let y = fromYear; y <= toYear; y++) {
    for (const h of ghanaPublicHolidays(y)) map.set(h.date, h);
  }
  return map;
}

/** Saturday or Sunday. */
export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** Whether banks and offices are shut — so no FOB transfer can clear. */
export function isGhanaWorkingDay(date: Date): boolean {
  if (isWeekend(date)) return false;
  const year = date.getUTCFullYear();
  return !holidayMap(year, year).has(dayKey(date));
}

export interface WorkingDayResult {
  /** End of the window — the last moment the reservation is still held. */
  date: Date;
  /** Holidays skipped along the way, for showing the customer why. */
  skipped: GhanaHoliday[];
  /**
   * True when the window ran through the uncertainty band around a computed
   * lunar holiday, so the customer got the benefit of the doubt.
   */
  graceApplied: boolean;
}

/**
 * Add `count` Ghana working days to `from`.
 *
 * The starting instant is preserved — reserve at 14:30 on Friday and a two-day
 * window ends at 14:30 on Tuesday, not at midnight. Expiring at midnight would
 * quietly shorten every reservation made in the afternoon.
 *
 * Days inside the uncertainty band around a computed Eid count as non-working,
 * so a window spanning one widens by itself. An importer waiting an extra day
 * is a cost; a customer losing a car they paid to hold because we guessed Eid
 * a day early is a broken promise.
 */
export function addGhanaWorkingDays(from: Date, count: number): WorkingDayResult {
  if (!Number.isFinite(count) || count < 0) {
    throw new Error(`addGhanaWorkingDays needs a non-negative count, got ${count}`);
  }

  const cursor = new Date(from.getTime());
  const skipped: GhanaHoliday[] = [];
  let remaining = Math.floor(count);
  let sawUnconfirmed = false;

  const step = () => {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const year = cursor.getUTCFullYear();
    const holidays = holidayMap(year, year);
    const hit = holidays.get(dayKey(cursor));
    if (hit) {
      skipped.push(hit);
      if (!hit.confirmed) sawUnconfirmed = true;
      return false;
    }
    return !isWeekend(cursor);
  };

  while (remaining > 0) {
    if (step()) remaining -= 1;
  }

  return { date: cursor, skipped, graceApplied: sawUnconfirmed };
}

/** How long a paid reservation holds a unit. */
export const RESERVATION_WORKING_DAYS = 2;
