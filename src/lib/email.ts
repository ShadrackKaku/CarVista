import nodemailer from "nodemailer";
import { SITE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const FROM = process.env.EMAIL_FROM ?? `${SITE.name} <no-reply@${SITE.domain}>`;

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * What actually happened to the message.
 *
 * `sendMail` used to return void, and returned it just as happily when it had
 * done nothing at all — with no provider configured it logged a line to the
 * console and came back clean. Every caller read that as success, which meant
 * password resets, email verification, order confirmations and admin invites
 * all reported themselves sent on a deployment with no mail provider. Silence
 * is the one failure mode email must not have.
 */
export type MailOutcome =
  | { delivered: true; via: "resend" | "smtp" }
  | { delivered: false; reason: "not-configured" | "failed"; detail?: string };

/** True when no provider is configured at all — a deployment mistake, not a bug. */
export function isMailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY ||
      (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER),
  );
}

/**
 * Send an email through the first configured provider.
 *
 *   1. Resend (RESEND_API_KEY)    — recommended, via REST (no dependency)
 *   2. SMTP (EMAIL_SERVER_*)      — any SMTP provider, via nodemailer
 *   3. Nothing                    — logged, and reported as undelivered
 *
 * Never throws. Callers that ignore the result behave exactly as before — a
 * failed order-confirmation must not turn a paid order into a 500 — while
 * callers who need to tell the user whether the message went can read it.
 */
export async function sendMail({ to, subject, html }: SendMailOptions): Promise<MailOutcome> {
  const hasSmtp = Boolean(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER);
  let failure: string | undefined;

  // 1) Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: FROM, to, subject, html }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Resend error ${res.status}: ${detail}`);
      }
      return { delivered: true, via: "resend" };
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
      console.error("[email:resend]", error);
      // Falls through to SMTP when one is configured.
    }
  }

  // 2) SMTP
  if (hasSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });
      await transporter.sendMail({ from: FROM, to, subject, html });
      return { delivered: true, via: "smtp" };
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
      console.error("[email:smtp]", error);
    }
  }

  if (failure) {
    return { delivered: false, reason: "failed", detail: failure };
  }

  // 3) Nothing configured. Fine locally, a misconfiguration in production —
  // said loudly enough to find in the logs, because the symptom otherwise is
  // simply that nobody ever receives anything.
  const message = `[email] No provider configured — "${subject}" to ${to} was NOT sent. Set RESEND_API_KEY (and EMAIL_FROM), or the EMAIL_SERVER_* variables.`;
  if (process.env.NODE_ENV === "production") console.error(message);
  else console.info(`[email:dev] To: ${to} — ${subject}`);

  return { delivered: false, reason: "not-configured" };
}

function layout(title: string, body: string) {
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#20214a">
    <div style="font-size:22px;font-weight:800;color:#5a5fe0;margin-bottom:24px">${SITE.name}</div>
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #eceefd;margin:28px 0" />
    <p style="font-size:12px;color:#6b7280">
      ${SITE.name} — ${SITE.tagline}<br/>
      ${SITE.address}
    </p>
  </div>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="background:#5a5fe0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">${label}</a></p>`;

export function verificationEmail(name: string, url: string) {
  return layout(
    "Verify your email",
    `<p>Hi ${name},</p>
     <p>Welcome to ${SITE.name}! Please confirm your email address to activate your account.</p>
     ${button(url, "Verify Email")}
     <p style="font-size:13px;color:#6b7280">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`,
  );
}

export function passwordResetEmail(name: string, url: string) {
  return layout(
    "Reset your password",
    `<p>Hi ${name},</p>
     <p>We received a request to reset your ${SITE.name} password. Click below to choose a new one.</p>
     ${button(url, "Reset Password")}
     <p style="font-size:13px;color:#6b7280">This link expires in 1 hour. If you didn't request this, no action is needed.</p>`,
  );
}

/**
 * The email that reaches somebody an administrator created an account for.
 *
 * It carries a link, never a password. The account exists with no password at
 * all until they set one through this link, so there is nothing in this message
 * that would compromise them if the mailbox were read by someone else — and no
 * member of staff ever knows their credentials.
 */
export function accountInviteEmail(opts: {
  name: string;
  url: string;
  roleLabel: string;
  invitedBy?: string | null;
  expiresInDays: number;
}) {
  const from = opts.invitedBy ? ` by ${opts.invitedBy}` : "";
  return layout(
    `Your ${SITE.name} account is ready`,
    `<p>Hi ${opts.name},</p>
     <p>An account has been created for you on ${SITE.name}${from}, set up as <strong>${opts.roleLabel}</strong>.</p>
     <p>Choose a password to finish setting it up — you pick it yourself, and nobody at ${SITE.name} sees it.</p>
     ${button(opts.url, "Set your password")}
     <p style="font-size:13px;color:#6b7280">This link works once and expires in ${opts.expiresInDays} days. If you weren't expecting this, you can ignore it — the account cannot be used until a password is set.</p>`,
  );
}

export interface OrderConfirmationData {
  name: string;
  orderNumber: string;
  total: number | string;
  items: { name: string; quantity: number; price: number | string }[];
  ordersUrl: string;
}

export function orderConfirmationEmail(data: OrderConfirmationData) {
  const rows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#374151">${i.name} × ${i.quantity}</td><td style="padding:6px 0;text-align:right;color:#374151">${formatCurrency(
          i.price,
        )}</td></tr>`,
    )
    .join("");
  return layout(
    "Your order is confirmed 🎉",
    `<p>Hi ${data.name},</p>
     <p>Thanks for your order! We've received your payment and are getting it ready.</p>
     <p style="margin:16px 0 8px;font-weight:600">Order ${data.orderNumber}</p>
     <table style="width:100%;border-collapse:collapse;font-size:14px">
       ${rows}
       <tr><td style="padding:10px 0 0;border-top:1px solid #eceefd;font-weight:700">Total</td>
       <td style="padding:10px 0 0;border-top:1px solid #eceefd;text-align:right;font-weight:700">${formatCurrency(
         data.total,
       )}</td></tr>
     </table>
     ${button(data.ordersUrl, "View my orders")}
     <p style="font-size:13px;color:#6b7280">We'll notify you when your order ships.</p>`,
  );
}

export function priceDropEmail(
  name: string,
  title: string,
  oldPrice: number,
  newPrice: number,
  url: string,
) {
  return layout(
    "Price drop on a saved vehicle 🎉",
    `<p>Hi ${name},</p>
     <p>Good news — <strong>${title}</strong>, one of your saved vehicles, just dropped in price.</p>
     <p style="font-size:18px;margin:16px 0">
       <span style="text-decoration:line-through;color:#9ca3af">${formatCurrency(oldPrice)}</span>
       &nbsp;→&nbsp;
       <strong style="color:#5a5fe0">${formatCurrency(newPrice)}</strong>
     </p>
     ${button(url, "View the listing")}
     <p style="font-size:13px;color:#6b7280">Prices can move fast — contact the seller soon if you're interested.</p>`,
  );
}

export function savedSearchAlertEmail(
  name: string,
  searchName: string,
  count: number,
  url: string,
) {
  return layout(
    "New matches for your saved search",
    `<p>Hi ${name},</p>
     <p><strong>${count}</strong> new vehicle${count === 1 ? "" : "s"} just matched your saved search <strong>“${searchName}”</strong>.</p>
     ${button(url, "See the new matches")}
     <p style="font-size:13px;color:#6b7280">You're receiving this because you saved this search on ${SITE.name}.</p>`,
  );
}
