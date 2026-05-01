"use strict";

const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

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

async function openaiChat(messages, maxTokens) {
  if (!OPENAI_API_KEY) {
    return { ok: false, code: "OPENAI_NOT_CONFIGURED" };
  }
  const body = {
    model: OPENAI_MODEL,
    messages,
    max_tokens: Math.min(Number(maxTokens) || 900, 2000),
    temperature: 0.35
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
    "You write post-checkout wellness workspace copy for VibeCart. " +
    "Strict rules: NOT medical advice — no diagnoses, treatments, prescriptions, or claims to cure conditions. " +
    "If user notes mention conditions, add one line urging them to follow their clinician's guidance. " +
    `${capsHint}` +
    " Output ONLY JSON (no markdown): " +
    '{"routine":"multi-line text where each logical line is separated by \\\\n (between 10 and 20 lines)","notifications":["...","..."]} ' +
    "routine: structured day plan + accountability tone. notifications: exactly 6 short strings suitable as mobile reminders (max 120 chars each).";
  const user = JSON.stringify({ flow, ownedPlans, profile });
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    1400
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
    .slice(0, 8);
  if (routine.length < 80 || notifications.length < 4) {
    return { ok: false, code: "AI_PARSE_ERROR", raw: r.text };
  }
  return {
    ok: true,
    routine: routine.slice(0, 12000),
    notifications,
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

async function generateAiOpsRecommendationsLLM(stats) {
  const system =
    "You are VibeCart operations AI for the owner console. Given live marketplace stats, propose EXACTLY 4 distinct recommendations. " +
    "Output ONLY JSON (no markdown): {\"items\":[{\"operationType\":\"short_snake_case\",\"summaryText\":\"...\",\"recommendationText\":\"...\",\"riskLevel\":\"low|medium|high\",\"executionMode\":\"recommend_only|owner_approval_required|manual\",\"ownerAction\":\"...\",\"expectedImpact\":\"...\",\"confidenceScore\":0.0-1.0}]}. " +
    "operationType must be unique per item. Be specific to the numbers provided.";
  const user = JSON.stringify(stats);
  const r = await openaiChat(
    [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    1400
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
    operationType: String(row.operationType || "ops_insight").trim().toLowerCase().replace(/\s+/g, "_"),
    summaryText: String(row.summaryText || row.summary || "AI recommendation").trim().slice(0, 220),
    recommendationText: String(row.recommendationText || row.recommendation || "").trim().slice(0, 900),
    riskLevel: ["low", "medium", "high"].includes(String(row.riskLevel || "").toLowerCase())
      ? String(row.riskLevel).toLowerCase()
      : "medium",
    executionMode: String(row.executionMode || "recommend_only")
      .trim()
      .toLowerCase(),
    ownerAction: String(row.ownerAction || "Review in AI ops queue.").trim().slice(0, 400),
    expectedImpact: String(row.expectedImpact || "Operational uplift.").trim().slice(0, 400),
    confidenceScore: Math.max(0, Math.min(1, Number(row.confidenceScore ?? row.confidence ?? 0.78) || 0.78))
  }));
  return { ok: true, items };
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
  return { ok: false, code: "INVALID_AGENT" };
}

const OUTREACH_TYPES = new Set(["initial_application", "traffic_update", "approval_followup"]);

async function generateAdminPromptLLM(input) {
  const task = String(input.task || "").trim().slice(0, 4000);
  const system =
    "You help a VibeCart marketplace owner draft a prompt for an external AI assistant (e.g. ChatGPT). " +
    "The prompt must ask for secure, production-safe engineering guidance: risks, implementation steps, test checklist, rollback plan. " +
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
  generateAiOpsRecommendationsLLM,
  runPublicGenerativeAgent,
  runOwnerGenerativeAgent
};
