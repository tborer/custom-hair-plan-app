import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "node:stream/consumers";
import type Stripe from "stripe";
import { getStripe, getWebhookSecret } from "@/lib/stripe";
import { markEventProcessed, unmarkEventProcessed } from "@/lib/db";
import { fulfillCheckoutSession } from "@/lib/fulfillment";

// Signature verification needs the raw request body, so Next's JSON
// body parser must be disabled for this route.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const stripe = getStripe();
  const webhookSecret = getWebhookSecret();

  if (!stripe || !webhookSecret) {
    console.warn("[stripe/webhook] not_configured", { hasStripe: !!stripe, hasWebhookSecret: !!webhookSecret });
    return res.status(400).json({ ok: false, message: "Stripe webhook is not configured" });
  }

  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig as string, webhookSecret);
  } catch (err: any) {
    console.error("[stripe/webhook] signature_verification_failed", { message: err?.message });
    return res.status(400).json({ ok: false, message: `Webhook signature verification failed` });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        console.log("[stripe/webhook] session_not_paid_yet", { stripeSessionId: session.id, paymentStatus: session.payment_status });
        return res.status(200).json({ ok: true, skipped: "not_paid" });
      }

      const isNewEvent = await markEventProcessed(event.id);
      if (!isNewEvent) {
        console.log("[stripe/webhook] duplicate_event_skipped", { eventId: event.id, stripeSessionId: session.id });
        return res.status(200).json({ ok: true, skipped: "duplicate" });
      }

      try {
        const result = await fulfillCheckoutSession(session);
        console.log("[stripe/webhook] fulfillment_complete", {
          eventId: event.id,
          stripeSessionId: session.id,
          emailed: result.emailed,
        });
      } catch (fulfillErr: any) {
        // Release the claim so Stripe's retry doesn't get skipped as a
        // "duplicate" of a delivery that never actually completed.
        await unmarkEventProcessed(event.id);
        throw fulfillErr;
      }
    } else {
      console.log("[stripe/webhook] ignored_event_type", { type: event.type });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    // Return 500 so Stripe retries delivery.
    console.error("[stripe/webhook] handler_error", { eventId: event.id, message: err?.message });
    return res.status(500).json({ ok: false, message: "Webhook handler failed" });
  }
}
