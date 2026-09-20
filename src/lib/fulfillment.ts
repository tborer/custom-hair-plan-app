import type Stripe from "stripe";
import { sendFullPlan } from "@/lib/email";
import { saveLead, savePlanLog } from "@/lib/db";
import { buildFullPlanHtml } from "@/lib/plan";

/**
 * Grants access to the full plan for a paid Checkout Session: saves the
 * lead, logs the exact plan that was unlocked, and emails it. This is the
 * single source of truth for fulfillment, called from the Stripe webhook.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<{ emailed: boolean; email: string | null }> {
  const email =
    (session.customer_details && session.customer_details.email) ||
    (session.customer_email as string) ||
    "";

  const appSessionId = (session.metadata && (session.metadata as any).app_session_id) || undefined;
  const insight = (session.metadata && (session.metadata as any).insight) || null;

  if (!email) {
    console.warn("[fulfillment] no_email_on_session", { stripeSessionId: session.id });
    return { emailed: false, email: null };
  }

  const planHtml = buildFullPlanHtml({ insight });

  await saveLead({
    email,
    consent: true,
    answers: undefined,
    sessionId: appSessionId,
    source: "stripe_paid",
  });

  try {
    await savePlanLog({
      email,
      planHtml,
      sessionId: appSessionId,
      source: "stripe_webhook",
    });
  } catch (e) {
    console.warn("[fulfillment] savePlanLog failed", e);
  }

  const result = await sendFullPlan({
    to: email,
    planHtml,
    sessionId: appSessionId,
  });

  return { emailed: result.sent, email };
}
