/**
 * api.js — Centralised Enterprise REST API Client
 * 
 * Implements standard, professional RESTful HTTP methods (GET, POST, PUT, DELETE).
 * Displays clean endpoint names, methods, and status codes in Chrome DevTools Network inspector.
 */

import { decryptTransportPayload, decryptClientData } from '../utils/crypto';

const API_BASE_URL = 'http://localhost:5000/api';

// ─── In-Memory Response Cache (30s TTL) for instant navigation ─────────────────
const _cache = new Map();
const CACHE_TTL = 30_000; // 30 seconds

const CACHEABLE_ENDPOINTS = new Set([
  '/projects',
  '/members',
  '/tasks',
  '/users',
  '/stats',
  '/analytics/summary',
  '/activity',
  '/categories',
  '/system/names',
  '/system/health'
]);

function getCacheKey(url) {
  return url.replace(API_BASE_URL, '').split('?')[0];
}

function isCacheable(url) {
  const key = getCacheKey(url);
  return CACHEABLE_ENDPOINTS.has(key);
}

function getFromCache(url) {
  const key = url.replace(API_BASE_URL, '');
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(url, data) {
  const key = url.replace(API_BASE_URL, '');
  _cache.set(key, { data, ts: Date.now() });
}

function invalidateCache(...patterns) {
  if (patterns.length === 0) {
    _cache.clear();
    return;
  }
  for (const [key] of _cache) {
    if (patterns.some(p => key.includes(p))) {
      _cache.delete(key);
    }
  }
}

// ─── Auth Headers Helper ───────────────────────────────────────────────────────
function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  try {
    const rawToken = localStorage.getItem('projectation_token');
    if (rawToken) {
      let token = rawToken;
      try {
        const dec = decryptClientData(rawToken);
        if (dec) token = dec;
      } catch {}
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage decryption errors
  }
  return headers;
}

// ─── Universal REST Request Handler ───────────────────────────────────────────
async function request(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  // Instant response from cache for eligible GET requests
  if (method === 'GET' && isCacheable(url)) {
    const cached = getFromCache(url);
    if (cached !== null) {
      // Background silent revalidation (fire-and-forget)
      _backgroundRefresh(url, options);
      return cached;
    }
  }

  const headers = getAuthHeaders();
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const fetchOptions = {
    method,
    headers
  };

  if (options.body !== undefined && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const retries = options.retries ?? (method === 'GET' ? 2 : 0);
  const retryDelay = options.retryDelay ?? 600;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, retryDelay * attempt));
    }

    let res;
    try {
      res = await fetch(url, fetchOptions);
    } catch (networkErr) {
      lastError = new Error('Network connection failed. Ensure backend server is running on port 5000.');
      if (attempt < retries) continue;
      throw lastError;
    }

    let data = await res.json().catch(() => ({}));

    // Support legacy encrypted envelopes gracefully if ever received
    if (data && data._encrypted && data.payload) {
      try {
        data = decryptTransportPayload(data.payload);
      } catch {
        // Fallback to raw data
      }
    }

    if (!res.ok) {
      const message = data?.error || `Request failed (${res.status})`;
      if (res.status >= 500 && attempt < retries) {
        lastError = new Error(message);
        continue;
      }
      throw new Error(message);
    }

    if (method === 'GET' && isCacheable(url)) {
      setCache(url, data);
    }

    return data;
  }

  throw lastError || new Error('Request failed after retries');
}

// Background refresh: silently update cache without blocking UI
async function _backgroundRefresh(url, options = {}) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) return;
    let data = await res.json().catch(() => null);
    if (!data) return;
    if (data._encrypted && data.payload) {
      try { data = decryptTransportPayload(data.payload); } catch { return; }
    }
    setCache(url, data);
  } catch {
    // Silent background refresh failure
  }
}

// ─── API Surface ───────────────────────────────────────────────────────────────

