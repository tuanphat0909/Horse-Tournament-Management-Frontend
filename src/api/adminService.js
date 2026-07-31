import { api } from '../services/api';

export const getRoles = () => api.get('/admin/roles');

export const createAccount = (data) => api.post('/admin/accounts', data);

export const getAccounts = () => api.get('/admin/accounts');

export const createTournament = (data) => api.post('/admin/tournaments', data);

export const generateTournamentRaces = (tournamentId) => api.post(`/admin/tournaments/${tournamentId}/generate-races`);
export const generateFinalRace = (tournamentId) => api.post(`/admin/tournaments/${tournamentId}/generate-final`);
export const closeTournamentRegistration = (tournamentId) => api.post(`/admin/tournaments/${tournamentId}/close-registration`);
export const extendTournamentRegistration = (tournamentId) => api.put(`/admin/tournaments/${tournamentId}/extend`);
export const cancelTournament = (tournamentId, reason) => api.put(`/admin/tournaments/${tournamentId}/cancel`, { reason });
export const updateTournament = (tournamentId, data) => api.put(`/admin/tournaments/${tournamentId}`, data);

export const createRace = (data) => api.post('/admin/races', data);

export const deleteRace = (raceId) => api.delete(`/admin/races/${raceId}`);
export const updateRace = (raceId, data) => api.put(`/admin/races/${raceId}`, data);

export const createRaceEntry = (raceId, data) => api.post(`/admin/races/${raceId}/entries`, data);

export const assignReferee = (raceId, refereeId) => api.post(`/admin/races/${raceId}/referees`, { refereeId });

export const getRaceReferees = (raceId) => api.get(`/admin/races/${raceId}/referees`);

export const removeReferee = (raceId, refereeId) => api.delete(`/admin/races/${raceId}/referees/${refereeId}`);

export const createPrizes = (data) => api.post('/admin/payouts/prizes', data);

export const getRegistrations = () => api.get('/admin/registrations');
export const approveRegistration = (id) => api.put(`/admin/registrations/${id}/approve`);
export const rejectRegistration = (id) => api.put(`/admin/registrations/${id}/reject`);

export const getReferees = () => api.get('/admin/referees');

export const getViolations = () => api.get('/admin/violations');

export const getPredictionStats = () => api.get('/admin/predictions/stats');

export const getPredictions = () => api.get('/admin/predictions');

export const getBetStats = () => api.get('/admin/bets/stats');

export const getBets = () => api.get('/admin/bets');

export const updateUserStatus = (id) => api.put(`/admin/users/${id}/status`);

export const publishRaceResult = (raceId) => api.post(`/admin/races/${raceId}/publish`);

export const getDashboardStats = () => api.get('/admin/dashboard');

export const updateViolationStatus = (id, status) => api.put(`/admin/violations/${id}/status`, { status });

export const getRacesRefereeAssignments = () => api.get('/admin/races/referee-assignments');

export const getActivityLog = () => api.get('/admin/activity-log');
export const getRefereeReports = () => api.get('/admin/referee-reports');

export const withdrawRaceEntry = (raceEntryId, reason) =>
  api.post(`/admin/races/entries/${raceEntryId}/withdraw`, { reason });

export const getAdminWalletBalance = () => api.get('/admin/wallet/balance');
export const getAdminWalletHistory = () => api.get('/admin/wallet/history');
export const depositAdminWallet = (amount) => api.post('/admin/wallet/deposit', { amount });
export const withdrawAdminWallet = (amount) => api.post('/admin/wallet/withdraw', { amount });

/**
 * Dựng sẵn một giải đấu demo chỉ bằng một lệnh: giải đã đóng đăng ký, 12 ngựa đã
 * được duyệt kèm phiếu khám sức khoẻ và hợp đồng nài ngựa. Dùng khi cần dữ liệu
 * nhanh để trình bày, thay vì bấm tay qua từng bước.
 */
export const setupDemoTournament = () => api.post('/Demo/auto-setup');

export const populateTournament = (tournamentId) => api.post(`/demo/populate-tournament/${tournamentId}`);
export const resolveRace = (tournamentId) => api.post(`/demo/resolve-race/${tournamentId}`);
