// ─────────────────────────────────────────────────────────────────────────────
// EASYTRIP — API CLIENT
// Axios-based authenticated client with JWT injection, interceptors, and typed
// methods for all backend routes.
// ─────────────────────────────────────────────────────────────────────────────

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { MMKV } from 'react-native-mmkv';
import type {
  Trip,
  ItineraryDay,
  Task,
  Budget,
  Expense,
  User,
  Subscription,
  TripType,
  TravelPace,
} from '@/types';

// ─── Token storage (shared with userStore) ────────────────────────────────────
const storage = new MMKV({ id: 'user-storage' });
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? 'http://localhost:3000/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Trips
export interface CreateTripPayload {
  destination: string;
  startDate: string;
  endDate: string;
  budgetAmount: number;
  budgetCurrency: string;
  tripType: TripType;
  travelPace: TravelPace;
  interests: string[];
  dietary: string[];
}

export interface GenerateItineraryPayload {
  tripId: string;
}

export interface GenerationStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string | null;
  tripId: string | null;
}

// Venues
export interface Venue {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  priceLevel: number | null;
  photos: string[];
  openingHours: string[] | null;
  website: string | null;
  phone: string | null;
  description: string | null;
  trendScore: number | null;
}

// Food
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number | null;
  address: string;
  lat: number | null;
  lng: number | null;
  photos: string[];
  mustTryDish: string | null;
  isHalal: boolean;
  isVegan: boolean;
}

// Transport
export interface TransportRoute {
  id: string;
  type: string;
  from: string;
  to: string;
  departureTime: string | null;
  arrivalTime: string | null;
  duration: number | null;
  price: number | null;
  currency: string | null;
  provider: string | null;
  bookingUrl: string | null;
}

// Translator
export interface TranslationResult {
  originalText: string;
  translatedText: string;
  targetLanguage: string;
  romanization: string | null;
  pronunciation: string | null;
  alternatives: string[];
}

export interface Phrase {
  id: string;
  category: string;
  text: string;
  translation: string;
  romanization: string | null;
  audioUrl: string | null;
}

// Social
export interface SocialPost {
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

// Budget / Expenses
export interface CreateExpensePayload {
  tripId: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  receiptUrl?: string;
}

// User
export interface UpdateProfilePayload {
  displayName?: string;
  avatarUrl?: string;
  preferredCurrency?: string;
  preferredLanguage?: string;
}

// Subscription
export interface SubscribePayload {
  productId: string;
  provider: 'stripe';
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

// AI Assistant
export interface SendMessagePayload {
  conversationId?: string;
  message: string;
  tripId?: string;
  context?: Record<string, unknown>;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AssistantConversation {
  id: string;
  title: string | null;
  messages: AssistantMessage[];
  createdAt: string;
  updatedAt: string;
}

// IAP verify
export interface VerifyIapPayload {
  platform: 'ios' | 'android';
  productId: string;
  receiptData: string;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (_client) return _client;

  _client = axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // ── Request interceptor: inject JWT ────────────────────────────────────────
  _client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = storage.getString(TOKEN_KEY);
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // ── Response interceptor: normalise errors + token refresh ─────────────────
  _client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Attempt token refresh on 401
      if (
        error.response?.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        const refreshToken = storage.getString(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          try {
            const res = await axios.post<{ accessToken: string; refreshToken: string }>(
              `${BASE_URL}/auth/refresh`,
              { refreshToken },
            );
            const { accessToken, refreshToken: newRefresh } = res.data;
            storage.set(TOKEN_KEY, accessToken);
            storage.set(REFRESH_TOKEN_KEY, newRefresh);
            originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
            return _client!(originalRequest);
          } catch {
            // Refresh failed — clear tokens
            storage.delete(TOKEN_KEY);
            storage.delete(REFRESH_TOKEN_KEY);
          }
        }
      }

      const apiError: ApiError = {
        message:
          error.response?.data?.message ??
          error.message ??
          'An unexpected error occurred',
        statusCode: error.response?.status ?? 0,
        error: error.response?.data?.error,
      };
      return Promise.reject(apiError);
    },
  );

  return _client;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await getClient().get<T>(url, config);
  return res.data;
}

async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await getClient().post<T>(url, data, config);
  return res.data;
}

