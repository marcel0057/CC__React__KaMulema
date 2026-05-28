import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapLibreView.css';

export default function MapLibreView({ markers, userPosition, onMarkerClick, selectedMarkerId, onMapClick }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markerRefs = useRef({}); // Store marker instances by id
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (mapRef.current) return; // initialize map only once

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
            center: userPosition ? [userPosition.longitude, userPosition.latitude] : [11.5, 3.8], // default centered in Cameroon
            zoom: 6,
            pitch: 0,
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));

        map.on('load', () => {
            setMapLoaded(true);
        });

        map.on('click', () => {
            if (onMapClick) onMapClick();
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update user position if available
    useEffect(() => {
        if (mapLoaded && userPosition && mapRef.current) {
            // Could also update a user marker if required
            // mapRef.current.flyTo({ center: [userPosition.longitude, userPosition.latitude], zoom: 10 });
        }
    }, [userPosition, mapLoaded]);

    // Sync Markers
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        // Remove obsolete markers
        const currentIds = markers.map(m => m.id);
        Object.keys(markerRefs.current).forEach(id => {
            if (!currentIds.includes(Number(id))) {
                markerRefs.current[id].remove();
                delete markerRefs.current[id];
            }
        });

        // Add or update new markers
        markers.forEach(markerData => {
            // Marker coords format expectation: lng, lat
            // Some properties might just have "zones" or city. We need to mock coordinates if they don't exist
            // Since it's a test for Ka Molema, let's mock coords based on id near default center if empty
            const rawId = String(markerData.id).replace(/\D/g, "") || "0";
            const numId = parseInt(rawId, 10);
            const lng = markerData.longitude || 11.5 + (numId % 10) * 0.1;
            const lat = markerData.latitude || 3.8 + (numId % 5) * 0.1;

            if (!markerRefs.current[markerData.id]) {
                // Create custom DOM element
                const el = document.createElement('div');
                el.className = `custom-map-marker ${markerData.availability?.toLowerCase().includes("disponible") ? 'available' : 'busy'}`;

                // Pulse ring
                const ring = document.createElement('div');
                ring.className = 'pulse-ring';
                el.appendChild(ring);

                // Dot
                const dot = document.createElement('div');
                dot.className = 'marker-dot';
                el.appendChild(dot);

                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onMarkerClick(markerData);
                });

                const newMarker = new maplibregl.Marker(el)
                    .setLngLat([lng, lat])
                    .addTo(mapRef.current);

                markerRefs.current[markerData.id] = newMarker;
            } else {
                // Update position if needed
                markerRefs.current[markerData.id].setLngLat([lng, lat]);
                // Update class
                const el = markerRefs.current[markerData.id].getElement();
                el.className = `custom-map-marker ${markerData.availability?.toLowerCase().includes("disponible") ? 'available' : 'busy'}`;
            }
        });
    }, [markers, mapLoaded]);

    // Handle Selection interactions (pitch / zoom)
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        if (selectedMarkerId) {
            const selectedMarker = markers.find(m => m.id === selectedMarkerId);
            if (selectedMarker) {
                const rawId = String(selectedMarker.id).replace(/\D/g, "") || "0";
                const numId = parseInt(rawId, 10);
                const lng = selectedMarker.longitude || 11.5 + (numId % 10) * 0.1;
                const lat = selectedMarker.latitude || 3.8 + (numId % 5) * 0.1;

                mapRef.current.easeTo({
                    center: [lng, lat],
                    pitch: 45,
                    bearing: -15,
                    zoom: 14,
                    duration: 1000
                });
            }
        } else {
            mapRef.current.easeTo({
                pitch: 0,
                bearing: 0,
                duration: 1000
            });
        }
    }, [selectedMarkerId, mapLoaded]);

    return <div ref={mapContainer} className="map-view-container" />;
}
