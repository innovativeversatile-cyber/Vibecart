"use strict";

const WebSocket = require("ws");

/** @type {Map<string, Set<import('ws')>>} */
const rooms = new Map();

function roomKey(bookingId) {
  return String(Number(bookingId) || 0);
}

function broadcastBookingChatRefresh(bookingId) {
  const key = roomKey(bookingId);
  const set = rooms.get(key);
  if (!set || set.size === 0) {
    return;
  }
  const payload = JSON.stringify({ type: "bakery_chat_refresh", bookingId: Number(bookingId) });
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
      } catch {
        /* ignore */
      }
    }
  }
}

/** @type {Map<string, Set<import('ws')>>} */
const providerRooms = new Map();

function providerRoomKey(userId) {
  return String(Number(userId) || 0);
}

function broadcastProviderDesk(userId, message) {
  const key = providerRoomKey(userId);
  const set = providerRooms.get(key);
  if (!set || set.size === 0) {
    return;
  }
  const payload = JSON.stringify(
    Object.assign({ type: "bakery_provider_desk" }, message && typeof message === "object" ? message : {})
  );
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * @param {import('http').Server} server
 * @param {{ validate: (token: string) => Promise<{ userId: number } | null> }} opts
 */
function attachBakeryProviderDeskWss(server, opts) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    try {
      const host = req.headers.host || "localhost";
      const u = new URL(req.url || "/", `http://${host}`);
      if (u.pathname !== "/ws/bakery-provider-desk") {
        return;
      }
      const token = String(u.searchParams.get("token") || "").trim();
      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }
      const sess = await opts.validate(token);
      if (!sess || !Number(sess.userId)) {
        socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        const key = providerRoomKey(sess.userId);
        if (!providerRooms.has(key)) {
          providerRooms.set(key, new Set());
        }
        providerRooms.get(key).add(ws);
        ws.on("close", () => {
          const s = providerRooms.get(key);
          if (s) {
            s.delete(ws);
            if (s.size === 0) {
              providerRooms.delete(key);
            }
          }
        });
        try {
          ws.send(JSON.stringify({ type: "bakery_provider_desk_ready", userId: Number(sess.userId) }));
        } catch {
          /* ignore */
        }
      });
    } catch {
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
    }
  });

  return wss;
}

/**
 * @param {import('http').Server} server
 * @param {{ validate: (token: string, bookingId: number) => Promise<boolean> }} opts
 */
function attachBakeryBookingChatWss(server, opts) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    try {
      const host = req.headers.host || "localhost";
      const u = new URL(req.url || "/", `http://${host}`);
      if (u.pathname !== "/ws/bakery-booking-chat") {
        return;
      }
      const token = String(u.searchParams.get("token") || "").trim();
      const bookingId = Number(u.searchParams.get("bookingId") || 0);
      if (!token || !bookingId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }
      const ok = await opts.validate(token, bookingId);
      if (!ok) {
        socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        const key = roomKey(bookingId);
        if (!rooms.has(key)) {
          rooms.set(key, new Set());
        }
        rooms.get(key).add(ws);
        ws.on("close", () => {
          const s = rooms.get(key);
          if (s) {
            s.delete(ws);
            if (s.size === 0) {
              rooms.delete(key);
            }
          }
        });
        try {
          ws.send(JSON.stringify({ type: "bakery_chat_ready", bookingId: Number(bookingId) }));
        } catch {
          /* ignore */
        }
      });
    } catch {
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
    }
  });

  return wss;
}

module.exports = {
  attachBakeryBookingChatWss,
  broadcastBookingChatRefresh,
  attachBakeryProviderDeskWss,
  broadcastProviderDesk
};
