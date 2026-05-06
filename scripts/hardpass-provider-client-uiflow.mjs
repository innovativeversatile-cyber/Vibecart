/**
 * Provider/client booking UI-flow parity hard-pass.
 *
 * This script validates the core user-facing flow behind My Business:
 * provider publishes slots -> client sees slots repeatedly -> client creates reservation
 * -> provider sees/accepts reservation -> both sides can exchange chat messages.
 *
 * Run: node scripts/hardpass-provider-client-uiflow.mjs
 */
const API_BASE = String(process.env.SMOKE_API_BASE || "https://vibecart-production.up.railway.app").replace(/\/$/, "");
const PASSWORD = "Hardpass!99";
const COUNTRY = "PL";

function fail(msg, detail) {
  console.error("FAIL:", msg, detail || "");
  process.exit(1);
}

function ok(msg, detail) {
  console.log("OK  ", msg, detail || "");
}

async function call(method, path, body, token) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function register(role, seed) {
  const email = `hardpass.ui.${role}.${seed}@example.com`;
  const out = await call("POST", "/api/public/auth/register", {
    email,
    password: PASSWORD,
    role,
    fullName: `Hardpass UI ${role}`,
    countryCode: COUNTRY
  });
  if (!(out.status === 200 && out.json && out.json.ok && out.json.token && out.json.user && out.json.user.id)) {
    fail(`register ${role}`, JSON.stringify(out));
  }
  return { token: String(out.json.token), userId: Number(out.json.user.id) };
}

function includesAll(got, expected) {
  const set = new Set((got || []).map((x) => String(x)));
  return expected.every((x) => set.has(String(x)));
}

