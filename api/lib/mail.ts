/**
 * Centralized SMTP mail utility (Nodemailer).
 *
 * All admin email sending (the Verification Result email and the legacy
 * /api/send-email endpoint) goes through sendMail() below. Credentials are
 * read from environment variables only — never hardcoded, never sent to
 * the client.
 *
 * Required env vars:
 *   SMTP_HOST
 *   SMTP_PORT
 *   SMTP_USER
 *   SMTP_PASSWORD
 *   SMTP_FROM        — the "from" address, e.g. noreply@karachiechallan.pk
 *   SMTP_FROM_NAME    — optional display name, e.g. "Karachi E-Challan"
 */
import nodemailer, { type Transporter } from "nodemailer";

export interface SmtpEnv {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  fromName: string;
}

/** Reads and validates SMTP config from env. Returns null if anything required is missing. */
export function getSmtpEnv(): SmtpEnv | null {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;
  const fromName = process.env.SMTP_FROM_NAME || "Karachi E-Challan";

  if (!host || !portRaw || !user || !password || !from) return null;
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) return null;
  return { host, port, user, password, from, fromName };
}

export function isSmtpConfigured(): boolean {
  return getSmtpEnv() !== null;
}

let cachedTransporter: Transporter | null = null;
let cachedKey = "";

/** One pooled transporter per unique config, reused across invocations (serverless-friendly). */
function getTransporter(env: SmtpEnv): Transporter {
  const key = `${env.host}:${env.port}:${env.user}`;
  if (cachedTransporter && cachedKey === key) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: env.host,
    port: env.port,
    secure: env.port === 465, // 465 = implicit TLS; 587/25 use STARTTLS
    auth: { user: env.user, pass: env.password },
  });
  cachedKey = key;
  return cachedTransporter;
}

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface SendMailResult {
  messageId: string;
}

/**
 * Sends one email over SMTP. Throws on any failure (auth, connection, rejected
 * recipient, etc.) — callers are expected to catch this and log a FAILED
 * EmailRecord without marking the request COMPLETED.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const env = getSmtpEnv();
  if (!env) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM.");
  }
  const transporter = getTransporter(env);
  const info = await transporter.sendMail({
    from: `"${env.fromName}" <${env.from}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo || env.from,
  });
  return { messageId: info.messageId || "" };
}
