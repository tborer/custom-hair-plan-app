import type { NextApiRequest, NextApiResponse } from "next";
import { sendEmailRaw } from "@/lib/email";

type ContactRequest = {
  message?: string;
  email?: string; // optional user email to reply to
  page?: string;  // optional page/location context
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const { message, email, page } = (req.body || {}) as ContactRequest;

    const text = String(message ?? "").trim();
    if (!text) {
      return res.status(400).json({ ok: false, message: "Message is required" });
    }

    // enforce 500 char cap
    const capped = text.length > 500 ? text.slice(0, 500) : text;

    const to = "ar@agilerant.info";
    const ua = req.headers["user-agent"] || "";
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.socket && req.socket.remoteAddress) ||
      "";
    const referer = (req.headers["referer"] as string) || undefined;

    const subject = `Contact Form Submission${page ? ` from ${page}` : ""}`;
    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#0b0b0c; padding:16px;">
        <h2 style="margin:0 0 12px; font-size:18px;">New Contact Form Submission</h2>
        <p style="margin:0 0 12px; white-space:pre-wrap;">${escapeHtml(capped)}</p>

        ${email ? `<p style="margin:8px 0 0;"><strong>Reply-to (user provided):</strong> ${escapeHtml(email)}</p>` : ""}
        ${page ? `<p style="margin:4px 0 0;"><strong>Page:</strong> ${escapeHtml(page)}</p>` : ""}
        ${referer ? `<p style="margin:4px 0 0;"><strong>Referrer:</strong> ${escapeHtml(referer)}</p>` : ""}

        <hr style="margin:16px 0; border:none; border-top:1px solid #e6e6e7;" />
        <p style="margin:0; font-size:12px; color:#6b6b70;">
          IP: ${escapeHtml(String(ip))} • UA: ${escapeHtml(String(ua))}
        </p>
        <p style="margin:0; font-size:12px; color:#6b6b70;">
          Env: ${(process.env.NEXT_PUBLIC_CO_DEV_ENV || process.env.NODE_ENV || "unknown")} • Time: ${new Date().toISOString()}
        </p>
      </div>
    `;

    const result = await sendEmailRaw({
      to,
      subject,
      html,
      text: `Contact form submission:\n\n${capped}\n\nFrom: ${email || "n/a"}\nPage: ${page || "n/a"}\nReferrer: ${referer || "n/a"}\nIP: ${ip}\nUA: ${ua}\nEnv: ${process.env.NEXT_PUBLIC_CO_DEV_ENV || process.env.NODE_ENV || "unknown"}`,
    });

    if (!result.sent) {
      return res.status(500).json({ ok: false, message: "Failed to send message" });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[api/contact] error", { message: err?.message || String(err) });
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
