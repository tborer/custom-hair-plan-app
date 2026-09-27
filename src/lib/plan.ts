/**
 * Plan engine: turns assessment answers into the free insight and the full
 * personalized plan. Pure functions with no Node/browser dependencies so the
 * same logic runs on the client (insight preview), the success page, and the
 * server (emails, webhook fulfillment).
 */
import { escapeHtml } from "@/lib/html";

export type Answers = Record<string, string>;

export type PlanSection = {
  id: string;
  title: string;
  intro?: string;
  items: string[];
};

export type Plan = {
  insight: string;
  sections: PlanSection[];
  disclaimer: string;
};

// ---------------------------------------------------------------------------
// Assessment definition (single source of truth for the quiz and validation)
// ---------------------------------------------------------------------------

const FREQ = ["Daily", "3–4 times/week", "1–2 times/week", "Rarely"];

export type Question = { id: string; text: string; type: "single" | "text"; options?: string[] };

export const QUESTIONS: Question[] = [
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
  { id: "protein_intake", text: "How often do you consume protein-rich foods?", type: "single", options: FREQ },
  { id: "iron_foods", text: "How often do you eat iron-rich foods?", type: "single", options: FREQ },
  { id: "biotin_foods", text: "How often do you consume foods rich in Biotin (B7)?", type: "single", options: FREQ },
  { id: "zinc_foods", text: "How often do you consume foods rich in Zinc?", type: "single", options: FREQ },
  { id: "vitc_foods", text: "How often do you consume foods rich in Vitamin C?", type: "single", options: FREQ },
  { id: "omega3_foods", text: "How often do you consume foods rich in Omega-3s?", type: "single", options: FREQ },
  { id: "water", text: "How many glasses of water do you drink per day?", type: "single", options: ["1–2", "3–5", "6–8", "8+"] },
  { id: "stress", text: "How would you rate your typical stress level?", type: "single", options: ["Low", "Moderate", "High"] },
  { id: "sleep", text: "How many hours of sleep do you get on average per night?", type: "single", options: ["Less than 6", "6–7", "7–8", "More than 8"] },
  { id: "activity", text: "How often do you exercise?", type: "single", options: FREQ },
  { id: "styling", text: "What is your typical hair styling routine?", type: "single", options: ["Heat styling", "Chemical treatments", "Protective styles", "Gentle / natural"] },
  { id: "goal", text: "What is your main goal for your hair?", type: "single", options: ["Faster growth", "Thicker hair", "Shinier hair", "Reduce shedding"] },
  { id: "supplements", text: "Are you currently taking any vitamins, minerals, or other supplements? If yes, list them.", type: "text" },
];

const MAX_TEXT = 500;

/**
 * Keep only known question ids; single-choice answers must match a listed option,
 * free-text answers are trimmed and capped. Use on every answers payload from a client.
 */
