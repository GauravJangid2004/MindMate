/**
 * MindMate API Client
 *
 * Centralised fetch wrapper that handles:
 *  - Base URL configuration
 *  - JWT token injection
 *  - Error normalisation
 *  - Response parsing
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Token helpers ──────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('mindmate_token');
}

export function setToken(token: string) {
  localStorage.setItem('mindmate_token', token);
}

export function clearToken() {
  localStorage.removeItem('mindmate_token');
}

// ─── Core fetch wrapper ─────────────────────────────────

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // If token is invalid/expired, clear it
    if (response.status === 401) {
      clearToken();
    }
    throw {
      status: response.status,
      message: data.message || 'Something went wrong',
      errors: data.errors,
    };
  }

  return data;
}

// ─── AUTH ────────────────────────────────────────────────

export const auth = {
  sendOTP: (phone: string) =>
    request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOTP: (phone: string, otp: string) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),

  register: (data: {
    phone: string;
    zkCommitment: string;
    anonymousHandle: string;
    userType: 'student' | 'elder';
    profile?: any;
  }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (phone: string, zkCommitment: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, zkCommitment }),
    }),

  getMe: () => request('/auth/me'),
};

// ─── USERS ──────────────────────────────────────────────

export const users = {
  getProfile: () => request('/users/me'),

  updateProfile: (updates: any) =>
    request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteAccount: () =>
    request('/users/me', {
      method: 'DELETE',
    }),

  listMentors: () => request('/users/mentors'),
};

// ─── CONNECTIONS ────────────────────────────────────────

export const connections = {
  sendRequest: (mentorId: string) =>
    request('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ mentorId }),
    }),

  getRequests: () => request('/connections/requests'),

  respondToRequest: (id: string, action: 'accept' | 'reject') =>
    request(`/connections/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
    }),

  getConnections: () => request('/connections/mine'),

  generateQR: () =>
    request('/connections/qr/generate', {
      method: 'POST',
    }),

  scanQR: (qrToken: string) =>
    request('/connections/qr/scan', {
      method: 'POST',
      body: JSON.stringify({ qrToken }),
    }),
};

// ─── CHAT ───────────────────────────────────────────────

export const chat = {
  getConversations: () => request('/chat/conversations'),

  getMessages: (conversationId: string, page = 1, limit = 50) =>
    request(
      `/chat/${conversationId}/messages?page=${page}&limit=${limit}`
    ),

  sendMessage: (
    conversationId: string,
    content: string,
    type: 'text' | 'voice' = 'text',
    voiceDuration = 0
  ) =>
    request(`/chat/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type, voiceDuration }),
    }),
};

// ─── DIARY ──────────────────────────────────────────────

export const diary = {
  getEntries: () => request('/diary'),

  createEntry: (content: string, mood: string) =>
    request('/diary', {
      method: 'POST',
      body: JSON.stringify({ content, mood }),
    }),

  deleteEntry: (id: string) =>
    request(`/diary/${id}`, {
      method: 'DELETE',
    }),

  getStudentDiary: (studentId: string) =>
    request(`/diary/student/${studentId}`),
};

// ─── MOOD ───────────────────────────────────────────────

export const mood = {
  logMood: (moodValue: number, note?: string) =>
    request('/mood', {
      method: 'POST',
      body: JSON.stringify({ moodValue, note }),
    }),

  getHistory: (days = 7) => request(`/mood?days=${days}`),

  getStats: () => request('/mood/stats'),
};

// ─── COMMUNITY ──────────────────────────────────────────

export const community = {
  getPosts: (page = 1) =>
    request(`/community/posts?page=${page}`),

  createPost: (title: string, content: string, category?: string) =>
    request('/community/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content, category }),
    }),

  toggleHeart: (postId: string) =>
    request(`/community/posts/${postId}/heart`, {
      method: 'POST',
    }),

  getEncouragement: () => request('/community/encouragement'),

  addEncouragement: (message: string) =>
    request('/community/encouragement', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};
