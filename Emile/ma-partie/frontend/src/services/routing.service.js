import axios from 'axios';

export const routingService = {
  /**
   * Fetches the route polyline between two coordinates using the public OSRM API.
   * Coordinates should be [lat, lng]. OSRM expects lng,lat in the URL.
   */
  getRoute: async (start, end) => {
    try {
      // OSRM expects coordinates in lng,lat order
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      
      const response = await axios.get(url);
      
      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        // The geometries are returned as GeoJSON coordinates [lng, lat]
        // react-leaflet Polyline expects [lat, lng]
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        return {
          coordinates,
          distance: route.distance, // in meters
          duration: route.duration  // in seconds
        };
      }
      return null;
    } catch (error) {
      console.error("Erreur lors du calcul de l'itinéraire OSRM:", error);
      return null;
    }
  }
};
