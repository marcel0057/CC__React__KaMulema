// =========================================================
// hooks/useGeolocation.ts — Position GPS automatique
// =========================================================

import { useState, useEffect, useRef } from 'react';

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
 * Demande la permission à l'utilisateur au premier chargement uniquement.
 */
export function useGeolocation(): GeolocationState {
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const mountedRef = useRef(true);
  const hasPosition = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    if (!navigator.geolocation) {
      if (mountedRef.current) {
        setError("La géolocalisation n'est pas supportée par ce navigateur.");
        setLoading(false);
      }
      return;
    }

    // Ne redemande pas la position si on l'a déjà (sauf si retry)
    if (hasPosition.current && trigger === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const success = (geo: GeolocationPosition) => {
      if (!mountedRef.current) return;
      hasPosition.current = true;
      setPosition({
        latitude: geo.coords.latitude,
        longitude: geo.coords.longitude,
      });
      setLoading(false);
    };

    const failure = (err: GeolocationPositionError) => {
      if (!mountedRef.current) return;
      const messages: Record<number, string> = {
        1: "Permission refusée. Activez la géolocalisation dans votre navigateur.",
        2: "Position introuvable. Vérifiez votre connexion GPS.",
        3: "Délai dépassé. Veuillez réessayer.",
      };
      setError(messages[err.code] ?? "Erreur de géolocalisation.");
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(success, failure, {
      enableHighAccuracy: false, // false = plus rapide, évite les re-renders
      timeout: 10000,
      maximumAge: 300000,        // Cache 5 minutes — ne redemande pas pendant 5 min
    });

    return () => {
      mountedRef.current = false;
    };
  }, [trigger]); // Se relance UNIQUEMENT si retry() est appelé

  const retry = () => {
    hasPosition.current = false;
    setPosition(null);
    setTrigger(t => t + 1);
  };

  return { position, loading, error, retry };
}