export function sanitizeAnswers(input: unknown): Answers {
  const out: Answers = {};
  if (!input || typeof input !== "object") return out;
  const src = input as Record<string, unknown>;
  for (const q of QUESTIONS) {
    const v = src[q.id];
    if (typeof v !== "string") continue;
    if (q.type === "single") {
      if (q.options?.includes(v)) out[q.id] = v;
    } else {
      const t = v.trim().slice(0, MAX_TEXT);
      if (t) out[q.id] = t;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isLow = (v?: string) => v === "Rarely" || v === "1–2 times/week";
const isPlantBased = (a: Answers) => a.diet === "Vegan" || a.diet === "Vegetarian";

function currentSupplements(a: Answers) {
  const s = (a.supplements || "").toLowerCase();
  const has = (...words: string[]) => words.some((w) => s.includes(w));
  return {
    iron: has("iron", "ferrous", "ferritin"),
    zinc: has("zinc"),
    biotin: has("biotin", "b7"),
    vitaminD: has("vitamin d", "vit d", "d3", "vitamin-d"),
    omega3: has("omega", "fish oil", "epa", "dha", "algae oil", "krill", "cod liver"),
    b12: has("b12", "b-12", "cobalamin", "b complex", "b-complex"),
    magnesium: has("magnesium"),
    collagen: has("collagen"),
    multivitamin: has("multi"),
    saw: has("saw palmetto"),
  };
}

// ---------------------------------------------------------------------------
// Free insight
// ---------------------------------------------------------------------------

export function generateInsight(a: Answers): string {
  if (a.stress === "High") {
    return "Your top lever: reduce systemic stress. Pair a balanced B‑complex in the morning with magnesium glycinate at night, aim for 7–8 hours sleep, and build a simple wind‑down. Lower cortisol helps prolong the growth (anagen) phase and reduce shedding.";
  }
  if (isPlantBased(a) && isLow(a.iron_foods)) {
    return "Prioritize iron and B12 status. With a plant‑forward diet and low iron intake, ask your clinician about checking ferritin and consider gentle iron paired with vitamin C. Addressing this often reduces diffuse shedding.";
  }
  if (isLow(a.omega3_foods)) {
    return "Increase omega‑3 intake. Add 2–3 servings of fatty fish per week or consider algae/fish oil (EPA/DHA). Better omega status supports follicle signaling and a calmer scalp.";
  }
  if (a.water === "1–2") {
    return "Hydration first: work toward 6–8 glasses of water daily. Hydration and electrolytes support nutrient delivery to follicles and reduce brittleness.";
  }
  if (isLow(a.protein_intake)) {
    return "Raise daily protein toward ~0.8–1.0 g/kg, distributed across meals. Adequate protein underpins keratin synthesis and can improve thickness over time.";
  }
  return "Solid foundation—focus on consistency. Keep protein targets, include vitamin D3+K2, zinc, and biotin‑rich foods, and pair a proven topical for best regrowth odds.";
}

// ---------------------------------------------------------------------------
// Full plan
// ---------------------------------------------------------------------------

export const PLAN_DISCLAIMER =
  "This plan is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Talk to your physician or pharmacist before starting supplements or topicals — especially if you are pregnant or breastfeeding, take medications, or have a medical condition. Stop and seek care if you notice adverse effects.";

export function buildPlan(input: Answers): Plan {
  const a = input || {};
  const have = currentSupplements(a);
  const plant = isPlantBased(a);
  const vegan = a.diet === "Vegan";
  const absorptionIssue = !!a.health_conditions && a.health_conditions !== "No";
  const longLoss = a.hair_loss_history === "Yes — 6–12 months" || a.hair_loss_history === "Yes — over a year";
  const recentLoss = a.hair_loss_history === "Yes — past month";
  const thinningConcern = a.primary_concern === "Hair thinning" || a.primary_concern === "Hair loss / shedding";

  // --- Nutrition ------------------------------------------------------------
  const nutrition: string[] = [];
  if (isLow(a.protein_intake)) {
    nutrition.push(
      plant
        ? "Protein is your biggest food gap: aim for ~0.8–1.0 g per kg of body weight daily, with a protein source at every meal (tofu, tempeh, lentils, beans, seitan" + (vegan ? "" : ", eggs, Greek yogurt") + ")."
        : "Protein is your biggest food gap: aim for ~0.8–1.0 g per kg of body weight daily, with a palm-sized protein serving at every meal (eggs, fish, poultry, Greek yogurt, legumes)."
    );
  } else {
    nutrition.push("Keep protein steady at ~0.8–1.0 g per kg of body weight, spread across meals — hair is built from keratin, a protein.");
  }
  if (isLow(a.iron_foods)) {
    nutrition.push(
      plant
        ? "Add iron-rich plant foods daily (lentils, chickpeas, tofu, pumpkin seeds, dark leafy greens) and eat them with vitamin C (citrus, peppers, berries) to boost absorption. Avoid tea or coffee within an hour of those meals."
        : "Add iron-rich foods 4+ times a week (red meat, shellfish, legumes, dark leafy greens), paired with a vitamin C source for absorption."
    );
  }
  if (isLow(a.zinc_foods)) {
    nutrition.push("Increase zinc from food: pumpkin seeds, chickpeas, cashews" + (plant ? ", oats" : ", oysters, beef") + " several times a week.");
  }
  if (isLow(a.omega3_foods)) {
    nutrition.push(
      plant
        ? "Add omega-3 sources daily: ground flax, chia, walnuts. Plant ALA converts poorly to EPA/DHA, so see the algae oil suggestion below."
        : "Eat fatty fish (salmon, sardines, mackerel, trout) 2–3 times a week for EPA/DHA."
    );
  }
  if (isLow(a.vitc_foods)) {
    nutrition.push("Eat a vitamin C food at most meals (citrus, kiwi, bell peppers, strawberries, broccoli) — it supports collagen formation and iron absorption.");
  }
  if (isLow(a.biotin_foods)) {
    nutrition.push("Include biotin-rich foods: eggs" + (vegan ? " (if you eat them)" : "") + ", nuts, seeds, sweet potato, and legumes.");
  }
  if (a.water === "1–2" || a.water === "3–5") {
    nutrition.push(`Hydration: you're at ${a.water} glasses a day — build up to 6–8, e.g. a glass on waking and one with each meal.`);
  }
  const foodAnswered = ["iron_foods", "zinc_foods", "omega3_foods", "vitc_foods", "biotin_foods"].every((k) => a[k]);
  if (nutrition.length === 1 && foodAnswered) {
    nutrition.push("Your food frequency answers look well rounded — the focus is consistency, not overhaul.");
  } else if (!foodAnswered) {
    nutrition.push("Build most meals around protein, colourful vegetables and fruit (for vitamin C), legumes, nuts and seeds (zinc, biotin), and omega-3 sources such as fatty fish or ground flax.");
  }

  // --- Supplements ----------------------------------------------------------
  const stack: string[] = [];
  const already: string[] = [];
  const coveredByMulti: string[] = [];
  const addOrNote = (haveIt: boolean, name: string, text: string) => {
    if (haveIt) (name.startsWith("multi:") ? coveredByMulti.push(name.slice(6)) : already.push(name));
    else stack.push(text);
  };

  const viaMulti = (explicit: boolean, name: string) => (explicit ? name : `multi:${name}`);
  addOrNote(have.vitaminD || have.multivitamin, viaMulti(have.vitaminD, "vitamin D"), "Vitamin D3: 1,000–2,000 IU daily with a meal containing fat. Low vitamin D is common in people with hair shedding; ask for a 25(OH)D blood test at your next check-up.");
  if ((plant && isLow(a.iron_foods)) || (a.gender === "Female" && thinningConcern) || absorptionIssue) {
    addOrNote(have.iron, "iron", "Iron: get ferritin tested before supplementing — iron should only be taken if levels are low, since excess iron is harmful. If low, your clinician may suggest a gentle form (e.g. iron bisglycinate) taken with vitamin C, away from coffee, tea, calcium, and zinc.");
  }
  if (vegan || (plant && isLow(a.protein_intake))) {
    addOrNote(have.b12, "B12", "Vitamin B12: essential on a plant-based diet — 250–500 mcg daily (or 1,000 mcg a few times a week).");
  }
  if (isLow(a.zinc_foods)) {
    addOrNote(have.zinc || have.multivitamin, viaMulti(have.zinc, "zinc"), "Zinc: 15–25 mg daily with food. Don't exceed 40 mg/day, and take it at a different meal than iron.");
  }
  if (isLow(a.omega3_foods)) {
    addOrNote(have.omega3, "omega-3", plant
      ? "Algae oil (vegan EPA/DHA): 250–500 mg combined EPA+DHA daily with a meal."
      : "Fish oil: 1,000 mg combined EPA+DHA daily with a meal (check with your clinician if you take blood thinners).");
  }
  if (a.stress === "High" || a.sleep === "Less than 6") {
    addOrNote(have.magnesium, "magnesium", "Magnesium glycinate: 200–400 mg in the evening to support relaxation and sleep quality.");
  }
  if (isLow(a.biotin_foods)) {
    addOrNote(have.biotin || have.multivitamin, viaMulti(have.biotin, "biotin"), "Biotin: only helpful if intake is low — a basic 30–100 mcg (often covered by a multivitamin) is enough; megadoses show no benefit. Stop biotin 3 days before any blood test — it can distort thyroid and heart lab results.");
  }
  if (isLow(a.protein_intake)) {
    addOrNote(have.collagen, "collagen/protein powder", plant
      ? "Pea or soy protein powder: one scoop daily to close your protein gap."
      : "Protein powder or collagen peptides: one serving daily to help close your protein gap.");
  }
  if (a.gender === "Male" && thinningConcern && !have.saw) {
    stack.push("Optional: saw palmetto (320 mg/day) has modest, mixed evidence for pattern thinning — far weaker than prescription options, so treat it as an add-on, not a substitute.");
  }
  if (coveredByMulti.length) already.push(`a multivitamin (covering ${listJoin(coveredByMulti)})`);
  if (already.length) {
    stack.push(`You already take ${listJoin(already)} — keep your current product and don't double up on the amounts above.`);
  }
  if (!stack.length) {
    stack.push("No new supplements needed based on your answers — your current routine and diet cover the key nutrients. Focus on the lifestyle and scalp steps below.");
  }

  // --- Stress & sleep -------------------------------------------------------
  const lifestyle: string[] = [];
  if (a.stress === "High") {
    lifestyle.push("High stress can push follicles into the shedding phase (telogen effluvium) 2–3 months later. Build a daily 10-minute reset: slow breathing, a walk outside, or journaling.");
  } else if (a.stress === "Moderate") {
    lifestyle.push("Moderate stress: protect one non-negotiable daily break (a walk, stretching, or 5 minutes of slow breathing).");
  } else if (a.stress === "Low") {
    lifestyle.push("Your stress is low — keep the habits that are working.");
  } else {
    lifestyle.push("Stress is a common shedding trigger: build a short daily reset such as a walk outside or a few minutes of slow breathing.");
  }
  if (a.sleep === "Less than 6" || a.sleep === "6–7") {
    lifestyle.push(`You sleep ${a.sleep === "Less than 6" ? "under 6" : "6–7"} hours; aim for 7–8. Keep a fixed wake time, stop screens 30–60 minutes before bed, and keep the bedroom cool and dark.`);
  } else if (a.sleep) {
    lifestyle.push("Your sleep duration is in a healthy range — keep a consistent schedule, including weekends.");
  } else {
    lifestyle.push("Aim for 7–8 hours of sleep on a consistent schedule, including weekends.");
  }
  if (isLow(a.activity) || !a.activity) {
    lifestyle.push("Add movement: work up to 150 minutes a week of brisk walking or similar — it improves circulation, sleep, and stress resilience.");
  } else {
    lifestyle.push("Your activity level is great. If training hard, make sure protein and calories keep up — under-eating is a common cause of shedding.");
  }

  // --- Scalp & topicals -----------------------------------------------------
  const scalp: string[] = [];
  switch (a.scalp_condition) {
    case "Flaky / sensitive":
      scalp.push("Flaking often signals dandruff (seborrheic dermatitis), which can worsen shedding. Use an anti-dandruff shampoo with ketoconazole 1% or zinc pyrithione 2–3×/week, leaving it on for 3–5 minutes.");
      break;
    case "Dry / itchy":
      scalp.push("For a dry, itchy scalp: wash with a gentle sulfate-free shampoo, avoid very hot water, and try a lightweight scalp serum or a few drops of oil massaged in before washing.");
      break;
    case "Oily":
      scalp.push("For an oily scalp: wash every day or every other day with a gentle shampoo; a weekly clarifying wash helps remove buildup that can clog follicles.");
      break;
    default:
      scalp.push("Keep your scalp routine gentle: a mild shampoo, conditioner on lengths only, and lukewarm water.");
  }
  scalp.push("Scalp massage: 4–5 minutes daily with your fingertips (not nails) — small studies link it to increased thickness over ~6 months.");
  if (thinningConcern || a.goal === "Thicker hair" || a.goal === "Reduce shedding") {
    scalp.push(
      a.gender === "Female"
        ? "Topical minoxidil (5% foam once daily or 2% solution twice daily) is the best-studied over-the-counter option for thinning. Expect a temporary shed in weeks 2–8; results take 4–6 months. Not for use during pregnancy or breastfeeding."
        : "Topical minoxidil (5%, once or twice daily) is the best-studied over-the-counter option for thinning. Expect a temporary shed in weeks 2–8; results take 4–6 months, and benefits last only while you use it."
    );
    if (a.gender === "Male") {
      scalp.push("For pattern thinning, prescription finasteride is the most effective option — ask a doctor or dermatologist whether it's right for you.");
    }
  }
  switch (a.styling) {
    case "Heat styling":
      scalp.push("Heat styling: use a heat protectant every time, keep tools at or below ~350°F (175°C), and give hair 2–3 heat-free days a week.");
      break;
    case "Chemical treatments":
      scalp.push("Chemical treatments: space colouring, relaxing, or perming at least 8–10 weeks apart, never do two on the same day, and use a bond-repair conditioner.");
      break;
    case "Protective styles":
      scalp.push("Protective styles: keep braids and extensions loose at the hairline and take breaks between installs — constant tension can cause traction hair loss.");
      break;
  }
  if (a.primary_concern === "Breakage" || a.hair_type === "Dry") {
    scalp.push("To reduce breakage: detangle wet hair gently with a wide-tooth comb starting from the ends, sleep on a silk or satin pillowcase, and trim split ends every 8–12 weeks.");
  }
  scalp.push("Track progress: photograph your part and hairline in the same light once a month.");

  // --- Weekly rhythm (built from the chosen stack) --------------------------
  const takes = (re: RegExp) => stack.some((s) => re.test(s));
  const am: string[] = ["protein-rich breakfast"];
  if (takes(/^Vitamin D3/)) am.push("vitamin D3");
  if (takes(/^Vitamin B12/)) am.push("B12");
  if (takes(/^(Fish oil|Algae oil)/)) am.push(plant ? "algae oil" : "fish oil");
  const midday: string[] = ["water with lunch", "protein at lunch"];
  if (takes(/^(Protein powder|Pea or soy)/)) midday.push("protein shake");
  const pm: string[] = ["protein at dinner"];
  if (takes(/^Zinc/)) pm.push("zinc with dinner");
  if (takes(/^Magnesium/)) pm.push("magnesium glycinate 1 hour before bed");
  const rhythm = [
    `Morning: ${listJoin(am)}.`,
    `Midday: ${listJoin(midday)}.`,
    `Evening: ${listJoin(pm)}${a.sleep === "Less than 6" || a.sleep === "6–7" ? "; screens off 30–60 minutes before bed" : ""}.`,
    "Daily: 4–5 minute scalp massage" + (scalp.some((s) => s.startsWith("Topical minoxidil")) ? " and topical minoxidil if you choose to use it" : "") + ".",
  ];
  if (a.scalp_condition === "Flaky / sensitive") rhythm.push("2–3× per week: anti-dandruff shampoo.");
  rhythm.push("Monthly: progress photos, and review what's working.");

  // --- Timeline & clinician flags ------------------------------------------
  const expectations: string[] = [
    "Weeks 1–4: build the routine; nothing visible yet — hair grows ~1 cm a month.",
    "Months 2–3: shedding should start to settle as nutrition, sleep, and stress improve.",
    `Months 3–6: new growth and ${a.goal === "Thicker hair" ? "improved density" : a.goal === "Shinier hair" ? "better shine and texture" : "less shedding"} become visible in your monthly photos.`,
  ];
  const clinician: string[] = [];
  if (longLoss) clinician.push("You've noticed thinning for more than 6 months — a dermatologist can diagnose the type of hair loss and discuss prescription treatments.");
  if (recentLoss) clinician.push("Sudden shedding that started in the past month is often triggered by illness, stress, surgery, or medication changes 2–3 months earlier; see a doctor if it continues beyond 3 months.");
  if (absorptionIssue) clinician.push(`With ${a.health_conditions === "Other / not sure" ? "a possible absorption issue" : a.health_conditions}, ask your doctor about testing ferritin, vitamin D, B12, and zinc before supplementing — your needs may differ.`);
  clinician.push("See a doctor promptly for patchy bald spots, scalp pain or scarring, or hair loss alongside fatigue, weight change, or irregular periods (possible thyroid or hormonal causes).");

  const sections: PlanSection[] = [
    { id: "nutrition", title: "Nutrition Foundation", items: nutrition },
    { id: "stack", title: "Growth Support Stack", intro: "Introduce one new supplement at a time, a few days apart, so you can spot any that don't agree with you.", items: stack },
    { id: "lifestyle", title: "Stress, Sleep & Movement", items: lifestyle },
    { id: "scalp", title: "Topicals & Scalp Care", items: scalp },
    { id: "rhythm", title: "Your Daily & Weekly Rhythm", items: rhythm },
    { id: "timeline", title: "What to Expect", items: expectations },
    { id: "clinician", title: "When to See a Clinician", items: clinician },
  ];

  return { insight: generateInsight(a), sections, disclaimer: PLAN_DISCLAIMER };
}

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Email-safe HTML rendering of a plan. All text is escaped. */
export function renderPlanHtml(plan: Plan): string {
  const sections = plan.sections
    .map(
      (s) => `
    <h2 style="margin:16px 0 8px; font-size:18px;">${escapeHtml(s.title)}</h2>
    ${s.intro ? `<p style="margin:0 0 8px;">${escapeHtml(s.intro)}</p>` : ""}
    <ul style="margin:0 0 16px; padding-left:18px;">
      ${s.items.map((i) => `<li style="margin:0 0 6px;">${escapeHtml(i)}</li>`).join("")}
    </ul>`
    )
    .join("");

  return `
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#0b0b0c;">
    <h2 style="margin:0 0 8px; font-size:18px;">Your Key Insight</h2>
    <blockquote style="margin:0 0 16px; padding:12px 16px; border-left:3px solid #111; background:#f6f6f7;">
      ${escapeHtml(plan.insight)}
    </blockquote>
    ${sections}
    <p style="margin:16px 0 0; font-size:12px; color:#6b6b70;">${escapeHtml(plan.disclaimer)}</p>
  </div>
  `;
}
