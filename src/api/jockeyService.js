import { api } from '../services/api';

export const getContracts = () => api.get('/jockeys/contracts');
export const respondContract = (id, status) => api.put(`/jockeys/contracts/${id}/respond`, { status });
