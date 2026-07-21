import { api } from '../services/api';

export const getMyHorses = () => api.get('/horses/my-horses');
export const createHorse = (data) => api.post('/horses', data);
export const getHorse = (id) => api.get(`/horses/${id}`);
export const updateHorse = (id, data) => api.put(`/horses/${id}`, data);
export const deleteHorse = (id) => api.delete(`/horses/${id}`);

export const createRegistration = (data) => api.post('/registrations', data);
export const getMyRegistrations = () => api.get('/registrations/my-registrations');

export const createJockeyContract = (data) => api.post('/jockey-contracts', data);
export const getMyProposals = () => api.get('/jockey-contracts/my-proposals');
export const cancelJockeyContract = (id) => api.delete(`/jockey-contracts/${id}`);

export const getOwnerResults = () => api.get('/owner/results');
export const checkHorseBusy = (horseId, tournamentId) => api.get(`/horses/${horseId}/check-busy/${tournamentId}`);
export const checkJockeyBusy = (jockeyId, tournamentId) => api.get(`/jockeys/${jockeyId}/check-busy/${tournamentId}`);

// Wallet endpoints for Owner
export const getOwnerWalletBalance = () => api.get('/owner/wallet/balance');
export const getOwnerWalletHistory = () => api.get('/owner/wallet/history');
export const ownerDeposit = (amount) => { throw new Error("Direct deposit is disabled. Please use VNPay payment."); };
export const ownerWithdraw = (amount) => api.post('/owner/wallet/withdraw', { amount });

// Withdraw — maps to POST /owner/wallet/withdraw (payload: { amount })
// The 'on-chain' variant did not exist on backend; use the standard endpoint.
export const ownerWithdrawOnChain = (payload) => api.post('/owner/wallet/withdraw', { amount: payload.amount });
