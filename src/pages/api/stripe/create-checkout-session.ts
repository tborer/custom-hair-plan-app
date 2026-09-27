import type { NextApiRequest, NextApiResponse } from "next";
import { getStripe, getSiteUrl, getPriceId, getStripeMode } from "@/lib/stripe";
import { isStripeEnabled } from "@/lib/flags";
import { enforceIpRateLimit } from "@/lib/http";
import { isValidEmail } from "@/lib/html";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  if (!(await enforceIpRateLimit(req, res, "checkout_create", { limit: 20, windowSec: 3600 }))) return;

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
    const rawSessionId = String(req.headers["x-session-id"] || "");
    const appSessionId = /^[A-Za-z0-9_-]{8,100}$/.test(rawSessionId) ? rawSessionId : "";
    const { email } = (req.body || {}) as { email?: string };
    const emailToUse = isValidEmail(email) ? email.trim() : undefined;

    const mode = getStripeMode();
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
      client_reference_id: appSessionId || undefined,
      // Only an opaque session id goes to Stripe - answers/insights (health data) stay in our DB.
      metadata: {
        app_session_id: appSessionId,
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
    return res.status(500).json({ ok: false, message: "Failed to create checkout session" });
  }
}