import Link from "next/link";
import { Car, Cog, Ship, ShieldCheck, Wrench, Calculator, Package, Users } from "lucide-react";

const categories = [
  { label: "Buy a Car", href: "/vehicles", icon: Car },
  { label: "Import a Car", href: "/import", icon: Ship },
  { label: "Car Parts", href: "/parts", icon: Cog },
  { label: "Dealers", href: "/dealers", icon: ShieldCheck },
  { label: "Services", href: "/services", icon: Wrench },
  { label: "Duty Calculator", href: "/calculators/import-duty", icon: Calculator },
  { label: "Sell a Car", href: "/vehicles/new", icon: Package },
  { label: "Sell Parts", href: "/dashboard/seller", icon: Users },
];

export function CategoryStrip() {
  return (
    <section className="container-page -mt-8 relative z-10">
      <div className="grid grid-cols-4 gap-3 rounded-2xl border bg-card p-4 shadow-card sm:grid-cols-8">
        {categories.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="group flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-colors hover:bg-accent"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/40 dark:text-brand-300">
              <cat.icon className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-medium leading-tight text-muted-foreground group-hover:text-foreground sm:text-xs">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
