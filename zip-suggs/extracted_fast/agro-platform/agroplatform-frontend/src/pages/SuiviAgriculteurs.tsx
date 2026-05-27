// =========================================================
// pages/SuiviAgriculteurs.tsx
// Page de suivi des agriculteurs par l'agronome (max 4)
// =========================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Btn, Divider } from '../components/ui';
import {
  getTableauBordSuivi,
  repondreDemandesuivi,
  retirerSuivi,
  mettreAJourDiagnostic,
} from '../services/suiviService';
import { getRdvAgriculteurAgronome } from '../services/agronomeService';
import { usePositionAgronome } from '../hooks/usePositionAgronome';
import type { SuiviAgriculteur, TableauBordSuivi } from '../types/suivi.types';
import type { DisponibiliteSlot } from '../types/agronome.types';

const AGRONOME_ID_TEMP = 1;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

/** Formate une date ISO en "Mer. 22 mai · 08h00" */
function formatRdv(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Section RDV à venir */
function SectionRdv({ agriculteurId, agronomeId, agronomeNom, onClickAgronome }: {
  agriculteurId: number;
  agronomeId: number;
  agronomeNom: string;
  onClickAgronome: () => void;
}) {
  const [rdvs, setRdvs] = useState<DisponibiliteSlot[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    getRdvAgriculteurAgronome(agriculteurId, agronomeId)
      .then(data => setRdvs(
        data
          .filter(s => s.statut === 'CONFIRME' && new Date(s.dateDebut) > new Date())
          .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
          .slice(0, 3) // Afficher max 3 prochains RDV
      ))
      .catch(() => setRdvs([]))
      .finally(() => setChargement(false));
  }, [agriculteurId, agronomeId]);

  return (
    <div style={{ borderLeft: '3px solid var(--agro-brown)', paddingLeft: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--agro-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        Prochains RDV
      </div>
      {chargement ? (
        <div style={{ fontSize: 12, color: 'var(--agro-text-muted)' }}>Chargement…</div>
      ) : rdvs.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--agro-text-muted)', fontStyle: 'italic' }}>
          Aucun rendez-vous à venir.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rdvs.map(rdv => (
            <div key={rdv.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-calendar-event" style={{ fontSize: 13, color: 'var(--agro-brown)', flexShrink: 0 }} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--agro-text-secondary)' }}>
                  {formatRdv(rdv.dateDebut)}
                </div>
                {/* Nom de l'agronome cliquable */}
                <div style={{ fontSize: 11, color: 'var(--agro-text-muted)' }}>
                  avec{' '}
                  <button
                    onClick={onClickAgronome}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: 'var(--agro-green-dark)', fontSize: 11,
                      fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
                      fontFamily: 'inherit',
                    }}
                  >
                    {agronomeNom}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Carte d'un agriculteur suivi */
function CarteAgriculteur({
  suivi,
  agronomeId,
  agronomeNom,
  onRetirer,
  onDiagnosticUpdate,
  onVoirProfilAgronome,
}: {
  suivi: SuiviAgriculteur;
  agronomeId: number;
  agronomeNom: string;
  onRetirer: (id: number) => void;
  onDiagnosticUpdate: (id: number, texte: string) => void;
  onVoirProfilAgronome: (id: number) => void;
}) {
  const [editDiagnostic, setEditDiagnostic] = useState(false);
  const [diagnostic, setDiagnostic] = useState(suivi.dernierDiagnostic ?? '');
  const [sauvegarde, setSauvegarde] = useState(false);

  const handleSauvegarder = async () => {
    setSauvegarde(true);
    await onDiagnosticUpdate(suivi.id, diagnostic);
    setEditDiagnostic(false);
    setSauvegarde(false);
  };

  const initiales = suivi.agriculteurNom
    ? suivi.agriculteurNom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AG';

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: 'var(--agro-green-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 16, fontWeight: 500,
        }}>
          {initiales}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
            {suivi.agriculteurNom ?? `Agriculteur #${suivi.agriculteurId}`}
          </div>
          {suivi.localisation && (
            <div style={{ fontSize: 12, color: 'var(--agro-text-muted)', marginTop: 2 }}>
              <i className="ti ti-map-pin" style={{ fontSize: 11, marginRight: 3 }} aria-hidden="true" />
              {suivi.localisation}
            </div>
          )}
        </div>
        <button
          onClick={() => onRetirer(suivi.id)}
          title="Retirer du suivi"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--agro-text-muted)', fontSize: 16, padding: 4 }}
        >
          <i className="ti ti-x" aria-hidden="true" />
        </button>
      </div>

      {/* Cultures */}
      {suivi.cultures && (
        <div style={{ borderLeft: '3px solid var(--agro-green-light)', paddingLeft: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--agro-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
            Cultures
          </div>
          <div style={{ fontSize: 13, color: 'var(--agro-text-secondary)' }}>{suivi.cultures}</div>
        </div>
      )}

      {/* RDV à venir avec nom agronome cliquable */}
      <SectionRdv
        agriculteurId={suivi.agriculteurId}
        agronomeId={agronomeId}
        agronomeNom={agronomeNom}
        onClickAgronome={() => onVoirProfilAgronome(agronomeId)}
      />

      {/* Diagnostic */}
      <div style={{ borderLeft: '3px solid var(--agro-yellow)', paddingLeft: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--agro-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dernier diagnostic
          </div>
          {!editDiagnostic && (
            <button
              onClick={() => setEditDiagnostic(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--agro-green-dark)', fontSize: 12 }}
            >
              <i className="ti ti-edit" style={{ marginRight: 3 }} aria-hidden="true" />Modifier
            </button>
          )}
        </div>
        {editDiagnostic ? (
          <div>
            <textarea
              value={diagnostic}
              onChange={e => setDiagnostic(e.target.value)}
              rows={3}
              placeholder="Décrivez l'état des cultures, les traitements appliqués..."
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 'var(--agro-radius-md)',
                border: '0.5px solid var(--agro-border-strong)',
                background: 'var(--agro-bg-input)', color: 'var(--agro-text-primary)',
                fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <Btn size="sm" variant="primary" onClick={handleSauvegarder} disabled={sauvegarde}>
                {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder'}
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => { setEditDiagnostic(false); setDiagnostic(suivi.dernierDiagnostic ?? ''); }}>
                Annuler
              </Btn>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: suivi.dernierDiagnostic ? 'var(--agro-text-secondary)' : 'var(--agro-text-muted)', fontStyle: suivi.dernierDiagnostic ? 'normal' : 'italic', lineHeight: 1.5 }}>
            {suivi.dernierDiagnostic ?? 'Aucun diagnostic enregistré.'}
          </p>
        )}
      </div>

      {/* Google Maps */}
      {suivi.localisation && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suivi.localisation)}&key=${GOOGLE_MAPS_API_KEY}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
            color: 'var(--agro-green-dark)', textDecoration: 'none',
            padding: '6px 10px', borderRadius: 'var(--agro-radius-md)',
            background: 'var(--agro-bg-surface)', border: '0.5px solid var(--agro-border)',
          }}
        >
          <i className="ti ti-map" style={{ fontSize: 13 }} aria-hidden="true" />
          Voir sur Google Maps
          <i className="ti ti-external-link" style={{ fontSize: 11, marginLeft: 'auto' }} aria-hidden="true" />
        </a>
      )}
    </Card>
  );
}

