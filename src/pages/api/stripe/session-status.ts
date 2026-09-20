import type { NextApiRequest, NextApiResponse } from "next";
import { getStripe } from "@/lib/stripe";

/**
 * Read-only check of a Checkout Session's payment status, used by the
 * success page to decide whether to render the paid plan content.
 * Has no side effects (no email, no DB writes) - fulfillment is handled
 * exclusively by the Stripe webhook (/api/stripe/webhook), so it's always
 * safe to call this.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(400).json({ ok: false, message: "Stripe is not configured" });
  }

  const sessionId = (req.query.session_id as string) || "";
  if (!sessionId) {
    return res.status(400).json({ ok: false, message: "Missing session_id" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(404).json({ ok: false, message: "Session not found" });
    }

    const email =
      (session.customer_details && session.customer_details.email) ||
      (session.customer_email as string) ||
      null;

    return res.status(200).json({
      ok: true,
      paid: session.payment_status === "paid",
      email,
    });
  } catch (err: any) {
    console.error("[stripe/session-status] error", {
      message: err?.message,
      type: err?.type,
      code: err?.code,
    });
    return res.status(500).json({ ok: false, message: err?.message || "Failed to check session status" });
  }
}
