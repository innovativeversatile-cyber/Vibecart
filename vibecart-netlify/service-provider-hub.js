(function () {
  "use strict";
var HUB_BUILD = "provider-template";
      var paramsEarly = new URLSearchParams(window.location.search || "");
      var serviceHintEarly = String(paramsEarly.get("service") || "").trim();
      var lineKey = serviceHintEarly
        ? serviceHintEarly.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 48).toLowerCase() || "line"
        : "default";
      var KEY = "vibecart-service-provider-template::" + lineKey;
      var AI_KEY = "vibecart-provider-hub-ai-layout::" + lineKey;
      var name = document.getElementById("spBusinessName");
      var service = document.getElementById("spServiceType");
      var pay = document.getElementById("spPaymentUrl");
      var dep = document.getElementById("spDepositAmount");
      var method = document.getElementById("spPaymentMethod");
      var status = document.getElementById("spStatus");
      var out = document.getElementById("spOutput");
      var aiPolish = document.getElementById("spAiPolish");
      var aiBlocks = document.getElementById("spAiBlocks");
      var aiReq = document.getElementById("spAiRequirements");
      var aiBuildBtn = document.getElementById("spAiBuildDashboard");
      var aiResetBtn = document.getElementById("spAiResetDashboard");
      var save = document.getElementById("spSave");
      var gen = document.getElementById("spGenerate");
      var publishNow = document.getElementById("spPublishNow");
      var aiGenerate = document.getElementById("spAiGenerate");
      var title = document.getElementById("spHubTitle");
      var lead = document.getElementById("spHubLead");
      var deck = document.getElementById("spVisualDeck");
      var params = paramsEarly;
      var serviceHint = serviceHintEarly;
      var slotHint = String(params.get("slot") || "").trim();
      var HERO_SAME_ORIGIN_STILL = "./media/provider-hair-1.jpg";
      var HERO_ICON_FALLBACK = "./icon-maskable.svg";
      /* Two bundled JPEGs per lane (replace files in ./media/ with your own photography). */
      var motionStill = {
        "Hair Styling": ["./media/provider-hair-1.jpg", "./media/provider-hair-2.jpg"],
        Nails: ["./media/provider-nails-1.jpg", "./media/provider-nails-2.jpg"],
        Makeup: ["./media/provider-makeup-1.jpg", "./media/provider-makeup-2.jpg"],
        Barber: ["./media/provider-barber-1.jpg", "./media/provider-barber-2.jpg"],
        "Bakery / custom cakes": ["./media/provider-bakery-1.jpg", "./media/provider-bakery-2.jpg"]
      };
      function hashMotionSalt(s) {
        var str = String(s || "");
        var h = 0;
        for (var i = 0; i < str.length; i++) {
          h = (h * 31 + str.charCodeAt(i)) | 0;
        }
        return Math.abs(h);
      }
      function resolveMotionUrl(entry, salt) {
        if (!entry) return HERO_SAME_ORIGIN_STILL;
        if (typeof entry === "string") return entry;
        if (entry.length) return entry[hashMotionSalt(salt) % entry.length];
        return HERO_SAME_ORIGIN_STILL;
      }
      function motionFromFreeText(t) {
        var s = String(t || "").toLowerCase();
        if (/bake|cake|cupcake|wedding cake|pastry|sweet|dessert|tier/.test(s)) return motionStill["Bakery / custom cakes"];
        if (/nail|manicure|pedicure|gel|acrylic/.test(s)) return motionStill.Nails;
        if (/makeup|glam|bridal|cosmetic|mua/.test(s)) return motionStill.Makeup;
        if (/barber|fade|beard|clipper|cut\s*men/.test(s)) return motionStill.Barber;
        return motionStill["Hair Styling"];
      }
      function applyHeroMotion(themeKey, freeText) {
        var img = document.getElementById("spHeroMotionImg");
        var box = document.getElementById("spHeroMotion");
        if (!img) return;
        var key = themeKey && motionStill[themeKey] ? themeKey : "";
        var entry = key ? motionStill[key] : motionFromFreeText(freeText);
        var salt = String(freeText || "") + "|" + String(serviceHint || "") + "|" + String((name && name.value) || "");
        var chosen = resolveMotionUrl(entry, salt);
        var list =
          entry && typeof entry === "object" && entry.length
            ? entry.slice()
            : typeof entry === "string"
              ? [entry]
              : [HERO_SAME_ORIGIN_STILL];
        var start = Math.max(0, list.indexOf(chosen));
        var pool = [];
        for (var j = 0; j < list.length; j++) {
          pool.push(list[(start + j) % list.length]);
        }
        if (!pool.length) pool = [HERO_SAME_ORIGIN_STILL];
        var attempt = 0;
        img.onerror = function () {
          attempt += 1;
          if (attempt < pool.length) {
            img.src = pool[attempt];
            return;
          }
          img.onerror = null;
          img.src = HERO_ICON_FALLBACK;
        };
        img.src = pool[0];
        if (box) {
          box.style.backgroundImage =
            "linear-gradient(145deg, rgba(26, 15, 36, 0.22), rgba(10, 13, 24, 0.42)), url(\"" + pool[0] + "\")";
        }
        img.alt = (key || "Service") + " — booking preview";
        if (box) box.setAttribute("aria-label", (key || String(freeText || "Service").trim() || "Service") + " preview");
      }
      var serviceThemes = {
        "Hair Styling": {
          title: "Hair styling booking studio",
          lead: "Showcuts, braid sessions, and treatment packages with visual expectations and timing clarity.",
          bullets: ["Wash + treatment variations", "Protective style bundles", "Quick restyle slots"]
        },
        "Nails": {
          title: "Nails booking studio",
          lead: "Guide clients through finish style, refill timing, and care follow-up before they pay.",
          bullets: ["Gel / acrylic choice guidance", "Fill vs full set pathways", "Aftercare highlights"]
        },
        "Makeup": {
          title: "Makeup booking studio",
          lead: "Package event, glam, and soft-look routes with clear prep notes and slot durations.",
          bullets: ["Bridal / event flow", "Skin prep checklist", "Look references by occasion"]
        },
        "Barber": {
          title: "Barber booking studio",
          lead: "Highlight cuts, fades, beard work, and timing so walk-ins become booked clients.",
          bullets: ["Fade and line-up tiers", "Beard detailing options", "Express vs full grooming"]
        },
        "Bakery / custom cakes": {
          title: "Bakery & custom cake booking studio",
          lead: "Show tiers, flavors, lead times, and deposit rules so celebration orders convert with clarity.",
          bullets: ["Wedding and event cake pathways", "Allergen and dietary notes", "Pickup vs delivery windows"]
        }
      };
      var activeTheme = serviceThemes[serviceHint] || serviceThemes["Hair Styling"];
      if (title) title.textContent = activeTheme.title;
      if (lead) {
        lead.textContent =
          activeTheme.lead + (slotHint ? " Selected slot context: " + slotHint + "." : "");
      }
      if (deck) {
        deck.innerHTML = activeTheme.bullets
          .map(function (item) {
            return (
              "<article class='vc-visual-step'><h3><img src='./icon.svg' alt='service step' />Service value</h3><p>" +
              item +
              "</p></article>"
            );
          })
          .join("");
      }
      function read() {
        try {
          return JSON.parse(localStorage.getItem(KEY) || "{}");
        } catch (e) {
          return {};
        }
      }
      function write(v) {
        localStorage.setItem(KEY, JSON.stringify(v));
      }
      function saveProviderAiLayout(serviceLine, requirements, sections) {
        try {
          var role = "provider";
          var line = String(serviceLine || "service").trim().toLowerCase().replace(/\s+/g, "-");
          var bucketKey = "vibecart-mb-ai-layout-v1:" + role + ":" + line;
          localStorage.setItem(
            bucketKey,
            JSON.stringify({
              requirements: String(requirements || "").slice(0, 1600),
              sections: Array.isArray(sections) ? sections.slice(0, 10) : [],
              updatedAt: new Date().toISOString()
            })
          );
        } catch (e) {
          /* ignore */
        }
      }
      function readHubAiLayout() {
        try {
          return JSON.parse(localStorage.getItem(AI_KEY) || "{}");
        } catch (e) {
          return {};
        }
      }
      function writeHubAiLayout(v) {
        try {
          localStorage.setItem(AI_KEY, JSON.stringify(v || {}));
        } catch (e) {
          /* ignore */
        }
      }
      function renderHubAiLayout(payload) {
        var data = payload || readHubAiLayout();
        var sections = Array.isArray(data.sections) ? data.sections : [];
        if (aiReq) aiReq.value = String(data.requirements || "");
        if (!aiBlocks) return;
        if (!sections.length) {
          aiBlocks.innerHTML = "<p class='note'>No AI dashboard blocks saved yet.</p>";
          return;
        }
        aiBlocks.innerHTML =
          "<p class='note'>Saved provider AI dashboard blocks:</p><ul>" +
          sections
            .map(function (s) {
              return "<li><strong>" + String(s.title || "Section") + ":</strong> " + String(s.intent || "") + "</li>";
            })
            .join("") +
          "</ul><p class='hero-actions'><a class='btn btn-primary' href='./my-business.html?force_provider=1'>Open provider dashboard now</a></p>";
      }
      function formPayload() {
        return {
          businessName: String(name.value || "").trim(),
          serviceType: String(service.value || "").trim(),
          paymentUrl: String(pay.value || "").trim(),
          depositAmount: String(dep.value || "").trim(),
          paymentMethod: String((method && method.value) || "card").trim()
        };
      }
      function authHeaders(base) {
        var headers = Object.assign({}, base || {});
        try {
          var token = String(localStorage.getItem("vibecart-public-auth-token") || "").trim();
          if (!token) return headers;
          if (window.VibeCartSessionDevice && typeof window.VibeCartSessionDevice.merge === "function") {
            return window.VibeCartSessionDevice.merge(token, headers);
          }
          headers.Authorization = "Bearer " + token;
          return headers;
        } catch (e) {
          return headers;
        }
      }
      function apiJson(path, options) {
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
                throw new Error(String((j && (j.message || j.code)) || "HTTP_" + r.status));
              }
              return j;
            });
        });
      }
      function renderProviderShareLink(serviceId, payload) {
        var box = document.getElementById("spShareLinkBox");
        if (!box || !serviceId) return;
        var line = String((payload && payload.serviceType) || serviceHint || "Hair Styling").trim();
        var direct =
          "./my-business.html?flow=book&line=" +
          encodeURIComponent(line) +
          "&providerServiceId=" +
          encodeURIComponent(String(serviceId));
        box.innerHTML =
          "<p class='note'>Special client booking link (share on socials):</p>" +
          "<p class='hero-actions'><a class='btn btn-primary' href='" +
          direct +
          "'>Open booking page</a></p>" +
          "<p class='note' style='word-break:break-all'>" +
          direct +
          "</p>";
      }
      var current = read();
      if (name) name.value = current.businessName || "";
      if (service) service.value = serviceHint || current.serviceType || "";
      if (pay) pay.value = current.paymentUrl || "";
      if (dep) dep.value = current.depositAmount || "";
      if (method) method.value = current.paymentMethod || "card";
      applyHeroMotion(serviceThemes[serviceHint] ? serviceHint : "", service ? service.value : "");
      if (service) {
        service.addEventListener(
          "input",
          function () {
            applyHeroMotion("", service.value);
          },
          { passive: true }
        );
      }
      if (save) save.addEventListener("click", function () {
        var payload = formPayload();
        write(payload);
        if (status) status.textContent = "Provider template saved for this service line.";
      });
      if (gen) gen.addEventListener("click", function () {
        var data = Object.assign(read(), formPayload());
        write(data);
        var link = "./checkout-details.html?flow=service_booking&provider=" + encodeURIComponent(data.businessName || "Provider") +
          "&service=" + encodeURIComponent(data.serviceType || "Service") +
          "&deposit=" + encodeURIComponent(data.depositAmount || "0") +
          "&payUrl=" + encodeURIComponent(data.paymentUrl || "") +
          "&paymentMethod=" + encodeURIComponent(data.paymentMethod || "card");
        if (out) {
          out.innerHTML =
            "<p class='note'>Share this booking payment route:</p>" +
            "<p class='hero-actions'><a class='btn btn-primary' id='spGenLinkBtn'>Open checkout link</a></p>" +
            "<p class='note vc-sp-checkout-url' style='word-break:break-all;margin-top:0.5rem'></p>";
          var genA = document.getElementById("spGenLinkBtn");
          var urlLine = out.querySelector(".vc-sp-checkout-url");
          if (genA) genA.setAttribute("href", link);
          if (urlLine) urlLine.textContent = link;
        }
        if (status) {
          status.textContent = data.paymentUrl
            ? "Booking link ready (includes your external prepay URL)."
            : "Booking link ready (VibeCart checkout flow).";
        }
        if (aiPolish) {
          aiPolish.textContent =
            "Tip: mention duration, deposit rules, and one clear add-on in your listing text.";
        }
      });
      if (publishNow) publishNow.addEventListener("click", function () {
        var data = Object.assign(read(), formPayload());
        write(data);
        var svc = String(data.serviceType || serviceHint || "Hair Styling").trim();
        if (!data.businessName) {
          if (status) status.textContent = "Add business name first.";
          return;
        }
        var body = {
          businessName: data.businessName,
          workTitle: svc + " booking",
          styleTheme: svc,
          basePrice: Number(data.depositAmount || 0) || 0,
          currency: "USD",
          imageUrl: "",
          requirementsText:
            "Payment route: " +
            String(data.paymentUrl || "VibeCart checkout") +
            " · Method: " +
            String(data.paymentMethod || "card"),
          slotDurationMinutes: 60
        };
        if (status) status.textContent = "Saving and publishing provider card…";
        apiJson("/api/public/bakery/services/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
          .then(function (res) {
            var sid = Number((res && res.serviceId) || 0);
            if (!sid) throw new Error("SERVICE_ID_MISSING");
            return apiJson("/api/public/bakery/services/toggle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ serviceId: sid, isActive: true })
            }).then(function () {
              renderProviderShareLink(sid, data);
              if (status) status.textContent = "Saved and published successfully.";
              var to =
                "./my-business.html?force_provider=1&line=" +
                encodeURIComponent(svc) +
                "&from=provider_hub&providerServiceId=" +
                encodeURIComponent(String(sid));
              window.setTimeout(function () {
                window.location.assign(to);
              }, 450);
            });
          })
          .catch(function (err) {
            if (status) {
              status.textContent =
                "Publish failed: " +
                String(err && err.message ? err.message : err) +
                ". Sign in on VibeCart (same device as Account hub) and try again.";
            }
          });
      });
      if (aiGenerate) {
        aiGenerate.addEventListener("click", function () {
          var data = Object.assign(read(), formPayload());
          write(data);
          var svc = String(data.serviceType || serviceHint || "Hair Styling").trim();
          var requirements =
            "Business: " +
            String(data.businessName || "Provider") +
            ". Service: " +
            svc +
            ". Need autonomous dashboard sections for bookings, VIP queue, slot filling, and compliance requirements.";
          function commitSections(sections, sourceTag) {
            saveProviderAiLayout(svc, requirements, sections);
            if (aiBlocks) {
              aiBlocks.innerHTML =
                "<p class='note'>AI blocks generated (" +
                sourceTag +
                ") and linked to provider dashboard:</p>" +
                "<ul>" +
                sections
                  .map(function (s) {
                    return "<li>" + String(s.title || "Section") + " — " + String(s.intent || "") + "</li>";
                  })
                  .join("") +
                "</ul>" +
                "<p class='hero-actions'><a class='btn btn-primary' href='./my-business.html?force_provider=1'>Open provider dashboard now</a></p>";
            }
            if (status) {
              status.textContent = "AI dashboard sections generated and saved.";
            }
          }
          if (typeof window.vibecartAiGenerate === "function") {
            window
              .vibecartAiGenerate("provider_dashboard_sections", {
                requirements: requirements,
                mode: "autonomous",
                service: svc
              })
              .then(function (res) {
                var sections = Array.isArray(res && res.sections)
                  ? res.sections
                      .map(function (s) {
                        return {
                          title: String((s && s.title) || "").trim(),
                          intent: String((s && s.intent) || "").trim(),
                          automation: String((s && s.automation) || "").trim()
                        };
                      })
                      .filter(function (s) { return s.title && s.intent; })
                      .slice(0, 8)
                  : [];
                if (!sections.length) {
                  sections = [
                    { title: "VIP Queue", intent: "Prioritize high-value clients.", automation: "Auto-rank bookings by value + urgency." },
                    { title: "Slot Filler", intent: "Fill cancellations quickly.", automation: "Auto-suggest best replacements." },
                    { title: "Requirements Guard", intent: "Respect allergies and constraints.", automation: "Flag risky bookings automatically." }
                  ];
                }
                commitSections(sections, "AI");
                if (status && res && res.model) {
                  status.textContent = "AI dashboard sections generated and saved (live model: " + String(res.model) + ").";
                }
              })
              .catch(function () {
                commitSections(
                  [
                    { title: "VIP Queue", intent: "Prioritize high-value clients.", automation: "Auto-rank bookings by value + urgency." },
                    { title: "Slot Filler", intent: "Fill cancellations quickly.", automation: "Auto-suggest best replacements." },
                    { title: "Requirements Guard", intent: "Respect allergies and constraints.", automation: "Flag risky bookings automatically." }
                  ],
                  "fallback"
                );
              });
            return;
          }
          commitSections(
            [
              { title: "VIP Queue", intent: "Prioritize high-value clients.", automation: "Auto-rank bookings by value + urgency." },
              { title: "Slot Filler", intent: "Fill cancellations quickly.", automation: "Auto-suggest best replacements." },
              { title: "Requirements Guard", intent: "Respect allergies and constraints.", automation: "Flag risky bookings automatically." }
            ],
            "fallback"
          );
        });
      }
      if (aiBuildBtn) {
        aiBuildBtn.addEventListener("click", function () {
          var data = Object.assign(read(), formPayload());
          write(data);
          var svc = String(data.serviceType || serviceHint || "Hair Styling").trim();
          var requirements = String((aiReq && aiReq.value) || "").trim();
          if (requirements.length < 8) {
            requirements =
              "Business: " +
              String(data.businessName || "Provider") +
              ". Service: " +
              svc +
              ". Build autonomous dashboard sections for bookings, repeat clients, and slot recovery.";
          }
          function commit(sections, sourceTag) {
            var payload = {
              requirements: requirements,
              sections: sections,
              updatedAt: new Date().toISOString()
            };
            writeHubAiLayout(payload);
            saveProviderAiLayout(svc, requirements, sections);
            renderHubAiLayout(payload);
            if (status) status.textContent = "AI provider dashboard built (" + sourceTag + ").";
          }
          if (typeof window.vibecartAiGenerate === "function") {
            window
              .vibecartAiGenerate("provider_dashboard_sections", {
                requirements: requirements,
                mode: "autonomous",
                service: svc
              })
              .then(function (res) {
                var sections = Array.isArray(res && res.sections)
                  ? res.sections
                      .map(function (s) {
                        return {
                          title: String((s && s.title) || "").trim(),
                          intent: String((s && s.intent) || "").trim(),
                          automation: String((s && s.automation) || "").trim()
                        };
                      })
                      .filter(function (s) { return s.title && s.intent; })
                      .slice(0, 10)
                  : [];
                if (!sections.length) {
                  sections = [
                    { title: "VIP Queue", intent: "Prioritize high-value clients.", automation: "AI reorders queue by urgency/value." },
                    { title: "Slot Filler", intent: "Fill sudden cancellations.", automation: "AI proposes best replacement clients." },
                    { title: "Requirements Guard", intent: "Track policy and constraints.", automation: "AI flags risky or invalid bookings." }
                  ];
                }
                commit(sections, "AI");
                if (status && res && res.model) {
                  status.textContent = "AI provider dashboard built (live model: " + String(res.model) + ").";
                }
              })
              .catch(function () {
                commit(
                  [
                    { title: "VIP Queue", intent: "Prioritize high-value clients.", automation: "AI reorders queue by urgency/value." },
                    { title: "Slot Filler", intent: "Fill sudden cancellations.", automation: "AI proposes best replacement clients." },
                    { title: "Requirements Guard", intent: "Track policy and constraints.", automation: "AI flags risky or invalid bookings." }
                  ],
                  "fallback"
                );
              });
            return;
          }
          commit(
            [
              { title: "VIP Queue", intent: "Prioritize high-value clients.", automation: "AI reorders queue by urgency/value." },
              { title: "Slot Filler", intent: "Fill sudden cancellations.", automation: "AI proposes best replacement clients." },
              { title: "Requirements Guard", intent: "Track policy and constraints.", automation: "AI flags risky or invalid bookings." }
            ],
            "fallback"
          );
        });
      }
      if (aiResetBtn) {
        aiResetBtn.addEventListener("click", function () {
          writeHubAiLayout({ requirements: "", sections: [], updatedAt: new Date().toISOString() });
          if (aiReq) aiReq.value = "";
          renderHubAiLayout({ requirements: "", sections: [] });
          if (status) status.textContent = "Provider AI dashboard reset.";
        });
      }
      renderHubAiLayout();
    
})();
(function () {
      if (!document.body || document.body.getAttribute("data-vc-lean-hud") !== "1") return;
      var IDS = [
        "vcMotionModeBtn",
        "vcArrangeHud",
        "vcArrangeResetHud",
        "vcActionHub",
        "vcQuickActionTrigger",
        "vcVibeModeBtn",
        "vcStoryRail",
        "vcSocialPulse",
        "vcMissionHud",
        "vcDealDraftComposer",
        "vcMobileStreakChip",
        "vcMobileInboxPulse",
        "vcFirst5Bar"
      ];
      function stripLeanIntruders() {
        IDS.forEach(function (id) {
          var n = document.getElementById(id);
          if (n && n.parentNode) n.parentNode.removeChild(n);
        });
        var sh = document.getElementById("vcQuickActionSheet");
        if (sh && sh.parentNode) sh.parentNode.removeChild(sh);
      }
      stripLeanIntruders();
      window.addEventListener("load", stripLeanIntruders, { once: true });
      [50, 400, 1200, 2800].forEach(function (ms) {
        window.setTimeout(stripLeanIntruders, ms);
      });
      if (document.body && typeof MutationObserver !== "undefined") {
        try {
          var mo = new MutationObserver(stripLeanIntruders);
          mo.observe(document.body, { childList: true, subtree: false });
        } catch (e) {
          /* ignore */
        }
      }
    })();
