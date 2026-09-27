import { sql } from "@vercel/postgres";
import { randomUUID } from "crypto";

let schemaEnsured = false;

/** True when Vercel Postgres connection env vars are present. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL);
}

export async function ensureSchema() {
  if (schemaEnsured || !isDbConfigured()) return;
  try {
    await sql`CREATE TABLE IF NOT EXISTS leads (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT,
      email TEXT NOT NULL,
      consent BOOLEAN NOT NULL,
      answers JSONB,
      source TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`;

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS leads_session_email_idx ON leads (session_id, email);`;

    await sql`CREATE TABLE IF NOT EXISTS answers (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      email TEXT,
      answers JSONB NOT NULL,
      source TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`;

    await sql`CREATE INDEX IF NOT EXISTS answers_session_idx ON answers (session_id);`;

    await sql`CREATE TABLE IF NOT EXISTS plan_logs (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT,
      email TEXT,
      plan_html TEXT NOT NULL,
      source TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`;

    await sql`CREATE INDEX IF NOT EXISTS plan_logs_session_idx ON plan_logs (session_id);`;

    // One row per Stripe Checkout Session; plan_emailed_at makes fulfillment idempotent.
    await sql`CREATE TABLE IF NOT EXISTS purchases (
      stripe_session_id TEXT PRIMARY KEY,
      app_session_id TEXT,
      email TEXT,
      amount_total BIGINT,
      currency TEXT,
      mode TEXT,
      plan_email_claimed_at TIMESTAMPTZ,
      plan_emailed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`;

    await sql`CREATE TABLE IF NOT EXISTS email_suppressions (
      email TEXT PRIMARY KEY,
      reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`;

    await sql`CREATE TABLE IF NOT EXISTS rate_limits (
      bucket TEXT NOT NULL,
      window_start TIMESTAMPTZ NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (bucket, window_start)
    );`;

    schemaEnsured = true;
  } catch (err) {
    // If DB is not configured yet, fail gracefully. We'll no-op in save functions.
    console.warn("[db] ensureSchema skipped or failed (is Postgres configured?)", err);
  }
}

export async function saveAnswers(params: {
  answers: Record<string, any>;
  sessionId?: string;
  email?: string;
  source?: string;
}): Promise<{ sessionId: string; saved: boolean }> {
  const { answers, sessionId, email, source } = params;
  const sid = sessionId || randomUUID();

  try {
    await ensureSchema();
    const answersJson = JSON.stringify(answers);
    await sql`
      INSERT INTO answers (session_id, email, answers, source)
      VALUES (${sid}, ${email ?? null}, ${answersJson}::jsonb, ${source ?? null})
    `;
    return { sessionId: sid, saved: true };
  } catch (err) {
    console.warn("[db] saveAnswers fallback (no DB)", err);
    return { sessionId: sid, saved: false };
  }
}

export async function saveLead(params: {
  email: string;
  consent: boolean;
  answers?: Record<string, any>;
  sessionId?: string;
  source?: string;
}): Promise<{ sessionId: string; saved: boolean }> {
  const { email, consent, answers, sessionId, source } = params;
  const sid = sessionId || randomUUID();

  try {
    await ensureSchema();
    const answersJson = answers ? JSON.stringify(answers) : null;
    await sql`
      INSERT INTO leads (session_id, email, consent, answers, source)
      VALUES (${sid}, ${email}, ${consent}, ${answersJson}::jsonb, ${source ?? null})
      ON CONFLICT (session_id, email)
      DO UPDATE SET
        consent = EXCLUDED.consent,
        answers = COALESCE(EXCLUDED.answers, leads.answers),
        source = COALESCE(EXCLUDED.source, leads.source),
        created_at = NOW()
    `;
    return { sessionId: sid, saved: true };
  } catch (err) {
    console.warn("[db] saveLead fallback (no DB)", err);
    return { sessionId: sid, saved: false };
  }
}

export async function savePlanLog(params: {
  email: string;
  planHtml: string;
  sessionId?: string;
  source?: string;
}): Promise<{ sessionId: string; saved: boolean }> {
  const { email, planHtml, sessionId, source } = params;
  const sid = sessionId || randomUUID();

  try {
    await ensureSchema();
    await sql`
      INSERT INTO plan_logs (session_id, email, plan_html, source)
      VALUES (${sid}, ${email}, ${planHtml}, ${source ?? null})
    `;
    return { sessionId: sid, saved: true };
  } catch (err) {
    console.warn("[db] savePlanLog fallback (no DB)", err);
    return { sessionId: sid, saved: false };
  }
}

/** Most recent answers saved for an app session, or null. */
export async function getLatestAnswers(sessionId: string): Promise<Record<string, any> | null> {
  if (!isDbConfigured() || !sessionId) return null;
  try {
    await ensureSchema();
    const { rows } = await sql`
      SELECT answers FROM (
        SELECT answers, created_at FROM answers WHERE session_id = ${sessionId} AND answers <> '{}'::jsonb
        UNION ALL
        SELECT answers, created_at FROM leads
        WHERE session_id = ${sessionId} AND answers IS NOT NULL AND answers <> '{}'::jsonb
      ) a
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return (rows[0]?.answers as Record<string, any>) ?? null;
  } catch (err) {
    console.warn("[db] getLatestAnswers failed", err);
    return null;
  }
}

export async function upsertPurchase(params: {
  stripeSessionId: string;
  appSessionId?: string | null;
  email?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  mode: string;
}): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    await ensureSchema();
    await sql`
      INSERT INTO purchases (stripe_session_id, app_session_id, email, amount_total, currency, mode)
      VALUES (${params.stripeSessionId}, ${params.appSessionId ?? null}, ${params.email ?? null},
              ${params.amountTotal ?? null}, ${params.currency ?? null}, ${params.mode})
      ON CONFLICT (stripe_session_id) DO UPDATE SET
        app_session_id = COALESCE(EXCLUDED.app_session_id, purchases.app_session_id),
        email = COALESCE(EXCLUDED.email, purchases.email)
    `;
    return true;
  } catch (err) {
    console.warn("[db] upsertPurchase failed", err);
    return false;
  }
}

/**
 * Atomically claim the right to send the plan email for a purchase.
 * Returns "claimed" for exactly one caller, "already" for everyone after, or
 * "unavailable" if the DB can't be used (caller must fall back).
 * A claim older than 10 minutes without a completed send is considered stale
 * (e.g. the function crashed mid-send) and can be re-claimed.
 */
export async function claimPlanEmail(stripeSessionId: string): Promise<"claimed" | "already" | "unavailable"> {
  if (!isDbConfigured()) return "unavailable";
  try {
    await ensureSchema();
    const { rows } = await sql`
      UPDATE purchases SET plan_email_claimed_at = NOW()
      WHERE stripe_session_id = ${stripeSessionId}
        AND plan_emailed_at IS NULL
        AND (plan_email_claimed_at IS NULL OR plan_email_claimed_at < NOW() - INTERVAL '10 minutes')
      RETURNING stripe_session_id
    `;
    return rows.length > 0 ? "claimed" : "already";
  } catch (err) {
    console.warn("[db] claimPlanEmail failed", err);
    return "unavailable";
  }
}

export async function completePlanEmail(stripeSessionId: string, sent: boolean): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    if (sent) {
      await sql`UPDATE purchases SET plan_emailed_at = NOW() WHERE stripe_session_id = ${stripeSessionId}`;
    } else {
      // Release the claim so a later webhook retry or page load can try again.
      await sql`UPDATE purchases SET plan_email_claimed_at = NULL WHERE stripe_session_id = ${stripeSessionId}`;
    }
  } catch (err) {
    console.warn("[db] completePlanEmail failed", err);
  }
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    await ensureSchema();
    const { rows } = await sql`SELECT 1 FROM email_suppressions WHERE email = ${email.trim().toLowerCase()}`;
    return rows.length > 0;
  } catch (err) {
    console.warn("[db] isEmailSuppressed failed", err);
    return false;
  }
}

export async function suppressEmail(email: string, reason: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    await ensureSchema();
    await sql`
      INSERT INTO email_suppressions (email, reason) VALUES (${email.trim().toLowerCase()}, ${reason})
      ON CONFLICT (email) DO NOTHING
    `;
    return true;
  } catch (err) {
    console.warn("[db] suppressEmail failed", err);
    return false;
  }
}
