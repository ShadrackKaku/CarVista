import Link from "next/link";
import { ArrowLeft, BadgeCheck, Ship, Wrench } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* Right — brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 lg:block">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div>
            <h2 className="max-w-md font-display text-3xl font-bold leading-tight">
              Ghana's complete automotive marketplace & import platform.
            </h2>
            <p className="mt-4 max-w-md text-brand-100">
              Join thousands buying, importing and maintaining vehicles the smart way.
            </p>
          </div>
          <div className="space-y-5">
            {[
              { icon: BadgeCheck, title: "Verified dealers", desc: "Buy with total confidence." },
              { icon: Ship, title: "End-to-end import", desc: "Auction to your doorstep." },
              { icon: Wrench, title: "Genuine parts & services", desc: "Everything in one place." },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-brand-100">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
