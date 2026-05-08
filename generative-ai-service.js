"use strict";

const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || "gpt-4o").trim();

function isGenerativeAiConfigured() {
  return Boolean(OPENAI_API_KEY);
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return null;
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function extractJsonArray(text) {
  const raw = String(text || "").trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : raw;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start < 0 || end <= start) {
    return null;
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function openaiChat(messages, maxTokens, options) {
  if (!OPENAI_API_KEY) {
    return { ok: false, code: "OPENAI_NOT_CONFIGURED" };
  }
  const opts = options && typeof options === "object" ? options : {};
  const temperature =
    typeof opts.temperature === "number" && opts.temperature >= 0 && opts.temperature <= 2
      ? opts.temperature
      : 0.35;
  const body = {
    model: OPENAI_MODEL,
    messages,
    max_tokens: Math.min(Number(maxTokens) || 900, 2000),
    temperature
  };
  let res;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    return { ok: false, code: "OPENAI_NETWORK", message: String(err.message || err) };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      code: "OPENAI_HTTP_ERROR",
      status: res.status,
      message: String(data.error?.message || data.message || res.statusText || "openai_error")
    };
  }
  const text = String(data.choices?.[0]?.message?.content || "").trim();
  return { ok: true, text, model: data.model || OPENAI_MODEL };
}

const VALID_PLANS = new Set(["starter", "ai-home", "plus", "pro"]);

async function generateCoachMatcherAdvice(input) {
  const goalType = String(input.goalType || "general_fitness");
  const cw = Number(input.currentWeightKg || 0);
  const tw = Number(input.targetWeightKg || 0);
  const speedType = String(input.goalSpeed || "steady");
  const dailyHours = Number(input.hoursDaily || 0.5);
  const system =
    "You route shoppers to one VibeCart coach subscription tier: starter, ai-home, plus, or pro. " +
    "Respond with ONLY a compact JSON object (no markdown fences) with keys: " +
    "planId (one of starter|ai-home|plus|pro), summary (one sentence), reasons (array of exactly 2 short strings). " +
    "Not medical advice; subscription routing only.";
  const user = JSON.stringify({
    goalType,
    currentWeightKg: cw || null,
    targetWeightKg: tw || null,
    goalSpeed: speedType,
    hoursDaily: dailyHours
  });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    500
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  if (!parsed || !VALID_PLANS.has(String(parsed.planId || "").trim())) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return {
    ok: true,
    planId: String(parsed.planId).trim(),
    summary: String(parsed.summary || "").trim(),
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 2) : []
  };
}

const COACH_WORKSPACE_VALID_PLANS = new Set(["starter", "ai-home", "plus", "pro"]);

