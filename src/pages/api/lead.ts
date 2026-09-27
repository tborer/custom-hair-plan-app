import type { NextApiRequest, NextApiResponse } from "next";
import { saveLead } from "@/lib/db";
import { sendPlanPreview } from "@/lib/email";
import { enforceIpRateLimit } from "@/lib/http";
import { isValidEmail } from "@/lib/html";
import { generateInsight, sanitizeAnswers } from "@/lib/plan";
import { rateLimit } from "@/lib/rateLimit";

type LeadPayload = {
  email?: string;
  consent?: boolean;
  answers?: Record<string, any>;
  source?: string;
};

type LeadResponse =
  | { ok: true; sessionId: string }
  | { ok: false; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LeadResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }
  if (!(await enforceIpRateLimit(req, res, "lead", { limit: 5, windowSec: 3600 }))) return;

  try {
    const { email, consent, answers: rawAnswers, source } = (req.body ?? {}) as LeadPayload;
    const rawSessionId = String(req.headers["x-session-id"] || "");
    const incomingSession = /^[A-Za-z0-9_-]{8,100}$/.test(rawSessionId) ? rawSessionId : undefined;

    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, message: "A valid email is required" });
    }
    if (consent !== true) {
      return res.status(400).json({ ok: false, message: "Consent is required" });
    }
    const to = email.trim();

    const answers = sanitizeAnswers(rawAnswers);
    const result = await saveLead({
      email: to,
      consent,
      answers: Object.keys(answers).length ? answers : undefined,
      sessionId: incomingSession,
      source: typeof source === "string" ? source.slice(0, 50) : undefined,
    });
    console.log("[lead] db_saved", JSON.stringify({ sessionId: result.sessionId, saved: result.saved }));

    // Cap preview emails per recipient so this endpoint can't be used to spam an address.
    const perRecipient = await rateLimit(`lead_to:${to.toLowerCase()}`, { limit: 3, windowSec: 86400 });
    if (perRecipient.allowed) {
      // The insight is recomputed from validated answers - never taken from the request.
      const emailResp = await sendPlanPreview({ to, insight: generateInsight(answers) });
      console.log("[lead] email_attempted", JSON.stringify({ sent: !!emailResp?.sent, suppressed: !!emailResp?.suppressed }));
    } else {
      console.warn("[lead] preview email skipped - per-recipient limit reached");
    }

    return res.status(200).json({ ok: true, sessionId: result.sessionId });
  } catch (err: any) {
    console.error("[lead] error", { message: err?.message || String(err), name: err?.name });
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}