/** Carte demande en attente */
function CarteDemandeEnAttente({ suivi, onAccepter, onRefuser, placesDisponibles }: {
  suivi: SuiviAgriculteur;
  onAccepter: (id: number) => void;
  onRefuser: (id: number) => void;
  placesDisponibles: number;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', background: 'var(--agro-bg-surface)',
      border: '0.5px solid var(--agro-border)', borderRadius: 'var(--agro-radius-md)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'var(--agro-warning-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: 'var(--agro-warning-text)', flexShrink: 0,
      }}>
        <i className="ti ti-user-question" aria-hidden="true" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
          {suivi.agriculteurNom ?? `Agriculteur #${suivi.agriculteurId}`}
        </div>
        <div style={{ fontSize: 11, color: 'var(--agro-text-muted)', marginTop: 1 }}>
          {suivi.cultures && <span>🌱 {suivi.cultures} · </span>}
          {suivi.localisation && <span>📍 {suivi.localisation}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <Btn size="sm" variant="primary" disabled={placesDisponibles <= 0}
          onClick={() => onAccepter(suivi.id)}
          title={placesDisponibles <= 0 ? 'Limite de 4 atteinte' : 'Accepter'}>
          <i className="ti ti-check" aria-hidden="true" />
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => onRefuser(suivi.id)}>
          <i className="ti ti-x" aria-hidden="true" />
        </Btn>
      </div>
    </div>
  );
}

