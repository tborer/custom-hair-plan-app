/**
 * Simple env-var feature flags, controlled from Vercel project settings.
 * Both default to enabled (true) unless explicitly turned off, so existing
 * deployments keep working until someone opts to disable a feature.
 */
function isEnabled(raw: string | undefined, defaultValue: boolean): boolean {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return defaultValue;
  if (["false", "0", "no", "off"].includes(v)) return false;
  if (["true", "1", "yes", "on"].includes(v)) return true;
  return defaultValue;
}

// "enable_waitlist" - toggles the "Join Waitlist" button/modal.
export function isWaitlistEnabled(): boolean {
  return isEnabled(process.env.enable_waitlist ?? process.env.ENABLE_WAITLIST, true);
}

// "enable_stripe" - toggles Stripe checkout/payment links while still setting up.
export function isStripeEnabled(): boolean {
  return isEnabled(process.env.enable_stripe ?? process.env.ENABLE_STRIPE, true);
}
