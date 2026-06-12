import { api } from '../services/api';

export const getJockeyRankings = () => api.get('/public/rankings/jockeys');
export const getHorseRankings = () => api.get('/public/rankings/horses');
export const getRaceSchedule = () => api.get('/public/races/schedule');
export const getNotifications = () => api.get('/public/notifications');
export const markNotificationRead = (id) => api.put(`/public/notifications/${id}/read`);
