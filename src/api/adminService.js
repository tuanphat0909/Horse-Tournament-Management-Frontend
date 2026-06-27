import { api } from '../services/api';

export const getRoles = () => api.get('/admin/roles');

export const createAccount = (data) => api.post('/admin/accounts', data);

export const getAccounts = () => api.get('/admin/accounts');

export const createTournament = (data) => api.post('/admin/tournaments', data);

export const createRace = (data) => api.post('/admin/races', data);

export const createRaceEntry = (raceId, data) => api.post(`/admin/races/${raceId}/entries`, data);

export const assignReferee = (raceId, refereeId) => api.post(`/admin/races/${raceId}/referees`, { refereeId });

export const getRaceReferees = (raceId) => api.get(`/admin/races/${raceId}/referees`);

export const removeReferee = (raceId, refereeId) => api.delete(`/admin/races/${raceId}/referees/${refereeId}`);

export const createPrizes = (data) => api.post('/admin/payouts/prizes', data);
export const triggerPayout = (raceId) => api.post(`/admin/payouts/trigger/${raceId}`);
export const getPayouts = () => api.get('/admin/payouts');

export const updateUserStatus = (id, status) => api.put(`/admin/users/${id}/status`, { status });
export const getUserOptions = () => api.get('/admin/users/options');
export const getHorseOptions = () => api.get('/admin/horses/options');

// ===== Danh sách quản trị (BE đã có) =====
export const getRegistrations = () => api.get('/admin/registrations');
export const approveRegistration = (id) => api.put(`/admin/registrations/${id}/approve`);
export const rejectRegistration = (id) => api.put(`/admin/registrations/${id}/reject`);

export const getActivityLog = () => api.get('/admin/activity-log');
export const getAdminDashboard = () => api.get('/admin/dashboard');
export const getAdminReferees = () => api.get('/admin/referees');
export const getViolations = () => api.get('/admin/violations');
export const getPredictions = () => api.get('/admin/predictions');
export const getPredictionStats = () => api.get('/admin/predictions/stats');

// ===== Kết quả & công bố =====
export const publishResult = (raceId) => api.post(`/admin/races/${raceId}/publish`);
export const getAdminRaceResults = (raceId) => api.get(`/admin/races/${raceId}/results`);

// body { name, startDate, endDate, numberOfRounds, status }
export const updateTournament = (id, body) => api.put(`/admin/tournaments/${id}`, body);

// POST /admin/tournaments/{id}/generate-races — tạo các race cho tournament
export const generateRacesForTournament = (id) => api.post(`/admin/tournaments/${id}/generate-races`);

// POST /admin/tournaments/{id}/generate-final — tạo trận chung kết (MỚI)
export const generateFinalRace = (id) => api.post(`/admin/tournaments/${id}/generate-final`);

// DELETE /admin/races/{raceId} — xóa cuộc đua (MỚI)
export const deleteRace = (raceId) => api.delete(`/admin/races/${raceId}`);

// POST /admin/races/{raceId}/recalculate-odds — tính lại tỷ lệ cược (MỚI)
export const recalculateOdds = (raceId) => api.post(`/admin/races/${raceId}/recalculate-odds`);

// PUT /admin/violations/{id}/status — đổi trạng thái vi phạm (MỚI): Pending/Confirmed/Rejected
export const updateViolationStatus = (id, status) => api.put(`/admin/violations/${id}/status`, { Status: status });

// GET /admin/races/referee-assignments — danh sách race kèm referee assignment (MỚI)
export const getRacesWithRefereeAssignments = () => api.get('/admin/races/referee-assignments');
