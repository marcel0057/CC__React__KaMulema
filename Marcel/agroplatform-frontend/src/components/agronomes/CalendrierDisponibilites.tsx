// =========================================================
// components/agronomes/CalendrierDisponibilites.tsx — Tâche 4
// Calendrier de disponibilités avec réservation temps réel
// =========================================================

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getCreneauxLibres, reserverCreneau } from '../../services/agronomeService';
import { Btn, Badge, Banner } from '../ui';
import type { DisponibiliteSlot } from '../../types/agronome.types';

interface Props {
  agronomeId: number;
  agronomeNom: string;
  agriculteurId: number;
  onReservationConfirmee?: (slot: DisponibiliteSlot) => void;
}

// ===== Helpers date =====
function formatJour(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CM', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatHeure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' });
}

function memeJour(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// Groupe les créneaux par jour
function grouperParJour(slots: DisponibiliteSlot[]): Map<string, DisponibiliteSlot[]> {
  const map = new Map<string, DisponibiliteSlot[]>();
  for (const slot of slots) {
    const jour = new Date(slot.dateDebut).toDateString();
    if (!map.has(jour)) map.set(jour, []);
    map.get(jour)!.push(slot);
  }
  return map;
}

// ===== Composant =====
export function CalendrierDisponibilites({
  agronomeId,
  agronomeNom,
  agriculteurId,
  onReservationConfirmee,
}: Props) {
  const [slots, setSlots] = useState<DisponibiliteSlot[]>([]);
  const [slotChoisi, setSlotChoisi] = useState<DisponibiliteSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [chargement, setChargement] = useState(true);
  const [reservationEnCours, setReservationEnCours] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Charge les créneaux libres
  useEffect(() => {
    setChargement(true);
    getCreneauxLibres(agronomeId)
      .then(setSlots)
      .catch(() => setErreur('Impossible de charger les créneaux.'))
      .finally(() => setChargement(false));
  }, [agronomeId]);

  // Mise à jour temps réel des créneaux via WebSocket
  useWebSocket<DisponibiliteSlot>({
    topic: `/topic/slots.${agronomeId}`,
    onMessage: (slotMaj) => {
      setSlots(prev => {
        const index = prev.findIndex(s => s.id === slotMaj.id);
        if (index >= 0) {
          // Mise à jour d'un slot existant
          const updated = [...prev];
          if (slotMaj.statut !== 'LIBRE') {
            // Retire les slots non libres de la vue
            updated.splice(index, 1);
          } else {
            updated[index] = slotMaj;
          }
          return updated;
        }
        // Nouveau slot ajouté par l'agronome
        if (slotMaj.statut === 'LIBRE') return [...prev, slotMaj];
        return prev;
      });
    },
  });

  const confirmerReservation = async () => {
    if (!slotChoisi) return;
    setReservationEnCours(true);
    setErreur(null);

    try {
      const slotReserve = await reserverCreneau({
        slotId: slotChoisi.id,
        notesAgriculteur: notes,
      });

      setSucces(true);
      setSlotChoisi(null);
      setNotes('');

      // Retire le slot de la liste (il n'est plus LIBRE)
      setSlots(prev => prev.filter(s => s.id !== slotChoisi.id));

      onReservationConfirmee?.(slotReserve);

      setTimeout(() => setSucces(false), 4000);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de la réservation.');
    } finally {
      setReservationEnCours(false);
    }
  };

  const slotsParJour = grouperParJour(slots);

  return (
    <div style={{
      background: 'var(--agro-bg-card)',
      border: '0.5px solid var(--agro-border)',
      borderRadius: 'var(--agro-radius-lg)',
      overflow: 'hidden',
    }}>

      {/* En-tête */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--agro-border)',
        background: 'var(--agro-bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
            <i className="ti ti-calendar" style={{ marginRight: 7, color: 'var(--agro-green-dark)' }} aria-hidden="true" />
            Disponibilités de {agronomeNom}
          </div>
          <div style={{ fontSize: 12, color: 'var(--agro-text-muted)', marginTop: 2 }}>
            Sélectionnez un créneau pour prendre rendez-vous
          </div>
        </div>
        <Badge variant="success">
          {slots.length} créneau{slots.length !== 1 ? 'x' : ''} libre{slots.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div style={{ padding: 16 }}>

        {/* Bannières état */}
        {succes && (
          <Banner variant="success" icon="check">
            Demande de rendez-vous envoyée ! {agronomeNom} vous confirmera bientôt.
          </Banner>
        )}
        {erreur && (
          <Banner variant="danger" icon="alert-circle">{erreur}</Banner>
        )}

        {/* Chargement */}
        {chargement && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--agro-text-muted)', fontSize: 13 }}>
            <i className="ti ti-loader-2" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} aria-hidden="true" />
            Chargement du calendrier…
          </div>
        )}

        {/* Aucun créneau */}
        {!chargement && slots.length === 0 && !erreur && (
          <div style={{
            textAlign: 'center', padding: '32px 16px',
            background: 'var(--agro-bg-surface)',
            borderRadius: 'var(--agro-radius-md)',
            border: '0.5px dashed var(--agro-border-strong)',
          }}>
            <i className="ti ti-calendar-off" style={{ fontSize: 32, color: 'var(--agro-text-muted)', display: 'block', marginBottom: 8 }} aria-hidden="true" />
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--agro-text-primary)', marginBottom: 4 }}>
              Aucun créneau disponible
            </div>
            <div style={{ fontSize: 13, color: 'var(--agro-text-muted)' }}>
              Envoyez un message à {agronomeNom} pour convenir d'une date.
            </div>
          </div>
        )}

        {/* Calendrier par jour */}
        {!chargement && slots.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Array.from(slotsParJour.entries()).map(([jour, slotsJour]) => (
              <div key={jour}>
                {/* Entête du jour */}
                <div style={{
                  fontSize: 12, fontWeight: 500, color: 'var(--agro-green-dark)',
                  textTransform: 'capitalize', marginBottom: 10,
                  paddingBottom: 6, borderBottom: '0.5px solid var(--agro-border)',
                }}>
                  <i className="ti ti-calendar-event" style={{ marginRight: 6 }} aria-hidden="true" />
                  {formatJour(slotsJour[0].dateDebut)}
                </div>

                {/* Grille des créneaux */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                  {slotsJour.map(slot => {
                    const estChoisi = slotChoisi?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSlotChoisi(estChoisi ? null : slot)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 'var(--agro-radius-md)',
                          border: estChoisi
                            ? '2px solid var(--agro-green-dark)'
                            : '0.5px solid var(--agro-slot-free-border)',
                          background: estChoisi
                            ? 'var(--agro-slot-selected-bg)'
                            : 'var(--agro-slot-free-bg)',
                          color: estChoisi
                            ? 'var(--agro-slot-selected-text)'
                            : 'var(--agro-slot-free-text)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontFamily: 'inherit',
                          transition: 'all var(--agro-transition)',
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {formatHeure(slot.dateDebut)}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                          → {formatHeure(slot.dateFin)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Panneau de confirmation */}
        {slotChoisi && (
          <div style={{
            marginTop: 20,
            padding: 16,
            background: 'var(--agro-bg-surface)',
            borderRadius: 'var(--agro-radius-md)',
            border: '0.5px solid var(--agro-border-strong)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--agro-text-primary)', marginBottom: 12 }}>
              <i className="ti ti-calendar-check" style={{ marginRight: 6, color: 'var(--agro-green-dark)' }} aria-hidden="true" />
              Confirmer le rendez-vous
            </div>

            {/* Récapitulatif */}
            <div style={{
              background: 'var(--agro-bg-card)',
              border: '0.5px solid var(--agro-border)',
              borderRadius: 'var(--agro-radius-md)',
              padding: '10px 14px',
              marginBottom: 12,
              fontSize: 13,
              color: 'var(--agro-text-secondary)',
            }}>
              <span style={{ fontWeight: 500, color: 'var(--agro-text-primary)' }}>
                {formatJour(slotChoisi.dateDebut)}
              </span>
              {' · '}
              {formatHeure(slotChoisi.dateDebut)} → {formatHeure(slotChoisi.dateFin)}
              {' · '}
              avec {agronomeNom}
            </div>

            {/* Notes optionnelles */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--agro-text-muted)', display: 'block', marginBottom: 5 }}>
                Message pour {agronomeNom} (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: J'ai des problèmes sur mes plants de cacao..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--agro-radius-md)',
                  border: '0.5px solid var(--agro-border-strong)',
                  background: 'var(--agro-bg-input)',
                  color: 'var(--agro-text-primary)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setSlotChoisi(null)}
                style={{ flex: 1 }}
              >
                Annuler
              </Btn>
              <Btn
                variant="primary"
                size="sm"
                onClick={confirmerReservation}
                disabled={reservationEnCours}
                icon={<i className="ti ti-calendar-plus" style={{ fontSize: 13 }} aria-hidden="true" />}
                style={{ flex: 2 }}
              >
                {reservationEnCours ? 'Envoi…' : 'Envoyer la demande'}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
