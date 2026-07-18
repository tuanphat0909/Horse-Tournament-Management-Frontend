import { api } from '../services/api';

export const deposit = (amount) => api.post('/spectator/wallet/deposit', { amount });
export const withdraw = (amount) => api.post('/spectator/wallet/withdraw', { amount });
export const getBalance = () => api.get('/spectator/wallet/balance');
export const getWalletHistory = () => api.get('/spectator/wallet/history');

// Withdraw — maps to POST /spectator/wallet/withdraw (payload: { amount })
// The 'on-chain' variant did not exist on backend; use the standard endpoint.
export const withdrawOnChain = (payload) => api.post('/spectator/wallet/withdraw', { amount: payload.amount });

export const placeBet = (data) => api.post('/spectator/bets', data);
export const getMyBets = () => api.get('/spectator/bets/my-bets');

export const createPrediction = (data) => api.post('/spectator/predictions', data);
export const getMyPredictions = () => api.get('/spectator/predictions/my-predictions');

export const getRaceBettingInfo = (raceId) => api.get(`/spectator/races/${raceId}/betting-info`);
