import { api } from '../services/api';

export const getRefereeDashboard = () => api.get('/referee/dashboard');
export const getHorseChecks = (raceId) => api.get(`/referee/races/${raceId}/horse-checks`);

export const getViolations = () => api.get('/referee/violations');
export const createViolation = (data) => api.post('/referee/violations', data);
export const updateViolation = (id, data) => api.put(`/referee/violations/${id}`, data);

export const submitResult = (data) => api.post(`/referee/races/${data.raceId}/results`, data);

// Tra ve mang rong neu cuoc dua chua nop ket qua — dung de an nhung cuoc dua da nop
// khoi danh sach, vi endpoint cong khai chua cong bo ket qua dang cho admin duyet.
export const getSubmittedResults = (raceId) => api.get(`/referee/races/${raceId}/results`);

export const getRaceReports = (raceId) => api.get(`/referee/races/${raceId}/reports`);
export const createReport = (data) => api.post('/referee/reports', data);