async function generateCoachWorkspacePlanLLM(input) {
  if (!isGenerativeAiConfigured()) {
    return { ok: false, code: "OPENAI_NOT_CONFIGURED" };
  }
  const flow = String(input.flow || "coach").toLowerCase() === "insurance" ? "insurance" : "coach";
  const rawPlans = Array.isArray(input.ownedPlans) ? input.ownedPlans : [];
  const ownedPlans = [];
  for (const p of rawPlans) {
    const id = String(p || "")
      .trim()
      .toLowerCase()
      .slice(0, 24);
    if (id && !ownedPlans.includes(id)) {
      ownedPlans.push(id);
    }
    if (ownedPlans.length >= 8) {
      break;
    }
  }
  if (flow === "coach") {
    const normalized = ownedPlans.filter((id) => COACH_WORKSPACE_VALID_PLANS.has(id));
    if (!normalized.length) {
      return { ok: false, code: "INVALID_INPUT", message: "ownedPlans must include a coach package id." };
    }
    ownedPlans.length = 0;
    normalized.forEach((id) => ownedPlans.push(id));
  } else if (!ownedPlans.length) {
    return { ok: false, code: "INVALID_INPUT", message: "ownedPlans required." };
  }
  const profile = {
    goal: String(input.profile?.goal || "").trim().slice(0, 280),
    diet: String(input.profile?.diet || "").trim().slice(0, 120),
    activity: String(input.profile?.activity || "medium").trim().slice(0, 40),
    wake: String(input.profile?.wake || "").trim().slice(0, 120),
    notes: String(input.profile?.notes || "").trim().slice(0, 400)
  };
  const recentCheckins = Array.isArray(input.recentCheckins)
    ? input.recentCheckins
        .slice(-14)
        .map((row) => ({
          at: String(row?.at || "").slice(0, 40),
          completed: String(row?.completed || "").slice(0, 20),
          effort: Number(row?.effort || 0),
          soreness: String(row?.soreness || "").slice(0, 20),
          sleep: String(row?.sleep || "").slice(0, 20),
          mood: String(row?.mood || "").slice(0, 20)
        }))
    : [];
  const checkinSummary = input.checkinSummary && typeof input.checkinSummary === "object"
    ? {
        adherence: String(input.checkinSummary.adherence || "").slice(0, 20),
        avgEffort: Number(input.checkinSummary.avgEffort || 0),
        avgSleep: String(input.checkinSummary.avgSleep || "").slice(0, 20),
        trend: String(input.checkinSummary.trend || "").slice(0, 320)
      }
    : null;
  let capsHint = "";
  if (flow === "insurance") {
    capsHint =
      "Insurance wellness workspace: preventive habits and compliance-style reminders only. " +
      "Do not interpret coverage or give legal/medical advice.";
  } else {
    const hasMeals = ownedPlans.includes("plus") || ownedPlans.includes("pro");
    const hasHome = ownedPlans.includes("ai-home");
    capsHint =
      `Active coach product ids: ${ownedPlans.join(", ")}. ` +
      (hasMeals
        ? "Plus or Pro is active: include practical meal-prep and nutrition habit lines (no prescriptions, no medical dosing). "
        : "No Plus/Pro: keep food guidance to general habits only (no detailed meal plans). ") +
      (hasHome ? "AI Home is active: emphasize no-equipment home sessions and daily adaptability. " : "") +
      "Always frame the AI as an accountability and planning assistant, not a clinician.";
  }
  const system =
    "You are VibeCart's elite live AI fitness coach for post-checkout clients. " +
    "Create practical, specific, execution-ready routines that feel like a real coach. " +
    "Strict safety: NOT medical advice. No diagnosis, treatment, dosing, or cure claims. " +
    "If notes mention conditions, add one concise clinician-guidance reminder. " +
    `${capsHint}` +
    "Respect package progression: starter has NO meal plan details; ai-home/plus/pro can include meal planning. " +
    "For plus/pro include gym-equipment options and progression cues. " +
    "Output ONLY JSON (no markdown) with keys: " +
    '{"routine":"multi-line summary string","weekPlan":[{"day":"Day 1","focus":"...","warmup":"...","main":"...","cardio":"...","cooldown":"..."}],' +
    '"notifications":["exactly 6 reminders, each <=118 chars"],' +
    '"adaptationNote":"how next sessions were adjusted using check-ins",'+
    '"mealPlan":{"enabled":true|false,"dailyTemplate":["..."],"prepBlocks":["..."]}}';
  const user = JSON.stringify({ flow, ownedPlans, profile, recentCheckins, checkinSummary });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    2000,
    { temperature: 0.62 }
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  let routine = String(parsed?.routine || "").trim();
  if (!routine && typeof parsed?.routineLines !== "undefined") {
    const lines = Array.isArray(parsed.routineLines) ? parsed.routineLines : [];
    routine = lines
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .join("\n");
  }
  const notificationsIn = Array.isArray(parsed?.notifications) ? parsed.notifications : [];
  const notifications = notificationsIn
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .map((x) => x.slice(0, 200))
    .slice(0, 6);
  const weekPlanIn = Array.isArray(parsed?.weekPlan) ? parsed.weekPlan : [];
  const weekPlan = weekPlanIn.slice(0, 7).map((row, idx) => ({
    day: String(row?.day || `Day ${idx + 1}`).trim().slice(0, 30),
    focus: String(row?.focus || "Training focus").trim().slice(0, 120),
    warmup: String(row?.warmup || "Mobility + activation").trim().slice(0, 260),
    main: String(row?.main || "Strength work").trim().slice(0, 360),
    cardio: String(row?.cardio || "Cardio block").trim().slice(0, 220),
    cooldown: String(row?.cooldown || "Stretch + breathing").trim().slice(0, 220)
  }));
  const adaptationNote = String(parsed?.adaptationNote || "").trim().slice(0, 300);
  const mealPlan = parsed?.mealPlan && typeof parsed.mealPlan === "object"
    ? {
        enabled: Boolean(parsed.mealPlan.enabled),
        dailyTemplate: Array.isArray(parsed.mealPlan.dailyTemplate)
          ? parsed.mealPlan.dailyTemplate.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 8)
          : [],
        prepBlocks: Array.isArray(parsed.mealPlan.prepBlocks)
          ? parsed.mealPlan.prepBlocks.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 6)
          : []
      }
    : null;
  if (routine.length < 60 || notifications.length < 5) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return {
    ok: true,
    routine: routine.slice(0, 12000),
    notifications,
    weekPlan,
    adaptationNote,
    mealPlan,
    model: r.model
  };
}

async function generateSellerGrowthPlanLLM(input) {
  const niche = String(input.niche || "general goods").slice(0, 200);
  const region = String(input.region || "your core region").slice(0, 120);
  const channel = String(input.channel || "mixed").slice(0, 80);
  const owner = String(input.ownerName || "Owner").slice(0, 60);
  const system =
    "You are VibeCart's seller growth strategist. Output ONLY JSON (no markdown) with keys: " +
    "title (string), steps (array of 4 strings, each one actionable sentence), caution (one string about compliance and honest listings).";
  const user = JSON.stringify({ niche, region, outreachChannel: channel, ownerFirstName: owner, goal: "0 to 10 verified micro-sellers in 30 days" });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    900
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  if (!parsed || !Array.isArray(parsed.steps) || parsed.steps.length < 2) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return {
    ok: true,
    title: String(parsed.title || "Growth plan").trim(),
    steps: parsed.steps.map((s) => String(s || "").trim()).filter(Boolean).slice(0, 6),
    caution: String(parsed.caution || "").trim()
  };
}

async function generateVibecoachTipLLM(input) {
  const path = String(input.path || "/").slice(0, 200);
  const mode = String(input.mode || "default").slice(0, 40);
  const category = String(input.category || "").slice(0, 120);
  const partner = String(input.partner || "").slice(0, 120);
  const system =
    "You are VibeCoach, a concise in-app shopping copilot for VibeCart (marketplace, cross-border). " +
    "Give ONE short paragraph (max 420 characters) of practical next steps. No purchase commands; no medical claims. " +
    "JSON only: {\"tip\":\"...\"}";
  const user = JSON.stringify({ path, mode, categoryMemory: category, partnerMemory: partner });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    350
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  const tip = String(parsed?.tip || "").trim() || r.text.slice(0, 500);
  return { ok: true, tip: tip.slice(0, 600) };
}

const AI_OPS_DB_TYPES = new Set(["marketing", "security", "inventory", "research", "product_update", "compliance", "pricing"]);