async function main() {
  console.log("provider-client ui-flow hardpass");
  console.log("API_BASE:", API_BASE);
  const seed = Date.now();
  const provider = await register("seller", seed);
  const client = await register("buyer", seed);

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const day = tomorrow.toISOString().slice(0, 10);
  const times = ["09:00", "10:00", "11:30"];

  const svc = await call(
    "POST",
    "/api/public/bakery/services/upsert",
    {
      businessName: "Hardpass UI Studio",
      workTitle: "Hair Styling Availability (Main Card)",
      styleTheme: "Hair Styling · Availability board",
      basePrice: 35,
      currency: "USD",
      requirementsText: "UI flow hardpass service",
      slotDurationMinutes: 60
    },
    provider.token
  );
  if (!(svc.status === 200 && svc.json && svc.json.ok && svc.json.serviceId)) {
    fail("service upsert", JSON.stringify(svc));
  }
  const serviceId = Number(svc.json.serviceId);
  ok("service upsert", `serviceId=${serviceId}`);

  await call("POST", "/api/public/bakery/services/toggle", { serviceId, isActive: true }, provider.token);

  const slotsUp = await call(
    "POST",
    "/api/public/bakery/schedule/slots/upsert",
    { serviceId, slotDate: day, slotTimes: times },
    provider.token
  );
  if (!(slotsUp.status === 200 && slotsUp.json && slotsUp.json.ok)) {
    fail("slot upsert", JSON.stringify(slotsUp));
  }
  ok("slot upsert", `date=${day}`);

  for (let i = 0; i < 3; i++) {
    const list = await call(
      "GET",
      `/api/public/bakery/schedule/slots?serviceId=${encodeURIComponent(String(serviceId))}&date=${encodeURIComponent(day)}`,
      undefined,
      client.token
    );
    if (!(list.status === 200 && list.json && list.json.ok && Array.isArray(list.json.slots))) {
      fail(`slot list #${i + 1}`, JSON.stringify(list));
    }
    if (!includesAll(list.json.slots, times)) {
      fail(`slot list mismatch #${i + 1}`, `got=${JSON.stringify(list.json.slots)}`);
    }
  }
  ok("slot persistence repeated-read", JSON.stringify(times));

  const bookingCreate = await call(
    "POST",
    "/api/public/bakery/bookings/create",
    {
      serviceId,
      customerName: "Hardpass UI Buyer",
      customerPhone: "+48555111333",
      eventDate: day,
      occasionType: "Payment: card · Time preference: 10:00",
      styleTheme: "Hair Styling",
      requestDetails: "UI-flow hardpass booking create with time preference 10:00",
      budgetAmount: 55,
      paymentPreference: "card",
      serviceLine: "Hair Styling"
    },
    client.token
  );
  if (!(bookingCreate.status === 200 && bookingCreate.json && bookingCreate.json.ok && bookingCreate.json.bookingId)) {
    fail("booking create", JSON.stringify(bookingCreate));
  }
  const bookingId = Number(bookingCreate.json.bookingId);
  ok("booking create", `bookingId=${bookingId}`);

  const providerMine = await call("GET", "/api/public/bakery/bookings/mine", undefined, provider.token);
  if (!(providerMine.status === 200 && providerMine.json && providerMine.json.ok && Array.isArray(providerMine.json.bookings))) {
    fail("provider bookings/mine", JSON.stringify(providerMine));
  }
  if (!providerMine.json.bookings.some((b) => Number(b.id) === bookingId)) {
    fail("provider cannot see booking", `bookingId=${bookingId}`);
  }
  ok("provider sees booking", `bookingId=${bookingId}`);

  const buyerMine = await call("GET", "/api/public/bakery/bookings/as-buyer", undefined, client.token);
  if (!(buyerMine.status === 200 && buyerMine.json && buyerMine.json.ok && Array.isArray(buyerMine.json.bookings))) {
    fail("buyer bookings/as-buyer", JSON.stringify(buyerMine));
  }
  if (!buyerMine.json.bookings.some((b) => Number(b.id) === bookingId)) {
    fail("buyer cannot see own booking", `bookingId=${bookingId}`);
  }
  ok("buyer sees booking", `bookingId=${bookingId}`);

  const accept = await call(
    "POST",
    "/api/public/bakery/bookings/status/update",
    { bookingId, status: "confirmed" },
    provider.token
  );
  if (!(accept.status === 200 && accept.json && accept.json.ok && String(accept.json.status || "") === "confirmed")) {
    fail("provider accept booking", JSON.stringify(accept));
  }
  ok("provider accepted booking", `bookingId=${bookingId}`);

  const postBuyerMsg = await call(
    "POST",
    "/api/public/bakery/bookings/messages",
    { bookingId, message: "Hi provider, confirming my preferred time is 10:00." },
    client.token
  );
  if (!(postBuyerMsg.status === 200 && postBuyerMsg.json && postBuyerMsg.json.ok)) {
    fail("buyer chat post", JSON.stringify(postBuyerMsg));
  }

  const postProviderMsg = await call(
    "POST",
    "/api/public/bakery/bookings/messages",
    { bookingId, message: "Confirmed. See you at 10:00." },
    provider.token
  );
  if (!(postProviderMsg.status === 200 && postProviderMsg.json && postProviderMsg.json.ok)) {
    fail("provider chat post", JSON.stringify(postProviderMsg));
  }
  ok("chat messages posted", `bookingId=${bookingId}`);

  const buyerMsgs = await call(
    "GET",
    `/api/public/bakery/bookings/messages?bookingId=${encodeURIComponent(String(bookingId))}`,
    undefined,
    client.token
  );
  if (!(buyerMsgs.status === 200 && buyerMsgs.json && buyerMsgs.json.ok && Array.isArray(buyerMsgs.json.messages))) {
    fail("buyer chat list", JSON.stringify(buyerMsgs));
  }
  if (buyerMsgs.json.messages.length < 2) {
    fail("chat messages missing", JSON.stringify(buyerMsgs.json.messages || []));
  }
  ok("chat list visible to buyer", `count=${buyerMsgs.json.messages.length}`);

  console.log("PASS: provider-client ui-flow hardpass", {
    providerUserId: provider.userId,
    clientUserId: client.userId,
    serviceId,
    bookingId,
    slotDate: day
  });
}

main().catch((err) => fail("unhandled", String(err && err.message ? err.message : err)));

