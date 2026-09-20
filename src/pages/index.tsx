import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Header from "@/components/Header";
import HelpLink from "@/components/HelpLink";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "2000",
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

  // Assessment: flattened questions and state
  const questions = [
    { id: "email", text: "What is your email?", type: "text" },
    { id: "gender", text: "What is your gender?", type: "single", options: ["Male", "Female", "Prefer not to say", "Other"] },
    { id: "age", text: "What is your age range?", type: "single", options: ["18–24", "25–34", "35–44", "45–54", "55+"] },
    { id: "location", text: "Where do you live? (city, region, or climate)", type: "text" },
    { id: "health_conditions", text: "Do you have any known health conditions that affect nutrient absorption?", type: "single", options: ["No", "Celiac disease", "Crohn's disease", "IBD/IBS", "Other / not sure"] },
    { id: "primary_concern", text: "What is your primary hair concern?", type: "single", options: ["Hair thinning", "Slow growth", "Dullness", "Breakage", "Hair loss / shedding"] },
    { id: "hair_type", text: "What is your hair type?", type: "single", options: ["Oily", "Dry", "Normal", "Combination"] },
    { id: "scalp_condition", text: "How would you describe your scalp?", type: "single", options: ["Dry / itchy", "Oily", "Normal", "Flaky / sensitive"] },
    { id: "hair_loss_history", text: "Have you noticed recent hair thinning or hair loss?", type: "single", options: ["No", "Yes — past month", "Yes — 3–6 months", "Yes — 6–12 months", "Yes — over a year"] },
    { id: "diet", text: "What is your dietary preference?", type: "single", options: ["Omnivore", "Vegetarian", "Vegan", "Pescatarian"] },
    { id: "protein_intake", text: "How often do you consume protein-rich foods?", type: "single", options: ["Daily", "3–4 times/week", "1–2 times/week", "Rarely"] },
    { id: "iron_foods", text: "How often do you eat iron-rich foods?", type: "single", options: ["Daily", "3–4 times/week", "1–2 times/week", "Rarely"] },
    { id: "biotin_foods", text: "How often do you consume foods rich in Biotin (B7)?", type: "single", options: ["Daily", "3–4 times/week", "1–2 times/week", "Rarely"] },
    { id: "zinc_foods", text: "How often do you consume foods rich in Zinc?", type: "single", options: ["Daily", "3–4 times/week", "1–2 times/week", "Rarely"] },
    { id: "vitc_foods", text: "How often do you consume foods rich in Vitamin C?", type: "single", options: ["Daily", "3–4 times/week", "1–2 times/week", "Rarely"] },
    { id: "omega3_foods", text: "How often do you consume foods rich in Omega-3s?", type: "single", options: ["Daily", "3–4 times/week", "1–2 times/week", "Rarely"] },
    { id: "water", text: "How many glasses of water do you drink per day?", type: "single", options: ["1–2", "3–5", "6–8", "8+"] },
    { id: "stress", text: "How would you rate your typical stress level?", type: "single", options: ["Low", "Moderate", "High"] },
    { id: "sleep", text: "How many hours of sleep do you get on average per night?", type: "single", options: ["Less than 6", "6–7", "7–8", "More than 8"] },
    { id: "activity", text: "How often do you exercise?", type: "single", options: ["Daily", "3–4 times/week", "1–2 times/week", "Rarely"] },
    { id: "styling", text: "What is your typical hair styling routine?", type: "single", options: ["Heat styling", "Chemical treatments", "Protective styles", "Gentle / natural"] },
    { id: "goal", text: "What is your main goal for your hair?", type: "single", options: ["Faster growth", "Thicker hair", "Shinier hair", "Reduce shedding"] },
    { id: "supplements", text: "Are you currently taking any vitamins, minerals, or other supplements? If yes, list them.", type: "text" },
  ] as { id: string; text: string; type: "single" | "text"; options?: string[] }[];

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
  const { toast } = useToast();

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

  const generateInsight = (ans: Record<string, any>): string => {
    const stress = ans["stress"];
    const diet = ans["diet"];
    const iron = ans["iron_foods"];
    const omega = ans["omega3_foods"];
    const water = ans["water"];
    const protein = ans["protein_intake"];
    const sleep = ans["sleep"];

    if (stress === "High") {
      return "Your top lever: reduce systemic stress. Pair a balanced B‑complex in the morning with magnesium glycinate at night, aim for 7–8 hours sleep, and build a simple wind‑down. Lower cortisol helps prolong the growth (anagen) phase and reduce shedding.";
    }
    if ((diet === "Vegan" || diet === "Vegetarian") && (iron === "Rarely" || iron === "1–2 times/week")) {
      return "Prioritize iron and B12 status. With a plant‑forward diet and low iron intake, ask your clinician about checking ferritin and consider gentle iron paired with vitamin C. Addressing this often reduces diffuse shedding.";
    }
    if (omega === "Rarely" || omega === "1–2 times/week") {
      return "Increase omega‑3 intake. Add 2–3 servings of fatty fish per week or consider algae/fish oil (EPA/DHA). Better omega status supports follicle signaling and a calmer scalp.";
    }
    if (water === "1–2") {
      return "Hydration first: work toward 6–8 glasses of water daily. Hydration and electrolytes support nutrient delivery to follicles and reduce brittleness.";
    }
    if (protein === "1–2 times/week" || protein === "Rarely") {
      return "Raise daily protein toward ~0.8–1.0 g/kg, distributed across meals. Adequate protein underpins keratin synthesis and can improve thickness over time.";
    }
    return "Solid foundation—focus on consistency. Keep protein targets, include vitamin D3+K2, zinc, and biotin‑rich foods, and pair a proven topical for best regrowth odds.";
  };

  const handleFinish = async () => {
    const text = generateInsight(answers);
    setInsight(text);
    await postLog("assessment_finish", { total, hasEmail: !!leadEmail || !!(answers as any)["email"] });
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hair_answers", JSON.stringify(answers));
        localStorage.setItem("hair_insight", text);
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
        body: JSON.stringify({ email, consent: true, source: "insight", answers, insight }),
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
        body: JSON.stringify({ insight, email: emailToUse }),
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

        // Optionally pass a prefilled email if we have one.
        const email = (leadEmail || "").trim();
        if (email && /^\S+@\S+\.\S+$/.test(email)) {
          const sep = redirectUrl.includes("?") ? "&" : "?";
          redirectUrl = `${redirectUrl}${sep}prefilled_email=${encodeURIComponent(email)}`;
        }

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
        
        <!-- GA4 Tracking Script -->
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
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
                  <span className="inline-flex items-center rounded-full bg-green-500/10 text-green-600 px-3 py-1 text-xs border border-green-500/20">
                    Powered by Stripe ✓ Secure checkout
                  </span>
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
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
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
                      <p>Custom Hair Plan by Agile Rant ("we", "us") respects your privacy. This policy explains what we collect when you use our site, why we collect it, and how we handle it.</p>
                      <p><span className="font-medium text-foreground">Information we collect:</span> assessment answers, email address, technical data (like IP address and device info), and payment confirmations from our provider (Stripe). We do not store full card numbers.</p>
                      <p><span className="font-medium text-foreground">How we use it:</span> to provide your insight and full plan, process payments, send emails you request (like plan delivery and receipts), improve the service, and keep the platform secure.</p>
                      <p><span className="font-medium text-foreground">Sharing:</span> we share data with processors we use to operate the service (e.g., hosting, email, analytics, payments). We don't sell your personal information.</p>
                      <p><span className="font-medium text-foreground">Retention:</span> we keep data as long as needed to provide the service and for legitimate business or legal reasons, then delete or anonymize it.</p>
                      <p><span className="font-medium text-foreground">Your choices:</span> you can request access or deletion of your data. You can unsubscribe from emails at any time via the link provided.</p>
                      <p><span className="font-medium text-foreground">Security:</span> we use reasonable technical and organizational measures to protect your data. No method of transmission or storage is 100% secure.</p>
                      <p><span className="font-medium text-foreground">Children:</span> the service isn't intended for individuals under 18.</p>
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
                      <p>By using Custom Hair Plan by Agile Rant ("Service"), you agree to these Terms. If you don't agree, please don't use the Service.</p>
                      <p><span className="font-medium text-foreground">Use of Service:</span> You may use the Service for personal, non-commercial purposes and must comply with applicable laws.</p>
                      <p><span className="font-medium text-foreground">No medical advice:</span> Content is for educational purposes only and does not constitute medical advice. Consult your clinician before making changes.</p>
                      <p><span className="font-medium text-foreground">Payments:</span> Payments are processed by Stripe. Access to the full plan is delivered upon successful payment. Taxes may apply.</p>
                      <p><span className="font-medium text-foreground">Accounts and communications:</span> You agree to provide accurate information and consent to receive emails related to plan delivery and important updates. You can unsubscribe from marketing at any time.</p>
                      <p><span className="font-medium text-foreground">Intellectual property:</span> The Service and content are owned by Agile Rant or its licensors. You may not copy, modify, or resell without permission.</p>
                      <p><span className="font-medium text-foreground">Prohibited conduct:</span> Don't misuse the Service, attempt to access others' data, or interfere with operation or security.</p>
                      <p><span className="font-medium text-foreground">Disclaimers:</span> The Service is provided "as is" without warranties. We do not guarantee outcomes, results, or uninterrupted availability.</p>
                      <p><span className="font-medium text-foreground">Limitation of liability:</span> To the fullest extent permitted by law, Agile Rant and its affiliates are not liable for indirect, incidental, or consequential damages.</p>
                      <p><span className="font-medium text-foreground">Governing law:</span> These Terms are governed by the laws of the jurisdiction where Agile Rant operates, without regard to conflict of law principles.</p>
                      <p><span className="font-medium text-foreground">Changes:</span> We may update these Terms. Material changes will be indicated by updating the Effective date.</p>
                      <p><span className="font-medium text-foreground">Contact:</span> use the Help link in the footer or email ar@agilerant.info.</p>
                      <p className="text-xs">Effective: {new Date().toISOString().slice(0, 10)}</p>
                    </div>
                  </DialogContent>
                </Dialog>

                <HelpLink
                  page="Home"
                  sessionId={sessionId ?? undefined}
                  email={(leadEmail || (answers as any)?.email) || undefined}
                />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
