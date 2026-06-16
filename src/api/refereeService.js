import { api } from '../services/api';

export const getRefereeDashboard = () => api.get('/referee/dashboard');
export const getRaceHorseChecks = (raceId) => api.get(`/referee/races/${raceId}/horse-checks`);