// ===== Page principale =====
export function SuiviAgriculteurs() {
  const navigate = useNavigate();
  const [tableau, setTableau] = useState<TableauBordSuivi | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [gpsActif, setGpsActif] = useState(false);

  const positionEtat = usePositionAgronome({ agronomeId: AGRONOME_ID_TEMP, actif: gpsActif });

  const charger = useCallback(() => {
    getTableauBordSuivi(AGRONOME_ID_TEMP)
      .then(setTableau)
      .catch(() => setErreur('Impossible de charger le tableau de bord.'))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const handleAccepter = async (id: number) => {
    try { await repondreDemandesuivi(id, 'ACCEPTE'); charger(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
  };
  const handleRefuser  = async (id: number) => { await repondreDemandesuivi(id, 'REFUSE'); charger(); };
  const handleRetirer  = async (id: number) => {
    if (!confirm('Retirer cet agriculteur de votre suivi ?')) return;
    await retirerSuivi(id); charger();
  };
  const handleDiagnostic = async (id: number, d: string) => { await mettreAJourDiagnostic(id, d); charger(); };

  if (chargement) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--agro-text-muted)' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} aria-hidden="true" />
      Chargement…
    </div>
  );

  if (erreur || !tableau) return <div style={{ color: 'var(--agro-danger-text)', padding: 20 }}>{erreur}</div>;

  const { suivisActifs, demandesEnAttente, nombreActifs, nombreMax, placesDisponibles } = tableau;

  // Nom de l'agronome connecté (sera récupéré depuis le contexte Auth de Joumessi)
  const agronomeNomTemp = 'Jean-Pierre Mbarga';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
            Mes agriculteurs suivis
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--agro-text-muted)' }}>
            {nombreActifs}/{nombreMax} agriculteurs · {placesDisponibles} place{placesDisponibles !== 1 ? 's' : ''} disponible{placesDisponibles !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Toggle GPS */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderRadius: 'var(--agro-radius-md)',
          background: gpsActif ? 'var(--agro-success-bg)' : 'var(--agro-bg-surface)',
          border: '0.5px solid var(--agro-border)',
        }}>
          <i className="ti ti-map-pin" style={{ fontSize: 16, color: gpsActif ? 'var(--agro-green-dark)' : 'var(--agro-text-muted)' }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--agro-text-primary)' }}>Partage de position</div>
            <div style={{ fontSize: 11, color: 'var(--agro-text-muted)' }}>
              {gpsActif
                ? positionEtat.derniereMAJ
                  ? `MàJ ${positionEtat.derniereMAJ.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Activation...'
                : 'Désactivé'}
            </div>
          </div>
          <label style={{ marginLeft: 8, cursor: 'pointer', position: 'relative' }}>
            <input type="checkbox" checked={gpsActif} onChange={e => setGpsActif(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
            <div style={{ width: 40, height: 22, borderRadius: 11, background: gpsActif ? 'var(--agro-green-dark)' : '#d1d5db', transition: 'background 0.2s', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 3, left: gpsActif ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
          </label>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--agro-text-muted)', marginBottom: 6 }}>
          <span>Capacité de suivi</span><span>{nombreActifs}/{nombreMax}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--agro-bg-surface)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${(nombreActifs / nombreMax) * 100}%`, borderRadius: 4,
            background: nombreActifs >= nombreMax ? 'var(--agro-danger-text)' : 'var(--agro-green-dark)',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Demandes en attente */}
      {demandesEnAttente.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--agro-text-primary)' }}>Demandes en attente</h2>
            <Badge variant="warning">{demandesEnAttente.length}</Badge>
            {placesDisponibles <= 0 && <Badge variant="danger">Limite atteinte</Badge>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {demandesEnAttente.map(s => (
              <CarteDemandeEnAttente key={s.id} suivi={s}
                onAccepter={handleAccepter} onRefuser={handleRefuser}
                placesDisponibles={placesDisponibles} />
            ))}
          </div>
          <Divider margin="20px 0 0" />
        </div>
      )}

      {/* Agriculteurs suivis */}
      <div>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
          <i className="ti ti-users" style={{ marginRight: 8, color: 'var(--agro-green-dark)' }} aria-hidden="true" />
          Suivi actif
        </h2>
        {suivisActifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--agro-bg-surface)', borderRadius: 'var(--agro-radius-lg)', border: '0.5px dashed var(--agro-border-strong)' }}>
            <i className="ti ti-users-group" style={{ fontSize: 36, color: 'var(--agro-text-muted)', display: 'block', marginBottom: 10 }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: 14, color: 'var(--agro-text-muted)' }}>Vous ne suivez aucun agriculteur pour le moment.</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--agro-text-muted)' }}>Les agriculteurs envoient une demande depuis votre profil.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {suivisActifs.map(s => (
              <CarteAgriculteur
                key={s.id}
                suivi={s}
                agronomeId={AGRONOME_ID_TEMP}
                agronomeNom={agronomeNomTemp}
                onRetirer={handleRetirer}
                onDiagnosticUpdate={handleDiagnostic}
                onVoirProfilAgronome={id => navigate(`/agronomes/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
