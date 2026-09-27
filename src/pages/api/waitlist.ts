import type { NextApiRequest, NextApiResponse } from "next";
import { isWaitlistEnabled } from "@/lib/flags";
import { enforceIpRateLimit } from "@/lib/http";
import { isValidEmail } from "@/lib/html";
import { sendInternalNotification } from "@/lib/notify";

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
  if (!(await enforceIpRateLimit(req, res, "waitlist", { limit: 5, windowSec: 3600 }))) return;

  try {
    const { email } = (req.body || {}) as WaitlistRequest;
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, message: "A valid email is required" });
    }
    const trimmedEmail = email.trim();

    const sent = await sendInternalNotification(req, {
      subject: "New Waitlist Signup",
      heading: "New Waitlist Signup",
      replyTo: trimmedEmail,
      fields: { Email: trimmedEmail },
    });
    if (!sent) {
      return res.status(500).json({ ok: false, message: "Failed to join waitlist" });
    }
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[api/waitlist] error", { message: err?.message || String(err) });
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}
