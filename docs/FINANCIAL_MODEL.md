# CarVista — Financial Model (starter)

> A **simple, honest** projection you plug real numbers into. It is **not** a
> forecast — it's a structure and a set of levers. Every number below is an
> illustrative assumption to be replaced with your own data as you learn it.
> Open [`financial-model.csv`](./financial-model.csv) in Google Sheets or Excel
> to edit and chart it live.

---

## How the model works

Revenue is built from three early lines (the ones that turn on in Horizon 1 of
the [strategy blueprint]). Everything is driven by a handful of **assumptions**
— change those, and the whole projection updates.

### The drivers (assumptions — edit these)

| Driver | Base-case value | Meaning |
| --- | --- | --- |
| Imports in month 1 | **3** | Import journeys you broker in the first month |
| Import growth | **20% / month** | Month-over-month growth in imports |
| Import service fee | **GHS 12,000** | ~4% margin on a ~GHS 300,000 car |
| Import variable cost | **GHS 3,000** | Inspection + ops cost per import |
| Dealer subs (start) | **5**, **+3 / month** | Dealers paying a subscription |
| Dealer sub price | **GHS 300 / month** | Per dealer |
| Parts GMV (start) | **GHS 20,000 / month**, **+15% / month** | Value of parts sold |
| Parts take-rate | **8%** | Your cut of parts GMV |
| Fixed opex | **GHS 25,000 / month** | A lean team + infra + ops |
| Starting cash | **GHS 600,000** | From the raise (~US$50k placeholder) |

### The formulas

```
import_revenue   = imports × import_fee
import_gross     = imports × (import_fee − import_variable_cost)
dealer_revenue   = active_subs × sub_price
parts_revenue    = parts_GMV × parts_take_rate
total_revenue    = import_revenue + dealer_revenue + parts_revenue
gross_profit     = import_gross + dealer_revenue + parts_revenue
net_cashflow     = gross_profit − fixed_opex
cash_balance     = previous_cash + net_cashflow
```

(Dealer and parts revenue are treated as ~full margin for simplicity — refine
with real costs.)

---

## Illustrative 12-month base case

All figures in **GHS**.

| Mo | Imports | Subs | Import rev | Dealer | Parts | **Total rev** | Gross profit | Net cashflow | Cash |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 3 | 5 | 36,000 | 1,500 | 1,600 | **39,100** | 30,100 | 5,100 | 605,100 |
| 2 | 4 | 8 | 48,000 | 2,400 | 1,840 | **52,240** | 40,240 | 15,240 | 620,340 |
| 3 | 4 | 11 | 48,000 | 3,300 | 2,116 | **53,416** | 41,416 | 16,416 | 636,756 |
| 4 | 5 | 14 | 60,000 | 4,200 | 2,433 | **66,633** | 51,633 | 26,633 | 663,389 |
| 5 | 6 | 17 | 72,000 | 5,100 | 2,798 | **79,898** | 61,898 | 36,898 | 700,287 |
| 6 | 7 | 20 | 84,000 | 6,000 | 3,218 | **93,218** | 72,218 | 47,218 | 747,505 |
| 7 | 9 | 23 | 108,000 | 6,900 | 3,701 | **118,601** | 91,601 | 66,601 | 814,106 |
| 8 | 11 | 26 | 132,000 | 7,800 | 4,256 | **144,056** | 111,056 | 86,056 | 900,162 |
| 9 | 13 | 29 | 156,000 | 8,700 | 4,894 | **169,594** | 130,594 | 105,594 | 1,005,756 |
| 10 | 15 | 32 | 180,000 | 9,600 | 5,629 | **195,229** | 150,229 | 125,229 | 1,130,985 |
| 11 | 19 | 35 | 228,000 | 10,500 | 6,473 | **244,973** | 187,973 | 162,973 | 1,293,958 |
| 12 | 22 | 38 | 264,000 | 11,400 | 7,444 | **282,844** | 216,844 | 191,844 | 1,485,802 |

---

## Read this before you trust any number

- **This base case is intentionally lean and therefore rosy** — it stays cash
  positive because fixed opex is only GHS 25,000/month. The moment you add a real
  senior-engineer salary (say GHS 40–80k/month), the early months go into
  **burn** — which is normal and fine. **Raise the `Opex` column in the CSV to
  your real number and watch the runway.** That is the single most important edit.
- **Imports are the engine.** Notice how total revenue tracks the import count —
  the wedge is what makes the model work. Protect it.
- **The point is the levers, not these values.** The three questions this model
  answers: *How many imports per month do I need to break even? How much runway
  does the raise buy at real opex? Which lever (imports, fee, or opex) moves the
  outcome most?*

## Metrics to keep alongside this model

- **Revenue per completed import** (and gross margin after inspection/ops cost).
- **Buyer CAC** vs. that margin.
- **Attach rate** — of a buyer, how many also service / insure / resell with you.
- **Trusted transactions completed** — the north-star from the strategy blueprint.

---

_A starter model, not financial advice. Validate every assumption with real
Ghanaian market and cost data before using it to raise._

[strategy blueprint]: ./PROJECT_GUIDE.md
