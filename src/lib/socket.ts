import { io, Socket } from 'socket.io-client';
import type { FlowIQState } from '../types/flowiq';

let socket: Socket | null = null;

/** Align socket target with API backend; in dev prefer Vite origin so /socket.io proxies to :5000. */
export function resolveSocketUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (import.meta.env.DEV && origin && configured && configured !== origin) {
    return origin;
  }
  return configured || origin;
}

function attachDevSocketLogging(sock: Socket) {
  if (!import.meta.env.DEV) return;
  let lastReconnectLog = 0;
  sock.on('connect', () => {
    console.info('[FlowIQ socket] connected', sock.id);
  });
  sock.on('disconnect', (reason) => {
    console.info('[FlowIQ socket] disconnected', reason);
  });
  sock.on('connect_error', (err) => {
    console.warn('[FlowIQ socket] connection error', err.message);
  });
  sock.io.on('reconnect_attempt', () => {
    const now = Date.now();
    if (now - lastReconnectLog > 5000) {
      lastReconnectLog = now;
      console.info('[FlowIQ socket] reconnecting…');
    }
  });
  sock.io.on('reconnect', () => {
    console.info('[FlowIQ socket] reconnected');
  });
}

export function getSocket(): Socket {
  if (!socket) {
    const url = resolveSocketUrl();
    socket = io(url, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    });
    attachDevSocketLogging(socket);
  }
  return socket;
}

export function subscribeState(onState: (s: FlowIQState) => void) {
  const s = getSocket();
  const handler = (state: FlowIQState) => onState(state);
  s.on('flowiq:state', handler);
  s.emit('flowiq:request_state');
  return () => {
    s.off('flowiq:state', handler);
  };
}
