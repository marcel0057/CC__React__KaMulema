import React from 'react';
import './BottomSheet.css';

export default function BottomSheet({ isOpen, onClose, data, onContact }) {
    if (!isOpen || !data) return null;

    const currentStatusClass = data.availability?.toLowerCase().includes("disponible")
        ? "status-indicator-green"
        : "status-indicator-orange";

    return (
        <div className={`bottom-sheet-container ${isOpen ? 'open' : ''}`}>
            <div className="bottom-sheet-backdrop" onClick={onClose}></div>
            <div className="bottom-sheet-content surface">

                {/* Grab Handle */}
                <div className="bottom-sheet-handle-container" onClick={onClose}>
                    <div className="bottom-sheet-handle"></div>
                </div>

                {/* Content */}
                <div className="bottom-sheet-body">
                    <div className="sheet-header">
                        <div className="sheet-title-row">
                            <h3>{data.name}</h3>
                            <div className={`status-dot ${currentStatusClass}`} title={data.availability}></div>
                        </div>
                        <p className="muted">{data.specialty || "Agronomie"}</p>
                    </div>

                    <div className="sheet-stats">
                        <div className="sheet-stat-item">
                            <i className="ti ti-map-pin"></i>
                            <span>{data.city || 'Non spécifié'}</span>
                        </div>
                        <div className="sheet-stat-item">
                            <i className="ti ti-star"></i>
                            <span>{data.rating}/5</span>
                        </div>
                        <div className="sheet-stat-item">
                            <i className="ti ti-briefcase"></i>
                            <span>{data.experience} ans d'exp.</span>
                        </div>
                    </div>

                    {data.zones && data.zones.length > 0 && (
                        <div className="chip-row compact">
                            {data.zones.map((zone) => (
                                <span className="plain-chip" key={zone}>{zone}</span>
                            ))}
                        </div>
                    )}

                    <div className="sheet-actions">
                        <button className="secondary-action" onClick={() => onContact(data, "contact")}>
                            <i className="ti ti-message-circle"></i>
                            Contacter
                        </button>
                        <button className="primary-action" onClick={() => onContact(data, "appointment")}>
                            <i className="ti ti-calendar"></i>
                            Rendez-vous
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
