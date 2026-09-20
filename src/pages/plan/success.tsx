import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";
import HelpLink from "@/components/HelpLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

type Answers = Record<string, any>;

export default function PlanSuccess() {
  const [insight, setInsight] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);

  const [cid] = useState(() => Math.random().toString(36).slice(2) + Date.now().toString(36));
  const postLog = async (
    event: string,
    context?: any,
    level: "info" | "warn" | "error" | "debug" = "info"
  ) => {
    try {
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" } as any,
        body: JSON.stringify({ event, level, context: { cid, stripeSessionId, ...context } }),
      });
    } catch {
      // ignore logging errors
    }
  };

  const [verifyState, setVerifyState] = useState<"idle" | "verifying" | "verified" | "failed">("idle");
  const debugBanner = ["true", "1", "yes", "on"].includes(String(process.env.NEXT_PUBLIC_DEBUG_BANNER ?? "").trim().toLowerCase());
  const [lastConfirm, setLastConfirm] = useState<{ status?: number; ok?: boolean; message?: string | null } | null>(null);
  const [cfg, setCfg] = useState<{ serverHasStripeKey: boolean; stripeMode: string } | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const sid = params.get("session_id");
          if (sid) setStripeSessionId(sid);

          const storedAnswers = window.localStorage.getItem("hair_answers");
          const storedInsight = window.localStorage.getItem("hair_insight");
          const parsedAnswers = storedAnswers ? (JSON.parse(storedAnswers) as Answers) : null;
          setAnswers(parsedAnswers);
          setInsight(storedInsight || null);
          const e = parsedAnswers?.email;
          if (typeof e === "string" && /^\S+@\S+\.\S+$/.test(e)) {
            setEmail(e);
          }

          await postLog("plan_success_load", {
            hasStoredAnswers: !!parsedAnswers,
            hasStoredInsight: !!storedInsight,
            hasEmail: !!e,
            stripeSessionIdPresent: !!sid,
          });
        }
      } catch {
        await postLog("plan_success_load_error");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Fetch runtime config for the debug banner only (stripe mode / key presence).
  useEffect(() => {
    (async () => {
      try {
        setConfigError(null);
        const resp = await fetch("/api/config");
        const data = await resp.json().catch(() => null);
        if (data?.ok) {
          setCfg({
            serverHasStripeKey: !!data.serverHasStripeKey,
            stripeMode: data.stripeMode || "test",
          });
        } else {
          setConfigError(data?.message || "invalid");
        }
      } catch (e: any) {
        setConfigError(e?.message || String(e));
      }
    })();
  }, []);

  // Gate the plan content on a server-verified payment status. Fulfillment
  // (saving the lead, logging the plan, emailing it) is handled entirely by
  // the Stripe webhook - this is a read-only check purely for the UI.
  useEffect(() => {
    if (!ready) return;
    if (!stripeSessionId) {
      setVerifyState("failed");
      return;
    }
    (async () => {
      try {
        setVerifyState("verifying");
        await postLog("verify_start", { stripeSessionId });
        const resp = await fetch(`/api/stripe/session-status?session_id=${encodeURIComponent(stripeSessionId)}`, { method: "GET" });
        const data = await resp.json().catch(() => null);
        setLastConfirm({ status: resp.status, ok: !!data?.ok, message: data?.message || null });
        if (data?.ok && data?.paid) {
          setVerifyState("verified");
          await postLog("verify_success", {});
        } else {
          setVerifyState("failed");
          await postLog("verify_error", { message: data?.message || "not_paid" }, "error");
        }
      } catch (e: any) {
        setVerifyState("failed");
        setLastConfirm({ status: undefined, ok: false, message: e?.message || String(e) });
        await postLog("verify_error", { message: e?.message || String(e) }, "error");
      }
    })();
  }, [ready, stripeSessionId]);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      await postLog("plan_displayed", {
        hasInsight: !!insight,
        hasAnswers: !!answers,
        hasEmail: !!email,
      });
    })();
  }, [ready, insight, answers, email]);

  const title = "Plan unlocked | Your comprehensive hair plan";
  const description = "Payment successful. Your complete, personalized hair plan is ready.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://example.com/plan/success" />
      </Head>

      <div className="bg-background min-h-screen flex flex-col">
        <Header />

        <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Payment successful</CardTitle>
              <CardDescription>
                {ready ? "Your complete plan is ready below." : "Preparing your plan…"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {email && (
                <p className="text-sm text-muted-foreground">
                  {`Signed in as ${email}.`}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {verifyState === "verifying"
                  ? "Verifying payment…"
                  : verifyState === "verified"
                  ? "Payment verified."
                  : verifyState === "failed"
                  ? "We couldn’t verify your payment. Please try again or contact support."
                  : null}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/">
                  <Button className="px-6">Return home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {verifyState === "verifying" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Preparing your plan…</CardTitle>
                <CardDescription>Verifying your payment before unlocking your full plan.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {verifyState === "failed" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">We couldn’t verify your payment</CardTitle>
                <CardDescription>
                  This link is missing a valid payment confirmation, so we can’t show your full plan here.
                  If you just paid, check the email we sent you — otherwise, try the checkout link again or reach out for help.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link href="/">
                    <Button className="px-6">Return home</Button>
                  </Link>
                  <HelpLink page="Plan Success (unverified)" sessionId={stripeSessionId ?? undefined} email={email ?? undefined} />
                </div>
              </CardContent>
            </Card>
          )}

          {verifyState === "verified" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Your Full Plan</CardTitle>
              <CardDescription>Personalized, research‑informed guidance based on your answers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {insight && (
                <section>
                  <h2 className="text-lg font-medium text-primary">Key Insight</h2>
                  <blockquote className="mt-2 rounded-md border bg-accent/20 text-foreground p-4">
                    {insight}
                  </blockquote>
                </section>
              )}

              <section>
                <h2 className="text-lg font-medium text-primary">Nutrition Foundation</h2>
                <ul className="mt-2 text-sm text-muted-foreground space-y-2">
                  <li>• Daily protein target: ~0.8–1.0 g/kg body weight, split across meals</li>
                  <li>• Micronutrients focus: Vitamin D3+K2, Zinc, Biotin, B‑complex</li>
                  <li>• Iron support if low ferritin; pair with Vitamin C (confirm with clinician)</li>
                  <li>• Hydration: 6–8 glasses water per day; add electrolytes if active</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-medium text-primary">Growth Support Stack</h2>
                <ul className="mt-2 text-sm text-muted-foreground space-y-2">
                  <li>• Collagen (type I/III) + MSM, daily</li>
                  <li>• Marine peptides or high‑quality protein to support keratin synthesis</li>
                  <li>• Saw palmetto / β‑sitosterol blend (monitor tolerance)</li>
                  <li>• Pair with topical minoxidil (discuss with clinician if needed)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-medium text-primary">Stress &amp; Sleep</h2>
                <ul className="mt-2 text-sm text-muted-foreground space-y-2">
                  <li>• Magnesium glycinate in the evening; consider L‑theanine earlier in day</li>
                  <li>• Wind‑down routine: light hygiene, screens off, consistent sleep window</li>
                  <li>• Target 7–8 hours sleep; light AM movement and sunlight exposure</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-medium text-primary">Topicals &amp; Scalp Care</h2>
                <ul className="mt-2 text-sm text-muted-foreground space-y-2">
                  <li>• Topical minoxidil once or twice daily as tolerated</li>
                  <li>• Gentle shampoo; avoid harsh heat/chemicals; consider scalp massage 3–5x/week</li>
                  <li>• Track shedding and density monthly with photos</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-medium text-primary">Weekly Rhythm</h2>
                <p className="mt-2 text-sm text-muted-foreground">Mon–Sun:</p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-2">
                  <li>• AM: Protein‑rich meal, D3+K2, B‑complex, fish oil/algae (EPA/DHA)</li>
                  <li>• Noon: Hydration; balanced meal; collagen + MSM</li>
                  <li>• PM: Protein‑rich meal; zinc (with food); magnesium glycinate before bed</li>
                  <li>• 3–5x/week: Scalp massage; topical application as directed</li>
                </ul>
              </section>

              <div className="text-xs text-muted-foreground rounded-md border bg-accent/20 p-3">
                <p className="font-medium text-foreground">Medical disclaimer</p>
                <p className="mt-1">
                  The information provided in this plan is for educational purposes only and is not a substitute for professional medical advice,
                  diagnosis, or treatment. Always seek the guidance of your physician or other qualified health provider with any questions you may have
                  regarding a medical condition, supplements, or medications (including finasteride, minoxidil, or peptide therapies). Do not disregard
                  professional medical advice or delay seeking it because of something you have read here. If you experience any adverse effects, stop
                  and consult a healthcare professional.
                </p>
              </div>
            </CardContent>
          </Card>
          )}
        {debugBanner && (
          <div className="fixed bottom-2 left-2 z-[60] rounded-md border bg-background/95 backdrop-blur px-3 py-2 text-xs text-muted-foreground">
            <div>Debug: sessionId={String(!!stripeSessionId)} verify={verifyState}</div>
            {lastConfirm ? (
              <div>status={String(lastConfirm.status)} ok={String(!!lastConfirm.ok)} msg={lastConfirm.message || ""}</div>
            ) : (
              <div>status: not called</div>
            )}
            <div>env={process.env.NEXT_PUBLIC_CO_DEV_ENV || "unknown"}</div>
            <div>storage: hasAnswers={String(!!answers)} hasInsight={String(!!insight)} hasEmail={String(!!email)}</div>
            {configError && (<div className="text-destructive">config error: {configError}</div>)}
            {cfg && (
              <div>config: mode={cfg.stripeMode} serverHasKey={String(cfg.serverHasStripeKey)}</div>
            )}
          </div>
        )}
        {/* Page footer with Help link */}
        <footer className="border-t">
          <div className="mx-auto max-w-3xl w-full px-4 py-10 text-sm text-muted-foreground">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p>© 2025 Custom Hair Plan by Agile Rant. All rights reserved.</p>
              <div className="flex gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="hover:text-primary">Privacy</button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Privacy Policy</DialogTitle>
                      <DialogDescription>How we collect, use, and protect your information.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>Custom Hair Plan by Agile Rant (“we”, “us”) respects your privacy. This policy explains what we collect when you use our site, why we collect it, and how we handle it.</p>
                      <p><span className="font-medium text-foreground">Information we collect:</span> assessment answers, email address, technical data (like IP address and device info), and payment confirmations from our provider (Stripe). We do not store full card numbers.</p>
                      <p><span className="font-medium text-foreground">How we use it:</span> to provide your insight and full plan, process payments, send emails you request (like plan delivery and receipts), improve the service, and keep the platform secure.</p>
                      <p><span className="font-medium text-foreground">Sharing:</span> we share data with processors we use to operate the service (e.g., hosting, email, analytics, payments). We don’t sell your personal information.</p>
                      <p><span className="font-medium text-foreground">Retention:</span> we keep data as long as needed to provide the service and for legitimate business or legal reasons, then delete or anonymize it.</p>
                      <p><span className="font-medium text-foreground">Your choices:</span> you can request access or deletion of your data. You can unsubscribe from emails at any time via the link provided.</p>
                      <p><span className="font-medium text-foreground">Security:</span> we use reasonable technical and organizational measures to protect your data. No method of transmission or storage is 100% secure.</p>
                      <p><span className="font-medium text-foreground">Children:</span> the service isn’t intended for individuals under 18.</p>
                      <p><span className="font-medium text-foreground">Contact:</span> use the Help link in the footer or email ar@agilerant.info.</p>
                      <p className="text-xs">Effective: {new Date().toISOString().slice(0, 10)}</p>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <button className="hover:text-primary">Terms</button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Terms of Service</DialogTitle>
                      <DialogDescription>Your agreement to use our service.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>By using Custom Hair Plan by Agile Rant (“Service”), you agree to these Terms. If you don’t agree, please don’t use the Service.</p>
                      <p><span className="font-medium text-foreground">Use of Service:</span> You may use the Service for personal, non‑commercial purposes and must comply with applicable laws.</p>
                      <p><span className="font-medium text-foreground">No medical advice:</span> Content is for educational purposes only and does not constitute medical advice. Consult your clinician before making changes.</p>
                      <p><span className="font-medium text-foreground">Payments:</span> Payments are processed by Stripe. Access to the full plan is delivered upon successful payment. Taxes may apply.</p>
                      <p><span className="font-medium text-foreground">Accounts and communications:</span> You agree to provide accurate information and consent to receive emails related to plan delivery and important updates. You can unsubscribe from marketing at any time.</p>
                      <p><span className="font-medium text-foreground">Intellectual property:</span> The Service and content are owned by Agile Rant or its licensors. You may not copy, modify, or resell without permission.</p>
                      <p><span className="font-medium text-foreground">Prohibited conduct:</span> Don’t misuse the Service, attempt to access others’ data, or interfere with operation or security.</p>
                      <p><span className="font-medium text-foreground">Disclaimers:</span> The Service is provided “as is” without warranties. We do not guarantee outcomes, results, or uninterrupted availability.</p>
                      <p><span className="font-medium text-foreground">Limitation of liability:</span> To the fullest extent permitted by law, Agile Rant and its affiliates are not liable for indirect, incidental, or consequential damages.</p>
                      <p><span className="font-medium text-foreground">Governing law:</span> These Terms are governed by the laws of the jurisdiction where Agile Rant operates, without regard to conflict of law principles.</p>
                      <p><span className="font-medium text-foreground">Changes:</span> We may update these Terms. Material changes will be indicated by updating the Effective date.</p>
                      <p><span className="font-medium text-foreground">Contact:</span> use the Help link in the footer or email ar@agilerant.info.</p>
                      <p className="text-xs">Effective: {new Date().toISOString().slice(0, 10)}</p>
                    </div>
                  </DialogContent>
                </Dialog>

                <HelpLink
                  page="Plan Success"
                  sessionId={stripeSessionId ?? undefined}
                  email={email ?? undefined}
                />
              </div>
            </div>
          </div>
        </footer>
        </main>
      </div>
    </>
  );
}