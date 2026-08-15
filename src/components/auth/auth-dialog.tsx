"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Ship, Wrench } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/auth/google-button";
import { cn } from "@/lib/utils";
import { OPEN_AUTH_DIALOG, type AuthDialogMode, type AuthDialogOptions } from "@/lib/ui-events";
import { SITE } from "@/lib/constants";

const PERKS = [
  { icon: BadgeCheck, title: "Verified dealers", desc: "Buy with total confidence." },
  { icon: Ship, title: "End-to-end import", desc: "Auction to your doorstep." },
  { icon: Wrench, title: "Parts & services", desc: "Everything in one place." },
];

/**
 * Sign-in and registration as a dialog.
 *
 * Mounted once near the root, opened from anywhere with `openAuthDialog()`.
 * Signing in stops throwing people off the page they were reading — they come
 * back to exactly where they were, one refresh later. `/login` and `/register`
 * stay as real pages for direct links, email links and search engines.
 */
export function AuthDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthDialogMode>("login");
  const [callbackUrl, setCallbackUrl] = useState<string | undefined>();

  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<AuthDialogOptions>).detail ?? {};
      setMode(detail.mode ?? "login");
      setCallbackUrl(detail.callbackUrl);
      setOpen(true);
    }
    window.addEventListener(OPEN_AUTH_DIALOG, onOpen);
    return () => window.removeEventListener(OPEN_AUTH_DIALOG, onOpen);
  }, []);

  function onSuccess() {
    setOpen(false);
    if (callbackUrl) router.push(callbackUrl);
  }

  const isLogin = mode === "login";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto sm:max-w-lg">
        <DialogTitle className="sr-only">
          {isLogin ? `Sign in to ${SITE.name}` : `Create a ${SITE.name} account`}
        </DialogTitle>

        {/* Heading first, so the dialog's close button has clear space. */}
        <div className="pr-8">
          <h2 className="font-display text-xl font-bold">
            {isLogin ? "Welcome back" : `Join ${SITE.name}`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin
              ? "Sign in to manage your vehicles, imports and orders."
              : "One account for buying, importing, parts and services."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(["login", "register"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                mode === value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <GoogleButton />

        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {isLogin ? (
          <LoginForm callbackUrl={callbackUrl} onSuccess={onSuccess} idPrefix="dlg-login" />
        ) : (
          <RegisterForm
            callbackUrl={callbackUrl}
            onSuccess={onSuccess}
            idPrefix="dlg-register"
            compact
          />
        )}

        {isLogin && (
          <ul className="grid gap-2 border-t pt-4 sm:grid-cols-3">
            {PERKS.map((perk) => (
              <li key={perk.title} className="flex items-start gap-2 text-xs">
                <perk.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                <span>
                  <span className="block font-medium text-foreground">{perk.title}</span>
                  <span className="text-muted-foreground">{perk.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
