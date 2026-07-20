import { api } from '../services/api';

export const getJockeyRankings = () => api.get('/public/rankings/jockeys');
export const getHorseRankings = () => api.get('/public/rankings/horses');
export const getRaceSchedule = () => api.get('/public/races/schedule');
export const getNotifications = (params = {}) => {
  const query = new URLSearchParams();
  if (params.type) query.append('type', params.type);
  if (params.isRead !== undefined) query.append('isRead', params.isRead);
  if (params.page) query.append('page', params.page);
  if (params.pageSize) query.append('pageSize', params.pageSize);
  const qStr = query.toString();
  return api.get(`/public/notifications${qStr ? '?' + qStr : ''}`);
};
export const markNotificationRead = (id) => api.put(`/public/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/public/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/public/notifications/${id}`);

export const getTournaments = () => api.get('/public/tournaments');
export const getTournamentDetail = (id) => api.get(`/public/tournaments/${id}`);

export const getLiveRaces = () => api.get('/public/races/live');

export const getRaceDetail = (id) => api.get(`/public/races/${id}`);
export const getRaceEntries = (raceId) => api.get(`/public/races/${raceId}/entries`);
export const getPublicRaceResults = (raceId) => api.get(`/public/races/${raceId}/results`);
