# Custom Hair Plan App

A Next.js web app that turns a short hair-health assessment into a personalized
hair regrowth plan. Visitors answer a 23-question quiz about their nutrition,
stress, sleep, scalp, and styling habits, receive one free tailored insight, and
can pay via Stripe to unlock the full plan — which is shown on screen and emailed
to them.

The app is a single marketing landing page plus a guided assessment flow, backed
by Next.js API routes for lead capture, payments, transactional email, and
structured logging. It is built to run on Vercel with Vercel Postgres, and every
external integration (database, email, Stripe) degrades gracefully when its
environment variables are absent, so the app still runs locally with no
credentials configured.

## Features

### Assessment & plan generation
- **23-question guided assessment** covering demographics, health conditions,
  hair and scalp type, thinning history, diet, per-nutrient intake (iron, biotin,
  zinc, vitamin C, omega-3s, protein), hydration, stress, sleep, activity,
  styling routine, goals, and current supplements.
- **Single-question stepper** with a progress bar, back/next navigation, and
  animated transitions (Framer Motion), presented as a full-screen overlay.
- **Free personalized insight** derived from the answers by a rules engine that
  prioritizes the highest-impact lever — high stress, low iron on a plant-forward
  diet, low omega-3s, low hydration, or low protein — with a solid-foundation
  fallback.
- **Personalized full plan** built by the rules engine in `src/lib/plan.ts` from
  every answer: nutrition gaps, a supplement stack that skips what the user
  already takes, stress/sleep/movement, scalp care and topicals matched to scalp
  type, styling and sex, a daily rhythm built from the chosen stack, expected
  timeline, and clinician red flags. The same structured plan renders on the
  success page and (escaped) in the plan email.
- **Medical disclaimer** shown with the plan and included in the emailed version.

### Payments
- **Stripe Checkout** sessions created server-side with a mode-aware price ID,
  promotion codes enabled, prefilled customer email, and the app session ID and
  insight carried in session metadata.
- **Payment Link fallback** — if Checkout session creation fails, the client
  falls back to a configured Stripe Payment Link with the email and
  `client_reference_id` (app session) prefilled.
- **Test/live mode switching** via `STRIPE_MODE`, which selects the matching
  secret key, price ID, and payment link so test and production credentials never
  mix.
- **Server-verified access** — the success page shows nothing until
  `/api/stripe/confirm` has retrieved the Checkout Session from Stripe and
  confirmed it is complete and paid; only then does the server return the plan.
- **Webhook fulfillment** (`/api/stripe/webhook`) on `checkout.session.completed`
  and `checkout.session.async_payment_succeeded`, so the plan is emailed even if
  the buyer closes the tab before returning to the site.
- **Exactly-once plan email** — the webhook and the success page share one
  fulfillment path; an atomic claim on the `purchases` table (or a PaymentIntent
  metadata flag without a DB) ensures the plan is emailed once per purchase.
  Reloading the success page never re-sends it.
- **Revisitable plan** — the plan email links to
  `/plan/success?session_id=…`, which re-verifies payment and rebuilds the plan
  from the answers stored server-side.

### Email
- **Dual-provider delivery** — Resend or SMTP (Nodemailer), selected by whichever
  is configured, with a no-op fallback when neither is.
- **Plan preview email** sent on lead capture (with a signed one-click
  unsubscribe link and `List-Unsubscribe` headers, honoring a suppression list)
  and **full plan email** sent after a confirmed payment.
- **In-app help dialog** available on every page; messages (capped at 500
  characters) are emailed to support with page, referrer, IP, user agent,
  session ID, and environment context attached.

### Data & instrumentation
- **Vercel Postgres persistence** for `leads`, `answers`, `plan_logs`,
  `purchases`, `email_suppressions`, and `rate_limits`, with the schema created
  on demand at first write and a unique constraint that upserts leads per
  session and email.
- **Abuse protection** — per-IP rate limits on every form/email endpoint (shared
  across instances via Postgres), a per-recipient cap on preview emails,
  whitelist validation of answers against the question definitions, and HTML
  escaping of all user input in emails. The insight is recomputed server-side,
  never accepted from the client.