function mapAiOpsOperationTypeToEnum(raw) {
  const t = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (AI_OPS_DB_TYPES.has(t)) return t;
  if (/sec|fraud|trust|auth|abuse|malware|ddos|spam|phish/.test(t)) return "security";
  if (/price|fee|margin|commission|payout|tax/.test(t)) return "pricing";
  if (/legal|gdpr|privacy|compliance|jurisdiction|regulat/.test(t)) return "compliance";
  if (/product|catalog|sku|listing|inventory|stock|warehouse|fulfill/.test(t)) return "inventory";
  if (/search|discover|seo|content|experiment|ab_test/.test(t)) return "research";
  if (/update|release|deploy|patch|version/.test(t)) return "product_update";
  return "marketing";
}

/** DB enum on ai_operations_queue.execution_mode — never return autonomous_safe from the model path; owner decides. */
function sanitizeOpsExecutionMode(mode) {
  const m = String(mode || "").trim().toLowerCase();
  if (m === "recommend_only") return "recommend_only";
  if (m === "owner_approval_required") return "owner_approval_required";
  if (m === "autonomous_safe" || m === "manual" || m === "auto" || m === "auto_execute") {
    return "owner_approval_required";
  }
  return "owner_approval_required";
}

async function generateAiOpsRecommendationsLLM(stats) {
  const system =
    "You are VibeCart's senior operations and trust AI for the OWNER console only. " +
    "You must respect all jurisdictions: output is NOT legal, tax, regulatory, or medical advice — cite that the owner must confirm with qualified counsel where needed. " +
    "Never instruct bypass of sanctions, AML/KYC, consumer protection, GDPR-style privacy duties, or platform policy. " +
    "No autonomous execution: every item executionMode must be recommend_only or owner_approval_required only (never autonomous_safe, auto_execute, or silent deploy). " +
    "Given marketplace stats JSON, propose EXACTLY 4 DISTINCT recommendations prioritizing security, fraud prevention, data minimization, and sustainable growth. " +
    "Each item MUST include regulatoryNotice (one sentence: jurisdiction-neutral compliance reminder). " +
    "Output ONLY JSON (no markdown): {\"items\":[{\"operationType\":\"short_snake_case\",\"summaryText\":\"...\",\"recommendationText\":\"...\",\"riskLevel\":\"low|medium|high\",\"executionMode\":\"recommend_only|owner_approval_required\",\"ownerAction\":\"...\",\"expectedImpact\":\"...\",\"confidenceScore\":0.0-1.0,\"regulatoryNotice\":\"...\"}]}. " +
    "operationType must be unique per item. Be specific to the numbers provided.";
  const user = JSON.stringify(stats);
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    1600
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  const itemsRaw = parsed && Array.isArray(parsed.items) ? parsed.items : extractJsonArray(r.text);
  if (!Array.isArray(itemsRaw) || itemsRaw.length < 2) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  const items = itemsRaw.slice(0, 6).map((row) => ({
    operationType: mapAiOpsOperationTypeToEnum(row.operationType),
    summaryText: String(row.summaryText || row.summary || "AI recommendation").trim().slice(0, 220),
    recommendationText: String(row.recommendationText || row.recommendation || "").trim().slice(0, 900),
    riskLevel: ["low", "medium", "high"].includes(String(row.riskLevel || "").toLowerCase())
      ? String(row.riskLevel).toLowerCase()
      : "medium",
    executionMode: sanitizeOpsExecutionMode(row.executionMode),
    ownerAction: String(row.ownerAction || "Review in AI ops queue.").trim().slice(0, 400),
    expectedImpact: String(row.expectedImpact || "Operational uplift.").trim().slice(0, 400),
    confidenceScore: Math.max(0, Math.min(1, Number(row.confidenceScore ?? row.confidence ?? 0.78) || 0.78)),
    regulatoryNotice: String(row.regulatoryNotice || "Owner must verify obligations in their own jurisdictions before acting.")
      .trim()
      .slice(0, 400)
  }));
  return { ok: true, items };
}

async function generateOwnerSecurityComplianceReviewLLM(stats) {
  const system =
    "You are VibeCart's CHIEF security and compliance analyst for the marketplace OWNER. " +
    "You produce a structured posture review from aggregate stats only (no PII). " +
    "You are NOT a lawyer or regulator: flag categories of risk and controls; the owner makes final legal and operational decisions. " +
    "Never suggest circumventing law, sanctions, licensing, age restrictions, financial promotion rules, or privacy duties. " +
    "Output ONLY JSON (no markdown): {\"executiveSummary\":\"...\",\"threatModelBullets\":[\"...\"],\"priorityControls\":[{\"control\":\"...\",\"rationale\":\"...\",\"severity\":\"low|medium|high\"}],\"auditChecklist\":[\"...\"],\"jurisdictionDisclaimer\":\"...\",\"requiresOwnerDecision\":[\"...\"]}. " +
    "executiveSummary max 900 chars; 4–7 threatModelBullets; 4–8 priorityControls; 6–12 auditChecklist strings.";
  const user = JSON.stringify(stats);
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    1800,
    { temperature: 0.25 }
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  if (!parsed || typeof parsed.executiveSummary !== "string") {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return {
    ok: true,
    executiveSummary: String(parsed.executiveSummary || "").trim().slice(0, 1200),
    threatModelBullets: Array.isArray(parsed.threatModelBullets) ? parsed.threatModelBullets.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 10) : [],
    priorityControls: Array.isArray(parsed.priorityControls) ? parsed.priorityControls.slice(0, 12) : [],
    auditChecklist: Array.isArray(parsed.auditChecklist) ? parsed.auditChecklist.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 14) : [],
    jurisdictionDisclaimer: String(parsed.jurisdictionDisclaimer || "").trim().slice(0, 800),
    requiresOwnerDecision: Array.isArray(parsed.requiresOwnerDecision)
      ? parsed.requiresOwnerDecision.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 10)
      : []
  };
}

