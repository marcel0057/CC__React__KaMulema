// =========================================================
// hooks/usePositionAgronome.ts
// Envoie la position GPS de l'agronome toutes les 30 secondes
// =========================================================

import { useEffect, useRef, useState } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8086';
const INTERVALLE_MS = 30_000; // 30 secondes

interface UsePositionAgronomeOptions {
  agronomeId: number;
  actif: boolean; // false = on arrête la mise à jour (agronome déconnecté)
}

interface EtatPosition {
  suivi: boolean;
  erreur: string | null;
  derniereMAJ: Date | null;
}

export function usePositionAgronome({ agronomeId, actif }: UsePositionAgronomeOptions): EtatPosition {
  const [etat, setEtat] = useState<EtatPosition>({
    suivi: false,
    erreur: null,
    derniereMAJ: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const envoyerPosition = (lat: number, lng: number) => {
    const token = localStorage.getItem('agro_token');
    fetch(`${BASE_URL}/api/agronomes/${agronomeId}/position`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
      .then(res => {
        if (res.ok) {
          setEtat({ suivi: true, erreur: null, derniereMAJ: new Date() });
        }
      })
      .catch(() => {
        setEtat(prev => ({ ...prev, erreur: 'Impossible de mettre à jour la position.' }));
      });
  };

  const obtenirEtEnvoyer = () => {
    if (!navigator.geolocation) {
      setEtat(prev => ({ ...prev, erreur: 'Géolocalisation non supportée.' }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => envoyerPosition(pos.coords.latitude, pos.coords.longitude),
      () => setEtat(prev => ({ ...prev, erreur: 'Permission GPS refusée.' })),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 20000 }
    );
  };

  useEffect(() => {
    if (!actif) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setEtat({ suivi: false, erreur: null, derniereMAJ: null });
      return;
    }

    // Envoi immédiat au démarrage
    obtenirEtEnvoyer();

    // Puis toutes les 30 secondes
    intervalRef.current = setInterval(obtenirEtEnvoyer, INTERVALLE_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [agronomeId, actif]);

  return etat;
}
