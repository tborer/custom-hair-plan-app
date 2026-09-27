import type { NextApiRequest, NextApiResponse } from "next";
import { enforceIpRateLimit } from "@/lib/http";

type LogLevel = "info" | "warn" | "error" | "debug";
type LogBody = {
  event: string;
  level?: LogLevel;
  context?: any;
};

function maskEmail(value: any): any {
  if (typeof value !== "string") return value;
  const [user, domain] = value.split("@");
  if (!domain || user.length === 0) return value;
  const maskedUser =
    user.length <= 2 ? user[0] + "*" : user[0] + "*".repeat(Math.max(1, user.length - 2)) + user[user.length - 1];
  return `${maskedUser}@${domain}`;
}

function sanitizeContext(input: any, depth = 0): any {
  if (depth > 4) return "[Truncated]";
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map((v) => sanitizeContext(v, depth + 1));
  if (typeof input === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      const key = String(k).toLowerCase();
      if (key.includes("email")) {
        out[k] = maskEmail(v);
      } else if (key.includes("secret") || key.includes("token") || key.includes("key")) {
        out[k] = "[REDACTED]";
      } else if (key === "answers") {
        // Avoid dumping potentially large PII payloads
        out[k] = "[omitted]";
      } else if (key === "insight") {
        const text = typeof v === "string" ? v : String(v ?? "");
        out[k] = text.length > 160 ? text.slice(0, 160) + "…" : text;
      } else {
        out[k] = sanitizeContext(v, depth + 1);
      }
    }
    return out;
  }
  if (typeof input === "string") {
    // Bound length
    return input.length > 500 ? input.slice(0, 500) + "…" : input;
  }
  return input;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }
  if (!(await enforceIpRateLimit(req, res, "log", { limit: 300, windowSec: 600, memoryOnly: true }))) return;

  const body = (req.body || {}) as LogBody;
  const level: LogLevel = ["info", "warn", "error", "debug"].includes(body.level as string)
    ? (body.level as LogLevel)
    : "info";
  const event = String(body.event || "unknown_event").slice(0, 100);

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.socket && req.socket.remoteAddress) ||
    undefined;

  const userAgent = req.headers["user-agent"];
  const xSessionId = (req.headers["x-session-id"] as string) || undefined;

  const context = sanitizeContext({
    ...body.context,
    _meta: {
      ip,
      ua: userAgent,
      xSessionId,
      stripeMode: (process.env.STRIPE_MODE || "test").toLowerCase() === "live" ? "live" : "test",
      env: process.env.NEXT_PUBLIC_CO_DEV_ENV || process.env.NODE_ENV || "unknown",
      route: "/api/log",
    },
  });

  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    context,
  };

  // Structured log to server console
  const line = JSON.stringify(payload);
  switch (level) {
    case "error":
      console.error("[log]", line);
      break;
    case "warn":
      console.warn("[log]", line);
      break;
    case "debug":
      console.debug("[log]", line);
      break;
    default:
      console.log("[log]", line);
  }

  return res.status(200).json({ ok: true });
}