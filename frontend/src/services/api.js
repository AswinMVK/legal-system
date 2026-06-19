import axios from "axios";

// Express API (main CRUD)
export const expressAPI = axios.create({
  baseURL: process.env.REACT_APP_EXPRESS_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Flask API (AI / prioritization)
export const flaskAPI = axios.create({
  baseURL: process.env.REACT_APP_FLASK_API_URL || "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request automatically
[expressAPI, flaskAPI].forEach((instance) => {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("legal_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("legal_token");
        localStorage.removeItem("legal_user");
        window.location.href = "/login";
      }
      return Promise.reject(err);
    },
  );
});

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => expressAPI.post("/auth/login", data),
  register: (data) => expressAPI.post("/auth/register", data),
};

// ─── Cases ───────────────────────────────────────────────────
export const casesAPI = {
  getAll: (params) => expressAPI.get("/cases", { params }),
  getById: (id) => expressAPI.get(`/cases/${id}`),
  create: (data) => expressAPI.post("/cases", data),
  update: (id, d) => expressAPI.put(`/cases/${id}`, d),
  delete: (id) => expressAPI.delete(`/cases/${id}`),
  getStats: () => expressAPI.get("/cases/stats/summary"),

  addPerson: (id, d) => expressAPI.post(`/cases/${id}/persons`, d),
  getPersons: (id) => expressAPI.get(`/cases/${id}/persons`),
  removePerson: (id, pid) => expressAPI.delete(`/cases/${id}/persons/${pid}`),

  addSection: (id, d) => expressAPI.post(`/cases/${id}/sections`, d),
  removeSection: (id, sid) => expressAPI.delete(`/cases/${id}/sections/${sid}`),

  assignAdvocate: (id, d) => expressAPI.post(`/cases/${id}/advocates`, d),
  removeAdvocate: (id, aid) =>
    expressAPI.delete(`/cases/${id}/advocates/${aid}`),

  scheduleHearing: (id, d) => expressAPI.post(`/cases/${id}/schedule`, d),
  addHearing: (id, d) => expressAPI.post(`/cases/${id}/hearings`, d),
  getHearings: (id) => expressAPI.get(`/cases/${id}/hearings`),

  addJudgment: (id, d) => expressAPI.post(`/cases/${id}/judgment`, d),
  getEvents: (id) => expressAPI.get(`/cases/${id}/events`),
  addDetention: (id, d) => expressAPI.post(`/cases/${id}/detention`, d),
};

// ─── Persons ─────────────────────────────────────────────────
export const personsAPI = {
  update: (id, d) => expressAPI.put(`/persons/${id}`, d),
  delete: (id) => expressAPI.delete(`/persons/${id}`),
  submitStatus: (id, formData) =>
    expressAPI.post(`/persons/${id}/status`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getStatusHistory: (id) => expressAPI.get(`/persons/${id}/status-history`),
  getPendingUpdates: () => expressAPI.get("/persons/status-updates/pending"),
  verifyStatusUpdate: (updateId, data) =>
    expressAPI.put(`/persons/status-updates/${updateId}/verify`, data),
};

// ─── Advocates ───────────────────────────────────────────────
export const advocatesAPI = {
  getAll: (params) => expressAPI.get("/advocates", { params }),
  getById: (id) => expressAPI.get(`/advocates/${id}`),
  create: (data) => expressAPI.post("/advocates", data),
  update: (id, d) => expressAPI.put(`/advocates/${id}`, d),
};

// ─── Judges ──────────────────────────────────────────────────
export const judgesAPI = {
  getAll: () => expressAPI.get("/judges"),
  getById: (id) => expressAPI.get(`/judges/${id}`),
  getCases: (id, p) => expressAPI.get(`/judges/${id}/cases`, { params: p }),
  getSchedule: (id, p) =>
    expressAPI.get(`/judges/${id}/schedule`, { params: p }),
  assignCase: (id, d) => expressAPI.put(`/judges/${id}/assign-case`, d),
};

// ─── Courts ──────────────────────────────────────────────────
export const courtsAPI = {
  getAll: () => expressAPI.get("/courts"),
  getById: (id) => expressAPI.get(`/courts/${id}`),
  create: (data) => expressAPI.post("/courts", data),
  update: (id, d) => expressAPI.put(`/courts/${id}`, d),
};

// ─── Users ───────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => expressAPI.get("/users"),
  getById: (id) => expressAPI.get(`/users/${id}`),
  update: (id, d) => expressAPI.put(`/users/${id}`, d),
  delete: (id) => expressAPI.delete(`/users/${id}`),
  getLegalSections: (params) =>
    expressAPI.get("/users/legal-sections/all", { params }),
};

// ─── Hearings ────────────────────────────────────────────────
export const hearingsAPI = {
  getSchedule: (judgeId, p) =>
    expressAPI.get(`/hearings/schedule/${judgeId}`, { params: p }),
  getToday: (judgeId) => expressAPI.get(`/hearings/today/${judgeId}`),
  update: (id, d) => expressAPI.put(`/hearings/${id}`, d),
  reschedule: (schedId, d) =>
    expressAPI.post(`/hearings/${schedId}/reschedule`, d),
};

// ─── Priority (Flask) ─────────────────────────────────────────
export const priorityAPI = {
  getCases: (params) => flaskAPI.get("/priority/cases", { params }),
  getByCase: (id) => flaskAPI.get(`/priority/case/${id}`),
  analyzeText: (data) => flaskAPI.post("/nlp/analyze", data),
  generateSummary: (data) => flaskAPI.post("/nlp/generate-summary", data),
  recommendSections: (data) => flaskAPI.post("/nlp/recommend-sections", data),
  getStats: () => flaskAPI.get("/stats/overview"),
};

// ─── Advocate (self-service) ──────────────────────────────────
export const advocateAPI = {
  getMyCases: () => expressAPI.get("/advocates/me/cases"),
  getMyVictims: () => expressAPI.get("/advocates/me/victims"),
  getMyRequests: () => expressAPI.get("/advocates/me/requests"),
  updateVictimNotes: (personId, data) =>
    expressAPI.put(`/advocates/me/victims/${personId}/notes`, data),
  submitVictimRequest: (personId, data) =>
    expressAPI.post(`/advocates/me/victims/${personId}/requests`, data),
};

// ─── AI Chat (Flask → Ollama) ────────────────────────────────
export const chatAPI = {
  send: (payload) => flaskAPI.post("/chat", payload),
};

// ─── Blockchain ───────────────────────────────────────────────
export const blockchainAPI = {
  getChain: () => expressAPI.get("/blockchain/chain"),
  verify: () => expressAPI.get("/blockchain/verify"),
  getLogs: (limit) => expressAPI.get("/blockchain/logs", { params: { limit } }),
  getCaseLogs: (caseId) => expressAPI.get(`/blockchain/logs/${caseId}`),
  getPending: () => expressAPI.get("/blockchain/pending"),
  transact: (data) => expressAPI.post("/blockchain/transact", data),
  getConfig: () => expressAPI.get("/blockchain/config"),
  getStats: () => expressAPI.get("/blockchain/stats"),
};
