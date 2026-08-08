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
 *  - Eid al-Fitr and Eid al-Adha — lunar. They are *declared*, not calculated,
 *    by executive instrument, and the observed date can shift a day from any
 *    astronomical estimate. They cannot be computed, so they are a maintained
 *    table, and anything unconfirmed buys the customer a grace day rather than
 *    silently expiring their reservation early.
 */

export interface GhanaHoliday {
  /** ISO `YYYY-MM-DD` in Ghana local time (UTC+0, no DST — see `dayKey`). */
  date: string;
  name: string;
  /**
   * False for a lunar date taken from an astronomical estimate rather than the
   * published national declaration. Unconfirmed dates trigger a grace day.
   */
  confirmed: boolean;
}

/**
 * Declared Eid dates, by year.
 *
 * Ghana gazettes these; until someone checks the gazette and flips `confirmed`,
 * the entry is treated as approximate. **This table needs a new year adding
 * annually** — `lunarHolidaysNeedAttention` reports when, and the reservation
 * window widens by a day in the meantime, so running dry degrades the customer
 * experience slightly instead of breaking the promise made to them.
 */
const DECLARED_LUNAR_HOLIDAYS: Record<number, GhanaHoliday[]> = {
  2026: [
    { date: "2026-03-20", name: "Eid al-Fitr", confirmed: false },
    { date: "2026-05-27", name: "Eid al-Adha", confirmed: false },
  ],
  2027: [
    { date: "2027-03-10", name: "Eid al-Fitr", confirmed: false },
    { date: "2027-05-17", name: "Eid al-Adha", confirmed: false },
  ],
};

/** Years the lunar table covers at all. */
export function lunarHolidayYears(): number[] {
  return Object.keys(DECLARED_LUNAR_HOLIDAYS)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * Whether the lunar table needs maintenance for a given year — either it has no
 * entries at all, or every entry is still an unconfirmed estimate.
 */
export function lunarHolidaysNeedAttention(year: number): boolean {
  const entries = DECLARED_LUNAR_HOLIDAYS[year];
  if (!entries || entries.length === 0) return true;
  return entries.some((h) => !h.confirmed);
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

  const base: GhanaHoliday[] = [
    { date: iso(year, 1, 1), name: "New Year's Day", confirmed: true },
    { date: iso(year, 1, 7), name: "Constitution Day", confirmed: true },
    { date: iso(year, 3, 6), name: "Independence Day", confirmed: true },
    { date: dayKey(goodFriday), name: "Good Friday", confirmed: true },
    { date: dayKey(easterMonday), name: "Easter Monday", confirmed: true },
    { date: iso(year, 5, 1), name: "May Day", confirmed: true },
    { date: iso(year, 8, 4), name: "Founders' Day", confirmed: true },
    { date: iso(year, 9, 21), name: "Kwame Nkrumah Memorial Day", confirmed: true },
    { date: dayKey(firstFridayOfDecember(year)), name: "Farmers' Day", confirmed: true },
    { date: iso(year, 12, 25), name: "Christmas Day", confirmed: true },
    { date: iso(year, 12, 26), name: "Boxing Day", confirmed: true },
    ...(DECLARED_LUNAR_HOLIDAYS[year] ?? []),
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
      });
    }
  }
  return observed;
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
   * True when an unconfirmed lunar date fell in or near the window and the
   * customer was given an extra working day rather than risk expiring early.
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
 * If the window runs through a lunar holiday we have not confirmed against the
 * gazette, the customer gets one more working day. An importer waiting an extra
 * day is a cost; a customer losing a car they paid to hold because we guessed
 * Eid a day early is a broken promise.
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

  if (sawUnconfirmed) {
    // One more working day, for the same reason the whole file exists.
    let granted = false;
    while (!granted) granted = step();
  }

  return { date: cursor, skipped, graceApplied: sawUnconfirmed };
}

/** How long a paid reservation holds a unit. */
export const RESERVATION_WORKING_DAYS = 2;
