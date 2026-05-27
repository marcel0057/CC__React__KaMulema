// =========================================================
// hooks/useGeolocation.ts — Position GPS automatique
// =========================================================

import { useState, useEffect } from 'react';

export interface Position {
  latitude: number;
  longitude: number;
}

export interface GeolocationState {
  position: Position | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Récupère automatiquement la position GPS du navigateur.
 * Demande la permission à l'utilisateur au premier chargement.
 */
export function useGeolocation(): GeolocationState {
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ce navigateur.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const success = (geo: GeolocationPosition) => {
      setPosition({
        latitude: geo.coords.latitude,
        longitude: geo.coords.longitude,
      });
      setLoading(false);
    };

    const failure = (err: GeolocationPositionError) => {
      const messages: Record<number, string> = {
        1: "Permission refusée. Activez la géolocalisation dans votre navigateur.",
        2: "Position introuvable. Vérifiez votre connexion GPS.",
        3: "Délai dépassé. Veuillez réessayer.",
      };
      setError(messages[err.code] ?? "Erreur de géolocalisation.");
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(success, failure, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // Cache 1 minute
    });
  }, [trigger]);

  const retry = () => setTrigger(t => t + 1);

  return { position, loading, error, retry };
}
