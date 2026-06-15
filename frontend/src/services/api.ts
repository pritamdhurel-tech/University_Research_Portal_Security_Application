import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// CORS FIX: Never point browser directly at backend in dev.
// '/api' goes through Vite proxy -> same-origin -> no CORS.
// VITE_API_URL is only read in production builds.
const BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || '/api')
  : 'http://localhost:8003/api';

// ─── Token Storage ─────────────────────────────────────────────────────────────
// Using memory for access tokens (more secure than localStorage)
// Refresh token in localStorage only (acceptable for long-lived token)

let accessToken: string | null = null;

export const tokenStore = {
  getAccess: () => accessToken,
  setAccess: (t: string | null) => { accessToken = t; },
  getRefresh: () => localStorage.getItem('rt'),
  setRefresh: (t: string | null) => {
    if (t) localStorage.setItem('rt', t);
    else localStorage.removeItem('rt');
  },
  clear: () => {
    accessToken = null;
    localStorage.removeItem('rt');
  },
};

// ─── Axios Instance ────────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — attach Bearer token ─────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor — handle 401 + token refresh ────────────────────────

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = tokenStore.getRefresh();
      if (!refreshToken) {
        tokenStore.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Deduplicate concurrent refresh calls
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${BASE_URL}/auth/refresh`, { refreshToken })
          .then((res) => {
            const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data.tokens;
            tokenStore.setAccess(newAccess);
            tokenStore.setRefresh(newRefresh);
            return newAccess;
          })
          .catch(() => {
            tokenStore.clear();
            window.location.href = '/login';
            return Promise.reject(new Error('Session expired'));
          })
          .finally(() => { refreshPromise = null; });
      }

      try {
        const newToken = await refreshPromise;
        if (original.headers) {
          original.headers['Authorization'] = `Bearer ${newToken}`;
        }
        return api(original);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth Endpoints ────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string; mfaToken?: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  setupPassword: (token: string, password: string) =>
    api.post('/admin/setup-password', { token, password }),

  requestPasswordReset: (email: string) =>
    api.post('/auth/password-reset/request', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/password-reset/confirm', { token, password }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// ─── MFA Endpoints ────────────────────────────────────────────────────────────

export const mfaApi = {
  setup: () => api.post('/mfa/setup'),
  verifySetup: (code: string) => api.post('/mfa/verify-setup', { token: code }),
  status: () => api.get('/mfa/status'),
  disable: (password: string, code: string) =>
    api.post('/mfa/disable', { password, token: code }),
  regenerateCodes: (password: string) =>
    api.post('/mfa/regenerate-codes', { password }),
};

// ─── Resources Endpoints ──────────────────────────────────────────────────────

export const resourcesApi = {
  list: (params?: Record<string, string>) =>
    api.get('/resources', { params }),
  get: (id: string) => api.get(`/resources/${id}`),
  create: (data: object) => api.post('/resources', data),
  update: (id: string, data: object) => api.put(`/resources/${id}`, data),
  delete: (id: string) => api.delete(`/resources/${id}`),
  checkAccess: (id: string, action: string) =>
    api.get(`/resources/${id}/check-access`, { params: { action } }),
};

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

export const adminApi = {
  createUser: (data: object) => api.post('/admin/users', data),
  approveUser: (id: string) => api.post(`/admin/users/${id}/approve`),
  getPendingUsers: () => api.get('/admin/users/pending'),
  getAuditLogs: (params?: Record<string, string>) =>
    api.get('/admin/audit-logs', { params }),
  getAccessLogs: (params?: Record<string, string>) =>
    api.get('/admin/access-logs', { params }),
};

export default api;
