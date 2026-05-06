# My Business — provider handoff (save & remind)

**Paste this block to the assistant when you continue:**

```
VC-MB-HANDOFF-2026

Handoff: My Business bakery/slots + client booking. Read vibecart/VC-MB-PROVIDER-HANDOFF.md and remind us what we changed and what the provider should verify. Next product goal: VC-MB-SLOTS-V2 (day windows grey outside hours, client picks only inside availability, on ACCEPT block that interval + provider sets duration, then system regenerates open slots).
```

---

## 1–4 — Product steps we aligned on (next build; confirm with her)

1. **Provider availability windows** — For each relevant day, define a time range (e.g. 09:00–17:00). Outside that range: **grey, not clickable** for clients. Dates with no availability: **grey** on the calendar / date picker where applicable.
2. **Published slots inside the window** — Only start times the provider (or system) offers inside that window stay selectable; the rest of the day stays grey.
3. **Book → accept → block** — Client picks an available time; after the provider **accepts**, that interval is **blocked** (grey / unavailable for others).
4. **After accept: duration → next slots** — Provider tells the system **how long** the booking runs (or use work-card default). The system **recomputes** remaining free time and **generates** the next open slots clients can take.

---

## What we already changed (deployed — provider & client should see this)

- **Client step 3:** Status/errors now show on the client desk (not only hidden provider status); slot selection can sync from the selected chip; clearer errors if submit fails.
- **Client image preview:** Tap preview image → full-screen lightbox (with fallback).
- **Slots persistence / listings:** Discover can surface services with **future published slots** even if `is_active` drifted; booking create allowed when service has future slots.
- **Provider dashboard calendar:** Fixed parsing of slot API `availableDates` so **published dates don’t “vanish” after reload**.
- **Provider slot panel:** Slot load/save prefers **`mbProvSlotService`**; auto-pick **main availability card** when sensible; calendar counts slots for **all** line services (not only first 5); default slot date; reload loads slots from server when service/date changes.

---

## What we want her to **look for / test** when she’s back

1. **Publish slots** → leave My Business → come back → **same dates/times still there** (calendar + slot editor).
2. **Client flow:** Pick provider offer → date → time → step 3 → **Send reservation** → any error is **visible** (not silent).
3. **Preview:** Tap provider image in client desk → **opens large**.
4. **Correct card:** Slot publishing stays tied to the **right work card** for her service line (main availability card behavior).

---

## Open questions for her (before coding VC-MB-SLOTS-V2)

- Availability: **per weekday template** vs **per calendar date**?
- Slot grid: always use **work-card appointment length**, or **only duration after accept**?
- Blocking: one booking blocks **exactly that start time** or the **full duration** (no overlapping starts)?

---

## Deploy targets (when continuing)

- Frontend: Netlify production `https://vibe-cart.com` (deploy via repo `vibecart`, `netlify deploy --prod`).
- Backend: Railway (`railway up` from `vibecart`).
