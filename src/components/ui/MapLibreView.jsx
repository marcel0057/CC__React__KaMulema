import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapLibreView.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Haversine distance in km between two [lng,lat] pairs */
function haversine(lng1, lat1, lng2, lat2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Turn a marker's data into stable numeric [lng, lat] coords */
function coordsFor(m, index) {
    if (m.longitude != null && m.latitude != null && !isNaN(m.longitude) && !isNaN(m.latitude)) {
        return [m.longitude, m.latitude];
    }
    const n = index || 0;
    return [11.5 + (n % 10) * 0.18, 3.8 + (n % 5) * 0.15];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MapLibreView({
    markers = [],
    userPosition,
    onMarkerClick,
    selectedMarkerId,
    onMapClick,
    mode = 'agronomes',   // 'agronomes' | 'transport'
}) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markerRefs = useRef({});      // keyed by marker.id
    const userMarkerRef = useRef(null); // blue dot for current user
    const [mapLoaded, setMapLoaded] = useState(false);

    // ── Init ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (mapRef.current) return;

        const initCenter = userPosition
            ? [userPosition.longitude, userPosition.latitude]
            : [11.85, 4.0];

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
            center: initCenter,
            zoom: 6.5,
            pitch: 0,
            bearing: 0,
            antialias: true,
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
        map.addControl(new maplibregl.ScaleControl({ maxWidth: 80, unit: 'metric' }), 'bottom-left');

        map.on('load', () => {
            // ── 3-D Buildings layer ──────────────────────────────────────
            // Only works with styles that have 'building' source layer
            if (map.getLayer('3d-buildings')) return;

            // Try to add extrusion from OSM vector tiles (may or may not be present in the style)
            try {
                map.addSource('openmaptiles', {
                    type: 'vector',
                    url: 'https://demotiles.maplibre.org/tiles/tiles.json'
                });
            } catch (_) { /* source might already exist */ }

            // Atmosphere / sky effect for depth
            map.setFog && map.setFog({
                color: 'rgb(20, 30, 48)',
                'high-color': 'rgb(36, 92, 160)',
                'horizon-blend': 0.02,
            });

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

    // ── User position blue dot ───────────────────────────────────────────────
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        if (!userPosition) {
            if (userMarkerRef.current) {
                userMarkerRef.current.remove();
                userMarkerRef.current = null;
            }
            return;
        }

        const { longitude, latitude } = userPosition;
        const lngLat = [longitude, latitude];

        if (!userMarkerRef.current) {
            const el = document.createElement('div');
            el.className = 'user-position-marker';
            const inner = document.createElement('div');
            inner.className = 'user-position-dot';
            el.appendChild(inner);
            const ring = document.createElement('div');
            ring.className = 'user-position-ring';
            el.appendChild(ring);

            userMarkerRef.current = new maplibregl.Marker(el)
                .setLngLat(lngLat)
                .addTo(mapRef.current);
        } else {
            userMarkerRef.current.setLngLat(lngLat);
        }
    }, [userPosition, mapLoaded]);

    // ── Sync markers ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        // Remove stale
        const currentIds = markers.map(m => String(m.id));
        Object.keys(markerRefs.current).forEach(id => {
            if (!currentIds.includes(id)) {
                markerRefs.current[id].marker.remove();
                delete markerRefs.current[id];
            }
        });

        // Add / update
        markers.forEach((m, index) => {
            const key = String(m.id);
            const [lng, lat] = coordsFor(m, index);
            const isAvailable = m.availability?.toLowerCase().includes('disponible');
            const isSelected = String(selectedMarkerId) === key;

            if (!markerRefs.current[key]) {
                // Build DOM element
                const el = document.createElement('div');
                el.className = `custom-map-marker ${isAvailable ? 'available' : 'busy'}${isSelected ? ' selected' : ''}`;

                const ring = document.createElement('div');
                ring.className = 'pulse-ring';
                el.appendChild(ring);

                const dot = document.createElement('div');
                dot.className = 'marker-dot';
                el.appendChild(dot);

                // Initials label
                const label = document.createElement('div');
                label.className = 'marker-label';
                label.textContent = (m.name || '?').split(' ').slice(-1)[0].slice(0, 5);
                el.appendChild(label);

                el.addEventListener('click', e => {
                    e.stopPropagation();
                    if (onMarkerClick) onMarkerClick(m, [lng, lat]);
                });

                const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                    .setLngLat([lng, lat])
                    .addTo(mapRef.current);

                markerRefs.current[key] = { marker, coords: [lng, lat] };
            } else {
                // Update position + class
                const { marker } = markerRefs.current[key];
                marker.setLngLat([lng, lat]);
                markerRefs.current[key].coords = [lng, lat];

                const el = marker.getElement();
                el.className = `custom-map-marker ${isAvailable ? 'available' : 'busy'}${isSelected ? ' selected' : ''}`;
            }
        });
    }, [markers, mapLoaded, selectedMarkerId]);

    // ── Selection: 3D tilt + center ───────────────────────────────────────────
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        if (selectedMarkerId) {
            const markerEntry = markerRefs.current[String(selectedMarkerId)];
            if (markerEntry) {
                mapRef.current.easeTo({
                    center: markerEntry.coords,
                    pitch: 45,
                    bearing: -15,
                    zoom: 13,
                    duration: 1000,
                });
            }
        } else {
            mapRef.current.easeTo({
                pitch: 0,
                bearing: 0,
                zoom: 6.5,
                duration: 800,
            });
        }
    }, [selectedMarkerId, mapLoaded]);

    return (
        <div className="map-view-wrapper">
            <div ref={mapContainer} className="map-view-container" />
            {!mapLoaded && (
                <div className="map-loading-overlay">
                    <div className="map-loading-spinner" />
                    <span>Chargement de la carte…</span>
                </div>
            )}
        </div>
    );
}
