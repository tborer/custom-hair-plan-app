import type { NextApiRequest, NextApiResponse } from "next";
import type Stripe from "stripe";
import { getStripe, getWebhookSecret } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/fulfillment";

// Stripe signs the raw request body, so Next's JSON body parser must be off.
export const config = { api: { bodyParser: false } };

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  const stripe = getStripe();
  const secret = getWebhookSecret();
  if (!stripe || !secret) {
    console.error("[stripe/webhook] not configured", { hasStripe: !!stripe, hasSecret: !!secret });
    return res.status(500).json({ ok: false, message: "Webhook not configured" });
  }

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"] as string, secret);
  } catch (err: any) {
    console.warn("[stripe/webhook] signature verification failed", { message: err?.message });
    return res.status(400).json({ ok: false, message: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await fulfillCheckoutSession(session, { source: "webhook" });
        console.log("[stripe/webhook] handled", JSON.stringify({
          type: event.type,
          id: event.id,
          ok: result.ok,
          emailed: result.ok ? result.emailed : false,
        }));
        // If the email failed to send, return 500 so Stripe retries the event.
        if (result.ok && result.email && !result.emailed && !result.alreadyEmailed) {
          return res.status(500).json({ ok: false, message: "Email delivery failed; retry" });
        }
        break;
      }
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("[stripe/webhook] handler error", { type: event.type, id: event.id, message: err?.message });
    return res.status(500).json({ ok: false, message: "Handler error" });
  }
}
