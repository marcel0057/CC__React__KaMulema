import axios from "axios";

const BASE_URL = "http://localhost:8081/api";

// Analyse du sol
export const analyzeSoil = (soilData) => {
  return axios.post(`${BASE_URL}/soil/analyze`, soilData);
};

// Créer un ticket
export const createTicket = (ticket) => {
  return axios.post(`${BASE_URL}/tickets`, ticket);
};

// Récupérer tous les tickets
export const getAllTickets = () => {
  return axios.get(`${BASE_URL}/tickets`);
};

// Mettre à jour le statut d'un ticket
export const updateTicketStatus = (ticketId, status) => {
  return axios.put(`${BASE_URL}/tickets/${ticketId}/status`, { status });
};

// Supprimer un ticket
export const deleteTicketApi = (ticketId) => {
  return axios.delete(`${BASE_URL}/tickets/${ticketId}`);
};