export const api = {
  // ── 1. System Telemetry & Fast Handshakes ──
  async ping() {
    return request(`${API_BASE_URL}/system/ping`);
  },

  async getHealth() {
    return request(`${API_BASE_URL}/system/health`);
  },

  // ── 2. Auth & Session ──
  async login(username, password, targetRole = 'admin') {
    const res = await request(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: { username, password, targetRole }
    });
    if (res.success === false && res.error) {
      throw new Error(res.error);
    }
    return res;
  },

  async verifyToken(token) {
    const activeToken = token || (() => {
      try {
        const raw = localStorage.getItem('projectation_token');
        return raw ? (decryptClientData(raw) || raw) : null;
      } catch { return null; }
    })();
    return request(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      body: { token: activeToken }
    });
  },

  async getProfile() {
    return request(`${API_BASE_URL}/auth/profile`, { method: 'POST' });
  },

  // ── 3. Stats & Analytics ──
  async getStats() {
    return request(`${API_BASE_URL}/stats`);
  },

  async getAnalyticsSummary() {
    return request(`${API_BASE_URL}/analytics/summary`);
  },

  // ── 4. Projects ──
  async getProjects() {
    return request(`${API_BASE_URL}/projects`);
  },

  async getProject(id) {
    return request(`${API_BASE_URL}/projects/${id}`);
  },

  async createProject(projectData) {
    const result = await request(`${API_BASE_URL}/projects`, {
      method: 'POST',
      body: projectData
    });
    invalidateCache('projects', 'stats', 'analytics', 'names');
    return result;
  },

  async updateProject(id, updateData) {
    const result = await request(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      body: { id, ...updateData }
    });
    invalidateCache('projects', 'stats', 'analytics');
    return result;
  },

  async deleteProject(id) {
    const result = await request(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE'
    });
    invalidateCache('projects', 'stats', 'analytics', 'members', 'tasks', 'activity', 'names');
    return result;
  },

  // ── 5. Members ──
  async getAllMembers() {
    return request(`${API_BASE_URL}/members`);
  },

  async addMember(projectId, memberData) {
    const result = await request(`${API_BASE_URL}/members`, {
      method: 'POST',
      body: { ...memberData, project_id: projectId }
    });
    invalidateCache('members', 'names');
    return result;
  },

  async createMember(memberData) {
    const result = await request(`${API_BASE_URL}/members`, {
      method: 'POST',
      body: memberData
    });
    invalidateCache('members', 'names');
    return result;
  },

  async updateMember(memberId, updateData) {
    const result = await request(`${API_BASE_URL}/members/${memberId}`, {
      method: 'PUT',
      body: { id: memberId, ...updateData }
    });
    invalidateCache('members', 'names');
    return result;
  },

  async deleteMember(memberId) {
    const result = await request(`${API_BASE_URL}/members/${memberId}`, {
      method: 'DELETE'
    });
    invalidateCache('members', 'names');
    return result;
  },

  // ── 6. Tasks ──
  async getAllTasks() {
    return request(`${API_BASE_URL}/tasks`);
  },

  async addTask(projectId, taskData) {
    const result = await request(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      body: { ...taskData, project_id: projectId }
    });
    invalidateCache('tasks', 'stats', 'activity', 'names');
    return result;
  },

  async createTask(taskData) {
    const result = await request(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      body: taskData
    });
    invalidateCache('tasks', 'stats', 'activity', 'names');
    return result;
  },

  async updateTask(taskId, taskData) {
    const result = await request(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      body: { id: taskId, ...taskData }
    });
    invalidateCache('tasks', 'stats');
    return result;
  },

  async updateTaskStatus(taskId, status) {
    const result = await request(`${API_BASE_URL}/tasks/status`, {
      method: 'POST',
      body: { id: taskId, status }
    });
    invalidateCache('tasks', 'stats');
    return result;
  },

  async deleteTask(taskId) {
    const result = await request(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE'
    });
    invalidateCache('tasks', 'stats', 'activity');
    return result;
  },

  // ── 7. Activity Audit Stream ──
  async getActivity(projectId = null, limit = 20) {
    const params = new URLSearchParams();
    if (projectId) params.set('project_id', projectId);
    if (limit) params.set('limit', limit);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`${API_BASE_URL}/activity${qs}`);
  },

  async logActivity(projectId, action, user = 'Admin') {
    return request(`${API_BASE_URL}/activity/log`, {
      method: 'POST',
      body: { project_id: projectId, action, user }
    });
  },

  // ── 8. Notifications ──
  async getNotifications() {
    return request(`${API_BASE_URL}/notifications`);
  },

  // ── 9. Categories ──
  async getCategories() {
    return request(`${API_BASE_URL}/categories`);
  },

  // ── 10. User Management & User Portal ──
  async getUsers() {
    return request(`${API_BASE_URL}/users`);
  },

  async createUser(userData) {
    const result = await request(`${API_BASE_URL}/users`, {
      method: 'POST',
      body: userData
    });
    invalidateCache('users', 'names');
    return result;
  },

  async updateUser(userData) {
    const result = await request(`${API_BASE_URL}/users/${userData.id}`, {
      method: 'PUT',
      body: userData
    });
    invalidateCache('users', 'names');
    return result;
  },

  async deleteUser(id) {
    const result = await request(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE'
    });
    invalidateCache('users', 'names');
    return result;
  },

  async getMyProjects(userName, userEmail, username) {
    const params = new URLSearchParams({
      userName: userName || '',
      userEmail: userEmail || '',
      username: username || ''
    });
    return request(`${API_BASE_URL}/users/my-projects?${params.toString()}`);
  },

  // ── 11. Central Enterprise Names Directory API ──
  async getAllNames() {
    return request(`${API_BASE_URL}/system/names`);
  },

  // ── 12. Lightweight Workspace Stream ──
  async syncWorkspaceStream() {
    return Promise.resolve([]);
  }
};

// Global Helper for Browser Console Inspection
if (typeof window !== 'undefined') {
  window.api = api;
}
