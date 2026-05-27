import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TrackingMap = ({ trip }) => {
  if (!trip) return <p>Chargement de la carte...</p>;

  return (
    <div className="h-[600px] rounded-2xl overflow-hidden border border-gray-200">
      <MapContainer
        center={trip.currentPosition}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Départ */}
        <Marker position={trip.start}>
          <Popup>Départ : {trip.from}</Popup>
        </Marker>

        {/* Position actuelle */}
        <Marker position={trip.currentPosition}>
          <Popup>
            <b>Position Actuelle</b><br />
            Camion en route
          </Popup>
        </Marker>

        {/* Destination */}
        <Marker position={trip.end}>
          <Popup>Destination : {trip.to}</Popup>
        </Marker>

        {/* Trajet */}
        <Polyline 
          positions={[trip.start, ...trip.steps.map(s => [s.lat, s.lng]), trip.end]} 
          color="green" 
          weight={5} 
        />
      </MapContainer>
    </div>
  );
};

export default TrackingMap;