// =========================================================
// types/agronome.types.ts — Types partagés du module agronomes
// =========================================================

export interface Agronome {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  bio?: string;
  photoUrl?: string;
  specialite: string;
  anneesExperience: number;
  ville: string;
  departement?: string;
  region?: string;
  latitude: number;
  longitude: number;
  disponible: boolean;
  noteMoyenne: number;
  nombreEvaluations: number;
  createdAt?: string;
  // Champ calculé côté frontend après appel Haversine
  distanceKm?: number;
}

export interface DisponibiliteSlot {
  id: number;
  agronomeId: number;
  agriculteurId?: number;
  dateDebut: string;   // ISO 8601
  dateFin: string;
  statut: StatutSlot;
  notesAgriculteur?: string;
  notesAgronome?: string;
}

export type StatutSlot = 'LIBRE' | 'RESERVE' | 'CONFIRME' | 'REFUSE' | 'TERMINE';

export interface EvaluationAgronome {
  id: number;
  agronomeId: number;
  agriculteurId: number;
  slotId: number;
  note: number;       // 1 à 5
  commentaire?: string;
  createdAt: string;
}

// --- Paramètres de recherche ---
export interface FiltreAgronomes {
  latitude?: number;
  longitude?: number;
  rayonKm: number;       // Par défaut : 50km
  departement?: string;
  specialite?: string;
  disponibleSeulement: boolean;
  experienceMin?: number;
}

// --- DTO pour réserver un créneau ---
export interface ReservationRequest {
  slotId: number;
  notesAgriculteur?: string;
}

// --- DTO pour évaluer un agronome ---
export interface EvaluationRequest {
  agronomeId: number;
  slotId: number;
  note: number;
  commentaire?: string;
}

// --- Message de chat ---
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
