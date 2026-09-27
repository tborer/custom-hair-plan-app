import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Plan } from "@/lib/plan";
import { SUPPORT_EMAIL } from "@/lib/site";

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "unpaid" }
  | { status: "error"; message: string }
  | { status: "verified"; plan: Plan; email: string | null; emailed: boolean };

export default function PlanSuccess() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);

  const postLog = (event: string, context?: any, level: "info" | "warn" | "error" = "info") => {
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, level, context }),
    }).catch(() => {
      // ignore logging errors
    });
  };

  const verify = useCallback(async (sid: string) => {
    setState({ status: "loading" });
    let answers: unknown = undefined;
    try {
      const stored = window.localStorage.getItem("hair_answers");
      answers = stored ? JSON.parse(stored) : undefined;
    } catch {
      // no local answers - the server will use the ones saved during the assessment
    }

    try {
      const resp = await fetch("/api/stripe/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, answers }),
      });
      const data = await resp.json().catch(() => null);
      if (resp.ok && data?.ok && data.plan) {
        setState({ status: "verified", plan: data.plan, email: data.email ?? null, emailed: !!data.emailed });
        postLog("confirm_success", { emailed: !!data.emailed });
      } else if (resp.status === 402) {
        setState({ status: "unpaid" });
        postLog("confirm_unpaid", {}, "warn");
      } else {
        const message = data?.message || "We couldn't verify your payment.";
        setState({ status: "error", message });
        postLog("confirm_error", { status: resp.status, message }, "error");
      }
    } catch (e: any) {
      setState({ status: "error", message: "Network error while verifying your payment." });
      postLog("confirm_error", { message: e?.message || String(e) }, "error");
    }
  }, []);

  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get("session_id");
    if (!sid) {
      setState({ status: "missing" });
      return;
    }
    setStripeSessionId(sid);
    verify(sid);
  }, [verify]);

  const verified = state.status === "verified" ? state : null;

  return (
    <>
      <Head>
        <title>{verified ? "Your hair plan | Custom Hair Plan" : "Checkout | Custom Hair Plan"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="bg-background min-h-screen flex flex-col">
        <Header />

        <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">
                {state.status === "loading" && "Verifying your payment…"}
                {state.status === "verified" && "Payment successful"}
                {state.status === "missing" && "No purchase found"}
                {state.status === "unpaid" && "Payment not completed"}
                {state.status === "error" && "We couldn’t verify your payment"}
              </CardTitle>
              <CardDescription>
                {state.status === "loading" && "This only takes a moment."}
                {verified &&
                  (verified.email
                    ? verified.emailed
                      ? `Your complete plan is below, and a copy has been emailed to ${verified.email}.`
                      : `Your complete plan is below. We’re sending a copy to ${verified.email}.`
                    : "Your complete plan is below.")}
                {state.status === "missing" &&
                  "This page needs a checkout reference. If you just paid, use the link in your confirmation email to view your plan."}
                {state.status === "unpaid" &&
                  "Stripe hasn’t confirmed this payment yet. If you completed checkout, wait a minute and try again."}
                {state.status === "error" && state.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {(state.status === "unpaid" || state.status === "error") && stripeSessionId && (
                  <Button className="px-6" onClick={() => verify(stripeSessionId)}>
                    Try again
                  </Button>
                )}
                <Link href="/">
                  <Button variant={verified ? "default" : "secondary"} className="px-6">
                    Return home
                  </Button>
                </Link>
              </div>
              {(state.status === "unpaid" || state.status === "error" || state.status === "missing") && (
                <p className="text-xs text-muted-foreground">
                  Still stuck? Use the Help link below or email {SUPPORT_EMAIL} — include the email you paid with.
                </p>
              )}
            </CardContent>
          </Card>

          {verified && (
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Your Full Plan</CardTitle>
                <CardDescription>Personalized, research‑informed guidance based on your answers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <section>
                  <h2 className="text-lg font-medium text-primary">Key Insight</h2>
                  <blockquote className="mt-2 rounded-md border bg-accent/20 text-foreground p-4">
                    {verified.plan.insight}
                  </blockquote>
                </section>

                {verified.plan.sections.map((section) => (
                  <section key={section.id}>
                    <h2 className="text-lg font-medium text-primary">{section.title}</h2>
                    {section.intro && <p className="mt-2 text-sm text-muted-foreground">{section.intro}</p>}
                    <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-2">
                      {section.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}

                <div className="text-xs text-muted-foreground rounded-md border bg-accent/20 p-3">
                  <p className="font-medium text-foreground">Medical disclaimer</p>
                  <p className="mt-1">{verified.plan.disclaimer}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        <SiteFooter
          maxWidthClass="max-w-3xl"
          help={{
            page: "Plan Success",
            sessionId: stripeSessionId ?? undefined,
            email: verified?.email ?? undefined,
          }}
        />
      </div>
    </>
  );
}
