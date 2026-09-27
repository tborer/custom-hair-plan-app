import type { NextApiRequest, NextApiResponse } from "next";
import { enforceIpRateLimit } from "@/lib/http";
import { capMessage, sendInternalNotification } from "@/lib/notify";

type ContactRequest = {
  message?: string;
  email?: string; // optional user email to reply to
  page?: string; // optional page/location context
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }
  if (!(await enforceIpRateLimit(req, res, "contact", { limit: 5, windowSec: 3600 }))) return;

  try {
    const { message, email, page } = (req.body || {}) as ContactRequest;
    const text = capMessage(message);
    if (!text) {
      return res.status(400).json({ ok: false, message: "Message is required" });
    }
    const pageLabel = typeof page === "string" ? page.slice(0, 100) : undefined;

    const sent = await sendInternalNotification(req, {
      subject: `Contact Form Submission${pageLabel ? ` from ${pageLabel}` : ""}`,
      heading: "New Contact Form Submission",
      message: text,
      replyTo: email,
      fields: { Page: pageLabel },
    });
    if (!sent) {
      return res.status(500).json({ ok: false, message: "Failed to send message" });
    }
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[api/contact] error", { message: err?.message || String(err) });
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}
