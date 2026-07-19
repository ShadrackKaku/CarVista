/**
 * Paystack integration helpers.
 *
 * Uses Paystack's server-side "initialize + verify" flow: we create a
 * transaction from the server (secret key), redirect the customer to Paystack's
 * hosted checkout (which supports cards AND Mobile Money in Ghana), then verify
 * the result — reinforced by a webhook for reliability.
 *
 * Docs: https://paystack.com/docs/payments/accept-payments/
 */
import crypto from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

export function isPaystackConfigured(): boolean {
  return !!process.env.PAYSTACK_SECRET_KEY;
}

export interface InitializeParams {
  email: string;
  /** Amount in GHS (major units). Converted to pesewas internally. */
  amountGhs: number;
  reference: string;
  callbackUrl: string;
  currency?: "GHS" | "NGN" | "USD";
  metadata?: Record<string, unknown>;
}

export interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initializeTransaction(
  params: InitializeParams,
): Promise<InitializeResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountGhs * 100), // pesewas
      currency: params.currency ?? "GHS",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {},
    }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to initialize Paystack transaction");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export interface VerifyResult {
  status: string; // "success" | "failed" | "abandoned" ...
  amount: number; // pesewas
  currency: string;
  reference: string;
  paidAt: string | null;
  channel: string | null;
}

/**
 * Convert a major-unit amount (GHS) to pesewas the SAME way
 * `initializeTransaction` does, so an expected amount can be compared exactly
 * against what Paystack reports it settled.
 */
export function toPesewas(amountMajor: number): number {
  return Math.round(amountMajor * 100);
}

/**
 * The core payment-integrity check: confirm that a settled transaction is for
 * the exact amount and currency we expected before we fulfil anything. Even
 * though we initialize transactions server-side, re-checking the settled amount
 * defends against reference confusion, partial payments, and currency mix-ups —
 * we never mark an order/installment paid on `status: "success"` alone.
 */
export function settledAsExpected(
  result: { amount: number; currency: string },
  expectedAmountMajor: number,
  expectedCurrency = "GHS",
): boolean {
  return (
    result.amount === toPesewas(expectedAmountMajor) &&
    result.currency.toUpperCase() === expectedCurrency.toUpperCase()
  );
}

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to verify Paystack transaction");
  }
  return {
    status: json.data.status,
    amount: json.data.amount,
    currency: json.data.currency,
    reference: json.data.reference,
    paidAt: json.data.paid_at ?? null,
    channel: json.data.channel ?? null,
  };
}

export interface RefundResult {
  status: string; // Paystack refund status: "pending" | "processing" | "processed" | "failed" ...
  reference: string | null; // the ORIGINAL transaction reference being refunded
}

/**
 * Request a refund for a settled transaction. Paystack processes refunds
 * asynchronously — this returns the initial status; final settlement arrives
 * via the `refund.processed` / `refund.failed` webhook. Omit `amountMajor` to
 * refund the full transaction.
 *
 * Docs: https://paystack.com/docs/payments/refunds/
 */
export async function refundTransaction(
  reference: string,
  amountMajor?: number,
): Promise<RefundResult> {
  const res = await fetch(`${PAYSTACK_BASE}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction: reference,
      ...(amountMajor != null ? { amount: toPesewas(amountMajor) } : {}),
    }),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Failed to initiate Paystack refund");
  }
  return {
    status: json.data?.status ?? "pending",
    reference: json.data?.transaction?.reference ?? reference,
  };
}

/** Verify the `x-paystack-signature` header on a webhook payload. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");
  // timing-safe compare
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
