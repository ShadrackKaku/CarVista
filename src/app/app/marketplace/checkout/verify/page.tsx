"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type State =
  | { phase: "verifying" }
  | { phase: "success"; orderNumber: string }
  | { phase: "failed"; message: string };

function VerifyInner() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const [state, setState] = useState<State>({ phase: "verifying" });

  useEffect(() => {
    if (!reference) {
      setState({ phase: "failed", message: "No payment reference was provided." });
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/payments/paystack/verify?reference=${encodeURIComponent(reference)}`);
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.status === "success") {
          setState({ phase: "success", orderNumber: data.orderNumber });
        } else {
          setState({
            phase: "failed",
            message:
              data.error ??
              "Your payment could not be confirmed. If you were charged, contact support with your reference.",
          });
        }
      } catch {
        if (active) setState({ phase: "failed", message: "Something went wrong verifying your payment." });
      }
    })();
    return () => {
      active = false;
    };
  }, [reference]);

  if (state.phase === "verifying") {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-500" />
        <h1 className="mt-6 font-display text-2xl font-bold">Confirming your payment…</h1>
        <p className="mt-2 text-muted-foreground">This only takes a moment. Please don't close this page.</p>
      </div>
    );
  }

  if (state.phase === "success") {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <CheckCircle2 className="h-16 w-16 text-success" />
        <h1 className="mt-6 font-display text-3xl font-bold">Payment successful! 🎉</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Your order <span className="font-semibold text-foreground">{state.orderNumber}</span> is
          confirmed and paid. We've emailed your receipt and will notify you when it ships.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild variant="gradient">
            <a href="/dashboard/orders">View my orders</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/app/marketplace/parts">Continue shopping</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-24 text-center">
      <XCircle className="h-16 w-16 text-destructive" />
      <h1 className="mt-6 font-display text-2xl font-bold">Payment not confirmed</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{state.message}</p>
      <div className="mt-8 flex gap-3">
        <Button asChild variant="gradient">
          <a href="/app/marketplace/cart">Back to cart</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/contact">Contact support</a>
        </Button>
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <div className="container-page">
      <Suspense
        fallback={
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          </div>
        }
      >
        <VerifyInner />
      </Suspense>
    </div>
  );
}
