/**
 * Site-wide constants and URL helpers shared by pages, API routes, and emails.
 * Everything here is safe to import on the client (only NEXT_PUBLIC_* vars).
 */

export const SITE_NAME = "Custom Hair Plan";

// Bump this whenever the Privacy Policy or Terms change materially.
export const POLICY_EFFECTIVE_DATE = "2026-09-27";

// Resolved in next.config.mjs from NEXT_PUBLIC_SUPPORT_EMAIL, else SMTP_FROM / SMTP_USER.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "ar@agilerant.info";

/**
 * Canonical public origin (no trailing slash). Set NEXT_PUBLIC_SITE_URL in every
 * deployed environment; the fallback is only for local development.
 */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
