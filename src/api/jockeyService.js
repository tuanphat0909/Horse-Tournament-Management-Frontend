import { api } from '../services/api';

export const getContracts = () => api.get('/jockeys/contracts');
export const respondContract = (id, status) => api.put(`/jockeys/contracts/${id}/respond`, { status });

export const getJockeyStats = () => api.get('/jockeys/stats');
export const getJockeyViolations = () => api.get('/jockeys/violations');
export const getAssignedHorses = () => api.get('/jockeys/assigned-horses');
