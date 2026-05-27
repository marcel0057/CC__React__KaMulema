// =========================================================
// hooks/useAgronomes.ts — Chargement + filtrage des agronomes
// =========================================================

import { useState, useEffect, useCallback } from 'react';
import { getAgronomes } from '../services/agronomeService';
import type { Agronome, FiltreAgronomes } from '../types/agronome.types';

/** Formule Haversine côté frontend pour le tri par distance */
function calculerDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Rayons d'élargissement automatique si aucun résultat
const RAYONS_PROGRESSIFS = [50, 100, 200, 500];

interface UseAgronomes {
  agronomes: Agronome[];
  loading: boolean;
  error: string | null;
  rayonActuel: number;
  rayonElargi: boolean;    // true si le rayon a été élargi automatiquement
  elargirRecherche: () => void;
  recharger: () => void;
}

export function useAgronomes(filtres: FiltreAgronomes): UseAgronomes {
  const [agronomes, setAgronomes] = useState<Agronome[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rayonIndex, setRayonIndex] = useState(0);
  const [rayonElargi, setRayonElargi] = useState(false);

  const rayonActuel = RAYONS_PROGRESSIFS[rayonIndex] ?? filtres.rayonKm;

  const charger = useCallback(async (rayon: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAgronomes({
        ...filtres,
        rayonKm: rayon,
      });

      // Calcule la distance pour chaque agronome si on a la position
      let enrichis = data;
      if (filtres.latitude && filtres.longitude) {
        enrichis = data
          .map(a => ({
            ...a,
            distanceKm: Math.round(
              calculerDistanceKm(filtres.latitude!, filtres.longitude!, a.latitude, a.longitude)
            ),
          }))
          .filter(a => a.distanceKm! <= rayon)
          // Tri : d'abord par distance, puis par note en cas d'égalité
          .sort((a, b) => {
            const distDiff = (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
            if (distDiff !== 0) return distDiff;
            return b.noteMoyenne - a.noteMoyenne;
          });
      }

      setAgronomes(enrichis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [filtres]);

  useEffect(() => {
    charger(rayonActuel);
  }, [charger, rayonActuel]);

  const elargirRecherche = () => {
    if (rayonIndex < RAYONS_PROGRESSIFS.length - 1) {
      setRayonIndex(i => i + 1);
      setRayonElargi(true);
    }
  };

  const recharger = () => {
    setRayonIndex(0);
    setRayonElargi(false);
    charger(RAYONS_PROGRESSIFS[0]);
  };

  return { agronomes, loading, error, rayonActuel, rayonElargi, elargirRecherche, recharger };
}
