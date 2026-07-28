import { api } from '../services/api';

export const getBalance = () => api.get('/spectator/wallet/balance');
export const getWalletHistory = () => api.get('/spectator/wallet/history');

// Withdraw — maps to POST /spectator/wallet/withdraw (payload: { amount })
// The 'on-chain' variant did not exist on backend; use the standard endpoint.
export const withdrawOnChain = (payload) => api.post('/spectator/wallet/withdraw', { amount: payload.amount });

export const placeBet = (data) => api.post('/spectator/bets', data);
export const getMyBets = () => api.get('/spectator/bets/my-bets');

export const getRaceBettingInfo = (raceId) => api.get(`/spectator/races/${raceId}/betting-info`);
