

import { encryptTransportPayload, decryptTransportPayload, decryptClientData } from '../utils/crypto';

const API_BASE_URL = 'http://localhost:5000/api';

// ─── In-Memory Response Cache (30s TTL) for instant navigation ─────────────────
const _cache = new Map();
const CACHE_TTL = 30_000;

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
  return CACHEABLE_ENDPOINTS.has(getCacheKey(url));
}

function getFromCache(url) {
  const key = url.replace(API_BASE_URL, '');
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.data;
}

function setCache(url, data) {
  _cache.set(url.replace(API_BASE_URL, ''), { data, ts: Date.now() });
}

function invalidateCache(...patterns) {
  if (patterns.length === 0) { _cache.clear(); return; }
  for (const [key] of _cache) {
    if (patterns.some(p => key.includes(p))) _cache.delete(key);
  }
}

// ─── Auth Headers ──────────────────────────────────────────────────────────────
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const raw = localStorage.getItem('projectation_token');
    if (raw) {
      let token = raw;
      try { const dec = decryptClientData(raw); if (dec) token = dec; } catch {}
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return headers;
}

// ─── Masked console log — never prints raw sensitive data ─────────────────────
const MASKED_KEYS = ['password', 'token', 'email', 'username', 'name', 'authorization'];

function safeSummary(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return `[Array(${data.length})]`;
  const keys = Object.keys(data);
  return `{${keys.map(k => MASKED_KEYS.some(m => k.toLowerCase().includes(m)) ? `${k}: [protected]` : `${k}: …`).join(', ')}}`;
}

// ─── Universal REST Request Handler ───────────────────────────────────────────
async function request(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const endpoint = url.replace(API_BASE_URL, '');
  const t0 = performance.now();

  // Serve from cache instantly for eligible GETs
  if (method === 'GET' && isCacheable(url)) {
    const cached = getFromCache(url);
    if (cached !== null) {
      console.log(`%c✓ ${method} ${endpoint} %c[CACHE] %c<1ms`, 'color:#2563eb;font-weight:700', 'color:#7c3aed;font-weight:600', 'color:#64748b');
      _backgroundRefresh(url);
      return cached;
    }
  }

  const headers = getAuthHeaders();
  if (options.headers) Object.assign(headers, options.headers);

  const fetchOptions = { method, headers };

  // Encrypt outbound body — DevTools Payload tab shows only ciphertext
  if (options.body !== undefined && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = JSON.stringify({
      _enc: true,
      data: encryptTransportPayload(options.body)
    });
  }

  const retries = options.retries ?? (method === 'GET' ? 2 : 0);
  const retryDelay = options.retryDelay ?? 600;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, retryDelay * attempt));
      console.warn(`%c↺ Retry #${attempt} — ${method} ${endpoint}`, 'color:#f59e0b;font-weight:600');
    }

    let res;
    try {
      res = await fetch(url, fetchOptions);
    } catch (netErr) {
      const ms = Math.round(performance.now() - t0);
      console.error(`%c✗ ${method} ${endpoint} %c[NETWORK ERROR] %c${ms}ms`, 'color:#ef4444;font-weight:700', 'color:#dc2626;font-weight:600', 'color:#64748b');
      lastError = new Error('Network connection failed. Ensure backend server is running on port 5000.');
      if (attempt < retries) continue;
      throw lastError;
    }

    let raw = await res.json().catch(() => ({}));
    const ms = Math.round(performance.now() - t0);

    // Decrypt inbound response envelope — backend wraps everything in {_enc, data}
    let data = raw;
    if (raw && (raw._enc || raw._encrypted)) {
      const cipher = raw.data || raw.payload;
      if (cipher) {
        try { data = decryptTransportPayload(cipher); } catch { data = raw; }
      }
    }

    if (!res.ok) {
      const message = data?.error || `Request failed (${res.status})`;
      console.error(`%c✗ ${method} ${endpoint} %c${res.status} %c${ms}ms`, 'color:#ef4444;font-weight:700', 'color:#ea580c;font-weight:600', 'color:#64748b');
      if (res.status >= 500 && attempt < retries) { lastError = new Error(message); continue; }
      throw new Error(message);
    }

    // Safe console log — masked, never leaks sensitive fields
    console.log(
      `%c✓ ${method} ${endpoint} %c${res.status} %c${ms}ms %c${safeSummary(data)}`,
      'color:#2563eb;font-weight:700',
      'color:#16a34a;font-weight:600',
      'color:#64748b',
      'color:#94a3b8'
    );

    if (method === 'GET' && isCacheable(url)) setCache(url, data);
    return data;
  }

  throw lastError || new Error('Request failed after retries');
}

