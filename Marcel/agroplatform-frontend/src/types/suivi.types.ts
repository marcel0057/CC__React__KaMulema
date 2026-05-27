// =========================================================
// types/suivi.types.ts
// =========================================================

export type StatutSuivi = 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';

export interface SuiviAgriculteur {
  id: number;
  agronomeId: number;
  agriculteurId: number;
  agriculteurNom: string;
  cultures?: string;
  localisation?: string;
  dernierDiagnostic?: string;
  statut: StatutSuivi;
  createdAt: string;
  updatedAt: string;
}

export interface TableauBordSuivi {
  suivisActifs: SuiviAgriculteur[];
  demandesEnAttente: SuiviAgriculteur[];
  nombreActifs: number;
  nombreMax: number;
  placesDisponibles: number;
}

export interface SuiviRequete {
  agronomeId: number;
  agriculteurId: number;
  agriculteurNom?: string;
  cultures?: string;
  localisation?: string;
}
