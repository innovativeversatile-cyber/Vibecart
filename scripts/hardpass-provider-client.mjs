/**
 * Hard-pass smoke for provider <-> client booking connection.
 *
 * Verifies the exact regression target:
 * 1) provider creates service + slots
 * 2) slots remain visible after repeated refresh/list calls
 * 3) buyer can submit reservation
 *
 * Run: node scripts/hardpass-provider-client.mjs
 */
const API_BASE = String(process.env.SMOKE_API_BASE || "https://vibecart-production.up.railway.app").replace(/\/$/, "");
const PASSWORD = "Hardpass!99";
const COUNTRY = "PL";

function fail(msg, detail) {
  console.error("FAIL:", msg, detail || "");
  process.exit(1);
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
  const email = `hardpass.${role}.${seed}@example.com`;
  const out = await call("POST", "/api/public/auth/register", {
    email,
    password: PASSWORD,
    role,
    fullName: `Hardpass ${role}`,
    countryCode: COUNTRY
  });
  if (!(out.status === 200 && out.json && out.json.ok && out.json.token && out.json.user && out.json.user.id)) {
    fail(`register ${role}`, JSON.stringify(out));
  }
  return { token: String(out.json.token), userId: Number(out.json.user.id) };
}

async function main() {
  const seed = Date.now();
  console.log("provider-client hardpass");
  console.log("API_BASE:", API_BASE);

  const seller = await register("seller", seed);
  const buyer = await register("buyer", seed);

  const svc = await call(
    "POST",
    "/api/public/bakery/services/upsert",
    {
      businessName: "Hardpass Studio",
      workTitle: "Hair Styling Availability (Main Card)",
      styleTheme: "Hair Styling · Availability board",
      basePrice: 25,
      currency: "USD",
      requirementsText: "Hardpass provider/client connectivity validation service.",
      slotDurationMinutes: 60
    },
    seller.token
  );
  if (!(svc.status === 200 && svc.json && svc.json.ok && svc.json.serviceId)) {
    fail("service upsert", JSON.stringify(svc));
  }
  const serviceId = Number(svc.json.serviceId);

  await call("POST", "/api/public/bakery/services/toggle", { serviceId, isActive: true }, seller.token);

  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const slotDate = d.toISOString().slice(0, 10);
  const slotTimes = ["09:00", "10:00", "11:30"];

  const up = await call(
    "POST",
    "/api/public/bakery/schedule/slots/upsert",
    { serviceId, slotDate, slotTimes },
    seller.token
  );
  if (!(up.status === 200 && up.json && up.json.ok)) {
    fail("slot upsert", JSON.stringify(up));
  }

  // Refresh-style repeated checks to catch "slots disappear after refresh".
  for (let i = 0; i < 4; i++) {
    const list = await call(
      "GET",
      `/api/public/bakery/schedule/slots?serviceId=${encodeURIComponent(String(serviceId))}&date=${encodeURIComponent(slotDate)}`,
      undefined,
      buyer.token
    );
    if (!(list.status === 200 && list.json && list.json.ok && Array.isArray(list.json.slots))) {
      fail(`slot list #${i + 1}`, JSON.stringify(list));
    }
    const got = list.json.slots.map((x) => String(x));
    const mismatch = slotTimes.some((t) => !got.includes(t));
    if (mismatch) {
      fail(`slot persistence #${i + 1}`, `expected ${JSON.stringify(slotTimes)} got ${JSON.stringify(got)}`);
    }
  }

  const booking = await call(
    "POST",
    "/api/public/bakery/bookings/create",
    {
      serviceId,
      customerName: "Hardpass Buyer",
      customerPhone: "+48555111222",
      eventDate: slotDate,
      occasionType: "Payment: card · Time preference: 10:00",
      styleTheme: "Hair Styling",
      requestDetails: "Regression hardpass booking create check with selected time preference 10:00.",
      budgetAmount: 40,
      paymentPreference: "card",
      serviceLine: "Hair Styling"
    },
    buyer.token
  );
  if (!(booking.status === 200 && booking.json && booking.json.ok && booking.json.bookingId)) {
    fail("booking create", JSON.stringify(booking));
  }

  console.log("PASS: provider-client hardpass", {
    sellerUserId: seller.userId,
    buyerUserId: buyer.userId,
    serviceId,
    bookingId: Number(booking.json.bookingId)
  });
}

main().catch((err) => {
  fail("unhandled", String(err && err.message ? err.message : err));
});

