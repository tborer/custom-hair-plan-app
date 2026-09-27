import type { NextApiRequest } from "next";
import { sendEmailRaw } from "@/lib/email";
import { escapeHtml, isValidEmail } from "@/lib/html";
import { getClientIp } from "@/lib/http";

/** Where internal notifications (help, contact, waitlist) are delivered. */
export function getSupportInbox(): string {
  return process.env.SUPPORT_EMAIL || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "ar@agilerant.info";
}

/**
 * Email an internal notification to the support inbox. All user-supplied values are
 * escaped; a valid user email becomes the Reply-To so support can answer directly.
 */
export async function sendInternalNotification(
  req: NextApiRequest,
  params: {
    subject: string;
    heading: string;
    message?: string;
    replyTo?: string;
    fields?: Record<string, string | undefined>;
  }
): Promise<boolean> {
  const ua = String(req.headers["user-agent"] || "").slice(0, 300);
  const ip = getClientIp(req);
  const referer = String(req.headers["referer"] || "").slice(0, 300) || undefined;
  const env = process.env.NEXT_PUBLIC_CO_DEV_ENV || process.env.NODE_ENV || "unknown";
  const replyTo = isValidEmail(params.replyTo) ? params.replyTo.trim() : undefined;

  const fields: Record<string, string | undefined> = {
    "Reply-to (user provided)": replyTo,
    ...params.fields,
    Referrer: referer,
  };
  const fieldHtml = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `<p style="margin:4px 0 0;"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</p>`)
    .join("");
  const fieldText = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const html = `
    <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#0b0b0c; padding:16px;">
      <h2 style="margin:0 0 12px; font-size:18px;">${escapeHtml(params.heading)}</h2>
      ${params.message ? `<p style="margin:0 0 12px; white-space:pre-wrap;">${escapeHtml(params.message)}</p>` : ""}
      ${fieldHtml}
      <hr style="margin:16px 0; border:none; border-top:1px solid #e6e6e7;" />
      <p style="margin:0; font-size:12px; color:#6b6b70;">IP: ${escapeHtml(ip)} • UA: ${escapeHtml(ua)}</p>
      <p style="margin:0; font-size:12px; color:#6b6b70;">Env: ${escapeHtml(env)} • Time: ${new Date().toISOString()}</p>
    </div>
  `;
  const text = `${params.heading}\n\n${params.message ? params.message + "\n\n" : ""}${fieldText}\nIP: ${ip}\nUA: ${ua}\nEnv: ${env}`;

  const result = await sendEmailRaw({
    to: getSupportInbox(),
    subject: params.subject.slice(0, 150),
    html,
    text,
    replyTo,
  });
  return result.sent;
}

/** Trim a user message to the 500-character cap; returns "" if empty. */
export function capMessage(message: unknown): string {
  return String(message ?? "").trim().slice(0, 500);
}
