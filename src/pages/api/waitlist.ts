import type { NextApiRequest, NextApiResponse } from "next";
import { sendEmailRaw } from "@/lib/email";
import { isWaitlistEnabled } from "@/lib/flags";

type WaitlistRequest = {
  email?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  if (!isWaitlistEnabled()) {
    return res.status(403).json({ ok: false, message: "Waitlist is not currently open" });
  }

  try {
    const { email } = (req.body || {}) as WaitlistRequest;

    const trimmedEmail = String(email ?? "").trim();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return res.status(400).json({ ok: false, message: "A valid email is required" });
    }

    const to = "ar@agilerant.info";
    const ua = req.headers["user-agent"] || "";
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.socket && req.socket.remoteAddress) ||
      "";
    const referer = (req.headers["referer"] as string) || undefined;

    const subject = "New Waitlist Signup";
    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#0b0b0c; padding:16px;">
        <h2 style="margin:0 0 12px; font-size:18px;">New Waitlist Signup</h2>
        <p style="margin:0 0 12px;"><strong>Email:</strong> ${escapeHtml(trimmedEmail)}</p>

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
      text: `New waitlist signup:\n\nEmail: ${trimmedEmail}\nReferrer: ${referer || "n/a"}\nIP: ${ip}\nUA: ${ua}\nEnv: ${process.env.NEXT_PUBLIC_CO_DEV_ENV || process.env.NODE_ENV || "unknown"}`,
    });

    if (!result.sent) {
      return res.status(500).json({ ok: false, message: "Failed to join waitlist" });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[api/waitlist] error", { message: err?.message || String(err) });
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
