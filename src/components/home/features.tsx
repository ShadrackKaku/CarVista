import { BadgeCheck, Banknote, Headphones, Lock, Ship, Sparkles } from "lucide-react";

const features = [
  {
    icon: BadgeCheck,
    title: "Verified Dealers & Sellers",
    desc: "Every dealer is vetted and badged so you buy with total confidence.",
  },
  {
    icon: Ship,
    title: "End-to-End Import",
    desc: "From auction to your doorstep — we source, ship, clear and deliver.",
  },
  {
    icon: Banknote,
    title: "Transparent Pricing",
    desc: "Live duty & shipping calculators mean zero hidden costs at the port.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    desc: "Mobile Money, Paystack & bank transfer — all protected end to end.",
  },
  {
    icon: Sparkles,
    title: "Genuine Parts",
    desc: "OEM-matched spare parts with fitment search for your exact vehicle.",
  },
  {
    icon: Headphones,
    title: "Local Support",
    desc: "A Ghana-based team on WhatsApp whenever you need a hand.",
  },
];

export function Features() {
  return (
    <section className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Why CarVista
        </span>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Everything automotive, in one trusted place
        </h2>
        <p className="mt-3 text-muted-foreground">
          We've reimagined how Ghana buys, imports and maintains vehicles — built around trust,
          transparency and convenience.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/40 dark:text-brand-300">
              <f.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
