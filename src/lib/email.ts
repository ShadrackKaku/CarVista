import nodemailer from "nodemailer";
import { SITE } from "@/lib/constants";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  // In development without SMTP configured, log instead of throwing.
  if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER) {
    console.info(`[email:dev] To: ${to} — ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? `${SITE.name} <no-reply@carvista.com.gh>`,
    to,
    subject,
    html,
  });
}

function layout(title: string, body: string) {
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#20214a">
    <div style="font-size:22px;font-weight:800;color:#5a5fe0;margin-bottom:24px">CarVista</div>
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #eceefd;margin:28px 0" />
    <p style="font-size:12px;color:#6b7280">
      ${SITE.name} — ${SITE.tagline}<br/>
      ${SITE.address}
    </p>
  </div>`;
}

export function verificationEmail(name: string, url: string) {
  return layout(
    "Verify your email",
    `<p>Hi ${name},</p>
     <p>Welcome to CarVista! Please confirm your email address to activate your account.</p>
     <p style="margin:24px 0">
       <a href="${url}" style="background:#5a5fe0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Verify Email</a>
     </p>
     <p style="font-size:13px;color:#6b7280">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`,
  );
}

export function passwordResetEmail(name: string, url: string) {
  return layout(
    "Reset your password",
    `<p>Hi ${name},</p>
     <p>We received a request to reset your CarVista password. Click below to choose a new one.</p>
     <p style="margin:24px 0">
       <a href="${url}" style="background:#5a5fe0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
     </p>
     <p style="font-size:13px;color:#6b7280">This link expires in 1 hour. If you didn't request this, no action is needed.</p>`,
  );
}
