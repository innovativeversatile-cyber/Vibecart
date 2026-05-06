(function () {
  "use strict";

  function status(text) {
    var n = document.getElementById("bizStatus");
    if (n) n.textContent = String(text || "");
  }

  function token() {
    try {
      return String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
    } catch (_) {
      return "";
    }
  }

  function authHeaders(base) {
    var h = Object.assign({}, base || {});
    var t = token();
    if (!t) return h;
    if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
      return window.VibeCartSessionDevice.merge(t, h);
    }
    h.Authorization = "Bearer " + t;
    return h;
  }

  function api(path, options) {
    var opts = Object.assign({}, options || {});
    opts.headers = authHeaders(opts.headers || {});
    return fetch(path, opts).then(function (r) {
      return r
        .json()
        .catch(function () {
          return {};
        })
        .then(function (j) {
          if (!r.ok || j.ok === false) {
            throw new Error(String((j && (j.message || j.code)) || ("HTTP_" + r.status)));
          }
          return j;
        });
    });
  }

  function normalizeTime(raw) {
    var m = String(raw || "")
      .trim()
      .match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return "";
    var h = Number(m[1]);
    var mm = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(mm) || h < 0 || h > 23 || mm < 0 || mm > 59) return "";
    return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
  }

  function readSlotTimes() {
    var list = [];
    var input = document.getElementById("mbProvSlotTimes");
    var raw = String((input && input.value) || "");
    raw.split(/[\s,;]+/).forEach(function (x) {
      var n = normalizeTime(x);
      if (n) list.push(n);
    });
    var chips = document.getElementById("mbProvSlotChips");
    if (chips && chips.querySelectorAll) {
      var btns = chips.querySelectorAll("[data-slot-chip-remove]");
      for (var i = 0; i < btns.length; i++) {
        var txt = String(btns[i].textContent || "").replace("✕", "").trim();
        var t = normalizeTime(txt);
        if (t) list.push(t);
      }
    }
    var map = {};
    list.forEach(function (t) {
      map[t] = true;
    });
    return Object.keys(map).sort();
  }

  function readDurationMinutes() {
    var el = document.getElementById("bakerySlotDurationMinutes");
    var n = Number((el && el.value) || 60);
    if (!Number.isFinite(n) || n < 15) return 60;
    return Math.round(n);
  }

  function hhmmToMins(hhmm) {
    var m = String(hhmm || "").match(/^([0-2]\d):([0-5]\d)$/);
    if (!m) return null;
    var h = Number(m[1]);
    var mm = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(mm) || h > 23) return null;
    return h * 60 + mm;
  }

  function minsToHHMM(mins) {
    var safe = Math.max(0, Number(mins) || 0);
    var h = Math.floor(safe / 60);
    var mm = safe % 60;
    return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  }

  function generateFromWindow(startHHMM, endHHMM, durationMins) {
    var s = hhmmToMins(startHHMM);
    var e = hhmmToMins(endHHMM);
    var d = Number(durationMins || 0);
    if (!Number.isFinite(s) || !Number.isFinite(e) || !Number.isFinite(d) || d < 15 || e <= s) return [];
    var out = [];
    for (var t = s; t + d <= e; t += d) {
      out.push(minsToHHMM(t));
    }
    return out;
  }

  function readDashboardLine() {
    try {
      var raw = localStorage.getItem("vibecart-mb-dashboard-v2");
      var cfg = raw ? JSON.parse(raw) : null;
      return String((cfg && cfg.service) || "Hair Styling").trim() || "Hair Styling";
    } catch (_) {
      return "Hair Styling";
    }
  }

  function lineMatchesService(line, svc) {
    var needle = String(line || "").trim().toLowerCase();
    if (!needle || !svc) return false;
    var style = String(svc.styleTheme || "").trim().toLowerCase();
    var head = style.split("·")[0].trim();
    if (head === needle || style.indexOf(needle) === 0) return true;
    var work = String(svc.workTitle || "").trim().toLowerCase();
    return work.indexOf(needle) >= 0;
  }

  function anchorTitleFor(line) {
    return String(line || "Service").trim() + " Availability (Main Card)";
  }

  function ensureServiceActive(serviceId) {
    return api("/api/public/bakery/services/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: Number(serviceId) || 0, isActive: true })
    });
  }

  function createLineAnchorService(line) {
    var businessName = String((document.getElementById("bakeryBusinessName") || {}).value || "").trim() || "Provider";
    var basePrice = Number((document.getElementById("bakeryBasePrice") || {}).value || 0) || 0;
    var imageUrl = String((document.getElementById("bakeryImageUrl") || {}).value || "").trim();
    var requirements =
      String((document.getElementById("bakeryRequirements") || {}).value || "").trim() ||
      "Main availability card for this service line. Provider will keep slots updated here.";
    var body = {
      businessName: businessName,
      workTitle: anchorTitleFor(line),
      styleTheme: line + " · Availability board",
      basePrice: basePrice,
      currency: "USD",
      imageUrl: imageUrl,
      requirementsText: requirements,
      slotDurationMinutes: 60
    };
    return api("/api/public/bakery/services/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (res) {
      var sid = Number((res && res.serviceId) || 0);
      if (!sid) throw new Error("NO_SAVED_CARD");
      return ensureServiceActive(sid).then(function () {
        return sid;
      });
    });
  }

  function getServiceIdForLine() {
    var hid = document.getElementById("bakeryEditServiceId");
    var id = Number((hid && hid.value) || 0);
    if (id) {
      return ensureServiceActive(id).then(function () {
        return id;
      });
    }
    var line = readDashboardLine();
    return api("/api/public/bakery/services/mine").then(function (res) {
      var arr = Array.isArray(res && res.services) ? res.services : [];
      var pick = null;
      var i;
      for (i = 0; i < arr.length; i++) {
        if (lineMatchesService(line, arr[i])) {
          pick = arr[i];
          break;
        }
      }
      if (pick && Number(pick.id || 0) > 0) {
        var sid = Number(pick.id);
        // Keep the persistent card easy to identify in the provider dashboard.
        var needRename = String((pick.workTitle || "")).trim() !== anchorTitleFor(line);
        var upkeep = Promise.resolve();
        if (needRename) {
          upkeep = api("/api/public/bakery/services/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              serviceId: sid,
              businessName: String(pick.businessName || "Provider"),
              workTitle: anchorTitleFor(line),
              styleTheme: String(pick.styleTheme || (line + " · Availability board")),
              basePrice: Number(pick.basePrice || 0) || 0,
              currency: String(pick.currency || "USD"),
              imageUrl: String(pick.imageUrl || ""),
              requirementsText:
                String(pick.requirementsText || "").trim() ||
                "Main availability card for this service line. Provider will keep slots updated here.",
              slotDurationMinutes: Number(pick.slotDurationMinutes || 60) || 60
            })
          }).catch(function () {
            return { ok: false };
          });
        }
        if (hid) hid.value = String(sid);
        return upkeep.then(function () {
          return ensureServiceActive(sid).then(function () {
            return sid;
          });
        });
      }
      return createLineAnchorService(line).then(function (sidNew) {
        if (hid) hid.value = String(sidNew);
        status("Created persistent availability card for " + line + ".");
        return sidNew;
      });
    });
  }

  function publishSlots() {
    if (!token()) {
      status("Sign in first, then publish slots.");
      return;
    }
    var d = document.getElementById("mbProvSlotDate");
    var slotDate = String((d && d.value) || "").trim().slice(0, 10);
    var startEl = document.getElementById("mbProvSlotDayStart");
    var endEl = document.getElementById("mbProvSlotDayEnd");
    var startHHMM = normalizeTime(startEl && startEl.value);
    var endHHMM = normalizeTime(endEl && endEl.value);
    var slotTimes = generateFromWindow(startHHMM, endHHMM, readDurationMinutes());
    if (!slotTimes.length) {
      slotTimes = readSlotTimes();
    }
    if (!slotDate || !slotTimes.length) {
      status("Choose date plus valid start/end times.");
      return;
    }
    status("Publishing slots...");
    getServiceIdForLine()
      .then(function (sid) {
        return api("/api/public/bakery/schedule/slots/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId: sid, slotDate: slotDate, slotTimes: slotTimes })
        });
      })
      .then(function (res) {
        status("Saved " + Number((res && res.inserted) || 0) + " slot(s) for " + slotDate + ".");
        var hiddenTimes = document.getElementById("mbProvSlotTimes");
        if (hiddenTimes) hiddenTimes.value = slotTimes.join(", ");
      })
      .catch(function (e) {
        var m = String((e && e.message) || e || "");
        if (m.indexOf("NO_SAVED_CARD") >= 0) m = "Save service card first, then publish slots.";
        status(m || "Publish slots failed.");
      });
  }

  function cancelSlots() {
    if (!token()) {
      status("Sign in first, then cancel slots.");
      return;
    }
    var d = document.getElementById("mbProvSlotDate");
    var slotDate = String((d && d.value) || "").trim().slice(0, 10);
    if (!slotDate) {
      status("Choose a date first.");
      return;
    }
    status("Cancelling date slots...");
    getServiceIdForLine()
      .then(function (sid) {
        return api("/api/public/bakery/schedule/slots/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId: sid, slotDate: slotDate, slotTimes: [] })
        });
      })
      .then(function () {
        status("Cancelled all slots for " + slotDate + ".");
      })
      .catch(function (e) {
        status(String((e && e.message) || e || "Cancel slots failed."));
      });
  }

  function bindButton(btn, handler) {
    if (!btn || btn.getAttribute("data-vc-slot-hotfix-bound") === "1") return;
    btn.setAttribute("data-vc-slot-hotfix-bound", "1");
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      handler();
    }, true);
    btn.addEventListener("touchend", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      handler();
    }, { capture: true, passive: false });
  }

  function wire() {
    var saveBtn = document.getElementById("mbProvSlotSave");
    var cancelBtn = document.getElementById("mbProvSlotCancel");
    bindButton(saveBtn, publishSlots);
    bindButton(cancelBtn, cancelSlots);
    var oldTimeInput = document.getElementById("mbProvSlotTimeInput");
    var oldPresetWrap = document.getElementById("mbProvSlotPresets");
    var oldChipWrap = document.getElementById("mbProvSlotChips");
    if (oldTimeInput && oldTimeInput.parentElement) oldTimeInput.parentElement.style.display = "none";
    if (oldPresetWrap) oldPresetWrap.style.display = "none";
    if (oldChipWrap) oldChipWrap.style.display = "none";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire, { once: true });
  } else {
    wire();
  }
  window.addEventListener("load", wire, { once: true });
  window.addEventListener("pageshow", wire);
  window.setTimeout(wire, 250);
  window.setTimeout(wire, 1200);
})();

