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
