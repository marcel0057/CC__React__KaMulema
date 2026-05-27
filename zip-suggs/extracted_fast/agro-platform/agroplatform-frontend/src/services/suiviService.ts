// =========================================================
// services/suiviService.ts
// =========================================================

import type { SuiviAgriculteur, TableauBordSuivi, SuiviRequete, StatutSuivi } from '../types/suivi.types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8086';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('agro_token');
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Erreur serveur');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Tableau de bord complet (actifs + en attente + stats) */
export const getTableauBordSuivi = (agronomeId: number): Promise<TableauBordSuivi> =>
  apiFetch<TableauBordSuivi>(`/api/agronomes/${agronomeId}/suivi`);

/** Un agriculteur demande à être suivi */
export const demanderSuivi = (req: SuiviRequete): Promise<SuiviAgriculteur> =>
  apiFetch<SuiviAgriculteur>('/api/suivi/demander', {
    method: 'POST',
    body: JSON.stringify(req),
  });

/** L'agronome accepte ou refuse */
export const repondreDemandesuivi = (suiviId: number, statut: StatutSuivi): Promise<SuiviAgriculteur> =>
  apiFetch<SuiviAgriculteur>(`/api/suivi/${suiviId}/repondre`, {
    method: 'PATCH',
    body: JSON.stringify({ statut }),
  });

/** Retirer un agriculteur du suivi */
export const retirerSuivi = (suiviId: number): Promise<void> =>
  apiFetch<void>(`/api/suivi/${suiviId}`, { method: 'DELETE' });

/** Mettre à jour le diagnostic d'un agriculteur suivi */
export const mettreAJourDiagnostic = (suiviId: number, diagnostic: string): Promise<SuiviAgriculteur> =>
  apiFetch<SuiviAgriculteur>(`/api/suivi/${suiviId}/diagnostic`, {
    method: 'PATCH',
    body: JSON.stringify({ diagnostic }),
  });