// Background refresh — silently updates cache
async function _backgroundRefresh(url) {
  try {
    const res = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    if (!res.ok) return;
    let raw = await res.json().catch(() => null);
    if (!raw) return;
    let data = raw;
    if (raw._enc || raw._encrypted) {
      const cipher = raw.data || raw.payload;
      if (cipher) { try { data = decryptTransportPayload(cipher); } catch { return; } }
    }
    setCache(url, data);
  } catch {}
}

// ─── API Surface ───────────────────────────────────────────────────────────────
export const api = {
  // ── 1. System ──
  async ping() { return request(`${API_BASE_URL}/system/ping`); },
  async getHealth() { return request(`${API_BASE_URL}/system/health`); },

  // ── 2. Auth & Session ──
  async login(username, password, targetRole = 'admin') {
    const res = await request(`${API_BASE_URL}/auth/login`, { method: 'POST', body: { username, password, targetRole } });
    if (res.success === false && res.error) throw new Error(res.error);
    return res;
  },
  async verifyToken(token) {
    const activeToken = token || (() => {
      try { const r = localStorage.getItem('projectation_token'); return r ? (decryptClientData(r) || r) : null; } catch { return null; }
    })();
    return request(`${API_BASE_URL}/auth/verify`, { method: 'POST', body: { token: activeToken } });
  },
  async getProfile() { return request(`${API_BASE_URL}/auth/profile`, { method: 'POST' }); },

  // ── 3. Stats & Analytics ──
  async getStats() { return request(`${API_BASE_URL}/stats`); },
  async getAnalyticsSummary() { return request(`${API_BASE_URL}/analytics/summary`); },

  // ── 4. Projects ──
  async getProjects() { return request(`${API_BASE_URL}/projects`); },
  async getProject(id) { return request(`${API_BASE_URL}/projects/${id}`); },
  async createProject(projectData) {
    const r = await request(`${API_BASE_URL}/projects`, { method: 'POST', body: projectData });
    invalidateCache('projects', 'stats', 'analytics', 'names'); return r;
  },
  async updateProject(id, updateData) {
    const r = await request(`${API_BASE_URL}/projects/${id}`, { method: 'PUT', body: { id, ...updateData } });
    invalidateCache('projects', 'stats', 'analytics'); return r;
  },
  async deleteProject(id) {
    const r = await request(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE' });
    invalidateCache('projects', 'stats', 'analytics', 'members', 'tasks', 'activity', 'names'); return r;
  },

  // ── 5. Members ──
  async getAllMembers() { return request(`${API_BASE_URL}/members`); },
  async addMember(projectId, memberData) {
    const r = await request(`${API_BASE_URL}/members`, { method: 'POST', body: { ...memberData, project_id: projectId } });
    invalidateCache('members', 'names'); return r;
  },
  async createMember(memberData) {
    const r = await request(`${API_BASE_URL}/members`, { method: 'POST', body: memberData });
    invalidateCache('members', 'names'); return r;
  },
  async updateMember(memberId, updateData) {
    const r = await request(`${API_BASE_URL}/members/${memberId}`, { method: 'PUT', body: { id: memberId, ...updateData } });
    invalidateCache('members', 'names'); return r;
  },
  async deleteMember(memberId) {
    const r = await request(`${API_BASE_URL}/members/${memberId}`, { method: 'DELETE' });
    invalidateCache('members', 'names'); return r;
  },

  // ── 6. Tasks ──
  async getAllTasks() { return request(`${API_BASE_URL}/tasks`); },
  async addTask(projectId, taskData) {
    const r = await request(`${API_BASE_URL}/tasks`, { method: 'POST', body: { ...taskData, project_id: projectId } });
    invalidateCache('tasks', 'stats', 'activity', 'names'); return r;
  },
  async createTask(taskData) {
    const r = await request(`${API_BASE_URL}/tasks`, { method: 'POST', body: taskData });
    invalidateCache('tasks', 'stats', 'activity', 'names'); return r;
  },
  async updateTask(taskId, taskData) {
    const r = await request(`${API_BASE_URL}/tasks/${taskId}`, { method: 'PUT', body: { id: taskId, ...taskData } });
    invalidateCache('tasks', 'stats'); return r;
  },
  async updateTaskStatus(taskId, status, progress_percent, progress_note, updated_by, completed_at = null) {
    const r = await request(`${API_BASE_URL}/tasks/status`, {
      method: 'POST',
      body: {
        id: taskId,
        status,
        progress_percent,
        progress_note,
        updated_by,
        completed_at
      }
    });
    invalidateCache('tasks', 'stats', 'activity', 'users'); return r;
  },
  async deleteTask(taskId) {
    const r = await request(`${API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE' });
    invalidateCache('tasks', 'stats', 'activity'); return r;
  },

  // ── 7. Activity ──
  async getActivity(projectId = null, limit = 20) {
    const params = new URLSearchParams();
    if (projectId) params.set('project_id', projectId);
    if (limit) params.set('limit', limit);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`${API_BASE_URL}/activity${qs}`);
  },
  async logActivity(projectId, action, user = 'Admin') {
    return request(`${API_BASE_URL}/activity/log`, { method: 'POST', body: { project_id: projectId, action, user } });
  },

  // ── 8. Notifications ──
  async getNotifications(role = 'Admin', userName = '') {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (userName) params.set('userName', userName);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`${API_BASE_URL}/notifications${qs}`);
  },
  async markNotificationRead(id = null, all = false, role = 'Admin', userName = '') {
    return request(`${API_BASE_URL}/notifications/read`, {
      method: 'POST',
      body: { id, all, role, userName }
    });
  },
  async clearNotifications(role = 'Admin') {
    return request(`${API_BASE_URL}/notifications/clear`, {
      method: 'POST',
      body: { role }
    });
  },

  // ── 9. Categories ──
  async getCategories() { return request(`${API_BASE_URL}/categories`); },

  // ── 10. User Management & User Progress ──
  async getUsers() { return request(`${API_BASE_URL}/users`); },
  async getUsersProgress() { return request(`${API_BASE_URL}/users/progress`); },
  async createUser(userData) {
    const r = await request(`${API_BASE_URL}/users`, { method: 'POST', body: userData });
    invalidateCache('users', 'names'); return r;
  },
  async updateUser(userData) {
    const r = await request(`${API_BASE_URL}/users/${userData.id}`, { method: 'PUT', body: userData });
    invalidateCache('users', 'names'); return r;
  },
  async deleteUser(id) {
    const r = await request(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
    invalidateCache('users', 'names'); return r;
  },
  async getMyProjects(userName, userEmail, username) {
    const params = new URLSearchParams({ userName: userName || '', userEmail: userEmail || '', username: username || '' });
    return request(`${API_BASE_URL}/users/my-projects?${params.toString()}`);
  },

  // ── 11. Names Directory ──
  async getAllNames() { return request(`${API_BASE_URL}/system/names`); },

  // ── 12. Workspace Stream ──
  async syncWorkspaceStream() { return Promise.resolve([]); }
};

// ─── Global DevTools Console Helpers ───────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.api = api;
  window.clearApiCache = () => { invalidateCache(); console.log('%c🗑 API cache cleared', 'color:#7c3aed;font-weight:700'); };

  console.log('%c Projectation API — Encrypted Transport Active', 'color:#2563eb;font-size:13px;font-weight:800');
  console.log('%c Backend: http://localhost:5000/api  |  All data encrypted in-transit', 'color:#64748b;font-size:11px');
}
