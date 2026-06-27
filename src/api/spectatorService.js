import { api } from '../services/api';

export const deposit = (amount) => api.post('/spectator/wallet/deposit', { amount });
export const withdraw = (amount) => api.post('/spectator/wallet/withdraw', { amount });
export const getBalance = () => api.get('/spectator/wallet/balance');
export const getWalletHistory = () => api.get('/spectator/wallet/history');

export const placeBet = (data) => api.post('/spectator/bets', data);
export const getMyBets = () => api.get('/spectator/bets/my-bets');

// Dự đoán: body { raceId, raceEntryId } (KHÁC cược dùng horseId)
export const createPrediction = (data) => api.post('/spectator/predictions', data);
export const getMyPredictions = () => api.get('/spectator/predictions/my-predictions');
export const getPredictionsByRace = (raceId) => api.get(`/spectator/predictions/race/${raceId}`);

// GET /spectator/races/{raceId}/betting-info — thông tin cược của race (MỚI)
export const getRaceBettingInfo = (raceId) => api.get(`/spectator/races/${raceId}/betting-info`);
