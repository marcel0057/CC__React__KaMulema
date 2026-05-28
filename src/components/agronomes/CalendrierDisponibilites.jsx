import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from "../../services/platformApi.js";

// ===== Helpers date =====
function formatJour(iso) {
    return new Date(iso).toLocaleDateString('fr-CM', {
        weekday: 'long', day: 'numeric', month: 'long',
    });
}

function formatHeure(iso) {
    return new Date(iso).toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' });
}

// Groupe les créneaux par jour
function grouperParJour(slots) {
    const map = new Map();
    for (const slot of slots) {
        const jour = new Date(slot.dateDebut).toDateString();
        if (!map.has(jour)) map.set(jour, []);
        map.get(jour).push(slot);
    }
    return map;
}

export default function CalendrierDisponibilites({
    agronomeId,
    agronomeNom,
    onReservationConfirmee,
}) {
    const [slots, setSlots] = useState([]);
    const [slotChoisi, setSlotChoisi] = useState(null);
    const [notes, setNotes] = useState('');
    const [chargement, setChargement] = useState(true);
    const [reservationEnCours, setReservationEnCours] = useState(false);
    const [succes, setSucces] = useState(false);
    const [erreur, setErreur] = useState(null);

    // Charge les créneaux libres via l'API Rest
    useEffect(() => {
        setChargement(true);
        apiGet(`/api/agronomes/${agronomeId}/slots`, [])
            .then(setSlots)
            .catch(() => setErreur('Impossible de charger les créneaux.'))
            .finally(() => setChargement(false));
    }, [agronomeId]);

    const confirmerReservation = async () => {
        if (!slotChoisi) return;
        setReservationEnCours(true);
        setErreur(null);

        try {
            const slotReserve = await apiPost('/api/agronomes/slots/reserver', {
                slotId: slotChoisi.id,
                notesAgriculteur: notes,
            });

            setSucces(true);
            setSlotChoisi(null);
            setNotes('');

            // Retire le slot de la liste
            setSlots(prev => prev.filter(s => s.id !== slotChoisi.id));
            if (onReservationConfirmee) onReservationConfirmee(slotReserve);
            setTimeout(() => setSucces(false), 4000);
        } catch (err) {
            setErreur(err.message || 'Erreur lors de la réservation.');
        } finally {
            setReservationEnCours(false);
        }
    };

    const slotsParJour = grouperParJour(slots);

    return (
        <div style={{ marginTop: '1rem', borderTop: '0.5px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                    <h4>Disponibilités de {agronomeNom}</h4>
                    <p className="muted" style={{ margin: 0 }}>Sélectionnez un créneau pour prendre rendez-vous</p>
                </div>
                <span className="badge success">
                    {slots.length} créneau{slots.length !== 1 ? 'x' : ''} libre{slots.length !== 1 ? 's' : ''}
                </span>
            </div>

            {succes && (
                <p className="alert alert-success">Demande de rendez-vous envoyée ! L'agronome vous confirmera bientôt.</p>
            )}
            {erreur && (
                <p className="alert alert-danger">{erreur}</p>
            )}

            {chargement && <p className="muted" style={{ textAlign: 'center' }}>Chargement du calendrier...</p>}

            {!chargement && slots.length === 0 && !erreur && (
                <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed var(--border)' }}>
                    <p className="muted">Aucun créneau disponible. Veuillez le contacter en direct.</p>
                </div>
            )}

            {!chargement && slots.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Array.from(slotsParJour.entries()).map(([jour, slotsJour]) => (
                        <div key={jour}>
                            <div style={{ fontWeight: 500, color: 'var(--accent)', textTransform: 'capitalize', marginBottom: '8px' }}>
                                {formatJour(slotsJour[0].dateDebut)}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {slotsJour.map(slot => {
                                    const estChoisi = slotChoisi?.id === slot.id;
                                    return (
                                        <button
                                            key={slot.id}
                                            onClick={() => setSlotChoisi(estChoisi ? null : slot)}
                                            style={{
                                                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                                border: estChoisi ? '2px solid var(--accent)' : '1px solid var(--border)',
                                                background: estChoisi ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                                color: 'var(--text)',
                                                minWidth: '100px'
                                            }}
                                        >
                                            <div style={{ fontWeight: '500' }}>{formatHeure(slot.dateDebut)}</div>
                                            <small className="muted">→ {formatHeure(slot.dateFin)}</small>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {slotChoisi && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                    <h5>Confirmer le rendez-vous</h5>
                    <p className="muted">
                        {formatJour(slotChoisi.dateDebut)} · {formatHeure(slotChoisi.dateDebut)} → {formatHeure(slotChoisi.dateFin)}
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Message optionnel</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ex: J'ai des problèmes sur mes plants..."
                            rows={2}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="secondary-action" onClick={() => setSlotChoisi(null)} style={{ flex: 1 }}>Annuler</button>
                        <button className="primary-action" onClick={confirmerReservation} disabled={reservationEnCours} style={{ flex: 2 }}>
                            {reservationEnCours ? 'Envoi...' : 'Envoyer la demande'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
