import type { NextApiRequest, NextApiResponse } from "next";
import { suppressEmail } from "@/lib/db";
import { escapeHtml, isValidEmail } from "@/lib/html";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { SITE_NAME, SUPPORT_EMAIL, getPublicSiteUrl } from "@/lib/site";

/**
 * Signed unsubscribe link from marketing-style emails.
 * GET  - user clicked the link: unsubscribe and show a confirmation page.
 * POST - RFC 8058 one-click unsubscribe from the mail client (List-Unsubscribe-Post).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).end();
  }

  const email = String(req.query.e ?? "");
  const token = String(req.query.t ?? "");
  const valid = isValidEmail(email) && verifyUnsubscribeToken(email, token);

  let done = false;
  if (valid) {
    done = await suppressEmail(email, "unsubscribe_link");
    if (!done) console.error("[unsubscribe] could not record suppression (is Postgres configured?)");
  }

  if (req.method === "POST") {
    return res.status(valid && done ? 200 : 400).json({ ok: valid && done });
  }

  const message = !valid
    ? "This unsubscribe link is invalid or has expired."
    : done
    ? `${escapeHtml(email)} has been unsubscribed. You won't receive further marketing emails from us.`
    : "We couldn't process your request automatically.";
  const help = valid && done ? "" : ` Please email <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}?subject=Unsubscribe">${escapeHtml(SUPPORT_EMAIL)}</a> and we'll remove you.`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(valid && done ? 200 : 400).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unsubscribe | ${escapeHtml(SITE_NAME)}</title></head>
<body style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 64px auto; padding: 0 16px; line-height: 1.6; color: #0b0b0c;">
<h1 style="font-size: 22px;">Email preferences</h1>
<p>${message}${help}</p>
<p><a href="${escapeHtml(getPublicSiteUrl())}">Return to ${escapeHtml(SITE_NAME)}</a></p>
</body></html>`);
}
