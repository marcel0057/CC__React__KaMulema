import api from './api';

export const transportsService = {
  transporteurs: async () => (await api.get('/transports/transporteurs')).data,
  createDemande: async (payload) => (await api.post('/transports/demande', payload)).data,
  myLivraisons: async () => (await api.get('/transports/mes-livraisons')).data,
  updateStatus: async (id, payload) => (await api.put(`/transports/livraisons/${id}/statut`, payload)).data,
  detail: async (id) => (await api.get(`/transports/livraisons/${id}`)).data,
  noterTransporteur: async (id, payload) => (await api.post(`/transports/livraisons/${id}/noter`, payload)).data
};
