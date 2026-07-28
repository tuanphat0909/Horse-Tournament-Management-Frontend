import { api } from '../services/api';

export const getMedicalChecks = () => api.get('/MedicalCheck');
export const createMedicalCheck = (data) => api.post('/MedicalCheck', data);
export const getPendingRegistrations = () => api.get('/MedicalCheck/pending-registrations');
export const getAssignedEntries = () => api.get('/MedicalCheck/assigned-entries');
export const performRecheck = (data) => api.post('/MedicalCheck/recheck', data);
export const getUnhealthyHorses = () => api.get('/MedicalCheck/unhealthy-horses');
