import type Stripe from "stripe";
import { buildPlan, renderPlanHtml, sanitizeAnswers, type Answers, type Plan } from "@/lib/plan";
import {
  claimPlanEmail,
  completePlanEmail,
  getLatestAnswers,
  saveLead,
  savePlanLog,
  upsertPurchase,
} from "@/lib/db";
import { sendFullPlan } from "@/lib/email";
import { getStripe, getStripeMode, getWebhookSecret } from "@/lib/stripe";
import { getPublicSiteUrl } from "@/lib/site";

export type FulfillmentResult =
  | { ok: true; plan: Plan; email: string | null; emailed: boolean; alreadyEmailed: boolean }
  | { ok: false; reason: "not_paid" };

/** A Checkout Session grants access once it is complete and paid (or fully discounted). */
export function isSessionPaid(session: Stripe.Checkout.Session): boolean {
  return (
    session.status === "complete" &&
    (session.payment_status === "paid" || session.payment_status === "no_payment_required")
  );
}

function appSessionIdOf(session: Stripe.Checkout.Session): string | null {
  // Checkout Sessions we create carry metadata; Payment Links pass client_reference_id.
  return (session.metadata?.app_session_id as string) || session.client_reference_id || null;
}

/**
 * Verify a Checkout Session, build the buyer's plan, and email it exactly once.
 * Called by both the success page (via /api/stripe/confirm) and the Stripe webhook,
 * so whichever arrives first delivers the plan and the other is a no-op.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  opts: { source: "confirm" | "webhook"; clientAnswers?: unknown }
): Promise<FulfillmentResult> {
  if (!isSessionPaid(session)) return { ok: false, reason: "not_paid" };

  const appSessionId = appSessionIdOf(session);
  const email = session.customer_details?.email || session.customer_email || null;

  // Server-stored answers are authoritative; the success page's local copy is a fallback
  // for deployments without a database.
  const stored = appSessionId ? await getLatestAnswers(appSessionId) : null;
  const answers: Answers = sanitizeAnswers(stored ?? opts.clientAnswers);
  if (!Object.keys(answers).length) {
    console.warn("[fulfillment] no answers found - building default plan", { source: opts.source, appSessionId });
  }
  const plan = buildPlan(answers);

  await upsertPurchase({
    stripeSessionId: session.id,
    appSessionId,
    email,
    amountTotal: session.amount_total,
    currency: session.currency,
    mode: getStripeMode(),
  });

  if (!email) {
    console.warn("[fulfillment] paid session has no email", { stripeSessionId: session.id });
    return { ok: true, plan, email: null, emailed: false, alreadyEmailed: false };
  }

  const shouldSend = await acquireSendRight(session, opts.source);
  if (!shouldSend.send) {
    return { ok: true, plan, email, emailed: false, alreadyEmailed: true };
  }

  const planHtml = renderPlanHtml(plan);
  const viewUrl = `${getPublicSiteUrl()}/plan/success?session_id=${encodeURIComponent(session.id)}`;
  const result = await sendFullPlan({ to: email, planHtml, viewUrl });
  await shouldSend.complete(result.sent);

  if (result.sent) {
    await saveLead({ email, consent: true, answers: Object.keys(answers).length ? answers : undefined, sessionId: appSessionId || undefined, source: "stripe_paid" });
    await savePlanLog({ email, planHtml, sessionId: appSessionId || undefined, source: `fulfill_${opts.source}` });
  }

  console.log("[fulfillment] plan email", JSON.stringify({ stripeSessionId: session.id, source: opts.source, sent: result.sent }));
  return { ok: true, plan, email, emailed: result.sent, alreadyEmailed: false };
}

/**
 * Decide whether this caller should send the plan email.
 * Primary: an atomic claim on the purchases row. Without a database, fall back to a
 * flag on the PaymentIntent's metadata (best effort, small race window).
 */
async function acquireSendRight(
  session: Stripe.Checkout.Session,
  source: "confirm" | "webhook"
): Promise<{ send: boolean; complete: (sent: boolean) => Promise<void> }> {
  const claim = await claimPlanEmail(session.id);
  if (claim === "claimed") return { send: true, complete: (sent) => completePlanEmail(session.id, sent) };
  if (claim === "already") return { send: false, complete: async () => {} };

  const stripe = getStripe();
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (stripe && piId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId);
      if (pi.metadata?.plan_emailed === "1") return { send: false, complete: async () => {} };
      return {
        send: true,
        complete: async (sent) => {
          if (!sent) return;
          await stripe.paymentIntents.update(piId, { metadata: { plan_emailed: "1" } }).catch((err) => {
            console.warn("[fulfillment] failed to flag PaymentIntent", { message: err?.message });
          });
        },
      };
    } catch (err: any) {
      console.warn("[fulfillment] PaymentIntent lookup failed", { message: err?.message });
    }
  }

  // No DB and no PaymentIntent (e.g. 100% discount): let exactly one path own delivery.
  const webhookOwns = Boolean(getWebhookSecret());
  const send = webhookOwns ? source === "webhook" : source === "confirm";
  return { send, complete: async () => {} };
}
