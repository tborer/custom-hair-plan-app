import type { NextApiRequest, NextApiResponse } from "next";
import { getStripe, getStripeMode } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/fulfillment";
import { enforceIpRateLimit } from "@/lib/http";

/**
 * Verifies a Stripe Checkout Session server-side and returns the buyer's plan.
 * This is the only way the success page obtains plan content, so the plan is
 * never shown without a paid session. Also triggers the (idempotent) plan email
 * in case the webhook hasn't delivered it yet.
 *
 * POST { session_id: string, answers?: Record<string,string> }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }
  if (!(await enforceIpRateLimit(req, res, "stripe_confirm", { limit: 30, windowSec: 600 }))) return;

  const stripe = getStripe();
  if (!stripe) {
    console.error("[stripe/confirm] Stripe not configured", { mode: getStripeMode() });
    return res.status(503).json({ ok: false, message: "Payments are not configured" });
  }

  const sessionId = String(req.body?.session_id ?? "");
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(sessionId)) {
    return res.status(400).json({ ok: false, message: "Invalid or missing session_id" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const result = await fulfillCheckoutSession(session, { source: "confirm", clientAnswers: req.body?.answers });

    if (!result.ok) {
      console.log("[stripe/confirm] not paid", JSON.stringify({ status: session.status, payment_status: session.payment_status }));
      return res.status(402).json({ ok: false, message: "Payment not completed" });
    }

    return res.status(200).json({
      ok: true,
      plan: result.plan,
      email: result.email,
      emailed: result.emailed || result.alreadyEmailed,
    });
  } catch (err: any) {
    if (err?.code === "resource_missing") {
      return res.status(404).json({ ok: false, message: "Checkout session not found" });
    }
    console.error("[stripe/confirm] error", { message: err?.message, type: err?.type, code: err?.code });
    return res.status(500).json({ ok: false, message: "Could not verify payment. Please try again." });
  }
}