async function generateOwnerSiteAutopilotPlanLLM(stats) {
  const system =
    "You are VibeCart's automation strategist for the OWNER. Using aggregate stats only, propose a 30-day style autopilot PLAN where every change is queued for OWNER APPROVAL — nothing auto-ships to production. " +
    "Respect marketing law, unfair commercial practices, data protection, and platform safety. No legal advice as authority. " +
    "Output ONLY JSON (no markdown): {\"planTitle\":\"...\",\"cadenceNote\":\"...\",\"workstreams\":[{\"name\":\"...\",\"objectives\":[\"...\"],\"metrics\":[\"...\"],\"ownerDecisionGates\":[\"...\"],\"riskNotes\":\"...\"}]}. " +
    "Exactly 3–5 workstreams; each with 3–6 objectives; ownerDecisionGates must be concrete yes/no decisions for the human.";
  const user = JSON.stringify(stats);
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    1800,
    { temperature: 0.35 }
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  if (!parsed || !Array.isArray(parsed.workstreams) || parsed.workstreams.length < 2) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return {
    ok: true,
    planTitle: String(parsed.planTitle || "VibeCart owner autopilot plan").trim().slice(0, 200),
    cadenceNote: String(parsed.cadenceNote || "").trim().slice(0, 600),
    workstreams: parsed.workstreams.slice(0, 6)
  };
}

async function generateAccountActivityDigestLLM(snapshot) {
  if (!isGenerativeAiConfigured()) {
    const oc = Number(snapshot?.ordersCount || 0);
    return {
      ok: true,
      headline: "Account snapshot (offline assist)",
      nudges: [
        oc ? `You have ${oc} order record(s) on file — open Orders & tracking for status.` : "No orders on file yet — browse Hot picks or your regional lanes.",
        snapshot?.hasCoachProfile ? "Coach profile is on file — open Plan workspace for routines." : "Optional: set coach goals in the wellbeing lane when you are ready."
      ],
      complianceDisclaimer:
        "This digest is informational, not legal or medical advice. Payment and password actions use official VibeCart screens only."
    };
  }
  const system =
    "You are VibeCart's signed-in account copilot. Input is an aggregate JSON snapshot with NO email, name, phone, or payment data. " +
    "Produce friendly nudges (shopping, orders, coach, insurance) that respect privacy and marketing law — no pressure, no deceptive urgency. " +
    "Not legal, tax, investment, or medical advice. " +
    "Output ONLY JSON (no markdown): {\"headline\":\"...\",\"nudges\":[\"...\",\"...\",\"...\"],\"complianceDisclaimer\":\"...\"}. " +
    "headline max 140 chars; exactly 3 nudges each max 220 chars.";
  const user = JSON.stringify(snapshot);
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    700,
    { temperature: 0.45 }
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  if (!parsed || typeof parsed.headline !== "string") {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  const nudges = Array.isArray(parsed.nudges) ? parsed.nudges.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 5) : [];
  return {
    ok: true,
    headline: String(parsed.headline || "").trim().slice(0, 200),
    nudges,
    complianceDisclaimer: String(parsed.complianceDisclaimer || "").trim().slice(0, 500)
  };
}

