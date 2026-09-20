import Stripe from "stripe";
import type { NextApiRequest } from "next";

/**
 * Lazily initialize a Stripe client based on STRIPE_MODE.
 * - STRIPE_MODE: "test" | "live" (defaults to "test" if unset)
 * - Test: uses STRIPE_TEST_SECRET_KEY
 * - Live: uses STRIPE_SECRET_KEY
 * Returns null if no appropriate key is configured so routes can gracefully fallback.
 */
let stripeSingleton: Stripe | null = null;
let stripeSingletonKey: string | null = null;

export function getStripe(): Stripe | null {
  const mode = (process.env.STRIPE_MODE || "test").toLowerCase() === "live" ? "live" : "test";
  const key =
    mode === "live"
      ? process.env.STRIPE_SECRET_KEY
      : process.env.STRIPE_TEST_SECRET_KEY;

  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[stripe] ${mode === "live" ? "STRIPE_SECRET_KEY" : "STRIPE_TEST_SECRET_KEY"} missing - Stripe disabled (using graceful fallback)`
      );
    }
    return null;
  }

  if (!stripeSingleton || stripeSingletonKey !== key) {
    // apiVersion is pinned for type-safety. Adjust as needed if Stripe updates.
    stripeSingleton = new Stripe(key, {
      apiVersion: "2024-06-20" as any,
    });
    stripeSingletonKey = key;
  }
  return stripeSingleton;
}

/**
 * Resolve the public site URL for redirects (Vercel-friendly).
 * Prefers NEXT_PUBLIC_SITE_URL if set; otherwise derives from request headers.
 */
export function getSiteUrl(req?: NextApiRequest): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const proto =
    (req?.headers["x-forwarded-proto"] as string) ||
    (req?.headers["x-forwarded-protocol"] as string) ||
    "https";
  const host = req?.headers.host || "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * Convenience to get the Price ID (required), selected by STRIPE_MODE.
 * - Test: STRIPE_TEST_PRICE_ID
 * - Live: STRIPE_PRICE_ID
 */
export function getPriceId(): string | null {
  const mode = (process.env.STRIPE_MODE || "test").toLowerCase() === "live" ? "live" : "test";
  const price = mode === "live" ? process.env.STRIPE_PRICE_ID : process.env.STRIPE_TEST_PRICE_ID;
  if (!price) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[stripe] ${mode === "live" ? "STRIPE_PRICE_ID" : "STRIPE_TEST_PRICE_ID"} missing - using graceful fallback`
      );
    }
    return null;
  }
  return price;
}

/**
 * Convenience to get the webhook signing secret, selected by STRIPE_MODE.
 * - Test: STRIPE_TEST_WEBHOOK_SECRET
 * - Live: STRIPE_WEBHOOK_SECRET
 */
export function getWebhookSecret(): string | null {
  const mode = (process.env.STRIPE_MODE || "test").toLowerCase() === "live" ? "live" : "test";
  const secret =
    mode === "live" ? process.env.STRIPE_WEBHOOK_SECRET : process.env.STRIPE_TEST_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[stripe] ${mode === "live" ? "STRIPE_WEBHOOK_SECRET" : "STRIPE_TEST_WEBHOOK_SECRET"} missing - webhook disabled`
      );
    }
    return null;
  }
  return secret;
}