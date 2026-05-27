import { useState, useEffect } from 'react';

/**
 * Hook to automatically track geolocation using navigator.geolocation.watchPosition
 * It returns the current position, error status, and a boolean indicating if it's active.
 */
export function useGeolocationTracker() {
    const [position, setPosition] = useState(null);
    const [error, setError] = useState(null);
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        if (!('geolocation' in navigator)) {
            setError('La géolocalisation n\'est pas supportée par votre navigateur.');
            return;
        }

        setIsTracking(true);
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition({ latitude, longitude });
                setError(null);

                // --- 
                // Transmission automatique au serveur (mock pour Ka Molema API)
                // ex: fetch('/api/agronomes/position', { method: 'POST', body: JSON.stringify({ lat: latitude, lng: longitude }) })
                // console.log(`[GeoTracker] Sent position to server: ${latitude}, ${longitude}`);
            },
            (err) => {
                setIsTracking(false);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError('Permission refusée.');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError('Position indisponible.');
                        break;
                    case err.TIMEOUT:
                        setError('Délai d\'attente dépassé.');
                        break;
                    default:
                        setError('Erreur inattendue.');
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
            setIsTracking(false);
        };
    }, []);

    return { position, error, isTracking };
}
