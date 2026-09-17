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
- **Full plan** organized into Key Insight, Nutrition Foundation, Growth Support
  Stack, Stress & Sleep, Topicals & Scalp Care, and a day-by-day Weekly Rhythm,
  rendered both on the success page and as HTML in the plan email.
- **Medical disclaimer** shown with the plan and included in the emailed version.

### Payments
- **Stripe Checkout** sessions created server-side with a mode-aware price ID,
  promotion codes enabled, prefilled customer email, and the app session ID and
  insight carried in session metadata.
- **Payment Link fallback** — if Checkout session creation fails, the client
  falls back to a configured Stripe Payment Link with the email prefilled.
- **Test/live mode switching** via `STRIPE_MODE`, which selects the matching
  secret key, price ID, and payment link so test and production credentials never
  mix.
- **Post-payment confirmation** (`/api/stripe/confirm`, feature-flagged) that
  retrieves the Checkout session, verifies `payment_status === "paid"`, then
  saves the lead, logs the plan, and emails the full plan.
- **Success and cancel pages** at `/plan/success` and `/plan/cancel`, with the
  success page reading the stored answers and insight to render the plan
  immediately.

### Email
- **Dual-provider delivery** — Resend or SMTP (Nodemailer), selected by whichever
  is configured, with a no-op fallback when neither is.
- **Plan preview email** sent on lead capture and **full plan email** sent after
  a confirmed payment.
- **In-app help dialog** available on every page; messages (capped at 500
  characters) are emailed to support with page, referrer, IP, user agent,
  session ID, and environment context attached.

### Data & instrumentation
- **Vercel Postgres persistence** for `leads`, `answers`, and `plan_logs`, with
  the schema created on demand at first write and a unique constraint that
  upserts leads per session and email.
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
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
- **Debug banner** on the success page, toggled by `NEXT_PUBLIC_DEBUG_BANNER`,
  showing stored state and confirmation status.

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
| `STRIPE_CONFIRM_ENABLED` | `true` to enable server-side payment confirmation |
| `NEXT_PUBLIC_STRIPE_CONFIRM_ENABLED` | `true` to let the success page call confirm |

Confirmation runs only when the server flag, the client flag, and a secret key
for the active mode are all present.

### Email

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Enables sending through Resend |
| `RESEND_FROM` | From address for Resend |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | SMTP delivery via Nodemailer |

### Database

`@vercel/postgres` reads the standard `POSTGRES_*` connection variables. Without
them, writes log a warning and return `saved: false` rather than failing the
request.

### Site & analytics

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Base URL used for Stripe redirects and email links |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID |
| `NEXT_PUBLIC_DEBUG_BANNER` | `true` to show the debug banner on the success page |
| `NEXT_PUBLIC_CO_DEV_ENV` | Environment label used in logs and the webpack config |

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/answers/save` | POST | Persist assessment answers, return a session ID |
| `/api/lead` | POST | Save a lead with consent and email the plan preview |
| `/api/plan/log` | POST | Store the generated plan HTML for later resend |
| `/api/stripe/create-checkout-session` | POST | Create a Stripe Checkout session |
| `/api/stripe/payment-link` | GET | Return the configured Payment Link URL |
| `/api/stripe/confirm` | GET/POST | Verify payment, save the lead, email the full plan |
| `/api/config` | GET | Runtime feature flags and Stripe mode |
| `/api/log` | POST | Structured, PII-masked event logging |
| `/api/help` | POST | Email a support request |

## Project structure

```
src/
  components/      Header, Logo, HelpLink, and the shadcn/ui library under ui/
  hooks/           Custom React hooks
  lib/             db.ts (Postgres), email.ts (Resend/SMTP), stripe.ts,
                   plan.ts (plan HTML builder), utils.ts
  pages/           index.tsx (landing + assessment), plan/success, plan/cancel,
                   error.tsx, and api/ routes
  styles/          globals.css
  util/            String helpers
```

## Deployment

Deploys to Vercel as-is; `vercel.json` sets the install command to
`pnpm install --no-frozen-lockfile`. Set `NEXT_PUBLIC_SITE_URL` to the deployed
URL so Stripe redirects and email links resolve correctly, and configure the
Stripe, email, and Postgres variables in the project's environment settings.

## Disclaimer

The plans this app produces are educational and are not medical advice. Users
should consult a clinician before changing supplements, medications, or
treatment.
