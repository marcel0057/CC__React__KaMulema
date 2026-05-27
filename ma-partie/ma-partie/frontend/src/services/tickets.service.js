import api from './api';

export const ticketsService = {
  generer: async (payload) => (await api.post('/tickets/generer', payload)).data,
  myTickets: async () => (await api.get('/tickets/mes-tickets')).data,
  scanner: async (numero, payload = {}) => (await api.put(`/tickets/${numero}/scanner`, payload)).data,
  notation: async (id, payload) => (await api.post(`/tickets/${id}/notation`, payload)).data,
  detail: async (numero) => (await api.get(`/tickets/${numero}`)).data
};
