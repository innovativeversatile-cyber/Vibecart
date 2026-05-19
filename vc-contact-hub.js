/* Floating Contact chip: reviews & questions. Crucial topics email the owner; others get a warm Brandon-style reply instantly. */
(function () {
  "use strict";

  if (typeof window === "undefined" || window.__vcContactHubBooted === "1") {
    return;
  }
  window.__vcContactHubBooted = "1";

  function apiOrigin() {
    try {
      var el = document.querySelector('meta[name="vibecart-api-base"]');
      var raw = el && el.getAttribute("content");
      var s = String(raw || "").trim();
      if (s && !/^disabled$/i.test(s)) {
        return s.replace(/\/$/, "");
      }
    } catch (e) {
      /* ignore */
    }
    try {
      if (window.location && /^https?:$/i.test(String(window.location.protocol || ""))) {
        return String(window.location.origin || "").replace(/\/$/, "");
      }
    } catch (e2) {
      /* ignore */
    }
    return "";
  }

  function mount() {
    if (document.getElementById("vcContactHubChip")) {
      return;
    }
    if (document.body && document.body.classList.contains("admin-surface")) {
      return;
    }
    var p = String((window.location && window.location.pathname) || "").toLowerCase();
    if (/admin-app|admin\.html|owner-access-kuda/.test(p)) {
      return;
    }

    var chip = document.createElement("button");
    chip.type = "button";
    chip.id = "vcContactHubChip";
    chip.className = "vc-contact-hub-chip";
    chip.setAttribute("aria-label", "Contact VibeCart");
    chip.setAttribute("aria-expanded", "false");
    chip.textContent = "Contact";

    var panel = document.createElement("div");
    panel.id = "vcContactHubPanel";
    panel.className = "vc-contact-hub-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-labelledby", "vcContactHubTitle");
    panel.innerHTML =
      "<div class='vc-contact-hub-panel__card'>" +
      "<button type='button' class='vc-contact-hub-close' id='vcContactHubClose' aria-label='Close'>×</button>" +
      "<p class='badge'>Real humans · real help</p>" +
      "<h3 id='vcContactHubTitle'>Talk to us</h3>" +
      "<p class='note vc-contact-hub-lead'>Share a review, question, or idea. Brandon answers most things right away; urgent security or payment issues go straight to our inbox.</p>" +
      "<label class='vc-contact-hub-field'>Topic" +
      "<select id='vcContactCategory'>" +
      "<option value='general'>General question</option>" +
      "<option value='review'>Review or praise</option>" +
      "<option value='order'>Order or delivery</option>" +
      "<option value='seller'>Selling on VibeCart</option>" +
      "<option value='coach'>Health coach</option>" +
      "<option value='payment'>Payment or refund (priority)</option>" +
      "<option value='security'>Security or account safety (priority)</option>" +
      "<option value='bug'>Something broken</option>" +
      "</select></label>" +
      "<label class='vc-contact-hub-field'>Your name (optional)" +
      "<input type='text' id='vcContactName' maxlength='80' autocomplete='name' placeholder='First name is fine' /></label>" +
      "<label class='vc-contact-hub-field'>Email (optional, for a reply)" +
      "<input type='email' id='vcContactEmail' maxlength='120' autocomplete='email' placeholder='you@example.com' /></label>" +
      "<label class='vc-contact-hub-field'>Message" +
      "<textarea id='vcContactMessage' rows='4' maxlength='2000' placeholder='Tell us what happened or what you need…'></textarea></label>" +
      "<button type='button' class='btn btn-primary' id='vcContactSend'>Send</button>" +
      "<p class='note'><a href='/lane-passport.html'>Create your free passport</a> for saved lanes and faster checkout.</p>" +
      "<p class='note vc-contact-hub-status' id='vcContactStatus' role='status' aria-live='polite'></p>" +
      "<div class='vc-contact-hub-reply hidden' id='vcContactReplyBox'>" +
      "<p class='vc-contact-hub-reply__label'>Brandon</p>" +
      "<p id='vcContactReplyText'></p>" +
      "</div>" +
      "</div>";

    document.body.appendChild(chip);
    document.body.appendChild(panel);

    var open = false;
    function setOpen(next) {
      open = next;
      panel.hidden = !open;
      chip.setAttribute("aria-expanded", open ? "true" : "false");
      chip.classList.toggle("is-open", open);
      if (open) {
        var msg = document.getElementById("vcContactMessage");
        if (msg) {
          window.setTimeout(function () {
            try {
              msg.focus();
            } catch (e) {
              /* ignore */
            }
          }, 80);
        }
      }
    }

    chip.addEventListener("click", function () {
      setOpen(!open);
    });
    document.getElementById("vcContactHubClose").addEventListener("click", function () {
      setOpen(false);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && open) {
        setOpen(false);
      }
    });

    document.getElementById("vcContactSend").addEventListener("click", function () {
      var status = document.getElementById("vcContactStatus");
      var replyBox = document.getElementById("vcContactReplyBox");
      var replyText = document.getElementById("vcContactReplyText");
      var message = String(document.getElementById("vcContactMessage").value || "").trim();
      if (message.length < 8) {
        if (status) {
          status.textContent = "Please write at least a short sentence so we can help.";
        }
        return;
      }
      var origin = apiOrigin();
      if (!origin) {
        if (status) {
          status.textContent = "Could not reach the server. Try again on vibe-cart.com.";
        }
        return;
      }
      if (status) {
        status.textContent = "Sending…";
      }
      if (replyBox) {
        replyBox.classList.add("hidden");
      }
      var payload = {
        category: String(document.getElementById("vcContactCategory").value || "general"),
        name: String(document.getElementById("vcContactName").value || "").trim(),
        email: String(document.getElementById("vcContactEmail").value || "").trim(),
        message: message,
        pageUrl: String(window.location.href || "").slice(0, 512)
      };
      fetch(origin + "/api/public/contact/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        credentials: "omit"
      })
        .then(function (r) {
          return r.json().then(function (body) {
            return { ok: r.ok, body: body || {} };
          });
        })
        .then(function (res) {
          if (!res.ok || !res.body.ok) {
            if (status) {
              status.textContent =
                String(res.body.message || res.body.code || "Could not send right now. Try again in a moment.");
            }
            return;
          }
          if (status) {
            status.textContent = res.body.escalated
              ? "Received — our team inbox has been notified. We will follow up as soon as we can."
              : "Thanks — your note is saved.";
          }
          if (replyBox && replyText && res.body.brandonReply) {
            replyText.textContent = String(res.body.brandonReply);
            replyBox.classList.remove("hidden");
          }
          document.getElementById("vcContactMessage").value = "";
          try {
            if (window.vibeCartBootBrandonUniversal) {
              window.vibeCartBootBrandonUniversal();
            }
          } catch (e) {
            /* ignore */
          }
        })
        .catch(function () {
          if (status) {
            status.textContent = "Network error. Check your connection and try again.";
          }
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