async function patch<T>(url: string, data?: unknown): Promise<T> {
  const res = await getClient().patch<T>(url, data);
  return res.data;
}

async function del<T>(url: string): Promise<T> {
  const res = await getClient().delete<T>(url);
  return res.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIPS
// ─────────────────────────────────────────────────────────────────────────────

export const tripsApi = {
  list: (): Promise<Trip[]> =>
    get('/trips'),

  create: (payload: CreateTripPayload): Promise<Trip> =>
    post('/trips', payload),

  get: (tripId: string): Promise<Trip> =>
    get(`/trips/${tripId}`),

  update: (tripId: string, updates: Partial<CreateTripPayload>): Promise<Trip> =>
    patch(`/trips/${tripId}`, updates),

  delete: (tripId: string): Promise<void> =>
    del(`/trips/${tripId}`),

  generate: (tripId: string): Promise<GenerationStatus> =>
    post(`/trips/${tripId}/generate`),

  generationStatus: (tripId: string, jobId: string): Promise<GenerationStatus> =>
    get(`/trips/${tripId}/generate/status?jobId=${jobId}`),

  regenerateDay: (tripId: string, dayId: string): Promise<GenerationStatus> =>
    post(`/trips/${tripId}/days/${dayId}/regenerate`),

  createShareToken: (tripId: string): Promise<{ token: string; url: string }> =>
    post(`/trips/${tripId}/share`),

  getByShareToken: (token: string): Promise<Trip> =>
    get(`/trips/shared/${token}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// ITINERARY (days + tasks)
// ─────────────────────────────────────────────────────────────────────────────

export const itineraryApi = {
  getDays: (tripId: string): Promise<ItineraryDay[]> =>
    get(`/trips/${tripId}/days`),

  getDay: (tripId: string, dayId: string): Promise<ItineraryDay> =>
    get(`/trips/${tripId}/days/${dayId}`),

  getTasks: (tripId: string, dayId: string): Promise<Task[]> =>
    get(`/trips/${tripId}/days/${dayId}/tasks`),

  createTask: (tripId: string, dayId: string, task: Partial<Task>): Promise<Task> =>
    post(`/trips/${tripId}/days/${dayId}/tasks`, task),

  updateTask: (tripId: string, dayId: string, taskId: string, updates: Partial<Task>): Promise<Task> =>
    patch(`/trips/${tripId}/days/${dayId}/tasks/${taskId}`, updates),

  deleteTask: (tripId: string, dayId: string, taskId: string): Promise<void> =>
    del(`/trips/${tripId}/days/${dayId}/tasks/${taskId}`),

  reorderTasks: (tripId: string, dayId: string, orderedTaskIds: string[]): Promise<void> =>
    post(`/trips/${tripId}/days/${dayId}/tasks/reorder`, { orderedTaskIds }),

  completeTask: (tripId: string, dayId: string, taskId: string): Promise<Task> =>
    post(`/trips/${tripId}/days/${dayId}/tasks/${taskId}/complete`),
};

// ─────────────────────────────────────────────────────────────────────────────
// VENUES
// ─────────────────────────────────────────────────────────────────────────────

export const venuesApi = {
  search: (params: {
    destination: string;
    category?: string;
    lat?: number;
    lng?: number;
    limit?: number;
  }): Promise<Venue[]> =>
    get('/venues', { params }),

  get: (venueId: string): Promise<Venue> =>
    get(`/venues/${venueId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// FOOD & DINING
// ─────────────────────────────────────────────────────────────────────────────

export const foodApi = {
  search: (params: {
    destination: string;
    cuisine?: string;
    dietary?: string[];
    lat?: number;
    lng?: number;
    limit?: number;
  }): Promise<Restaurant[]> =>
    get('/food', { params }),

  get: (restaurantId: string): Promise<Restaurant> =>
    get(`/food/${restaurantId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT
// ─────────────────────────────────────────────────────────────────────────────

export const transportApi = {
  search: (params: {
    from: string;
    to: string;
    date?: string;
    type?: string;
  }): Promise<TransportRoute[]> =>
    get('/transport', { params }),

  getPass: (destination: string): Promise<{
    passes: Array<{ name: string; price: number; currency: string; description: string; url: string }>;
  }> =>
    get(`/transport/passes/${encodeURIComponent(destination)}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATOR
// ─────────────────────────────────────────────────────────────────────────────

export const translatorApi = {
  translate: (text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult> =>
    post('/translator/translate', { text, targetLanguage, sourceLanguage }),

  phrasebook: (language: string, category?: string): Promise<Phrase[]> =>
    get('/translator/phrases', { params: { language, category } }),

  detectLanguage: (text: string): Promise<{ language: string; confidence: number }> =>
    post('/translator/detect', { text }),
};

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL INTELLIGENCE
// ─────────────────────────────────────────────────────────────────────────────

export const socialApi = {
  getFeed: (destination: string, params?: { limit?: number; platform?: string }): Promise<SocialPost[]> =>
    get('/social/feed', { params: { destination, ...params } }),

  getTrending: (params?: { limit?: number }): Promise<Array<{
    city: string;
    country: string;
    trendScore: number;
    postCount: number;
    topTag: string;
  }>> =>
    get('/social/trending', { params }),

  getPostsByDestination: (destination: string): Promise<SocialPost[]> =>
    get(`/social/posts/${encodeURIComponent(destination)}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET & EXPENSES
// ─────────────────────────────────────────────────────────────────────────────

export const budgetApi = {
  get: (tripId: string): Promise<Budget> =>
    get(`/budget/${tripId}`),

  getExpenses: (tripId: string): Promise<Expense[]> =>
    get(`/budget/${tripId}/expenses`),

  createExpense: (payload: CreateExpensePayload): Promise<Expense> =>
    post(`/budget/${payload.tripId}/expenses`, payload),

  updateExpense: (tripId: string, expenseId: string, updates: Partial<CreateExpensePayload>): Promise<Expense> =>
    patch(`/budget/${tripId}/expenses/${expenseId}`, updates),

  deleteExpense: (tripId: string, expenseId: string): Promise<void> =>
    del(`/budget/${tripId}/expenses/${expenseId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────

export const userApi = {
  getProfile: (): Promise<User> =>
    get('/user/profile'),

  updateProfile: (updates: UpdateProfilePayload): Promise<User> =>
    patch('/user/profile', updates),

  deleteAccount: (): Promise<void> =>
    del('/user/account'),

  uploadAvatar: (formData: FormData): Promise<{ avatarUrl: string }> =>
    post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateTheme: (theme: string): Promise<void> =>
    patch('/user/theme', { theme }),

  getAchievements: (): Promise<Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string | null;
  }>> =>
    get('/user/achievements'),
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptionApi = {
  getPlans: (): Promise<Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string | null;
    features: string[];
  }>> =>
    get('/subscriptions/plans'),

  getStatus: (): Promise<Subscription | null> =>
    get('/subscriptions/status'),

  createCheckout: (payload: SubscribePayload): Promise<CheckoutSession> =>
    post('/subscriptions/checkout', payload),

  cancel: (): Promise<void> =>
    post('/subscriptions/cancel'),

  getPortal: (): Promise<{ url: string }> =>
    post('/subscriptions/portal'),

  verifyIap: (payload: VerifyIapPayload): Promise<{ success: boolean; tier: string }> =>
    post('/subscriptions/verify-iap', payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// AI ASSISTANT
// ─────────────────────────────────────────────────────────────────────────────

export const aiAssistantApi = {
  sendMessage: (payload: SendMessagePayload): Promise<{
    message: AssistantMessage;
    conversationId: string;
  }> =>
    post('/ai-assistant/message', payload),

  getConversations: (): Promise<AssistantConversation[]> =>
    get('/ai-assistant/conversations'),

  getConversation: (conversationId: string): Promise<AssistantConversation> =>
    get(`/ai-assistant/conversations/${conversationId}`),

  deleteConversation: (conversationId: string): Promise<void> =>
    del(`/ai-assistant/conversations/${conversationId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE RE-EXPORT — generate itinerary (used by TripCreatorScreen)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateItinerary(tripId: string): Promise<GenerationStatus> {
  return tripsApi.generate(tripId);
}

export default {
  trips: tripsApi,
  itinerary: itineraryApi,
  venues: venuesApi,
  food: foodApi,
  transport: transportApi,
  translator: translatorApi,
  social: socialApi,
  budget: budgetApi,
  user: userApi,
  subscription: subscriptionApi,
  aiAssistant: aiAssistantApi,
};
