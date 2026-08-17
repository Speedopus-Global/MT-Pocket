import { io } from 'socket.io-client';

// Your REST base is usually something like http://localhost:3000/api —
// Socket.IO needs the bare origin (no /api), since the gateway's namespace
// is mounted at /chat directly on the Nest HTTP server, not under /api.
const SOCKET_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

let socket = null;

// Call once right after login (and again if you ever rotate the access
// token mid-session) — the gateway verifies this token ONCE at handshake
// and does not re-check it later, so a stale token here just means the
// socket connects successfully but as whoever that token belonged to.
export function connectChatSocket(accessToken) {
  if (!accessToken) return null;
  if (socket) {
    socket.auth = { token: accessToken };
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(`${SOCKET_ORIGIN}/chat`, {
    auth: { token: accessToken },
    withCredentials: true,
    transports: ['polling', 'websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function getChatSocket() {
  return socket;
}

// Call on logout — otherwise the old socket stays connected as the
// now-logged-out user until it naturally times out.
export function disconnectChatSocket() {
  socket?.disconnect();
  socket = null;
}