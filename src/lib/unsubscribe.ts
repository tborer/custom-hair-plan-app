import { createHmac, timingSafeEqual } from "crypto";
import { getPublicSiteUrl } from "@/lib/site";

function secret(): string | null {
  if (process.env.UNSUBSCRIBE_SECRET) return process.env.UNSUBSCRIBE_SECRET;
  if (process.env.NODE_ENV !== "production") return "dev-unsubscribe-secret";
  return null;
}

export function unsubscribeToken(email: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(email.trim().toLowerCase()).digest("base64url");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (!expected || !token) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Signed one-click unsubscribe URL, or null if UNSUBSCRIBE_SECRET is not configured. */
export function unsubscribeUrl(email: string): string | null {
  const token = unsubscribeToken(email);
  if (!token) {
    console.error("[unsubscribe] UNSUBSCRIBE_SECRET is not set - cannot build unsubscribe link");
    return null;
  }
  const e = encodeURIComponent(email.trim().toLowerCase());
  return `${getPublicSiteUrl()}/api/unsubscribe?e=${e}&t=${token}`;
}
