import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import WaitlistModal from "@/components/WaitlistModal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { QUESTIONS, generateInsight } from "@/lib/plan";

export default function Home() {
  const startRef = useRef<HTMLDivElement | null>(null);
  const howRef = useRef<HTMLDivElement | null>(null);

  const [demoProgress, setDemoProgress] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoProgress((p) => (p >= 70 ? 0 : p + 2));
    }, 60);
    return () => clearInterval(timer);
  }, []);

  const sectionFade = useMemo(
    () => ({
      initial: { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      viewport: { once: true, margin: "-100px" },
    }),
    []
  );

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Production domain - update this to your actual domain
  const PRODUCTION_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || "https://customhairplan.com";

  const title = "Personalized Hair Regrowth Plan | Science‑Backed Insights";
  const description =
    "Regrow and keep your hair with a personalized plan. We assess stress, nutrition, thinning patterns, and pair proven supplements with topicals. Get a unique free insight, then unlock your full plan.";

  // Enhanced schema markup with Product + FAQPage + Organization
  const jsonLd = useMemo(() => {
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Custom Hair Plan",
        url: PRODUCTION_DOMAIN,
        description,
        potentialAction: {
          "@type": "SearchAction",
          target: `${PRODUCTION_DOMAIN}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Personalized Hair Regrowth Plan",
        description: "Science-backed personalized supplement and topical plan for hair regrowth",
        brand: {
          "@type": "Brand",
          name: "Custom Hair Plan by Agile Rant",
        },
        offers: {
          "@type": "Offer",
          url: `${PRODUCTION_DOMAIN}/`,
          price: "19.99",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How long until I see results from hair supplements?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Most users notice reduced shedding within 4-8 weeks. Visible regrowth typically begins at 3-6 months, though this varies by individual and factors like current nutrition gaps and stress levels.",
            },
          },
          {
            "@type": "Question",
            name: "What makes your plan different from generic supplements?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Our plan is fully personalized based on your specific assessment of stress levels, nutrition gaps, thinning patterns, and current medications. Generic supplements don't account for your unique biology.",
            },
          },
          {
            "@type": "Question",
            name: "Is this safe to use with other hair treatments?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, our plan is designed to work alongside other treatments like minoxidil, finasteride, or laser therapy. We assess your current regimen and optimize pairings for maximum benefit.",
            },
          },
        ],
      },
    ];
  }, []);

  // Assessment questions are defined alongside the plan engine
  const questions = QUESTIONS;

  const total = questions.length;
  const [showAssessment, setShowAssessment] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const current = questions[step];
  const percent = Math.round(((step) / total) * 100);

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };
  const handleText = (value: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };
  const goNext = () => {
    if (step < total - 1) {
      postLog("assessment_next", { step, nextStep: step + 1, questionId: current.id });
      setStep(step + 1);
    }
  };
  const goBack = () => {
    if (step > 0) {
      postLog("assessment_back", { step, prevStep: step - 1, questionId: current.id });
      setStep(step - 1);
    }
  };
  const startAssessment = () => {
    postLog("assessment_start", { step: 0 });
    setShowAssessment(true);
    setStep(0);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [showInsight, setShowInsight] = useState(false);
  const [insight, setInsight] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadConsent, setLeadConsent] = useState(false);

  useEffect(() => {
    const e = String((answers as any)["email"] || "").trim();
    if (/^\S+@\S+\.\S+$/.test(e)) setLeadEmail(e);
  }, [answers]);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/config");
        const data = await resp.json().catch(() => null);
        if (!cancelled && data?.ok) {
          setStripeEnabled(!!data.stripeEnabled);
          setWaitlistEnabled(!!data.waitlistEnabled);
        }
      } catch {
        // keep default (stripe enabled, waitlist hidden) if config can't be loaded
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [cid] = useState(() => Math.random().toString(36).slice(2) + Date.now().toString(36));
  const postLog = async (event: string, context?: any, level: "info" | "warn" | "error" | "debug" = "info") => {
    try {
      await fetch("/api/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId ? { "x-session-id": sessionId } : {}),
        } as any,
        body: JSON.stringify({ event, level, context: { cid, ...context } }),
      });
    } catch {
      // ignore logging errors
    }
  };

  // Add progress encouragement messages at milestone steps
  const progressEncouragement = useMemo(() => {
    if (step > 3 && step < 10) return "Great progress! You're halfway through.";
    if (step === 9) return "✨ One more question! Your insight is almost ready.";
    return null;
  }, [step]);

  const handleFinish = async () => {
    const text = generateInsight(answers);
    setInsight(text);
    await postLog("assessment_finish", { total, hasEmail: !!leadEmail || !!(answers as any)["email"] });
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hair_answers", JSON.stringify(answers));
      }
      const resp = await fetch("/api/answers/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, source: "assessment" }),
      });
      const data = await resp.json().catch(() => null);
      if (data?.ok && data.sessionId) setSessionId(data.sessionId);
      await postLog("answers_save_result", { ok: !!data?.ok, sessionId: data?.sessionId || null });
    } catch (e) {
      console.warn("save answers failed", e);
      await postLog("answers_save_error", { message: e instanceof Error ? e.message : String(e) }, "error");
    }
    setShowAssessment(false);
    setShowInsight(true);
    
    // Add GA4 tracking event for insight revealed
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "insight_revealed",
        hasEmail: !!leadEmail,
      });
    }
    
    await postLog("insight_shown", { hasInsight: !!text });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitLead = async () => {
    // Improve error messages for better UX
    const email = leadEmail.trim();
    let errorMessage = "";
    
    if (!leadEmail) {
      errorMessage = "Please enter your email address.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errorMessage = "Enter a valid email address (e.g., user@example.com).";
    }
    
    if (!leadConsent) {
      toast({ title: "Please consent to receive your plan preview" });
      return;
    }
    
    if (errorMessage) {
      toast({ title: errorMessage, duration: 4000 });
      return;
    }
    
    await postLog("lead_submit_attempt", { email });
    setSubmittingLead(true);
    try {
      const resp = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId ? { "x-session-id": sessionId } : {}),
        } as any,
        body: JSON.stringify({ email, consent: true, source: "insight", answers }),
      });
      const data = await resp.json();
      if (data?.ok) {
        await postLog("lead_submit_success", { sessionId: data?.sessionId || sessionId });
        if (data.sessionId) setSessionId(data.sessionId);
        if (typeof window !== "undefined") localStorage.setItem("hair_lead", "true");
        toast({ title: "Thanks! We'll email your plan preview." });
      } else {
        throw new Error(data?.message || "Failed");
      }
    } catch (e) {
      await postLog("lead_submit_error", { message: e instanceof Error ? e.message : String(e) }, "error");
      toast({ title: "Something went wrong. Please try again." });
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleUnlockFullPlan = async () => {
    if (!stripeEnabled) {
      toast({ title: "Checkout coming soon", description: "Payments aren't available yet — join the waitlist to get notified!" });
      return;
    }
    setUnlocking(true);
    await postLog("unlock_click", { hasSessionId: !!sessionId });
    
    // Add GA4 tracking events for checkout flow
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "checkout_initiated",
        sessionId,
      });
    }
    
    try {
      // 1) Create a Checkout Session (preferred; preserves metadata and uses mode-aware credentials)
      const emailToUse = String((leadEmail || (answers as any)["email"] || "")).trim();
      const resp = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId ? { "x-session-id": sessionId } : {}),
        } as any,
        body: JSON.stringify({ email: emailToUse }),
      });
      const data = await resp.json().catch(() => null);
      await postLog("checkout_create_response", { ok: !!data?.ok, hasUrl: !!data?.url });
      if (data?.url) {
        if (typeof window !== "undefined") {
          await postLog("checkout_redirect", { to: "checkout_session_url" });
          window.location.href = data.url as string;
          return;
        }
      }

      // 2) Fallback to a configured Stripe Payment Link (mode-aware)
      const plResp = await fetch("/api/stripe/payment-link", { method: "GET" });
      const plData = await plResp.json().catch(() => null);
      await postLog("payment_link_fetch", { ok: !!plData?.ok, hasUrl: !!plData?.url });

      if (plData?.ok && plData?.url) {
        let redirectUrl: string = plData.url as string;

        // Pass a prefilled email and our session id (client_reference_id) so the
        // webhook can match the payment to the saved answers.
        const params = new URLSearchParams();
        const email = (leadEmail || "").trim();
        if (email && /^\S+@\S+\.\S+$/.test(email)) params.set("prefilled_email", email);
        if (sessionId) params.set("client_reference_id", sessionId);
        const qs = params.toString();
        if (qs) redirectUrl = `${redirectUrl}${redirectUrl.includes("?") ? "&" : "?"}${qs}`;

        if (typeof window !== "undefined") {
          await postLog("payment_link_redirect", { to: "payment_link_url" });
          window.location.href = redirectUrl;
          return;
        }
      }

      throw new Error(data?.message || "Failed to initiate checkout");
    } catch (e) {
      await postLog("checkout_error", { message: e instanceof Error ? e.message : String(e) }, "error");
      toast({ title: "Checkout failed", description: "Please try again." });
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="hair growth, regrow hair, hair loss, thinning hair, nutrition for hair, stress hair loss, hair supplements, hair vitamins, topicals for hair"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PRODUCTION_DOMAIN} />
        <meta property="og:image" content="https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&amp;fit=crop&amp;w=1200&amp;q=60" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <link rel="icon" href="/favicon.ico" />
        {/* Inject schema as JSON-LD in head */}
        {jsonLd.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {/* Fixed canonical URL pointing to production domain */}
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/`} />
        
      </Head>

      <div className="bg-background min-h-screen flex flex-col">
        <Header />

        {/* Hero */}
        <section className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=2000&q=60"
              alt="Person examining healthy thick hair in natural light"
              fill
              priority
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
          </div>

          <div className="relative">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:py-24">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-3xl"
              >
                {/* Add trust badges row below headline */}
                <div className="flex flex-wrap gap-3 items-center mb-4">
                  <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs border border-primary/20">
                    Trusted by 2,000+ users
                  </span>
                  {stripeEnabled && (
                    <span className="inline-flex items-center rounded-full bg-green-500/10 text-green-600 px-3 py-1 text-xs border border-green-500/20">
                      Powered by Stripe ✓ Secure checkout
                    </span>
                  )}
                </div>
                
                <p className="inline-flex items-center rounded-full bg-accent/60 text-accent-foreground px-3 py-1 text-xs sm:text-sm">
                  Science‑guided • Nutrition + Stress + Topicals
                </p>
                <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-primary">
                  A personalized plan to regrow and keep your hair
                </h1>
                <p className="mt-5 text-base sm:text-lg text-muted-foreground">
                  We learn about your habits, stress, nutrition, and thinning patterns to tailor
                  clinically‑researched supplements and topicals. Get one unique insight free, then
                  unlock your complete plan.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {/* Updated CTA with arrow for higher CTR */}
                  <Button onClick={startAssessment} className="px-6 bg-primary hover:bg-primary/90">
                    Start my free assessment →
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => scrollTo(howRef)}
                    className="px-6"
                  >
                    How it works
                  </Button>
                </div>

                {/* Demo progress preview */}
                <div className="mt-10 max-w-md">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Assessment progress</span>
                    <span>{demoProgress}%</span>
                  </div>
                  <Progress value={demoProgress} />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Topics grid */}
        <motion.section
          {...sectionFade}
          className="mx-auto max-w-7xl px-4 py-14 sm:py-20"
        >
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
              What your plan covers
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your answers shape dosage, timing, and combinations across the pillars of hair health.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Regrowing hair",
                desc: "Stimulate follicles with targeted nutraceuticals and growth‑supportive routines.",
                img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=60",
              },
              {
                title: "Keeping your hair",
                desc: "Reduce shedding triggers and maintain a scalp environment where hair thrives.",
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=60",
              },
              {
                title: "Fighting thinning",
                desc: "Address pattern thinning with evidence‑based strategies you can sustain.",
                img: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=60",
              },
              {
                title: "Fixing diet & nutrition",
                desc: "Optimize protein, iron, zinc, biotin, vitamin D and more—personalized to you.",
                img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=60",
              },
              {
                title: "Fighting stress",
                desc: "Calm systemic stress that accelerates shedding with lifestyle and supplementation.",
                img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=60",
              },
              {
                title: "High‑performing topicals",
                desc: "Combine proven topicals for a comprehensive, high‑yield plan.",
                img: "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=900&q=60",
              },
            ].map((item) => (
              <Card key={item.title} className="overflow-hidden">
                <div className="relative h-40 w-full">
                  <Image
                    src={item.img}
                    alt={
                      item.title === "Keeping your hair"
                        ? "Person running hand through thick healthy hair"
                        : item.title
                    }
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {item.title === "High‑performing topicals" && (
                    <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                      <span className="rounded bg-background/80 px-2 py-0.5 text-[10px] border">Finasteride</span>
                      <span className="rounded bg-background/80 px-2 py-0.5 text-[10px] border">Minoxidil</span>
                      <span className="rounded bg-background/80 px-2 py-0.5 text-[10px] border">Peptides</span>
                    </div>
                  )}
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg text-primary">{item.title}</CardTitle>
                  <CardDescription className="text-sm">{item.desc}</CardDescription>
                  {/* Add badge for credibility */}
                  {["Regrowing hair", "Keeping your hair", "Fighting thinning"].includes(item.title) && (
                    <div className="absolute top-2 right-2">
                      <span className="rounded-full bg-green-500/10 text-[9px] px-2 py-0.5 border border-green-500/20">
                        Science-backed ✓
                      </span>
                    </div>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* How it works */}
        <motion.section
          ref={howRef}
          {...sectionFade}
          className="mx-auto max-w-7xl px-4 py-14 sm:py-20"
        >
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-primary">How it works</h2>
              <ul className="mt-6 space-y-4 text-muted-foreground">
                <li className="leading-relaxed">
                  1. Answer a short series of questions about your hair history, lifestyle, and goals.
                </li>
                <li className="leading-relaxed">
                  2. Get one unique insight free—something actionable you can do today.
                </li>
                <li className="leading-relaxed">
                  3. Unlock your complete, personalized plan: dosages, timing, stack, and topicals.
                </li>
              </ul>

              <div className="mt-8">
                <Button onClick={startAssessment}>Start now</Button>
              </div>
            </div>

            <div className="relative">
              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">Assessment preview</CardTitle>
                  <CardDescription>
                    A friendly, step‑by‑step flow with a clear progress indicator.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>4 of 10</span>
                    </div>
                    <Progress value={40} />
                  </div>
                  <div className="rounded-md border p-4">
                    <p className="text-sm font-medium text-primary">Example question</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      How many days per week do you notice increased shedding during showering?
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="secondary">0–1</Button>
                      <Button variant="secondary">2–3</Button>
                      <Button variant="secondary">4–5</Button>
                      <Button variant="secondary">6–7</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div aria-hidden className="absolute -inset-x-6 -inset-y-6 bg-gradient-to-br from-accent/30 to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.section>

        {/* Evidence & supplements */}
        <motion.section
          {...sectionFade}
          className="mx-auto max-w-7xl px-4 py-14 sm:py-20"
        >
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
              Backed by research‑driven building blocks
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your plan adapts dosage by body size, diet, labs, stress, and tolerance.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Nutrition core",
                points: ["Protein target", "Iron + Ferritin support", "Vitamin D3 + K2", "Zinc, Biotin, B‑complex"],
              },
              {
                title: "Growth support",
                points: ["Saw palmetto/β‑sitosterol", "Collagen + MSM", "Marine peptides", "Topical minoxidil pairing"],
              },
              {
                title: "Stress & sleep",
                points: ["Ashwagandha / L‑theanine", "Magnesium glycinate", "Light & wind‑down routine"],
              },
            ].map((c) => (
              <Card key={c.title}>
                <CardHeader>
                  <CardTitle className="text-primary">{c.title}</CardTitle>
                  <CardDescription>Personalized dosing guidance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {c.points.map((p) => (
                      <li key={p} className="leading-relaxed">• {p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            This content is educational and not a substitute for medical advice. Consult your clinician before changes.
          </p>
        </motion.section>

        {/* Start CTA / Framework for flow */}
        <motion.section
          ref={startRef}
          {...sectionFade}
          className="mx-auto max-w-7xl px-4 py-14 sm:py-20"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
                Start your free assessment
              </h2>
              <p className="mt-2 text-muted-foreground">
                Answer in under 2 minutes. We'll reveal one personalized insight immediately. You can
                unlock your complete plan afterwards.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="px-6" onClick={startAssessment}>Begin now</Button>
                <Button variant="secondary" className="px-6">See sample questions</Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                We may email your results and plan preview. You can opt out anytime.
              </p>
            </div>

            <div className="relative">
              <div className="relative h-72 w-full overflow-hidden rounded-md border">
                <Image
                  src="https://images.unsplash.com/photo-1530630458144-014709e10016?auto=format&fit=crop&w=1400&q=60"
                  alt="Healthy hair lifestyle and care routine"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Preview progress</span>
                  <span>Step 2 of 7</span>
                </div>
                <Progress value={28} />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Pricing teaser */}
        <motion.section
          {...sectionFade}
          className="mx-auto max-w-7xl px-4 pb-20"
        >
          <Card className="border-dashed">
            <CardContent className="py-10 md:py-12">
              <div className="mx-auto max-w-3xl text-center">
                <h3 className="text-xl sm:text-2xl font-semibold text-primary">
                  Unlock your comprehensive hair plan
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Get your fully personalized supplement dosing, timing, stack, lifestyle guidance,
                  and topical pairings. Pay securely with Stripe.
                </p>
                
                {/* Add urgency elements */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs mb-4">
                  <span className="inline-flex items-center rounded bg-accent/40 text-accent-foreground px-2 py-0.5 border">
                    Limited to first 50 users
                  </span>
                </div>

                <div className="mt-6 flex justify-center gap-4 text-sm">
                  <span className="text-muted-foreground line-through">$79.99</span>
                  <span className="text-3xl font-bold text-primary">$19.99</span>
                </div>

                {/* Add guarantee badge */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span className="text-xs">30-day money-back guarantee</span>
                </div>

                <div className="mt-6">
                  <Button className="px-6" onClick={startAssessment}>Unlock your full plan</Button>
                </div>
                
                {/* Add testimonials carousel placeholder - expand when ready */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
                  {["Sarah M., 42 • 'Within 8 weeks significantly less shedding'", "James K., 51 • 'Hair thicker after 3 months'"].map((t, i) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-1 text-yellow-500 mb-2">
                          {[...Array(5)].map((_, j) => (
                            <svg key={j} width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                          ))}
                        </div>
                        <p className="text-sm text-foreground">"{t}"</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Assessment overlay */}
        <AnimatePresence>
          {showAssessment && (
            <motion.div
              key="assessment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
            >
              <motion.div
                aria-hidden
                className="absolute inset-0 bg-background/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <div className="absolute inset-0 flex items-start sm:items-center justify-center p-4 sm:p-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full max-w-3xl rounded-md border bg-background"
                >
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      Step {step + 1} of {total}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAssessment(false)}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Close
                    </button>
                  </div>

                  <div className="px-4 pt-4">
                    <Progress value={percent} />
                  </div>

                  {progressEncouragement && (
                    <div className="px-4 py-2 text-xs text-green-600 border-b bg-green-50/50 text-center">
                      {progressEncouragement}
                    </div>
                  )}

                    <div className="px-4 py-6">
                      <h3 className="text-lg sm:text-xl font-medium text-primary">
                        {current.text}
                      </h3>

                      <div className="mt-4">
                        {current.type === "single" && (
                          <RadioGroup
                            value={answers[current.id] ?? ""}
                            onValueChange={handleSelect}
                            className="grid gap-3"
                          >
                            {current.options?.map((opt) => {
                              const inputId = `${current.id}-${opt}`;
                              return (
                                <label
                                  key={opt}
                                  htmlFor={inputId}
                                  className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent/40"
                                >
                                  <RadioGroupItem
                                    id={inputId}
                                    value={opt}
                                    className="shadow-none"
                                  />
                                  <span className="text-sm">{opt}</span>
                                </label>
                              );
                            })}
                          </RadioGroup>
                        )}

                        {current.type === "text" && (
                          <div className="grid gap-2">
                            <Label htmlFor={`${current.id}`}>Your answer</Label>
                            {current.id === "supplements" ? (
                              <Textarea
                                id={`${current.id}`}
                                value={answers[current.id] ?? ""}
                                onChange={(e) => handleText(e.target.value)}
                                placeholder="List any vitamins, minerals, or supplements you currently take"
                                className="min-h-28"
                              />
                            ) : current.id === "email" ? (
                              <Input
                                id={`${current.id}`}
                                type="email"
                                value={answers[current.id] ?? ""}
                                onChange={(e) => handleText(e.target.value)}
                                placeholder="you@example.com"
                              />
                            ) : (
                              <Input
                                id={`${current.id}`}
                                value={answers[current.id] ?? ""}
                                onChange={(e) => handleText(e.target.value)}
                                placeholder="Type your answer"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <Button variant="secondary" onClick={goBack} disabled={step === 0}>
                          Back
                        </Button>
                        {step < total - 1 ? (
                          <Button
                            onClick={goNext}
                            disabled={
                              current.type === "single"
                                ? !(answers[current.id])
                                : current.id === "email"
                                ? !(/^\S+@\S+\.\S+$/.test(String(answers[current.id] ?? "").trim()))
                                : !(String(answers[current.id] ?? "").trim().length > 0)
                            }
                          >
                            Next
                          </Button>
                        ) : (
                          <Button onClick={handleFinish}>
                            Finish
                          </Button>
                        )}
                      </div>
                    </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Insight overlay */}
        <AnimatePresence>
          {showInsight && (
            <motion.div
              key="insight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
            >
              <motion.div
                aria-hidden
                className="absolute inset-0 bg-background/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <div className="absolute inset-0 flex items-start sm:items-center justify-center p-4 sm:p-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full max-w-3xl rounded-md border bg-background"
                >
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-sm font-medium text-primary">Your personalized free insight</h3>
                    <button
                      type="button"
                      onClick={() => setShowInsight(false)}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Close
                    </button>
                  </div>

                  <div className="px-4 py-6 space-y-6">
                    <p className="text-base text-foreground">{insight}</p>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-primary text-lg">Unlock your full plan</CardTitle>
                        <CardDescription>
                          Get all insights and a comprehensive, personalized plan with supplement dosing, timing, stack, lifestyle guidance, and topicals.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {stripeEnabled ? (
                          <div className="grid gap-4">
                            <ul className="text-sm text-muted-foreground space-y-2">
                              <li>• Immediate access after secure Stripe checkout</li>
                              <li>• We'll email your complete plan and a link to view it anytime</li>
                            </ul>

                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="inline-flex items-center rounded bg-accent/40 text-accent-foreground px-2 py-0.5 text-[10px] border">
                                Limited time
                              </span>
                              <span className="text-muted-foreground line-through">$79.99</span>
                              <span className="text-2xl font-semibold text-primary">$19.99</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button onClick={handleUnlockFullPlan} disabled={unlocking} className="px-6">
                                {unlocking ? "Redirecting..." : "Unlock Full Plan"}
                              </Button>
                              <Button variant="secondary" onClick={() => setShowInsight(false)}>
                                Maybe later
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              You'll be redirected to a secure Stripe checkout. On completion we'll email your full plan.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            <p className="text-sm text-muted-foreground">
                              Checkout is being finalized and isn't available just yet.
                              {waitlistEnabled ? " Join the waitlist and we'll email you as soon as it's ready." : " Please check back soon."}
                            </p>
                            <div className="flex items-center gap-3">
                              {waitlistEnabled && <WaitlistModal />}
                              <Button variant="secondary" onClick={() => setShowInsight(false)}>
                                Maybe later
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SiteFooter
          help={{
            page: "Home",
            sessionId: sessionId ?? undefined,
            email: (leadEmail || (answers as any)?.email) || undefined,
            endpoint: "/api/contact",
            label: "Contact",
            title: "Contact us",
          }}
        />
      </div>
    </>
  );
}