- **Session correlation** — a server-issued session ID flows through the quiz,
  lead capture, checkout metadata, and logs via the `x-session-id` header.
- **Structured event logging** (`/api/log`) across the whole funnel — assessment
  start, per-step navigation, finish, insight shown, lead submit, checkout
  create, redirect, and errors.
- **PII-safe logs** — the log route masks email addresses, redacts secrets,
  tokens, and keys, omits raw answer payloads, and truncates long strings.
- **Runtime config endpoint** (`/api/config`) so the client reads feature flags
  and Stripe mode at request time instead of from build-time-baked
  `NEXT_PUBLIC_*` values.
- **Google Analytics 4** page views, including SPA route changes, when
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set — loaded only after the visitor accepts
  the cookie banner (changeable via "Cookie settings" in the footer).
- **Privacy-minded payments** — only an opaque session ID is sent to Stripe;
  assessment answers and insights stay in your database.

### UI & SEO
- **shadcn/ui component library** (48 components in `src/components/ui`, most
  built on Radix UI primitives) styled with
  Tailwind CSS, with class-variance-authority variants and a `dark` mode
  selector.
- **Marketing landing page** with hero, topics grid, how-it-works, evidence and
  supplements, CTA, and pricing sections, animated on scroll.
- **SEO metadata** — title, description, keywords, canonical URL, Open Graph and
  Twitter card tags, and `WebSite` JSON-LD structured data.
- **Toast notifications** for validation and error feedback, and
  **localStorage persistence** of answers and insight across the Stripe redirect.

## Tech stack

