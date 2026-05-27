package cm.agroplatform.agronomes.service;

import org.springframework.stereotype.Component;

/**
 * Calcule la distance à vol d'oiseau entre deux points GPS
 * en utilisant la formule de Haversine.
 * Aucune API externe — 100% gratuit et hors-ligne.
 */
@Component
public class HaversineService {

    private static final double RAYON_TERRE_KM = 6371.0;

    /**
     * @param lat1 Latitude du point A (ex: position de l'agriculteur)
     * @param lng1 Longitude du point A
     * @param lat2 Latitude du point B (ex: position de l'agronome)
     * @param lng2 Longitude du point B
     * @return Distance en kilomètres
     */
    public double calculerDistance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return RAYON_TERRE_KM * c;
    }

    /**
     * Vérifie si un point B est dans un rayon donné autour du point A.
     */
    public boolean estDansLeRayon(double lat1, double lng1,
                                   double lat2, double lng2,
                                   double rayonKm) {
        return calculerDistance(lat1, lng1, lat2, lng2) <= rayonKm;
    }
}
