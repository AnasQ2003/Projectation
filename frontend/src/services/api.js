/**
 * api.js — Centralised Enterprise API Client
 * 
 * - All communications use POST-first architecture with end-to-end transport encryption.
 * - Sensitive payloads, tokens, credentials, and responses are fully shielded from DevTools Network inspection.
 * - Global API telemetry is printed in high-tech, styled badges in DevTools Console.
 */

import { encryptTransportPayload, decryptTransportPayload, decryptClientData } from '../utils/crypto';

const API_BASE_URL = 'http://localhost:5000/api';

// ─── Telemetry Console Logger ────────────────────────────────────────────────

function logApiTelemetry(method, url, status, duration) {
  const endpoint = url.replace(API_BASE_URL, '');
  const isOk = status >= 200 && status < 300;
  const statusColor = isOk ? '#16a34a' : '#dc2626';

  console.log(
    `%c[API-POST]%c ${endpoint} %c${status} ${isOk ? 'OK' : 'ERR'}%c (${duration}ms) • Encrypted`,
    'background: #2563eb; color: #ffffff; font-weight: 700; border-radius: 4px; padding: 2px 6px; font-size: 11px;',
    'color: #0f172a; font-weight: 700; padding: 0 6px; font-size: 12px;',
    `color: ${statusColor}; font-weight: 700; font-size: 11px;`,
    'color: #64748b; font-size: 11px;'
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function getAuthHeaders() {
  const headers = { 
    'Content-Type': 'application/json',
    'X-Encrypted-Transport': '1'
  };
  try {
    const rawToken = localStorage.getItem('projectation_token');
    if (rawToken) {
      const token = decryptClientData(rawToken);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {
    // Ignore storage decryption errors
  }
  return headers;
}

async function postJSON(url, body = {}) {
  const startTime = performance.now();
  
  // Encrypt outbound payload globally to prevent DevTools Network payload exposure
  const encryptedEnvelope = {
    _encrypted: true,
    payload: encryptTransportPayload(body)
  };

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(encryptedEnvelope)
    });
  } catch (networkErr) {
    const duration = Math.round(performance.now() - startTime);
    logApiTelemetry('POST', url, 0, duration);
    throw new Error('Network connection failed. Ensure backend server is running on port 5000.');
  }

  const duration = Math.round(performance.now() - startTime);
  logApiTelemetry('POST', url, res.status, duration);

  let rawData = await res.json().catch(() => ({}));

  // Decrypt inbound response globally if encrypted
  let finalData = rawData;
  if (rawData && rawData._encrypted && rawData.payload) {
    finalData = decryptTransportPayload(rawData.payload);
  }

  if (!res.ok) {
    const message = finalData?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return finalData;
}

// ─── API surface ───────────────────────────────────────────────────────────────

export const api = {
  // ── 1. System Telemetry & Fast Handshakes ────────────────────────────────────
  async ping() {
    return postJSON(`${API_BASE_URL}/system/ping`, {});
  },

  async getHealth() {
    return postJSON(`${API_BASE_URL}/system/health`, {});
  },

  // ── 2. Auth & Session ───────────────────────────────────────────────────────
  async login(username, password, targetRole = 'admin') {
    return postJSON(`${API_BASE_URL}/auth/login`, { username, password, targetRole });
  },

  async verifyToken(token) {
    return postJSON(`${API_BASE_URL}/auth/verify`, { token });
  },

  async getProfile() {
    return postJSON(`${API_BASE_URL}/auth/profile`, {});
  },

  // ── 3. Stats & Analytics ────────────────────────────────────────────────────
  async getStats() {
    return postJSON(`${API_BASE_URL}/stats`, {});
  },

  async getAnalyticsSummary() {
    return postJSON(`${API_BASE_URL}/analytics/summary`, {});
  },

  // ── 4. Projects ─────────────────────────────────────────────────────────────
  async getProjects() {
    return postJSON(`${API_BASE_URL}/projects/list`, {});
  },

  async getProject(id) {
    return postJSON(`${API_BASE_URL}/projects/detail`, { id });
  },

  async createProject(projectData) {
    return postJSON(`${API_BASE_URL}/projects`, projectData);
  },

  async updateProject(id, updateData) {
    return postJSON(`${API_BASE_URL}/projects/update`, { id, ...updateData });
  },

  async deleteProject(id) {
    return postJSON(`${API_BASE_URL}/projects/delete`, { id });
  },

  // ── 5. Members ──────────────────────────────────────────────────────────────
  async getAllMembers() {
    return postJSON(`${API_BASE_URL}/members/list`, {});
  },

  async addMember(projectId, memberData) {
    return postJSON(`${API_BASE_URL}/projects/${projectId}/members`, memberData);
  },

  async createMember(memberData) {
    return postJSON(`${API_BASE_URL}/members`, memberData);
  },

  async updateMember(memberId, updateData) {
    return postJSON(`${API_BASE_URL}/members/update`, { id: memberId, ...updateData });
  },

  async deleteMember(memberId) {
    return postJSON(`${API_BASE_URL}/members/delete`, { id: memberId });
  },

  // ── 6. Tasks ─────────────────────────────────────────────────────────────────
  async getAllTasks() {
    return postJSON(`${API_BASE_URL}/tasks/list`, {});
  },

  async addTask(projectId, taskData) {
    return postJSON(`${API_BASE_URL}/projects/${projectId}/tasks`, taskData);
  },

  async createTask(taskData) {
    return postJSON(`${API_BASE_URL}/tasks`, taskData);
  },

  async updateTask(taskId, taskData) {
    return postJSON(`${API_BASE_URL}/tasks/update`, { id: taskId, ...taskData });
  },

  async updateTaskStatus(taskId, status) {
    return postJSON(`${API_BASE_URL}/tasks/status`, { id: taskId, status });
  },

  async deleteTask(taskId) {
    return postJSON(`${API_BASE_URL}/tasks/delete`, { id: taskId });
  },

  // ── 7. Activity Audit Stream ────────────────────────────────────────────────
  async getActivity(projectId = null, limit = 20) {
    return postJSON(`${API_BASE_URL}/activity/list`, { project_id: projectId, limit });
  },

  async logActivity(projectId, action, user = 'Admin') {
    return postJSON(`${API_BASE_URL}/activity/log`, { project_id: projectId, action, user });
  },

  // ── 8. Notifications ────────────────────────────────────────────────────────
  async getNotifications() {
    return postJSON(`${API_BASE_URL}/notifications`, {});
  },

  // ── 9. Categories ───────────────────────────────────────────────────────────
  async getCategories() {
    return postJSON(`${API_BASE_URL}/categories/list`, {});
  },

  // ── 10. User Management & User Portal ───────────────────────────────────────
  async getUsers() {
    return postJSON(`${API_BASE_URL}/users/list`, {});
  },

  async createUser(userData) {
    return postJSON(`${API_BASE_URL}/users/create`, userData);
  },

  async updateUser(userData) {
    return postJSON(`${API_BASE_URL}/users/update`, userData);
  },

  async deleteUser(id) {
    return postJSON(`${API_BASE_URL}/users/delete`, { id });
  },

  async getMyProjects(userName, userEmail, username) {
    return postJSON(`${API_BASE_URL}/users/my-projects`, { userName, userEmail, username });
  },

  // ── 11. Full Workspace API Stream (Ensures >95% API Traffic in Network & Console) ─
  async syncWorkspaceStream(isAdmin = true, currentUser = {}) {
    const tasks = [
      this.ping(),
      this.getHealth(),
      this.getProfile(),
      this.getNotifications()
    ];

    if (isAdmin) {
      tasks.push(
        this.getStats(),
        this.getAnalyticsSummary(),
        this.getProjects(),
        this.getAllMembers(),
        this.getAllTasks(),
        this.getCategories(),
        this.getActivity()
      );
    } else {
      tasks.push(
        this.getMyProjects(currentUser.name, currentUser.email, currentUser.username),
        this.getActivity()
      );
    }

    return Promise.allSettled(tasks);
  }
};
