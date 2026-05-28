import React, { useMemo } from 'react';
import './BottomSheet.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

function relativeTime(isoDate) {
    if (!isoDate) return null;
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 2) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
}

function mapsDirectionUrl(destLng, destLat) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {object} props.data  – marker data
 * @param {[number,number]} props.markerCoords – [lng, lat] of selected marker
 * @param {{longitude:number,latitude:number}} props.userPosition  – from geolocation hook
 * @param {Function} props.onContact  – called with (data, mode)
 * @param {'agronomes'|'transport'} props.mode
 */
export default function BottomSheet({
    isOpen,
    onClose,
    data,
    markerCoords,
    userPosition,
    onContact,
    mode = 'agronomes',
}) {
    const isAvailable = data?.availability?.toLowerCase().includes('disponible');

    const distanceText = useMemo(() => {
        if (!userPosition || !markerCoords) return null;
        const km = haversine(
            userPosition.longitude, userPosition.latitude,
            markerCoords[0], markerCoords[1],
        );
        return formatDistance(km);
    }, [userPosition, markerCoords]);

    const lastActiveText = relativeTime(data?.lastActive);

    if (!data) return null;

    return (
        <div className={`bottom-sheet-container ${isOpen ? 'open' : ''}`}>
            <div className="bottom-sheet-backdrop" onClick={onClose} />
            <div className="bottom-sheet-content">

                {/* Grab handle */}
                <div className="bottom-sheet-handle-container" onClick={onClose}>
                    <div className="bottom-sheet-handle" />
                </div>

                <div className="bottom-sheet-body">

                    {/* ── Header ─────────────────────────────────────────────── */}
                    <div className="sheet-header">
                        <div className="sheet-avatar">
                            {(data.name || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="sheet-title-row">
                                <h3>{data.name}</h3>
                                <span className={`status-dot ${isAvailable ? 'status-green' : 'status-orange'}`} />
                            </div>
                            <p className="muted sheet-subtitle">{data.specialty || (mode === 'transport' ? data.product : 'Agronomie')}</p>
                        </div>
                    </div>

                    {/* ── Stats row ──────────────────────────────────────────── */}
                    <div className="sheet-stats">
                        {mode === 'agronomes' ? (
                            <>
                                <div className="sheet-stat-item">
                                    <i className="ti ti-map-pin" />
                                    <span>{data.city || '–'}</span>
                                </div>
                                <div className="sheet-stat-item">
                                    <i className="ti ti-star-filled" style={{ color: '#f5a623' }} />
                                    <span>{data.rating}/5</span>
                                </div>
                                <div className="sheet-stat-item">
                                    <i className="ti ti-briefcase" />
                                    <span>{data.experience} ans</span>
                                </div>
                                {distanceText && (
                                    <div className="sheet-stat-item">
                                        <i className="ti ti-route" />
                                        <span>{distanceText}</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="sheet-stat-item">
                                    <i className="ti ti-map-2" />
                                    <span>{data.from} → {data.to}</span>
                                </div>
                                <div className="sheet-stat-item">
                                    <i className="ti ti-progress" />
                                    <span>{data.progress}%</span>
                                </div>
                                {distanceText && (
                                    <div className="sheet-stat-item">
                                        <i className="ti ti-route" />
                                        <span>{distanceText}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── GPS / last active status ───────────────────────────── */}
                    <div className="sheet-gps-row">
                        <i className={`ti ${isAvailable ? 'ti-signal-4g' : 'ti-signal-3g'}`} />
                        <span>
                            {isAvailable ? 'GPS actif · En ligne' : 'En mission · Position mise à jour'}
                        </span>
                        {lastActiveText && <span className="sheet-last-active">{lastActiveText}</span>}
                    </div>

                    {/* ── Zone chips (agronomes only) ────────────────────────── */}
                    {mode === 'agronomes' && data.zones?.length > 0 && (
                        <div className="chip-row compact">
                            {data.zones.map(z => <span className="plain-chip" key={z}>{z}</span>)}
                        </div>
                    )}

                    {/* ── Quick Actions ──────────────────────────────────────── */}
                    <div className="sheet-actions">
                        {/* Phone */}
                        {data.phone && (
                            <a
                                href={`tel:${data.phone}`}
                                className="sheet-quick-btn"
                                title="Appeler"
                            >
                                <i className="ti ti-phone" />
                                <span>Appeler</span>
                            </a>
                        )}

                        {/* Message */}
                        {mode === 'agronomes' && onContact && (
                            <button
                                className="sheet-quick-btn"
                                onClick={() => onContact(data, 'contact')}
                                title="Messagerie"
                            >
                                <i className="ti ti-message-circle" />
                                <span>Message</span>
                            </button>
                        )}

                        {/* Route */}
                        {markerCoords && (
                            <a
                                href={mapsDirectionUrl(markerCoords[0], markerCoords[1])}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sheet-quick-btn"
                                title="Itinéraire"
                            >
                                <i className="ti ti-map-route" />
                                <span>Itinéraire</span>
                            </a>
                        )}

                        {/* Rendez-vous (agronomes primary CTA) */}
                        {mode === 'agronomes' && onContact && (
                            <button
                                className="sheet-quick-btn primary"
                                onClick={() => onContact(data, 'appointment')}
                            >
                                <i className="ti ti-calendar-event" />
                                <span>Rendez-vous</span>
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
