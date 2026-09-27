import type { NextApiRequest, NextApiResponse } from "next";
import { rateLimit } from "@/lib/rateLimit";

export function getClientIp(req: NextApiRequest): string {
  return (
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Apply a per-IP rate limit for a route. Returns true if the request may proceed;
 * otherwise it has already sent a 429 response.
 */
export async function enforceIpRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  route: string,
  opts: { limit: number; windowSec: number; memoryOnly?: boolean }
): Promise<boolean> {
  const result = await rateLimit(`ip:${route}:${getClientIp(req)}`, opts);
  if (result.allowed) return true;
  res.setHeader("Retry-After", String(result.retryAfterSec));
  res.status(429).json({ ok: false, message: "Too many requests. Please try again later." });
  return false;
}
