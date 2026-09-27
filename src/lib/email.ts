import { Resend } from "resend";
import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/html";
import { getPublicSiteUrl, SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { isEmailSuppressed } from "@/lib/db";

const resendKey = process.env.RESEND_API_KEY || "";
const resendFrom = process.env.RESEND_FROM || defaultFrom();

function defaultFrom(): string {
  let host = "localhost";
  try {
    host = new URL(getPublicSiteUrl()).hostname;
  } catch {
    // keep localhost
  }
  if (process.env.NODE_ENV === "production" && !process.env.SMTP_FROM) {
    console.warn("[email] RESEND_FROM/SMTP_FROM not set - defaulting to noreply@" + host);
  }
  return `${SITE_NAME} <noreply@${host}>`;
}

// SMTP configuration (via env)
const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT || (process.env.SMTP_SECURE ? 465 : 587));
const smtpSecure = (() => {
  const v = String(process.env.SMTP_SECURE ?? "").trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes" || v === "on") return true;
  if (v === "false" || v === "0" || v === "no" || v === "off") return false;
  // If not explicitly set, infer from port: 465 => secure
  return smtpPort === 465;
})();
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || resendFrom;

function hasSmtp(): boolean {
  return Boolean(smtpHost && smtpUser && smtpPass);
}

type SendParams = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  replyTo?: string;
};

async function sendWithSMTP(params: SendParams): Promise<{ sent: boolean; id?: string | null }> {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      headers: params.headers,
      replyTo: params.replyTo,
    });

    console.log("[email] SMTP sent", {
      ok: true,
      messageId: info?.messageId || null,
    });

    return { sent: true, id: info?.messageId || null };
  } catch (err: any) {
    console.error("[email] SMTP send error", {
      message: err?.message || String(err),
    });
    return { sent: false, id: null };
  }
}

async function sendWithResend(params: SendParams): Promise<{ sent: boolean; id?: string | null }> {
  if (!resendKey) {
    console.warn("[email] RESEND_API_KEY missing - skipping resend send");
    return { sent: false, id: null };
  }
  try {
    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: resendFrom,
      to: [params.to],
      subject: params.subject,
      html: params.html || (params.text ? `<pre>${escapeHtml(params.text)}</pre>` : "<div/>"),
      text: params.text,
      headers: params.headers,
      replyTo: params.replyTo,
    });

    console.log("[email] Resend sent", {
      ok: Boolean(result?.data?.id),
      id: result?.data?.id || null,
    });

    return { sent: Boolean(result?.data?.id), id: result?.data?.id ?? null };
  } catch (err: any) {
    console.error("[email] Resend send error", {
      message: err?.message || String(err),
    });
    return { sent: false, id: null };
  }
}

/**
 * Generic email sender that prefers SMTP if configured, then falls back to Resend if available.
 */
export async function sendEmailRaw(params: SendParams): Promise<{ sent: boolean; id?: string | null; via?: "smtp" | "resend" | "none" }> {
  // Try SMTP first
  if (hasSmtp()) {
    const smtpResult = await sendWithSMTP(params);
    if (smtpResult.sent) return { ...smtpResult, via: "smtp" };
    // If SMTP configured but failed, attempt Resend as a fallback
    if (resendKey) {
      const resendResult = await sendWithResend(params);
      return { ...resendResult, via: resendResult.sent ? "resend" : "none" };
    }
    return { ...smtpResult, via: "none" };
  }

  // Fallback to Resend if available
  if (resendKey) {
    const resendResult = await sendWithResend(params);
    return { ...resendResult, via: resendResult.sent ? "resend" : "none" };
  }

  console.warn("[email] No SMTP or Resend configured - skipping send");
  return { sent: false, id: null, via: "none" };
}

