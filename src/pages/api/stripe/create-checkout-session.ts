import type { NextApiRequest, NextApiResponse } from "next";
import { getStripe, getSiteUrl, getPriceId } from "@/lib/stripe";
import { isStripeEnabled } from "@/lib/flags";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  if (!isStripeEnabled()) {
    return res.status(200).json({ ok: false, message: "Payments are not available yet" });
  }

  const stripe = getStripe();
  const priceId = getPriceId();

  if (!stripe) {
    return res.status(400).json({ ok: false, message: "Stripe is not configured" });
  }
  if (!priceId) {
    return res.status(400).json({ ok: false, message: "Stripe Price ID is not configured" });
  }

  try {
    const siteUrl = getSiteUrl(req);
    const appSessionId = (req.headers["x-session-id"] as string) || "";
    const { insight, email } = (req.body || {}) as { insight?: string; email?: string };
    const emailToUse =
      typeof email === "string" && /^\S+@\S+\.\S+$/.test(email.trim()) ? email.trim() : undefined;

    const mode = (process.env.STRIPE_MODE || "test").toLowerCase() === "live" ? "live" : "test";
    console.log("[stripe] checkout_session_create start", JSON.stringify({
      mode,
      hasStripe: !!stripe,
      hasPriceId: !!priceId,
      appSessionId: !!appSessionId,
      emailProvided: !!emailToUse,
      siteUrl
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/plan/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/plan/cancel`,
      customer_email: emailToUse,
      allow_promotion_codes: true,
      // Let Stripe collect the email during checkout
      metadata: {
        app_session_id: appSessionId,
        insight: (insight || "").slice(0, 300),
        source: "checkout",
      },
    });

    console.log("[stripe] checkout_session_create success", JSON.stringify({
      id: session.id,
      hasUrl: !!session.url,
      mode
    }));
    return res.status(200).json({ ok: true, id: session.id, url: session.url });
  } catch (err: any) {
    console.error("[stripe] checkout_session_create error", {
      message: err?.message,
      type: err?.type,
      code: err?.code,
    });
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Failed to create checkout session" });
  }
}