async function generateHotPicksTrendSlidesLLM(input) {
  if (!isGenerativeAiConfigured()) {
    return { ok: false, code: "OPENAI_NOT_CONFIGURED" };
  }
  const locale = String(input.locale || "en").trim().slice(0, 12);
  const monthHint = String(input.monthHint || "").trim().slice(0, 10);
  const refreshHint = String(input.refreshHint || "").trim().slice(0, 120);
  const system =
    "You are VibeCart's fashion and lifestyle trend editor for a public Hot Picks page. " +
    "You do NOT browse the live web; you synthesize timely micro-trends from your training knowledge and clearly current seasonal cues. " +
    "Return ONLY compact JSON (no markdown fences): " +
    '{"generatedLabel":"short ISO-ish stamp","slides":[' +
    '{"title":"...","caption":"1-2 sentences","tags":["tag1","tag2"],"ctaLabel":"Shop trend","ctaUrl":"https://..."}' +
    "]}. " +
    "Rules: exactly 6 slides; each title <= 70 chars; caption 120-220 chars; tags array length 2-3; each tag 3-12 chars, lowercase letters a-z only, " +
    "fashion-relevant words suitable as photo search tags (examples: sneakers, denim, blazer, streetwear, beauty). " +
    "ctaUrl must be https and point to a real public retailer category, new-in, or trending landing page (e.g. asos, zalando, nike, mrporter, ssense, sephora, mytheresa). " +
    "No tracking parameters, no javascript: or data: URLs.";
  const user = JSON.stringify({ locale, monthHint, refreshHint });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    1500
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  const slidesRaw = parsed && Array.isArray(parsed.slides) ? parsed.slides : extractJsonArray(r.text);
  if (!Array.isArray(slidesRaw) || slidesRaw.length < 4) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  const tagRe = /^[a-z]{3,12}$/;
  const slides = slidesRaw.slice(0, 6).map((row) => {
    const title = String(row.title || row.headline || "Trend").trim().slice(0, 80);
    const caption = String(row.caption || row.summary || "").trim().slice(0, 260);
    const tagsIn = Array.isArray(row.tags) ? row.tags : [];
    const tags = [];
    for (const t of tagsIn) {
      const v = String(t || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      if (tagRe.test(v) && !tags.includes(v)) {
        tags.push(v);
      }
      if (tags.length >= 3) break;
    }
    while (tags.length < 2) {
      tags.push(tags.length === 0 ? "fashion" : "streetwear");
    }
    const ctaLabel = String(row.ctaLabel || row.shopLabel || "Explore").trim().slice(0, 60);
    let ctaUrl = String(row.ctaUrl || row.shopUrl || row.url || "").trim();
    try {
      const u = new URL(ctaUrl);
      if (u.protocol !== "https:") {
        ctaUrl = "";
      }
      const host = u.hostname.toLowerCase();
      if (!host || host === "localhost" || host.endsWith(".local")) {
        ctaUrl = "";
      }
    } catch {
      ctaUrl = "";
    }
    return { title, caption, tags, ctaLabel, ctaUrl };
  });
  const generatedLabel = String(parsed?.generatedLabel || new Date().toISOString()).trim().slice(0, 40);
  return {
    ok: true,
    model: r.model,
    generatedLabel,
    slides
  };
}

const BRANDON_SITE_MAP =
  "Allowed action hrefs (use exactly; relative ./ paths only):\n" +
  [
    "./index.html — home, hero, marketplace sections",
    "./browse-categories.html — all category entry points",
    "./regional-shops.html — regional shop folders",
    "./live-market.html — live market lane chooser",
    "./live-market-shops.html?cat=All&view=global — all shops grid",
    "./live-market-shops.html?cat=Fashion&view=global — fashion grid",
    "./live-market-shops.html?cat=Electronics&view=global — electronics",
    "./live-market-shops.html?cat=Books&view=global — books",
    "./live-market-shops.html?cat=Gaming&view=global — gaming",
    "./live-market-shops.html?cat=All&region=ie — Ireland region grid",
    "./bridge-hub.html — cross-border trade bridge",
    "./global-search.html — search across site",
    "./hot-picks.html — curated deals lane",
    "./buy-journey.html — buyer flow",
    "./sell-journey.html — start selling",
    "./seller-boost.html — seller growth tools",
    "./my-business.html — My Business client bookings and provider desk (seller sign-in required for provider tools)",
    "./orders-tracking.html — order tracking",
    "./checkout-details.html — checkout safety notes",
    "./payment-confirmation.html — after payment",
    "./top-class-checkout.html — premium checkout lane",
    "./security-overview.html — trust & safety",
    "./policy.html — platform policy",
    "./terms.html — terms of use",
    "./privacy.html — privacy",
    "./legal-settings.html — legal preferences",
    "./account-hub.html — sign-in / account",
    "./account-welcome.html — account onboarding",
    "./passport-welcome.html — passport onboarding",
    "./lane-passport.html — lane passport",
    "./lane-welcome.html — lane welcome",
    "./wellbeing.html — wellbeing / health coach tools",
    "./coach-experience.html — coach sessions / programs",
    "./coach-payment-recovery.html — coach billing recovery",
    "./plan-workspace.html — planning workspace",
    "./world-shop-experience.html — world shop tour",
    "./popular-market.html — popular market shortcuts",
    "./service-provider-hub.html — service providers",
    "./audience-fit.html — audience / ICP fit",
    "./affiliate-dashboard.html — affiliate tracking",
    "./rewards-hub.html — rewards",
    "./insurance.html — insurance lane",
    "./shops-europe.html — Europe shops",
    "./shops-mama-africa.html — Africa shops",
    "./shops-asia.html — Asia shops",
    "./shops-scents.html — scents / beauty",
    "./shops-global.html — global mainstream shops",
    "./fashion-trends.html — fashion trends rail",
    "./seller-orders.html — seller orders",
    "./buyer-orders.html — buyer orders",
    "./my-listings.html — my listings",
    "./seller-live-preview.html — listing preview",
    "./admin.html — owner admin (sign-in)",
    "./admin-app.html — admin app shell",
    "./admin-messages.html — admin messages"
  ].join("\n");

function sanitizeBrandonGuideActions(raw) {
  const hrefOk = /^\.\/[a-z0-9._-]+\.html(\?[a-z0-9._=&%-]*)?(#[-a-z0-9._]*)?$/i;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    let href = String(row.href || "").trim().replace(/\s+/g, "");
    const label = String(row.label || "Open").trim().slice(0, 48);
    if (!hrefOk.test(href)) continue;
    if (/^(javascript|data):/i.test(href)) continue;
    if (href.length > 220) continue;
    out.push({ label: label || "Open", href });
    if (out.length >= 4) break;
  }
  return out;
}

/** Apparel / style only — keep in sync with deploy-web/mobile-app-shell.js `brandonFashionLiveGridIntent`. */
function brandonFashionLiveGridFromQuestion(question) {
  const a = String(question || "")
    .trim()
    .toLowerCase();
  return (
    /\b(?:fashion|outfits?|wardrobe|streetwear|runway|lookbook|apparel|garments?|clothes|clothing|footwear|sneakers?|jewelry|jewellery)\b/.test(
      a
    ) || /\bstyles?\b/.test(a)
  );
}

const BRANDON_FASHION_GRID_HREF_RE = /cat\s*=\s*fashion|lane\s*=\s*fashion/i;

function finalizeBrandonGuideActions(question, rawActions) {
  const q = String(question || "").trim();
  let list = sanitizeBrandonGuideActions(rawActions);
  const dedupe = (rows) => {
    const s = new Set();
    return rows.filter((row) => {
      const h = String(row.href || "");
      if (s.has(h)) return false;
      s.add(h);
      return true;
    });
  };
  list = dedupe(list);
  if (!brandonFashionLiveGridFromQuestion(q)) {
    list = list.filter((row) => !BRANDON_FASHION_GRID_HREF_RE.test(String(row.href || "")));
  }
  if (!brandonFashionLiveGridFromQuestion(q) && list.length === 1) {
    const only = String(list[0].href || "")
      .trim()
      .toLowerCase();
    if (only === "./hot-picks.html" || only.startsWith("./hot-picks.html?")) {
      list = list.concat([
        { label: "Live market (all shops)", href: "./live-market-shops.html?cat=All&view=global" },
        { label: "Global search", href: "./global-search.html" }
      ]);
      list = dedupe(list);
    }
  }
  if (!list.length) {
    return [
      { label: "Browse categories", href: "./browse-categories.html" },
      { label: "Global search", href: "./global-search.html" }
    ];
  }
  return list.slice(0, 4);
}

async function generateMbStudioSuiteLLM(input) {
  if (!isGenerativeAiConfigured()) {
    return { ok: false, code: "OPENAI_NOT_CONFIGURED" };
  }
  const tradeName = String(input.tradeName || "").trim().slice(0, 120);
  const niche = String(input.niche || "").trim().slice(0, 220);
  const audience = String(input.audience || "").trim().slice(0, 160);
  const painPoints = String(input.painPoints || "").trim().slice(0, 500);
  const dailyOps = String(input.dailyOps || "").trim().slice(0, 500);
  const tone = String(input.tone || "premium-calm").trim().slice(0, 40);
  if (!tradeName || niche.length < 4) {
    return { ok: false, code: "INVALID_INPUT" };
  }
  const system =
    "You are VibeCart's My Business Studio AI — you design a UNIQUE provider dashboard suite for one service business (beauty, wellness, trades, creative, or hybrid). " +
    "Output ONLY JSON (no markdown). Schema: " +
    '{"suiteName":"short branded title","tagline":"one line","toneNotes":"how UI copy should feel","modules":[{"id":"snake_case","title":"","purpose":"","kpis":["metric"],"widgets":["what shows on card"]}],"onboardingChecklist":[""],"clientPromise":"one sentence"} . ' +
    "Provide 5–8 modules tailored to the answers (not a generic salon clone unless inputs say salon). Include at least: intake, scheduling, payments/deposits, portfolio/showcase, client messaging, analytics, compliance reminders where relevant.";
  const user = JSON.stringify({ tradeName, niche, audience, painPoints, dailyOps, tone });
  const r = await openaiChat(
    [{ role: "system", content: system }, { role: "user", content: user }],
    1400,
    { temperature: 0.78 }
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  if (!parsed || !String(parsed.suiteName || "").trim()) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  const modules = Array.isArray(parsed.modules) ? parsed.modules.slice(0, 12) : [];
  return {
    ok: true,
    suiteName: String(parsed.suiteName || "").trim().slice(0, 120),
    tagline: String(parsed.tagline || "").trim().slice(0, 220),
    toneNotes: String(parsed.toneNotes || "").trim().slice(0, 400),
    modules: modules.map((m) => ({
      id: String(m.id || "module")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .slice(0, 48),
      title: String(m.title || "Module").trim().slice(0, 80),
      purpose: String(m.purpose || "").trim().slice(0, 320),
      kpis: Array.isArray(m.kpis) ? m.kpis.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 4) : [],
      widgets: Array.isArray(m.widgets) ? m.widgets.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 5) : []
    })),
    onboardingChecklist: Array.isArray(parsed.onboardingChecklist)
      ? parsed.onboardingChecklist.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 14)
      : [],
    clientPromise: String(parsed.clientPromise || "").trim().slice(0, 280),
    model: r.model
  };
}

