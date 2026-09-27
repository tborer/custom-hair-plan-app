import type { NextApiRequest, NextApiResponse } from "next";
import { enforceIpRateLimit } from "@/lib/http";
import { capMessage, sendInternalNotification } from "@/lib/notify";

type HelpRequest = {
  message?: string;
  email?: string; // optional user email to reply to
  page?: string; // optional page/location context
  sessionId?: string; // optional app session id for correlation
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }
  if (!(await enforceIpRateLimit(req, res, "help", { limit: 5, windowSec: 3600 }))) return;

  try {
    const { message, email, page, sessionId } = (req.body || {}) as HelpRequest;
    const text = capMessage(message);
    if (!text) {
      return res.status(400).json({ ok: false, message: "Message is required" });
    }
    const pageLabel = typeof page === "string" ? page.slice(0, 100) : undefined;
    const xSessionId = String(req.headers["x-session-id"] || sessionId || "").slice(0, 100) || undefined;

    const sent = await sendInternalNotification(req, {
      subject: `Help Request${pageLabel ? ` from ${pageLabel}` : ""}`,
      heading: "New Help Request",
      message: text,
      replyTo: email,
      fields: { Page: pageLabel, "Session ID": xSessionId },
    });
    if (!sent) {
      return res.status(500).json({ ok: false, message: "Failed to send help request" });
    }
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[api/help] error", { message: err?.message || String(err) });
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}
