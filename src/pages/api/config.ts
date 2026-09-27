import type { NextApiRequest, NextApiResponse } from "next";
import { isStripeEnabled, isWaitlistEnabled } from "@/lib/flags";
import { getStripeMode } from "@/lib/stripe";

/**
 * Runtime configuration for client consumption, evaluated per request so flags
 * can be changed in Vercel without a rebuild (unlike NEXT_PUBLIC_* values).
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    ok: true,
    stripeMode: getStripeMode(),
    stripeEnabled: isStripeEnabled(),
    waitlistEnabled: isWaitlistEnabled(),
  });
}
