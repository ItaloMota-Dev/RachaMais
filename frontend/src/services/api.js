import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  const { data } = await api.post('/users/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
};

export const register = async (userData) => {
  const { data } = await api.post('/users/register', userData);
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/users/me');
  return data;
};

// ── Groups ────────────────────────────────────────────────────────────────────

export const getGroups = async () => {
  const { data } = await api.get('/groups/');
  return data;
};

export const createGroup = async (groupData) => {
  const { data } = await api.post('/groups/', groupData);
  return data;
};

export const getGroupDashboard = async (groupId) => {
  const { data } = await api.get(`/groups/${groupId}/dashboard`);
  return data;
};

export const getGroupMembers = async (groupId) => {
  const { data } = await api.get(`/groups/${groupId}/members`);
  return data;
};

// ── Expenses ─────────────────────────────────────────────────────────────────

export const getExpensesByGroup = async (groupId) => {
  const { data } = await api.get(`/expenses/group/${groupId}`);
  return data;
};

export const createExpense = async (expenseData) => {
  const { data } = await api.post('/expenses/', expenseData);
  return data;
};

export const scanExpense = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  const { data } = await api.post('/expenses/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteExpense = async (expenseId) => {
  await api.delete(`/expenses/${expenseId}`);
};

// ── Settlements ───────────────────────────────────────────────────────────────

export const getSettlements = async () => {
  const { data } = await api.get('/settlements/');
  return data;
};

export const createSettlement = async (settlementData) => {
  const { data } = await api.post('/settlements/', settlementData);
  return data;
};

export const completeSettlement = async (settlementId) => {
  const { data } = await api.patch(`/settlements/${settlementId}/complete`);
  return data;
};

export default api;
