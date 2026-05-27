// =========================================================
// hooks/useAgronomes.ts — Chargement + filtrage des agronomes
// =========================================================

import { useState, useEffect, useRef } from 'react';
import { getAgronomes } from '../services/agronomeService';
import type { Agronome, FiltreAgronomes } from '../types/agronome.types';

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

const RAYONS_PROGRESSIFS = [50, 100, 200, 500];

interface UseAgronomes {
  agronomes: Agronome[];
  loading: boolean;
  error: string | null;
  rayonActuel: number;
  rayonElargi: boolean;
  elargirRecherche: () => void;
  recharger: () => void;
}

export function useAgronomes(filtres: FiltreAgronomes): UseAgronomes {
  const [agronomes, setAgronomes] = useState<Agronome[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rayonIndex, setRayonIndex] = useState(0);
  const [rayonElargi, setRayonElargi] = useState(false);

  // On stocke filtres dans un ref pour éviter qu'il soit une dépendance
  // de useEffect et cause des boucles infinies
  const filtresRef = useRef(filtres);

  // Clés stables pour détecter les vrais changements
  const specialite = filtres.specialite;
  const disponibleSeulement = filtres.disponibleSeulement;
  const experienceMin = filtres.experienceMin;
  const latitude = filtres.latitude;
  const longitude = filtres.longitude;

  // Met à jour le ref à chaque render sans déclencher de re-render
  useEffect(() => {
    filtresRef.current = filtres;
  });

  const rayonActuel = RAYONS_PROGRESSIFS[rayonIndex] ?? filtres.rayonKm;

  useEffect(() => {
    let annule = false;

    const charger = async () => {
      setLoading(true);
      setError(null);
      try {
        const f = filtresRef.current;
        const data = await getAgronomes({
          specialite: f.specialite,
          disponibleSeulement: f.disponibleSeulement,
          experienceMin: f.experienceMin,
          rayonKm: rayonActuel,
        });

        if (annule) return;

        let enrichis = data;
        if (f.latitude && f.longitude) {
          enrichis = data
            .map(a => ({
              ...a,
              distanceKm: Math.round(
                calculerDistanceKm(f.latitude!, f.longitude!, a.latitude, a.longitude)
              ),
            }))
            .filter(a => a.distanceKm! <= rayonActuel)
            .sort((a, b) => {
              const distDiff = (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
              if (distDiff !== 0) return distDiff;
              return b.noteMoyenne - a.noteMoyenne;
            });
        }

        setAgronomes(enrichis);
      } catch (err) {
        if (!annule) {
          setError(err instanceof Error ? err.message : 'Erreur lors du chargement.');
        }
      } finally {
        if (!annule) setLoading(false);
      }
    };

    charger();

    // Nettoyage — annule la requête si le composant se démonte
    return () => { annule = true; };

  // Dépendances primitives uniquement — pas d'objet
  }, [specialite, disponibleSeulement, experienceMin, latitude, longitude, rayonIndex]);

  const elargirRecherche = () => {
    if (rayonIndex < RAYONS_PROGRESSIFS.length - 1) {
      setRayonIndex(i => i + 1);
      setRayonElargi(true);
    }
  };

  const recharger = () => {
    setRayonIndex(0);
    setRayonElargi(false);
  };

  return { agronomes, loading, error, rayonActuel, rayonElargi, elargirRecherche, recharger };
}