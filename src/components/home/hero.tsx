"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calculator, Search, Ship, ShieldCheck } from "lucide-react";
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

type HomeStat = { label: string; value: string };

// Set NEXT_PUBLIC_HERO_VIDEO_URL to an .mp4 URL (e.g. a Cloudinary upload) to
// play a looping background video. Without it, the poster image animates.
const HERO_VIDEO_URL = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;
const HERO_POSTER =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1920&q=70";

export function Hero({ stats = HOME_STATS }: { stats?: HomeStat[] }) {
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
    <section className="relative isolate overflow-hidden">
      {/* Background video / animated poster */}
      <div className="absolute inset-0 -z-10">
        {HERO_VIDEO_URL ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={HERO_POSTER}
            className="h-full w-full object-cover"
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          <div
            className="h-full w-full animate-kenburns bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_POSTER}')` }}
          />
        )}
        {/* Contrast overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/80" />
      </div>

      <div className="container-page relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl"
          >
            Buy, sell & <span className="text-gradient">import cars</span>
            <br className="hidden sm:block" /> the smart way.
          </motion.h1>
        </div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-10 max-w-4xl rounded-2xl border bg-background/95 p-3 backdrop-blur"
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
          <Button asChild variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
            <Link href="/calculators/import-duty">
              <Calculator className="h-4 w-4" /> Import Duty Calculator
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
            <Link href="/import">
              <Ship className="h-4 w-4" /> Import a Car
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
            <Link href="/dealers">
              <ShieldCheck className="h-4 w-4" /> Verified Dealers
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
