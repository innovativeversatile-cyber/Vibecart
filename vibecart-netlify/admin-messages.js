(function () {
  const AUTH_SESSION_KEY = "vibecart-owner-api-session";
  const API_BASE_KEY = "vibecart-api-base-url";
  const MESSAGE_CENTER_KEY = "vibecart-admin-message-center-v1";
  const LEGACY_READ_AT_KEY = "vibecart-admin-message-read-at-v1";
  const PUBLIC_PRODUCTION_API_FALLBACK = "https://vibe-cart.com";
  const DEFAULT_API_BASE = (function () {
    const proto = window.location.protocol;
    const host = String(window.location.hostname || "").toLowerCase();
    if (proto === "https:" || proto === "http:") {
      if (host === "localhost" || host === "127.0.0.1") {
        return "http://localhost:8081";
      }
      return window.location.origin;
    }
    return PUBLIC_PRODUCTION_API_FALLBACK;
  })();
  const list = document.getElementById("msgList");
  const input = document.getElementById("msgInput");
  const type = document.getElementById("msgType");
  const addBtn = document.getElementById("msgAdd");
  const markReadBtn = document.getElementById("msgMarkRead");
  const clearBtn = document.getElementById("msgClear");
  const refreshBtn = document.getElementById("msgRefresh");
  const statusEl = document.getElementById("msgStatus");
  const tabAll = document.getElementById("msgTabAll");
  const tabUnread = document.getElementById("msgTabUnread");
  const tabUrgent = document.getElementById("msgTabUrgent");
  const tabRequest = document.getElementById("msgTabRequest");
  let activeTab = "all";
  let items = [];
  let usingLocalFallback = false;
  let refreshTimer = 0;
  let stream = null;
  let lastStreamSignature = "";

  function setStatus(text, isError) {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = String(text || "").trim() || " ";
    statusEl.classList.toggle("msg-status--error", Boolean(isError));
  }

  function nextLocalId() {
    return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function formatRelativeTime(ms) {
    const t = Number(ms) || 0;
    if (!t) {
      return "";
    }
    const diff = Date.now() - t;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) {
      return "just now";
    }
    const min = Math.floor(sec / 60);
    if (min < 60) {
      return `${min}m ago`;
    }
    const hr = Math.floor(min / 60);
    if (hr < 48) {
      return `${hr}h ago`;
    }
    const day = Math.floor(hr / 24);
    if (day < 14) {
      return `${day}d ago`;
    }
    try {
      return new Date(t).toLocaleString();
    } catch {
      return "";
    }
  }

  function normalizeItems(rawItems) {
    const legacyReadAt = Number(localStorage.getItem(LEGACY_READ_AT_KEY) || "0");
    return (Array.isArray(rawItems) ? rawItems : []).map(function (item) {
      const typeNorm = String(item?.type || item?.message_type || "system").toLowerCase();
      const createdAtMs =
        Number(item?.createdAtMs || 0) ||
        Number(new Date(item?.createdAt || item?.created_at || 0).getTime() || 0) ||
        Date.now();
      const readAt =
        item?.readAt ||
        item?.read_at ||
        (legacyReadAt > 0 && createdAtMs <= legacyReadAt ? new Date(legacyReadAt).toISOString() : null);
      const rawId = item?.id;
      const id =
        rawId !== undefined && rawId !== null && String(rawId).trim() !== ""
          ? rawId
          : nextLocalId();
      return {
        id: id,
        type: typeNorm === "urgent" || typeNorm === "request" ? typeNorm : "system",
        text: String(item?.text || item?.message_text || ""),
        createdAt: String(item?.createdAt || item?.created_at || new Date(createdAtMs).toLocaleString()),
        createdAtMs: createdAtMs,
        readAt: readAt
      };
    });
  }

  function sortItemsDesc() {
    items.sort(function (a, b) {
      return (Number(b.createdAtMs) || 0) - (Number(a.createdAtMs) || 0);
    });
  }

  function normalizeApiBase(input) {
    let value = String(input || "").trim().replace(/\/+$/, "");
    if (/\/api$/i.test(value)) {
      value = value.replace(/\/api$/i, "");
    }
    return value || DEFAULT_API_BASE;
  }

  function getApiBase() {
    const isProdPage = /^https?:$/i.test(window.location.protocol) && !/localhost|127\.0\.0\.1/i.test(window.location.host);
    let fromStorage = localStorage.getItem(API_BASE_KEY);
    if (isProdPage && fromStorage && /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(fromStorage)) {
      localStorage.removeItem(API_BASE_KEY);
      fromStorage = null;
    }
    const selected = normalizeApiBase(window.__VIBECART_API_BASE_URL__ || fromStorage || DEFAULT_API_BASE);
    if (isProdPage && /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(selected)) {
      return normalizeApiBase(window.location.origin);
    }
    return selected;
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function startLiveMessageStream() {
    try {
      if (stream) {
        stream.close();
        stream = null;
      }
      const token = String(getSession().token || "").trim();
      if (!token) {
        return;
      }
      const streamUrl = `${getApiBase().replace(/\/+$/, "")}/api/owner/messages/stream?authToken=${encodeURIComponent(token)}`;
      stream = new EventSource(streamUrl);
      stream.addEventListener("message_delta", function (event) {
        try {
          const data = JSON.parse(event.data || "{}");
          const sig = `${Number(data.latestId || 0)}|${Number(data.unreadCount || 0)}|${Number(data.totalCount || 0)}`;
          if (sig !== lastStreamSignature) {
            lastStreamSignature = sig;
            refreshItems().catch(function () {});
          }
        } catch {
          /* ignore malformed stream payload */
        }
      });
      stream.addEventListener("error", function () {
        // EventSource auto-reconnects; keep current UI state.
      });
    } catch {
      /* stream unavailable; polling still active */
    }
  }

  function hasValidAdminSession() {
    const session = getSession();
    const expiresAtMs = new Date(session.expiresAt || "").getTime();
    return Boolean(session.token && Number.isFinite(expiresAtMs) && expiresAtMs > Date.now());
  }

  if (!hasValidAdminSession()) {
    window.location.replace("./admin.html");
    return;
  }

  function saveLocalFallback(nextItems) {
    localStorage.setItem(MESSAGE_CENTER_KEY, JSON.stringify(nextItems.slice(0, 120)));
    try {
      localStorage.setItem("vibecart-admin-message-sync-at", String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  function getLocalFallback() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MESSAGE_CENTER_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async function postOwnerMessage(path, payload) {
    const session = getSession();
    const base = getApiBase().replace(/\/+$/, "");
    const url = `${base}${path.startsWith("/") ? path : "/" + path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authToken: String(session.token || ""),
        token: String(session.token || ""),
        ...(payload || {})
      })
    });
    const body = await response.json().catch(function () {
      return {};
    });
    if (!response.ok || !body.ok) {
      const detail = String(body.message || body.code || `HTTP_${response.status}` || "request_failed").trim();
      throw new Error(detail || "request_failed");
    }
    return body;
  }

  function patchLocalItem(id, patch) {
    items = items
      .map(function (item) {
        return String(item.id) === String(id) ? Object.assign({}, item, patch) : item;
      })
      .slice(0, 120);
    saveLocalFallback(items);
    if (patch && Object.prototype.hasOwnProperty.call(patch, "readAt")) {
      const lastReadAt = patch.readAt ? Date.now() : 0;
      if (lastReadAt > 0) {
        localStorage.setItem(LEGACY_READ_AT_KEY, String(lastReadAt));
      }
    }
    render();
  }

  function removeLocalItem(id) {
    items = items
      .filter(function (item) {
        return String(item.id) !== String(id);
      })
      .slice(0, 120);
    saveLocalFallback(items);
    render();
  }

  async function updateMessageCloud(id, body) {
    await postOwnerMessage("/api/owner/messages/update", Object.assign({ messageId: id }, body));
    await refreshItems();
  }

  async function deleteMessageCloud(id) {
    await postOwnerMessage("/api/owner/messages/delete", { messageId: id });
    await refreshItems();
  }

  function render() {
    sortItemsDesc();
    const unreadCount = items.filter(function (item) {
      return !item.readAt;
    }).length;
    const urgentCount = items.filter(function (item) {
      return String(item.type) === "urgent";
    }).length;
    const requestCount = items.filter(function (item) {
      return String(item.type) === "request";
    }).length;
    tabAll.textContent = `All (${items.length})`;
    tabUnread.textContent = `Unread (${unreadCount})`;
    tabUrgent.textContent = `Urgent (${urgentCount})`;
    tabRequest.textContent = `Requests (${requestCount})`;
    const visible = items.filter(function (item) {
      const kind = String(item.type || "system").toLowerCase();
      if (activeTab === "unread") {
        return !item.readAt;
      }
      if (activeTab === "urgent") {
        return kind === "urgent";
      }
      if (activeTab === "request") {
        return kind === "request";
      }
      return true;
    });
    list.innerHTML = "";
    if (visible.length === 0) {
      const empty = document.createElement("div");
      empty.className = "admin-message-item";
      empty.textContent = "No messages in this view.";
      list.appendChild(empty);
      return;
    }
    visible.forEach(function (item) {
      const kind = String(item.type || "system").toLowerCase();
      const card = document.createElement("article");
      card.className = `admin-message-item admin-message-${kind}`;
      if (!item.readAt) {
        card.classList.add("admin-message-item--unread");
      }

      const metaRow = document.createElement("div");
      metaRow.className = "admin-message-card__row";
      const pill = document.createElement("span");
      pill.className = "admin-message-type-pill";
      pill.textContent = kind;
      const timeEl = document.createElement("span");
      timeEl.className = "admin-message-time";
      timeEl.textContent = formatRelativeTime(item.createdAtMs) + " · " + String(item.createdAt || "");
      metaRow.appendChild(pill);
      metaRow.appendChild(timeEl);
      card.appendChild(metaRow);

      const body = document.createElement("div");
      body.className = "admin-message-body";
      body.textContent = String(item.text || "");
      card.appendChild(body);

      const src = document.createElement("span");
      src.className = "note";
      src.textContent = usingLocalFallback ? "Stored on this device only" : "Synced to server";
      card.appendChild(src);

      const actions = document.createElement("div");
      actions.className = "admin-message-actions";
      function mkBtn(label, className, onClick) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = className;
        btn.textContent = label;
        btn.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          onClick().catch(function () {});
        });
        actions.appendChild(btn);
      }
      if (item.readAt) {
        mkBtn("Mark unread", "btn btn-secondary", async function () {
          if (usingLocalFallback) {
            patchLocalItem(item.id, { readAt: null });
            return;
          }
          await updateMessageCloud(item.id, { readState: "unread" });
        });
      } else {
        mkBtn("Mark read", "btn btn-secondary", async function () {
          if (usingLocalFallback) {
            patchLocalItem(item.id, { readAt: new Date().toISOString() });
            return;
          }
          await updateMessageCloud(item.id, { readState: "read" });
        });
      }
      mkBtn("System", "btn btn-secondary", async function () {
        if (usingLocalFallback) {
          patchLocalItem(item.id, { type: "system" });
          return;
        }
        await updateMessageCloud(item.id, { messageType: "system" });
      });
      mkBtn("Urgent", "btn btn-secondary", async function () {
        if (usingLocalFallback) {
          patchLocalItem(item.id, { type: "urgent" });
          return;
        }
        await updateMessageCloud(item.id, { messageType: "urgent" });
      });
      mkBtn("Request", "btn btn-secondary", async function () {
        if (usingLocalFallback) {
          patchLocalItem(item.id, { type: "request" });
          return;
        }
        await updateMessageCloud(item.id, { messageType: "request" });
      });
      mkBtn("Delete", "btn btn-secondary", async function () {
        if (!confirm("Delete this message permanently?")) {
          return;
        }
        if (usingLocalFallback) {
          removeLocalItem(item.id);
          return;
        }
        await deleteMessageCloud(item.id);
      });
      card.appendChild(actions);
      list.appendChild(card);
    });
  }

  async function refreshItems() {
    setStatus("Loading messages…", false);
    try {
      const payload = await postOwnerMessage("/api/owner/messages/list", { limit: 120 });
      items = normalizeItems(payload.items);
      usingLocalFallback = false;
      saveLocalFallback(items);
      sortItemsDesc();
      setStatus(
        items.length
          ? `${items.length} message(s) loaded from server.`
          : "Inbox is empty — add a message below.",
        false
      );
    } catch (err) {
      items = normalizeItems(getLocalFallback());
      usingLocalFallback = true;
      sortItemsDesc();
      setStatus(
        "Could not reach the server (" +
          String(err.message || err) +
          "). Showing cached copy only. Use the same API origin as this page (leave API base empty on admin login for Netlify), then tap Refresh.",
        true
      );
    }
    render();
  }

  async function addMessage() {
    const text = String(input.value || "").trim();
    if (!text) {
      setStatus("Write something before sending.", true);
      return;
    }
    const kind = String(type.value || "request");
    setStatus("Sending…", false);
    if (usingLocalFallback) {
      const nowMs = Date.now();
      items.unshift({
        id: nextLocalId(),
        text: text,
        type: kind,
        createdAt: new Date(nowMs).toLocaleString(),
        createdAtMs: nowMs,
        readAt: null
      });
      items = normalizeItems(items.slice(0, 120));
      saveLocalFallback(items);
      input.value = "";
      setStatus("Saved locally (server still unreachable).", true);
      render();
      return;
    }
    try {
      await postOwnerMessage("/api/owner/messages/create", { text: text, type: kind });
      input.value = "";
      await refreshItems();
    } catch (err) {
      setStatus("Send failed: " + String(err.message || err), true);
    }
  }

  async function markAllRead() {
    setStatus("Updating…", false);
    if (usingLocalFallback) {
      items = items.map(function (item) {
        return Object.assign({}, item, { readAt: item.readAt || new Date().toISOString() });
      });
      saveLocalFallback(items);
      setStatus("Marked read locally.", false);
      render();
      return;
    }
    try {
      await postOwnerMessage("/api/owner/messages/mark-read");
      await refreshItems();
    } catch (err) {
      setStatus("Mark read failed: " + String(err.message || err), true);
    }
  }

  async function clearAll() {
    setStatus("Clearing…", false);
    if (usingLocalFallback) {
      items = [];
      saveLocalFallback(items);
      setStatus("Local cache cleared.", false);
      render();
      return;
    }
    try {
      await postOwnerMessage("/api/owner/messages/clear");
      await refreshItems();
      setStatus("All server messages deleted.", false);
    } catch (err) {
      setStatus("Clear failed: " + String(err.message || err), true);
    }
  }

  addBtn.addEventListener("click", function () {
    addMessage().catch(function () {});
  });
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      refreshItems().catch(function () {});
    });
  }
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      addMessage().catch(function () {});
    }
  });
  markReadBtn.addEventListener("click", function () {
    markAllRead().catch(function () {});
  });
  clearBtn.addEventListener("click", function () {
    if (
      !confirm(
        "Delete every message in the owner message center? This removes them from the database and cannot be undone."
      )
    ) {
      return;
    }
    clearAll().catch(function () {});
  });
  const setActiveTab = function (tab) {
    activeTab = tab;
    [tabAll, tabUnread, tabUrgent, tabRequest].forEach(function (btn) {
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-secondary");
    });
    const map = { all: tabAll, unread: tabUnread, urgent: tabUrgent, request: tabRequest };
    if (map[tab]) {
      map[tab].classList.remove("btn-secondary");
      map[tab].classList.add("btn-primary");
    }
    render();
  };
  tabAll.addEventListener("click", function () {
    setActiveTab("all");
  });
  tabUnread.addEventListener("click", function () {
    setActiveTab("unread");
  });
  tabUrgent.addEventListener("click", function () {
    setActiveTab("urgent");
  });
  tabRequest.addEventListener("click", function () {
    setActiveTab("request");
  });

  setActiveTab("all");
  refreshItems().catch(function () {});
  startLiveMessageStream();
  refreshTimer = window.setInterval(function () {
    if (document.hidden) {
      return;
    }
    refreshItems().catch(function () {});
  }, 45000);
  window.addEventListener("beforeunload", function () {
    if (refreshTimer) {
      window.clearInterval(refreshTimer);
    }
    if (stream) {
      stream.close();
      stream = null;
    }
  });
  window.addEventListener("storage", function (event) {
    if (event.key === MESSAGE_CENTER_KEY || event.key === "vibecart-admin-message-sync-at") {
      if (usingLocalFallback) {
        items = normalizeItems(getLocalFallback());
        render();
      }
    }
  });
})();
