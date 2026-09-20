import { sql } from "@vercel/postgres";
import { randomUUID } from "crypto";

let schemaEnsured = false;

async function ensureSchema() {
  if (schemaEnsured) return;
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

    await sql`CREATE TABLE IF NOT EXISTS stripe_events (
      event_id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
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

/**
 * Records a Stripe webhook event as processed, for idempotency against
 * Stripe's at-least-once retry delivery. Returns true the first time an
 * event id is seen, false on any subsequent (duplicate) delivery.
 * If Postgres isn't configured, every event is treated as new (graceful
 * fallback, same as the rest of this module).
 */
export async function markEventProcessed(eventId: string): Promise<boolean> {
  try {
    await ensureSchema();
    const result = await sql`
      INSERT INTO stripe_events (event_id)
      VALUES (${eventId})
      ON CONFLICT (event_id) DO NOTHING
    `;
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    console.warn("[db] markEventProcessed fallback (no DB)", err);
    return true;
  }
}

/**
 * Releases a previously claimed event id so a Stripe retry can attempt
 * fulfillment again. Call this if processing fails after markEventProcessed
 * claimed the event, so the failure isn't mistaken for "already handled".
 */
export async function unmarkEventProcessed(eventId: string): Promise<void> {
  try {
    await ensureSchema();
    await sql`DELETE FROM stripe_events WHERE event_id = ${eventId}`;
  } catch (err) {
    console.warn("[db] unmarkEventProcessed failed (no DB)", err);
  }
}