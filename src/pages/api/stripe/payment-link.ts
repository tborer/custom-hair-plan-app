import type { NextApiRequest, NextApiResponse } from "next";
import { isStripeEnabled } from "@/lib/flags";

/**
 * Returns a Stripe Payment Link URL based on STRIPE_MODE.
 * - STRIPE_MODE=test -> STRIPE_TEST_PAYMENT_LINK
 * - STRIPE_MODE=live -> STRIPE_PAYMENT_LINK
 * If not configured, returns ok:false so the client can fall back to standard Checkout Sessions.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  if (!isStripeEnabled()) {
    return res.status(200).json({ ok: false, message: "Payments are not available yet" });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.socket && req.socket.remoteAddress) ||
    undefined;
  const ua = req.headers["user-agent"] || undefined;

  const mode = (process.env.STRIPE_MODE || "test").toLowerCase() === "live" ? "live" : "test";
  console.log("[stripe/payment-link] start", JSON.stringify({ mode, ip: Boolean(ip), ua: Boolean(ua) }));
  const url =
    mode === "live"
      ? process.env.STRIPE_PAYMENT_LINK
      : process.env.STRIPE_TEST_PAYMENT_LINK;

  if (!url) {
    console.warn("[stripe/payment-link] missing", JSON.stringify({ mode, configured: false }));
    return res.status(200).json({ ok: false, message: "Payment Link not configured" });
  }

  console.log("[stripe/payment-link] success", JSON.stringify({ mode, hasUrl: !!url }));
  return res.status(200).json({ ok: true, url });
}