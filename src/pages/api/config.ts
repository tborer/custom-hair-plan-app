import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Runtime configuration for client consumption.
 * Lets the client decide whether to call confirm based on server-evaluated flags,
 * avoiding build-time NEXT_PUBLIC_* caching issues.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.socket && req.socket.remoteAddress) ||
    undefined;
  const ua = req.headers["user-agent"] || undefined;

  const stripeMode = (process.env.STRIPE_MODE || "test").toLowerCase() === "live" ? "live" : "test";
  const serverHasStripeKey =
    stripeMode === "live" ? !!process.env.STRIPE_SECRET_KEY : !!process.env.STRIPE_TEST_SECRET_KEY;

  const env = process.env.NEXT_PUBLIC_CO_DEV_ENV || process.env.NODE_ENV || "unknown";

  console.log(
    "[config] return",
    JSON.stringify({
      stripeMode,
      serverHasStripeKey,
      env,
      ip: Boolean(ip),
      ua: Boolean(ua),
    })
  );

  return res.status(200).json({
    ok: true,
    stripeMode,
    serverHasStripeKey,
    env,
  });
}