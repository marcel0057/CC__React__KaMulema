import api from './api';

export const certificationsService = {
  mine: async () => (await api.get('/certifications/ma-certification')).data,
  submit: async () => (await api.post('/certifications/demande')).data,
  list: async (params = {}) => (await api.get('/certifications/toutes', { params })).data,
  decide: async (id, payload) => (await api.put(`/certifications/${id}/decision`, payload)).data,
  stats: async () => (await api.get('/certifications/stats')).data
};
