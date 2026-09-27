import type { NextApiRequest, NextApiResponse } from "next";
import { saveAnswers } from "@/lib/db";
import { enforceIpRateLimit } from "@/lib/http";
import { sanitizeAnswers } from "@/lib/plan";

type SavePayload = {
  answers?: Record<string, any>;
  sessionId?: string;
  email?: string;
  source?: string;
};

type SaveResponse =
  | { ok: true; sessionId: string }
  | { ok: false; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  if (!(await enforceIpRateLimit(req, res, "answers_save", { limit: 20, windowSec: 3600 }))) return;

  try {
    const { answers: rawAnswers, sessionId: rawIncoming, source } = (req.body ?? {}) as SavePayload;
    const answers = sanitizeAnswers(rawAnswers);
    const incoming = typeof rawIncoming === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(rawIncoming) ? rawIncoming : undefined;
    const email = answers.email;

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.socket && req.socket.remoteAddress) ||
      undefined;
    const ua = req.headers["user-agent"] || undefined;
    const xSessionId = (req.headers["x-session-id"] as string) || undefined;

    console.log("[answers/save] start", JSON.stringify({
      hasAnswers: !!answers,
      hasIncomingSession: !!incoming,
      hasXSessionId: !!xSessionId,
      hasEmail: typeof email === "string",
      source: source || null,
      ip: Boolean(ip),
      ua: Boolean(ua),
    }));

    if (!Object.keys(answers).length) {
      console.warn("[answers/save] validation", JSON.stringify({ hasAnswers: false }));
      return res.status(400).json({ ok: false, message: "Answers are required" });
    }

    const result = await saveAnswers({
      answers,
      sessionId: incoming,
      email,
      source: typeof source === "string" ? source.slice(0, 50) : undefined,
    });
    console.log("[answers/save] success", JSON.stringify({ sessionId: result.sessionId }));
    return res.status(200).json({ ok: true, sessionId: result.sessionId });
  } catch (err: any) {
    console.error("[answers/save] error", {
      message: err?.message || String(err),
      name: err?.name,
    });
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}