async function generateProviderDashboardSectionsLLM(input) {
  if (!isGenerativeAiConfigured()) {
    return { ok: false, code: "OPENAI_NOT_CONFIGURED" };
  }
  const requirements = String(input.requirements || "").trim().slice(0, 1800);
  const service = String(input.service || "General service").trim().slice(0, 120);
  const mode = String(input.mode || "autonomous").trim().toLowerCase().slice(0, 40);
  const system =
    "You are VibeCart's live AI for service-provider dashboards inside My Business. " +
    "Design practical, high-conversion dashboard sections for operators (beauty, wellness, trades, creative services). " +
    "Output ONLY JSON (no markdown): " +
    '{"sections":[{"title":"short title","intent":"why this section exists","automation":"how AI automates it","widgets":["specific dashboard cards"]}]}. ' +
    "Rules: provide exactly 6 sections, each with 2-4 widget ideas. Keep wording practical and operator-focused. " +
    "Do not request secrets, card data, OTPs, or password info. Respect compliance and safety workflows.";
  const user = JSON.stringify({ requirements, service, mode });
  const r = await openaiChat(
    [{ role: "system", content: system }, { role: "user", content: user }],
    1400,
    { temperature: 0.6 }
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  const raw = parsed && Array.isArray(parsed.sections) ? parsed.sections : [];
  if (!raw.length) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  const sections = raw
    .slice(0, 8)
    .map((s) => ({
      title: String((s && s.title) || "Section").trim().slice(0, 90),
      intent: String((s && s.intent) || "").trim().slice(0, 360),
      automation: String((s && s.automation) || "").trim().slice(0, 360),
      widgets: Array.isArray(s && s.widgets)
        ? s.widgets.map((w) => String(w || "").trim()).filter(Boolean).slice(0, 5)
        : []
    }))
    .filter((s) => s.title && s.intent);
  if (!sections.length) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return { ok: true, sections, model: r.model };
}

function brandonGuideQuestionHitsCredentialScope(q) {
  const s = String(q || "").trim().toLowerCase();
  if (!s) return false;
  if (/\b(forgot password|password reset|where (do i|to) reset)\b/.test(s)) return false;
  if (/\b(cvv|cvc|card number|routing number|bank account number|sort code|iban\b|swift code|bic code|wire transfer|account number)\b/.test(s)) {
    return true;
  }
  if (/\b(atm pin|card pin)\b/.test(s)) return true;
  if (/\bpassword\b/.test(s) && /\b(give|send|paste|tell me what|reveal|hack|stolen)\b/.test(s)) return true;
  if (/\b(otp|one[- ]time code|2fa secret)\b/.test(s)) return true;
  if (/\b(ssn|social security number)\b/.test(s)) return true;
  return false;
}

async function generateBrandonGuideLLM(input) {
  if (!isGenerativeAiConfigured()) {
    return { ok: false, code: "OPENAI_NOT_CONFIGURED" };
  }
  const question = String(input.question || "").trim().slice(0, 400);
  const pageUrl = String(input.pageUrl || "").trim().slice(0, 500);
  const path = String(input.path || "").trim().slice(0, 200);
  const locale = String(input.locale || "en").trim().slice(0, 12);
  if (question.length < 2) {
    return { ok: false, code: "INVALID_INPUT" };
  }
  if (brandonGuideQuestionHitsCredentialScope(question)) {
    return {
      ok: true,
      reply:
        "I cannot help with passwords, card numbers, CVV, PIN, bank account data, or one-time codes. Use official VibeCart checkout and account screens only.",
      actions: [
        { label: "Security overview", href: "./security-overview.html" },
        { label: "Account hub", href: "./account-hub.html" },
        { label: "Privacy", href: "./privacy.html" }
      ]
    };
  }
  const recent = Array.isArray(input.recentQuestions)
    ? input.recentQuestions.map((x) => String(x || "").trim().slice(0, 200)).filter(Boolean).slice(-5)
    : [];
  const displayName = String(input.displayName || "")
    .trim()
    .slice(0, 80);
  const system =
    "You are Brandon, VibeCart's in-app guide for the static marketplace site (buy/sell cross-border, live shop grids, coach lanes). " +
    "You do NOT browse the live web. Answer in clear English for the user's question. " +
    "When JSON field displayName is a real first name or short name (not empty, not the word friend), greet them once by name in the opening clause, then continue with routing help. " +
    "Be decisively helpful: when several lanes could apply, pick the single clearest next step and the best matching `href` set; only mention a second path if it fits naturally in the same breath. " +
    "Be practical: one tight paragraph in `reply` (max ~820 characters), no markdown, no emojis—concrete next clicks over generic reassurance, present tense, warm and direct without hype. " +
    "If the question is broad, add one clarifying angle inside the same paragraph, then anchor navigation to the strongest destination. " +
    "Vary wording; do not repeat identical sentences if similar questions appear in recentQuestions. " +
    "Each request includes diversityNonce — treat it as a fresh session id and avoid copying a previous reply verbatim. " +
    "For service PROVIDERS: point them to ./my-business.html (provider path, signed-in seller) for offers and bookings, and ./service-provider-hub.html for prepayment/checkout copy — do not imply a separate AI studio page on My Business. " +
    "Do not give medical diagnosis or legal advice as authority—point to policy/privacy/security pages when needed. " +
    "Never request or process passwords, OTPs, CVV, full card numbers, PINs, bank account numbers, or wire instructions—refuse and point to ./security-overview.html and ./account-hub.html . " +
    "Never invent external URLs. For navigation, output 0–4 buttons in JSON `actions` with `label` and `href`. " +
    "Each `href` MUST be copied exactly from the allowed list below (including optional ?query). " +
    "If the user is vague, suggest browse-categories + global-search (or live market All shops), not hot-picks plus Fashion grid. " +
    "Use ./live-market-shops.html?cat=Fashion&view=global only for clear apparel/clothing/style questions — not for beauty-only, scents, salon, or booking pros (use ./shops-scents.html or ./service-provider-hub.html). " +
    "Output ONLY compact JSON (no markdown): {\"reply\":\"...\",\"actions\":[{\"label\":\"...\",\"href\":\"./page.html\"}]}";
  const user = JSON.stringify({
    question,
    currentPageUrl: pageUrl,
    currentPath: path,
    locale,
    displayName: displayName || undefined,
    recentQuestions: recent,
    diversityNonce: String(Date.now()),
    siteMap: BRANDON_SITE_MAP
  });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    900,
    { temperature: 0.9 }
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  const reply = String(parsed?.reply || "").trim() || String(r.text || "").trim().slice(0, 800);
  const actions = finalizeBrandonGuideActions(question, parsed?.actions);
  if (!reply) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return { ok: true, reply: reply.slice(0, 900), actions };
}

async function generateSiteSeoPulseLLM(input) {
  if (!isGenerativeAiConfigured()) {
    return { ok: false, code: "OPENAI_NOT_CONFIGURED" };
  }
  const path = String(input.path || "/").trim().slice(0, 200);
  const title = String(input.title || "").trim().slice(0, 200);
  const existing = String(input.existingKeywords || "").trim().slice(0, 500);
  const system =
    "You are VibeCart's SEO discovery engine for a legal cross-border marketplace (Africa, Europe, Dubai, Asia, secure payments, live shop grids, hot picks, seller tools). " +
    "Output ONLY compact JSON (no markdown): {\"keywords\":\"...\"} where keywords is one comma-separated line of 22–48 distinct English search phrases. " +
    "Mix head terms and realistic long-tail buyer/seller intents (cross-border shopping, tracked delivery, marketplace trust, regional lanes). " +
    "No duplicate near-duplicates, no misleading medical or get-rich claims, no pipe | characters, max 920 characters total. " +
    "Do not paste URLs. Respect existingKeywords as a hint to avoid total repetition — you may extend and diversify.";
  const user = JSON.stringify({ path, pageTitle: title, existingKeywords: existing });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    800,
    { temperature: 0.88 }
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  const keywords = String(parsed?.keywords || "").trim().slice(0, 920);
  if (!keywords) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return { ok: true, keywords };
}

async function runPublicGenerativeAgent(agent, input) {
  if (agent === "coach_matcher") {
    return generateCoachMatcherAdvice(input || {});
  }
  if (agent === "coach_workspace_plan") {
    return generateCoachWorkspacePlanLLM(input || {});
  }
  if (agent === "seller_growth_plan") {
    return generateSellerGrowthPlanLLM(input || {});
  }
  if (agent === "vibecoach_tip") {
    return generateVibecoachTipLLM(input || {});
  }
  if (agent === "hot_picks_trends") {
    return generateHotPicksTrendSlidesLLM(input || {});
  }
  if (agent === "brandon_guide") {
    return generateBrandonGuideLLM(input || {});
  }
  if (agent === "site_seo_pulse") {
    return generateSiteSeoPulseLLM(input || {});
  }
  if (agent === "mb_studio_suite") {
    return generateMbStudioSuiteLLM(input || {});
  }
  if (agent === "provider_dashboard_sections") {
    return generateProviderDashboardSectionsLLM(input || {});
  }
  return { ok: false, code: "INVALID_AGENT" };
}

const OUTREACH_TYPES = new Set(["initial_application", "traffic_update", "approval_followup"]);

async function generateAdminPromptLLM(input) {
  const task = String(input.task || "").trim().slice(0, 4000);
  const system =
    "You help a VibeCart marketplace owner draft a prompt for an external AI assistant (e.g. ChatGPT). " +
    "The prompt must ask for secure, production-safe engineering guidance: risks, implementation steps, test checklist, rollback plan. " +
    "The drafted prompt must insist on respecting applicable laws (privacy, consumer protection, payments, marketing) and on owner final sign-off before production changes. " +
    "Output ONLY JSON (no markdown): {\"prompt\":\"...\"}. The prompt may be multi-line inside the JSON string.";
  const user = JSON.stringify({
    ownerRequest: task || "Suggest top-priority improvements for security, performance, and UX."
  });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    1200
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  const prompt = String(parsed?.prompt || "").trim();
  if (!prompt) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return { ok: true, prompt: prompt.replace(/\\n/g, "\n").slice(0, 12000) };
}

async function generateAdminAdCreativeLLM(input) {
  const slot = String(input.slot || "homepage").trim().slice(0, 120);
  const budget = Math.max(0, Math.min(1e7, Number(input.budget) || 50));
  const system =
    "You are VibeCart's ads strategist. Propose compliant, trust-preserving sponsored placements and 2–4 concrete campaign angles. " +
    "Respect unfair commercial practices law, truth-in-advertising, and jurisdiction-specific marketing rules — the owner must validate copy with counsel where needed. " +
    "Output ONLY JSON (no markdown): {\"suggestions\":\"...\"} where suggestions is one multi-paragraph string the owner can paste into the admin textarea.";
  const user = JSON.stringify({ adSlotLabel: slot, minimumCampaignBudgetEur: budget });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    900
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  const suggestions = String(parsed?.suggestions || "").trim();
  if (!suggestions) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return { ok: true, suggestions: suggestions.replace(/\\n/g, "\n").slice(0, 8000) };
}

async function generateAdminAffiliateOutreachLLM(input) {
  const partnerName = String(input.partnerName || "Affiliate Partner").trim().slice(0, 160);
  const siteName = String(input.siteName || "VibeCart").trim().slice(0, 120);
  const siteUrl = String(input.siteUrl || "").trim().slice(0, 500);
  const ownerName = String(input.ownerName || "VibeCart Partnerships").trim().slice(0, 120);
  const replyEmail = String(input.replyEmail || "").trim().slice(0, 200);
  const draftType = OUTREACH_TYPES.has(String(input.draftType || "").trim())
    ? String(input.draftType).trim()
    : "initial_application";
  const trafficClicks = Math.max(0, Math.min(1e9, Number(input.trafficClicks) || 0));
  const trafficRegions = String(input.trafficRegions || "").trim().slice(0, 200);
  const system =
    "You draft professional affiliate partnership emails for a marketplace operator. Tone: concise, respectful, no hype, no legal guarantees. " +
    "Avoid CAN-SPAM/GDPR-style compliance mistakes: no deceptive subjects, include clear opt-out language placeholder where appropriate, and remind the owner to verify recipient consent and local electronic marketing law. " +
    "Output ONLY JSON (no markdown): {\"subject\":\"...\",\"body\":\"...\"}. Body is plain text with paragraphs separated by \\n\\n in JSON.";
  const user = JSON.stringify({
    draftType,
    partnerName,
    marketplaceName: siteName,
    marketplaceUrl: siteUrl,
    senderName: ownerName,
    replyToEmail: replyEmail,
    trafficClicksLastPeriod: trafficClicks,
    trafficRegionsSummary: trafficRegions
  });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    1100
  );
  if (!r.ok) {
    return r;
  }
  const parsed = extractJsonObject(r.text);
  const subject = String(parsed?.subject || "").trim();
  const body = String(parsed?.body || "").trim();
  if (!subject || !body) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return {
    ok: true,
    subject: subject.slice(0, 300),
    body: body.replace(/\\n/g, "\n").slice(0, 12000)
  };
}

async function runOwnerGenerativeAgent(agent, input) {
  if (!isGenerativeAiConfigured()) {
    return { ok: false, code: "OPENAI_NOT_CONFIGURED" };
  }
  if (agent === "admin_prompt") {
    return generateAdminPromptLLM(input || {});
  }
  if (agent === "admin_ad_creative") {
    return generateAdminAdCreativeLLM(input || {});
  }
  if (agent === "admin_outreach") {
    return generateAdminAffiliateOutreachLLM(input || {});
  }
  return { ok: false, code: "INVALID_AGENT" };
}

module.exports = {
  isGenerativeAiConfigured,
  generateCoachMatcherAdvice,
  generateCoachWorkspacePlanLLM,
  generateSellerGrowthPlanLLM,
  generateVibecoachTipLLM,
  generateHotPicksTrendSlidesLLM,
  generateBrandonGuideLLM,
  generateSiteSeoPulseLLM,
  generateMbStudioSuiteLLM,
  generateAiOpsRecommendationsLLM,
  generateOwnerSecurityComplianceReviewLLM,
  generateOwnerSiteAutopilotPlanLLM,
  generateAccountActivityDigestLLM,
  runPublicGenerativeAgent,
  runOwnerGenerativeAgent
};
