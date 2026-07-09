import { api } from '../services/api';

export const getMedicalChecks = () => api.get('/MedicalCheck');
export const getMedicalCheckById = (id) => api.get(`/MedicalCheck/${id}`);
export const getMedicalCheckByRegistration = (registrationId) => api.get(`/MedicalCheck/by-registration/${registrationId}`);
export const createMedicalCheck = (data) => api.post('/MedicalCheck', data);
export const updateMedicalCheck = (id, data) => api.put(`/MedicalCheck/${id}`, data);
export const deleteMedicalCheck = (id) => api.delete(`/MedicalCheck/${id}`);
export const getPendingRegistrations = () => api.get('/MedicalCheck/pending-registrations');