export async function sendPlanPreview(params: {
  to: string;
  insight?: string;
}): Promise<{ sent: boolean; id?: string | null; suppressed?: boolean }> {
  const { to, insight } = params;

  if (await isEmailSuppressed(to)) {
    console.log("[email] sendPlanPreview skipped - recipient unsubscribed");
    return { sent: false, id: null, suppressed: true };
  }

  const subject = "Your Hair Plan Preview";
  const site = getPublicSiteUrl();
  const unsubUrl = unsubscribeUrl(to);
  const unsubHref = unsubUrl || `mailto:${SUPPORT_EMAIL}?subject=Unsubscribe`;
  const headers: Record<string, string> = unsubUrl
    ? { "List-Unsubscribe": `<${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
    : { "List-Unsubscribe": `<mailto:${SUPPORT_EMAIL}?subject=Unsubscribe>` };

  const html = `
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #0b0b0c; padding: 24px;">
    <h1 style="margin:0 0 12px; font-size: 20px;">Your personalized insight</h1>
    <p style="margin: 0 0 12px;">Here is your free insight based on your answers:</p>
    ${insight ? `<blockquote style="margin: 0 0 16px; padding: 12px 16px; border-left: 3px solid #111; background: #f6f6f7;">${escapeHtml(insight)}</blockquote>` : ""}
    <p style="margin: 0 0 16px;">
      Ready for the complete, personalized plan (dosages, timing, stack, and topical pairings)?
    </p>

    <p style="margin: 16px 0;">
      <a href="${escapeHtml(site)}" style="display: inline-block; text-decoration: none; padding: 10px 16px; background: #111; color: #fff; border-radius: 6px;">
        Get your full plan
      </a>
    </p>

    <p style="margin: 8px 0 0; font-size: 12px; color: #6b6b70;">
      You are receiving this email because you requested a plan preview at ${escapeHtml(site)}.
      <a href="${escapeHtml(unsubHref)}" style="color:#6b6b70;">Unsubscribe</a>.
    </p>
  </div>
  `;

  try {
    const result = await sendEmailRaw({ to, subject, html, headers, replyTo: SUPPORT_EMAIL });
    return { sent: result.sent, id: result.id ?? null };
  } catch (err) {
    console.error("[email] sendPlanPreview error", err);
    return { sent: false, id: null };
  }
}

/**
 * Transactional: deliver a purchased plan. Not subject to the suppression list.
 * planHtml must already be escaped (see renderPlanHtml).
 */
export async function sendFullPlan(params: {
  to: string;
  planHtml: string;
  viewUrl?: string;
  subject?: string;
}): Promise<{ sent: boolean; id?: string | null }> {
  const { to, planHtml, viewUrl, subject } = params;

  const wrappedHtml = `
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #0b0b0c; padding: 24px;">
    <h1 style="margin:0 0 12px; font-size: 20px;">Your Complete Hair Plan</h1>
    <p style="margin: 0 0 16px;">Thank you for your purchase. Your personalized plan is below${viewUrl ? " — you can also view it online anytime" : ""}.</p>
    ${viewUrl ? `<p style="margin: 8px 0 16px;">
      <a href="${escapeHtml(viewUrl)}" style="display: inline-block; text-decoration: none; padding: 10px 16px; background: #111; color: #fff; border-radius: 6px;">
        View your plan online
      </a>
    </p>` : ""}
    <div style="border: 1px solid #e6e6e7; border-radius: 10px; padding: 16px; background:#fff;">
      ${planHtml}
    </div>
    <p style="margin: 16px 0 0; font-size: 12px; color: #6b6b70;">
      Questions? Just reply to this email or write to ${escapeHtml(SUPPORT_EMAIL)}.
    </p>
  </div>
  `;

  try {
    const result = await sendEmailRaw({
      to,
      subject: subject || "Your Complete Hair Plan",
      html: wrappedHtml,
      replyTo: SUPPORT_EMAIL,
    });
    return { sent: result.sent, id: result.id ?? null };
  } catch (err) {
    console.error("[email] sendFullPlan error", err);
    return { sent: false, id: null };
  }
}
