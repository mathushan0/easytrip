// ─────────────────────────────────────────────────────────────────────────────
// EASYTRIP — SOCKET CLIENT
// Socket.io client for live Social Intelligence WebSocket updates.
// ─────────────────────────────────────────────────────────────────────────────

import { io, Socket } from 'socket.io-client';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'user-storage' });
const TOKEN_KEY = 'auth_token';

const SOCKET_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined)
    ?.replace('/api/v1', '')
    ?? 'http://localhost:3000';

// ─── Event types ─────────────────────────────────────────────────────────────

export interface SocialPostEvent {
  id: string;
  platform: string;
  content: string;
  trendScore: number;
  destination: string;
  publishedAt: string;
  url: string | null;
  author: string | null;
  mediaUrls: string[];
}

export interface TripGenerationProgressEvent {
  jobId: string;
  tripId: string;
  progress: number;
  currentStep: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface ServerToClientEvents {
  'social:new-post': (post: SocialPostEvent) => void;
  'social:trending-update': (data: { destination: string; trendScore: number }) => void;
  'trip:generation-progress': (data: TripGenerationProgressEvent) => void;
  'trip:generation-complete': (data: { tripId: string; jobId: string }) => void;
  'trip:generation-failed': (data: { tripId: string; jobId: string; error: string }) => void;
}

export interface ClientToServerEvents {
  'social:subscribe': (destination: string) => void;
  'social:unsubscribe': (destination: string) => void;
  'trip:subscribe': (tripId: string) => void;
  'trip:unsubscribe': (tripId: string) => void;
}

// ─── Singleton socket ─────────────────────────────────────────────────────────

let _socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (_socket?.connected) return _socket;

  const token = storage.getString(TOKEN_KEY);

  _socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false,
    auth: token ? { token } : undefined,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  _socket.on('connect', () => {
    console.log('[Socket] Connected:', _socket?.id);
  });

  _socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  _socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return _socket;
}

export function connectSocket(): void {
  const socket = getSocket();
  if (!socket.connected) {
    // Refresh auth token before connecting
    const token = storage.getString(TOKEN_KEY);
    if (token) {
      (socket as unknown as { auth: { token: string } }).auth = { token };
    }
    socket.connect();
  }
}

export function disconnectSocket(): void {
  _socket?.disconnect();
}

// ─── Subscription helpers ─────────────────────────────────────────────────────

export function subscribeToDestination(destination: string): void {
  getSocket().emit('social:subscribe', destination);
}

export function unsubscribeFromDestination(destination: string): void {
  getSocket().emit('social:unsubscribe', destination);
}

export function subscribeToTripGeneration(tripId: string): void {
  getSocket().emit('trip:subscribe', tripId);
}

export function unsubscribeFromTripGeneration(tripId: string): void {
  getSocket().emit('trip:unsubscribe', tripId);
}

// ─── React hook ───────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';

export function useSocialFeed(
  destination: string | null,
  onNewPost: (post: SocialPostEvent) => void,
): void {
  const callbackRef = useRef(onNewPost);
  callbackRef.current = onNewPost;

  useEffect(() => {
    if (!destination) return;

    const socket = getSocket();
    connectSocket();
    subscribeToDestination(destination);

    const handler = (post: SocialPostEvent) => {
      if (post.destination.toLowerCase() === destination.toLowerCase()) {
        callbackRef.current(post);
      }
    };
    socket.on('social:new-post', handler);

    return () => {
      socket.off('social:new-post', handler);
      unsubscribeFromDestination(destination);
    };
  }, [destination]);
}

export function useTripGenerationSocket(
  tripId: string | null,
  onProgress: (data: TripGenerationProgressEvent) => void,
  onComplete: (data: { tripId: string; jobId: string }) => void,
  onFailed: (data: { tripId: string; jobId: string; error: string }) => void,
): void {
  const progressRef = useRef(onProgress);
  const completeRef = useRef(onComplete);
  const failedRef = useRef(onFailed);
  progressRef.current = onProgress;
  completeRef.current = onComplete;
  failedRef.current = onFailed;

  useEffect(() => {
    if (!tripId) return;

    const socket = getSocket();
    connectSocket();
    subscribeToTripGeneration(tripId);

    const progressHandler = (data: TripGenerationProgressEvent) => progressRef.current(data);
    const completeHandler = (data: { tripId: string; jobId: string }) => completeRef.current(data);
    const failedHandler = (data: { tripId: string; jobId: string; error: string }) => failedRef.current(data);

    socket.on('trip:generation-progress', progressHandler);
    socket.on('trip:generation-complete', completeHandler);
    socket.on('trip:generation-failed', failedHandler);

    return () => {
      socket.off('trip:generation-progress', progressHandler);
      socket.off('trip:generation-complete', completeHandler);
      socket.off('trip:generation-failed', failedHandler);
      unsubscribeFromTripGeneration(tripId);
    };
  }, [tripId]);
}
