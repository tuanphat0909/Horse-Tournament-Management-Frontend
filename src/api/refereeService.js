import { api } from '../services/api';

export const getRefereeDashboard = () => api.get('/referee/dashboard');
export const getHorseChecks = (raceId) => api.get(`/referee/races/${raceId}/horse-checks`);

export const getViolations = () => api.get('/referee/violations');
export const createViolation = (data) => api.post('/referee/violations', data);
export const updateViolation = (id, data) => api.put(`/referee/violations/${id}`, data);

export const submitResult = (data) => api.post(`/referee/races/${data.raceId}/results`, data);

export const getRaceReports = (raceId) => api.get(`/referee/races/${raceId}/reports`);
export const createReport = (data) => api.post('/referee/reports', data);
