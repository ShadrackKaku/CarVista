import {
  Banknote,
  Calculator,
  Coins,
  FileSearch,
  Landmark,
  Receipt,
  Ship,
  type LucideIcon,
} from "lucide-react";

/**
 * The tools workspace.
 *
 * One registry drives the rail, the tools grid, the sidebar's Tools section and
 * the command palette, so a tool is added in exactly one place.
 *
 * `status: "SOON"` items render but do not link — they set the shape of the
 * workspace before the data behind them exists, which is honest about what
 * works today without hiding the roadmap.
 */
export interface Tool {
  id: string;
  name: string;
  /** Rail label — shorter than `name` where the full name would wrap. */
  short: string;
  href: string;
  icon: LucideIcon;
  blurb: string;
  status: "LIVE" | "SOON";
  /** Extra search terms for the command palette. */
  keywords?: string[];
}

export const TOOLS: Tool[] = [
  {
    id: "landed-cost",
    name: "Landed cost & import duty",
    short: "Landed cost",
    href: "/app/calculators/import-duty",
    icon: Calculator,
    blurb:
      "What the car actually costs on your driveway — duty, levies, shipping and clearing, priced off real customs assessments.",
    status: "LIVE",
    keywords: ["duty", "customs", "gra", "icums", "clearing", "tax", "hdv"],
  },
  {
    id: "shipping",
    name: "Shipping cost",
    short: "Shipping",
    href: "/app/calculators/shipping",
    icon: Ship,
    blurb: "RoRo against container, port by port, with transit times into Tema and Takoradi.",
    status: "LIVE",
    keywords: ["roro", "container", "freight", "tema", "takoradi", "port"],
  },
  {
    id: "financing",
    name: "Financing & repayments",
    short: "Financing",
    href: "/app/calculators/financing",
    icon: Banknote,
    blurb: "Monthly repayment, total interest and a full amortisation schedule.",
    status: "LIVE",
    keywords: ["loan", "credit", "interest", "monthly", "amortisation", "repayment"],
  },
  {
    id: "taxes",
    name: "Taxes & duties explained",
    short: "Taxes & duties",
    href: "/app/calculators/taxes",
    icon: Receipt,
    blurb:
      "Every levy on an imported vehicle, what it is charged on, and the over-age penalty bands — in plain language.",
    status: "LIVE",
    keywords: [
      "duty",
      "duties",
      "tax",
      "taxes",
      "vat",
      "nhil",
      "getfund",
      "levy",
      "levies",
      "penalty",
      "overage",
      "age",
      "rates",
    ],
  },
  {
    id: "fx",
    name: "Currency & FX rates",
    short: "Currency & FX",
    href: "/app/calculators/fx",
    icon: Coins,
    blurb: "The customs exchange rates for the current week, the way ICUMS publishes them.",
    status: "SOON",
    keywords: ["exchange", "rate", "dollar", "cedi", "usd", "eur", "gbp", "forex"],
  },
  {
    id: "hs-code",
    name: "HS code lookup",
    short: "HS code lookup",
    href: "/app/calculators/hs-code",
    icon: FileSearch,
    blurb: "Find the tariff line for any vehicle or part, and the duty rate that comes with it.",
    status: "SOON",
    keywords: ["tariff", "classification", "harmonised", "harmonized", "code", "8703"],
  },
  {
    id: "share-bill",
    name: "Share a duty bill",
    short: "Share a bill",
    href: "/app/calculators/share-bill",
    icon: Landmark,
    blurb:
      "Paste a real ICUMS assessment. It sharpens everyone's estimate — including your next one.",
    status: "LIVE",
    keywords: ["contribute", "assessment", "icums", "receipt", "verify"],
  },
];

export const LIVE_TOOLS = TOOLS.filter((t) => t.status === "LIVE");

export function toolByHref(href: string): Tool | undefined {
  return TOOLS.find((t) => t.href === href);
}
