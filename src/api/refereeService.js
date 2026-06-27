import { api } from '../services/api';

// ===== Dashboard =====
export const getRefereeDashboard = () => api.get('/referee/dashboard');

// ===== Vi phạm =====
export const getAllViolations = () => api.get('/referee/violations');
export const getRaceViolations = (raceId) => api.get(`/referee/races/${raceId}/violations`);
export const updateViolation = (id, data) => api.put(`/referee/violations/${id}`, data);
export const logViolation = (body) => api.post('/referee/violations', body);

// ===== Báo cáo =====
export const getRaceReports = (raceId) => api.get(`/referee/races/${raceId}/reports`);
export const submitReport = (body) => api.post('/referee/reports', body);

// ===== Kết quả / Kiểm tra =====
export const getRaceResults = (raceId) => api.get(`/referee/races/${raceId}/results`);
export const getHorseChecks = (raceId) => api.get(`/referee/races/${raceId}/horse-checks`);
export const submitResult = (body) => api.post('/referee/results', body);
