// ─────────────────────────────────────────────────────────────────────────────
// WEB API CLIENT — Next.js axios client with JWT injection & retry logic
// ─────────────────────────────────────────────────────────────────────────────

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import type {
  Trip,
  ItineraryDay,
  Task,
  User,
} from '@/types';

// ─── Token storage (localStorage for web) ─────────────────────────────────────
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ─── Create Axios Instance ────────────────────────────────────────────────────
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: inject JWT token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: retry on 5xx, handle 401
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig & { retryCount?: number };

      // Retry on 5xx (except 501)
      if (error.response?.status && error.response.status >= 500 && error.response.status !== 501) {
        const retryCount = (config?.retryCount || 0) + 1;
        if (retryCount <= 3) {
          config.retryCount = retryCount;
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          return instance(config);
        }
      }

      // Handle 401: clear token and redirect to login
      if (error.response?.status === 401) {
        clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const apiClient = createAxiosInstance();

// ─── API Methods ──────────────────────────────────────────────────────────────

// Auth
export const authAPI = {
  signInWithEmail: (payload: { email: string; otp?: string }) =>
    apiClient.post('/auth/signin', payload),
  signInWithGoogle: (payload: { idToken: string }) =>
    apiClient.post('/auth/google', payload),
  signInWithApple: (payload: { idToken: string; user?: { name?: { firstName?: string; lastName?: string }; email?: string } }) =>
    apiClient.post('/auth/apple', payload),
  getProfile: () => apiClient.get<User>('/auth/profile'),
  updateProfile: (payload: Partial<User>) =>
    apiClient.patch<User>('/auth/profile', payload),
  logout: () => {
    clearToken();
    return Promise.resolve();
  },
};

// Trips
export const tripsAPI = {
  list: (params?: { skip?: number; limit?: number }) =>
    apiClient.get<{ data: Trip[]; total: number }>('/trips', { params }),
  get: (tripId: string) => apiClient.get<Trip>(`/trips/${tripId}`),
  create: (payload: any) => apiClient.post<Trip>('/trips', payload),
  update: (tripId: string, payload: Partial<Trip>) =>
    apiClient.patch<Trip>(`/trips/${tripId}`, payload),
  delete: (tripId: string) => apiClient.delete(`/trips/${tripId}`),
};

// Itinerary
export const itineraryAPI = {
  getDays: (tripId: string) =>
    apiClient.get<ItineraryDay[]>(`/trips/${tripId}/itinerary`),
  getDay: (dayId: string) => apiClient.get<ItineraryDay>(`/itinerary-days/${dayId}`),
  addDay: (tripId: string) => apiClient.post(`/trips/${tripId}/itinerary`, {}),
  generateItinerary: (tripId: string) =>
    apiClient.post<{ jobId: string }>(`/trips/${tripId}/generate-itinerary`, {}),
};

// Tasks
export const tasksAPI = {
  list: (params?: { dayId?: string; skip?: number; limit?: number }) =>
    apiClient.get<{ data: Task[]; total: number }>('/tasks', { params }),
  get: (taskId: string) => apiClient.get<Task>(`/tasks/${taskId}`),
  create: (payload: any) => apiClient.post<Task>('/tasks', payload),
  update: (taskId: string, payload: Partial<Task>) =>
    apiClient.patch<Task>(`/tasks/${taskId}`, payload),
  delete: (taskId: string) => apiClient.delete(`/tasks/${taskId}`),
  reorder: (dayId: string, taskIds: string[]) =>
    apiClient.post(`/itinerary-days/${dayId}/reorder-tasks`, { taskIds }),
};

// Venues
export const venuesAPI = {
  get: (venueId: string) => apiClient.get(`/venues/${venueId}`),
  search: (params?: { query?: string; location?: string }) =>
    apiClient.get('/venues/search', { params }),
};

// Favorites
export const favoritesAPI = {
  list: () => apiClient.get('/favorites'),
  add: (venueId: string) => apiClient.post('/favorites', { venueId }),
  remove: (venueId: string) => apiClient.delete(`/favorites/${venueId}`),
};

// Social
export const socialAPI = {
  feed: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/social/feed', { params }),
  post: (payload: any) => apiClient.post('/social/posts', payload),
  searchPosts: (query: string) =>
    apiClient.get('/social/search', { params: { q: query } }),
};

export { getToken, setToken, clearToken };
