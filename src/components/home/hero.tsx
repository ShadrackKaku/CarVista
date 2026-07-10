"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calculator, Search, Ship, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { POPULAR_BRANDS, BODY_TYPES } from "@/lib/constants";
import { HOME_STATS } from "@/lib/sample-data";

export function Hero() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [keyword, setKeyword] = useState("");

  function search() {
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (bodyType) params.set("bodyType", bodyType);
    if (keyword) params.set("q", keyword);
    router.push(`/vehicles?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden hero-gradient">
      <div className="container-page relative py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1.5 text-sm font-medium text-brand-700 shadow-soft backdrop-blur dark:text-brand-300"
          >
            <Sparkles className="h-4 w-4" />
            Ghana's #1 automotive marketplace & import platform
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl"
          >
            Buy, sell & <span className="text-gradient">import cars</span>
            <br className="hidden sm:block" /> the smart way.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground"
          >
            Thousands of verified vehicles, genuine parts and trusted dealers — plus a live Ghana
            import duty calculator so you know the real landed cost before you buy.
          </motion.p>
        </div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-10 max-w-4xl rounded-2xl border bg-background/90 p-3 shadow-card backdrop-blur"
        >
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="h-12 border-0 bg-muted/60">
                <SelectValue placeholder="Any brand" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bodyType} onValueChange={setBodyType}>
              <SelectTrigger className="h-12 border-0 bg-muted/60">
                <SelectValue placeholder="Body type" />
              </SelectTrigger>
              <SelectContent>
                {BODY_TYPES.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search e.g. Toyota Camry"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              className="h-12 border-0 bg-muted/60"
            />
            <Button size="lg" variant="gradient" className="h-12" onClick={search}>
              <Search className="h-5 w-5" /> Search
            </Button>
          </div>
        </motion.div>

        {/* Quick actions */}
        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline" size="sm" className="bg-background/70">
            <Link href="/calculators/import-duty">
              <Calculator className="h-4 w-4" /> Import Duty Calculator
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="bg-background/70">
            <Link href="/import">
              <Ship className="h-4 w-4" /> Import a Car
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="bg-background/70">
            <Link href="/dealers">
              <ShieldCheck className="h-4 w-4" /> Verified Dealers
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {HOME_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl font-bold text-brand-700 dark:text-brand-400 sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
