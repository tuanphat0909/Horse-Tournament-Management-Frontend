import { api } from '../services/api';

export const getJockeyRankings = () => api.get('/public/rankings/jockeys');
export const getHorseRankings = () => api.get('/public/rankings/horses');
export const getRaceSchedule = () => api.get('/public/races/schedule');
export const getLiveRaces = () => api.get('/public/races/live');
export const getNotifications = () => api.get('/public/notifications');
export const markNotificationRead = (id) => api.put(`/public/notifications/${id}/read`);

export const getTournaments = () => api.get('/public/tournaments');
export const getTournamentDetail = (id) => api.get(`/public/tournaments/${id}`);

// ===== Chi tiết cuộc đua / lằn đua / kết quả / vòng (phục vụ dropdown) =====
export const getRaceDetail = (id) => api.get(`/public/races/${id}`);
// dropdown chọn ngựa trong 1 race (cho cược + dự đoán)
export const getRaceEntries = (raceId) => api.get(`/public/races/${raceId}/entries`);
export const getRaceResultsPublic = (raceId) => api.get(`/public/races/${raceId}/results`);
export const getRound = (roundId) => api.get(`/public/rounds/${roundId}`);
export const getTournamentRounds = (tournamentId) => api.get(`/public/tournaments/${tournamentId}/rounds`);