- [Next.js 14](https://nextjs.org/docs) (Pages Router) with TypeScript
- [Tailwind CSS](https://tailwindcss.com/docs) + [shadcn/ui](https://ui.shadcn.com) on Radix UI
- [Framer Motion](https://www.framer.com/motion/) for animation
- [Stripe](https://docs.stripe.com/) for payments
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (`@vercel/postgres`)
- [Resend](https://resend.com/docs) and [Nodemailer](https://nodemailer.com/) for email

## Getting started

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

Scripts: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`. Node 20.x is
required (see `engines` in `package.json`).

## Configuration

Create a `.env.local` file. Every variable is optional — the app runs without
them, skipping the integrations that are not configured.

### Stripe

| Variable | Purpose |
| --- | --- |
| `STRIPE_MODE` | `test` (default) or `live`; selects which credential set below is used |
| `STRIPE_TEST_SECRET_KEY` / `STRIPE_SECRET_KEY` | Secret key for test / live mode |
| `STRIPE_TEST_PRICE_ID` / `STRIPE_PRICE_ID` | Price ID for the full plan |
| `STRIPE_TEST_PAYMENT_LINK` / `STRIPE_PAYMENT_LINK` | Payment Link used as a checkout fallback |
| `STRIPE_TEST_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET` | Signing secret (`whsec_…`) for the webhook endpoint in test / live mode |
| `ENABLE_STRIPE` | `false` to disable checkout/payment links while still setting up (default: enabled) |

**Webhook setup:** in the Stripe Dashboard (Developers → Webhooks) add an
endpoint at `https://<your-domain>/api/stripe/webhook` listening for
`checkout.session.completed` and `checkout.session.async_payment_succeeded`, and
copy its signing secret into the matching env var. Locally:
`stripe listen --forward-to localhost:3000/api/stripe/webhook`.

**Payment Link setup:** if you use the Payment Link fallback, set its
confirmation behavior to redirect to
`https://<your-domain>/plan/success?session_id={CHECKOUT_SESSION_ID}` so buyers
land on the verified plan page.

### Email

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Enables sending through Resend |
| `RESEND_FROM` | From address for Resend |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | SMTP delivery via Nodemailer, used for the contact form and waitlist signups too |
| `UNSUBSCRIBE_SECRET` | Random string used to sign unsubscribe links (**required in production**; without it emails fall back to a mailto unsubscribe) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional. Support address shown to users and used as Reply-To. Defaults to the address in `SMTP_FROM`, then `SMTP_USER` |
| `SUPPORT_EMAIL` | Optional. Inbox for help, contact, and waitlist notifications if different from the above |

If neither `RESEND_FROM` nor `SMTP_FROM` is set, mail is sent from
`noreply@<NEXT_PUBLIC_SITE_URL host>` — verify that domain with your provider.

### Waitlist

| Variable | Purpose |
| --- | --- |
| `ENABLE_WAITLIST` | `false` to hide the "Join Waitlist" button/modal (default: enabled) |

### Database

Vercel no longer offers its own Postgres; add **Neon** from the Vercel Marketplace
(Storage → Create Database → Neon, free plan available on Hobby) and connect it
to this project. The app reads `POSTGRES_URL`, or `DATABASE_URL` if that is what
the integration sets. Without
them, writes log a warning and return `saved: false` rather than failing the
request. **A database is required in production**: it stores the answers the
webhook uses to build the emailed plan, guarantees the plan email is sent once,
backs cross-instance rate limits, and records unsubscribes.

### Site & analytics

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical base URL (no trailing slash) used for canonicals, the sitemap/robots, Stripe redirects, and email links |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID (loaded only after cookie consent) |
| `NEXT_PUBLIC_CO_DEV_ENV` | Environment label used in logs and the webpack config |

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/answers/save` | POST | Persist assessment answers, return a session ID |
| `/api/lead` | POST | Save a lead with consent and email the plan preview |
| `/api/stripe/create-checkout-session` | POST | Create a Stripe Checkout session |
| `/api/stripe/payment-link` | GET | Return the configured Payment Link URL |
| `/api/stripe/confirm` | POST | Verify a paid Checkout Session and return the plan (emails it if not yet sent) |
| `/api/stripe/webhook` | POST | Stripe webhook: fulfill paid Checkout Sessions |
| `/api/unsubscribe` | GET/POST | Signed unsubscribe link / RFC 8058 one-click unsubscribe |
| `/api/config` | GET | Runtime feature flags and Stripe mode |
| `/api/log` | POST | Structured, PII-masked event logging |
| `/api/help` | POST | Email a support request |
| `/api/contact` | POST | Email a footer "Contact" form submission |
| `/api/waitlist` | POST | Email a waitlist signup |

## Project structure

```
src/
  components/      Header, Logo, HelpLink, WaitlistModal, SiteFooter (legal
                   dialogs), CookieConsent, and the shadcn/ui library under ui/
  hooks/           Custom React hooks
  lib/             plan.ts (questions, insight + plan engine), fulfillment.ts
                   (payment verification + one-time plan email), db.ts
                   (Postgres), email.ts (Resend/SMTP), stripe.ts, rateLimit.ts,
                   notify.ts (support emails), unsubscribe.ts, consent.ts,
                   site.ts (site URL, support email, policy date), flags.ts
  pages/           index.tsx (landing + assessment), plan/success, plan/cancel,
                   error.tsx, sitemap.xml and robots.txt (generated), and api/
                   routes
  styles/          globals.css
  util/            String helpers
```

## Deployment

Deploys to Vercel as-is; `vercel.json` sets the install command to
`pnpm install --no-frozen-lockfile`. Before launch:

1. Connect Vercel Postgres.
2. Set `NEXT_PUBLIC_SITE_URL` and `UNSUBSCRIBE_SECRET` (the support address
   defaults to your SMTP sender).
3. Configure email (Resend or SMTP) with a verified sending domain.
4. Configure Stripe keys, price ID, and the webhook endpoint + secret for the
   active `STRIPE_MODE` (see above).
5. Make a test-mode purchase end to end: plan shown after payment, plan email
   received once, and `/plan/success` without a valid paid `session_id` shows no
   plan.
6. When the policies change, update `POLICY_EFFECTIVE_DATE` in `src/lib/site.ts`.

## Disclaimer

The plans this app produces are educational and are not medical advice. Users
should consult a clinician before changing supplements, medications, or
treatment.
