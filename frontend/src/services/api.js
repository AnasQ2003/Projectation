/**
 * api.js — Centralised API client
 * All data mutations use POST (no PUT or DELETE verbs).
 */

const API_BASE_URL = 'http://localhost:5000/api';

// ─── Shared helpers ────────────────────────────────────────────────────────────

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── API surface ───────────────────────────────────────────────────────────────

export const api = {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  async login(username, password) {
    return postJSON(`${API_BASE_URL}/auth/login`, { username, password });
  },

  // ── Stats ────────────────────────────────────────────────────────────────────
  async getStats() {
    return postJSON(`${API_BASE_URL}/stats`, {});
  },

  // ── Projects ─────────────────────────────────────────────────────────────────
  async getProjects() {
    return postJSON(`${API_BASE_URL}/projects/list`, {});
  },

  async getProject(id) {
    return postJSON(`${API_BASE_URL}/projects/detail`, { id });
  },

  async createProject(projectData) {
    return postJSON(`${API_BASE_URL}/projects`, projectData);
  },

  /** POST /api/projects/update  (id + fields in body) */
  async updateProject(id, updateData) {
    return postJSON(`${API_BASE_URL}/projects/update`, { id, ...updateData });
  },

  /** POST /api/projects/delete  (id in body) */
  async deleteProject(id) {
    return postJSON(`${API_BASE_URL}/projects/delete`, { id });
  },

  // ── Members ──────────────────────────────────────────────────────────────────
  async getAllMembers() {
    return postJSON(`${API_BASE_URL}/members/list`, {});
  },

  async addMember(projectId, memberData) {
    return postJSON(`${API_BASE_URL}/projects/${projectId}/members`, memberData);
  },

  async createMember(memberData) {
    return postJSON(`${API_BASE_URL}/members`, memberData);
  },

  /** POST /api/members/update (id + fields in body) */
  async updateMember(memberId, updateData) {
    return postJSON(`${API_BASE_URL}/members/update`, { id: memberId, ...updateData });
  },

  /** POST /api/members/delete  (id in body) */
  async deleteMember(memberId) {
    return postJSON(`${API_BASE_URL}/members/delete`, { id: memberId });
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────────
  async getAllTasks() {
    return postJSON(`${API_BASE_URL}/tasks/list`, {});
  },

  async addTask(projectId, taskData) {
    return postJSON(`${API_BASE_URL}/projects/${projectId}/tasks`, taskData);
  },

  async createTask(taskData) {
    return postJSON(`${API_BASE_URL}/tasks`, taskData);
  },

  /** POST /api/tasks/update  (id + fields in body) */
  async updateTask(taskId, taskData) {
    return postJSON(`${API_BASE_URL}/tasks/update`, { id: taskId, ...taskData });
  },

  /** POST /api/tasks/delete  (id in body) */
  async deleteTask(taskId) {
    return postJSON(`${API_BASE_URL}/tasks/delete`, { id: taskId });
  }
};
