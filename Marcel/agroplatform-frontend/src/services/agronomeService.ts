// =========================================================
// services/agronomeService.ts — version complète Tâches 1-4
// =========================================================

import type {
  Agronome,
  DisponibiliteSlot,
  EvaluationAgronome,
  FiltreAgronomes,
  ReservationRequest,
  EvaluationRequest,
} from '../types/agronome.types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8086';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('agro_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Erreur serveur');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ===== Agronomes =====
export const getAgronomes = (filtres?: Partial<FiltreAgronomes>): Promise<Agronome[]> => {
  const params = new URLSearchParams();
  if (filtres?.departement) params.set('departement', filtres.departement);
  if (filtres?.specialite) params.set('specialite', filtres.specialite);
  if (filtres?.disponibleSeulement) params.set('disponible', 'true');
  if (filtres?.experienceMin) params.set('experienceMin', String(filtres.experienceMin));
  const q = params.toString() ? `?${params}` : '';
  return apiFetch<Agronome[]>(`/api/agronomes${q}`);
};

export const getAgronome = (id: number): Promise<Agronome> =>
  apiFetch<Agronome>(`/api/agronomes/${id}`);

// ===== Disponibilités =====
export const getCreneauxLibres = (agronomeId: number): Promise<DisponibiliteSlot[]> =>
  apiFetch<DisponibiliteSlot[]>(`/api/agronomes/${agronomeId}/creneaux`);

export const reserverCreneau = (req: ReservationRequest): Promise<DisponibiliteSlot> =>
  apiFetch<DisponibiliteSlot>(
    `/api/slots/${req.slotId}/reserver?agriculteurId=0&notes=${encodeURIComponent(req.notesAgriculteur ?? '')}`,
    { method: 'POST' }
  );

export const getMesReservations = (agriculteurId: number): Promise<DisponibiliteSlot[]> =>
  apiFetch<DisponibiliteSlot[]>(`/api/agriculteurs/${agriculteurId}/reservations`);

// ===== Messagerie =====
export interface MessageDTO {
  id: number;
  agriculteurId: number;
  agronomeId: number;
  agronomeNomComplet: string;
  expediteur: 'AGRICULTEUR' | 'AGRONOME';
  contenu: string;
  lu: boolean;
  createdAt: string;
}

export const getConversation = (agriculteurId: number, agronomeId: number): Promise<MessageDTO[]> =>
  apiFetch<MessageDTO[]>(
    `/api/messages/conversation?agriculteurId=${agriculteurId}&agronomeId=${agronomeId}`
  );

export const marquerLus = (agriculteurId: number, agronomeId: number): Promise<{ marquesLus: number }> =>
  apiFetch(`/api/messages/lus?agriculteurId=${agriculteurId}&agronomeId=${agronomeId}`, { method: 'PATCH' });

export const getNonLus = (agriculteurId: number): Promise<{ nonLus: number }> =>
  apiFetch(`/api/messages/non-lus?agriculteurId=${agriculteurId}`);

// ===== Evaluations =====
export const getEvaluations = (agronomeId: number): Promise<EvaluationAgronome[]> =>
  apiFetch<EvaluationAgronome[]>(`/api/agronomes/${agronomeId}/evaluations`);

export const soumettreEvaluation = (req: EvaluationRequest): Promise<EvaluationAgronome> =>
  apiFetch<EvaluationAgronome>('/api/evaluations', { method: 'POST', body: JSON.stringify(req) });

/** Vérifie si un agriculteur peut évaluer un agronome pour un slot donné */
export const peutEvaluer = (
  agronomeId: number,
  agriculteurId: number,
  slotId: number
): Promise<{ peutEvaluer: boolean }> =>
  apiFetch<{ peutEvaluer: boolean }>(
    `/api/evaluations/peut-evaluer?agronomeId=${agronomeId}&agriculteurId=${agriculteurId}&slotId=${slotId}`
  );

/** RDV confirmés à venir d'un agriculteur avec un agronome spécifique */
export const getRdvAgriculteurAgronome = (
  agriculteurId: number,
  agronomeId: number
): Promise<import('../types/agronome.types').DisponibiliteSlot[]> =>
  apiFetch(
    `/api/agriculteurs/${agriculteurId}/reservations?agronomeId=${agronomeId}&statut=CONFIRME`
  );
