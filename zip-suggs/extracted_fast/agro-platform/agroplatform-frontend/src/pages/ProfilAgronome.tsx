// =========================================================
// pages/ProfilAgronome.tsx — Tâches 1, 3 & 4 réunies
// Profil détaillé + messagerie + calendrier de RDV
// =========================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAgronome } from '../services/agronomeService';
import { Messagerie } from '../components/agronomes/Messagerie';
import { FormulaireEvaluation } from '../components/agronomes/FormulaireEvaluation';
import { ListeEvaluations } from '../components/agronomes/ListeEvaluations';
import { CalendrierDisponibilites } from '../components/agronomes/CalendrierDisponibilites';
import { Avatar, Badge, Etoiles, AccentStrip, Card, StatCard } from '../components/ui';
import type { Agronome, DisponibiliteSlot } from '../types/agronome.types';

// ID agriculteur connecté — sera remplacé par le contexte Auth de Joumessi
const AGRICULTEUR_ID_TEMP = 1;
const AGRICULTEUR_INITIALES_TEMP = 'MA';

type Onglet = 'profil' | 'messages' | 'rdv';

export function ProfilAgronome() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agronome, setAgronome] = useState<Agronome | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<Onglet>('profil');

  useEffect(() => {
    if (!id) return;
    setChargement(true);
    getAgronome(Number(id))
      .then(setAgronome)
      .catch(() => setErreur('Agronome introuvable.'))
      .finally(() => setChargement(false));
  }, [id]);

  if (chargement) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--agro-text-muted)' }}>
        <i className="ti ti-loader-2" style={{ fontSize: 36, display: 'block', marginBottom: 10 }} aria-hidden="true" />
        Chargement du profil…
      </div>
    );
  }

  if (erreur || !agronome) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--agro-text-muted)' }}>
        <i className="ti ti-user-off" style={{ fontSize: 40, display: 'block', marginBottom: 10 }} aria-hidden="true" />
        {erreur ?? 'Agronome introuvable.'}
        <br />
        <button
          onClick={() => navigate('/agronomes')}
          style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--agro-green-dark)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const initiales = `${agronome.prenom[0]}${agronome.nom[0]}`.toUpperCase();

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>

      {/* Bouton retour */}
      <button
        onClick={() => navigate('/agronomes')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--agro-text-muted)', fontSize: 13, marginBottom: 20,
          fontFamily: 'inherit', padding: 0,
        }}
      >
        <i className="ti ti-arrow-left" style={{ fontSize: 15 }} aria-hidden="true" />
        Retour à la liste
      </button>

      {/* Carte profil principale */}
      <Card style={{ marginBottom: 20, padding: '24px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar initiales={initiales} photoUrl={agronome.photoUrl} disponible={agronome.disponible} size={72} />

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
                {agronome.prenom} {agronome.nom}
              </h1>
              <Badge variant={agronome.disponible ? 'success' : 'danger'}>
                {agronome.disponible ? '● Disponible' : '○ Indisponible'}
              </Badge>
            </div>

            <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--agro-text-secondary)' }}>
              <i className="ti ti-certificate" style={{ fontSize: 13, marginRight: 5 }} aria-hidden="true" />
              {agronome.specialite} · {agronome.anneesExperience} ans d'expérience
            </p>

            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--agro-text-muted)' }}>
              <i className="ti ti-map-pin" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true" />
              {agronome.ville}
              {agronome.departement && `, ${agronome.departement}`}
              {agronome.region && ` · Région ${agronome.region}`}
              {agronome.distanceKm !== undefined && (
                <span style={{ color: 'var(--agro-green-dark)', fontWeight: 600 }}>
                  {' '}· {agronome.distanceKm} km de vous
                </span>
              )}
            </p>

            <Etoiles note={agronome.noteMoyenne} count={agronome.nombreEvaluations} size={16} />
          </div>

          {/* Actions rapides */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
            <button
              onClick={() => setOnglet('messages')}
              style={{
                padding: '9px 16px', borderRadius: 'var(--agro-radius-md)',
                background: 'var(--agro-green-dark)', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'inherit',
              }}
            >
              <i className="ti ti-message" style={{ fontSize: 14 }} aria-hidden="true" />
              Envoyer un message
            </button>
            <button
              onClick={() => setOnglet('rdv')}
              disabled={!agronome.disponible}
              style={{
                padding: '9px 16px', borderRadius: 'var(--agro-radius-md)',
                background: 'transparent', color: 'var(--agro-green-dark)',
                border: '1px solid var(--agro-green-dark)', cursor: agronome.disponible ? 'pointer' : 'not-allowed',
                fontSize: 13, fontWeight: 500, opacity: agronome.disponible ? 1 : 0.45,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'inherit',
              }}
            >
              <i className="ti ti-calendar-plus" style={{ fontSize: 14 }} aria-hidden="true" />
              Prendre rendez-vous
            </button>
          </div>
        </div>

        {/* Bio */}
        {agronome.bio && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '0.5px solid var(--agro-border)' }}>
            <AccentStrip
              title="À propos"
              text={agronome.bio}
              color="green"
            />
          </div>
        )}
      </Card>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        <StatCard label="Note moyenne" value={agronome.noteMoyenne.toFixed(1)} sub="sur 5 étoiles" color="yellow" />
        <StatCard label="Évaluations" value={agronome.nombreEvaluations} sub="agriculteurs" color="green" />
        <StatCard label="Expérience" value={`${agronome.anneesExperience} ans`} sub="de terrain" color="default" />
        <StatCard
          label="Statut"
          value={agronome.disponible ? 'Actif' : 'Absent'}
          sub={agronome.disponible ? 'Répond rapidement' : 'Temporairement absent'}
          color={agronome.disponible ? 'green' : 'default'}
        />
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '0.5px solid var(--agro-border)', marginBottom: 20 }}>
        {([ 
          { key: 'profil', label: 'Profil & Avis', icon: 'ti-user' },
          { key: 'messages', label: 'Messages', icon: 'ti-message' },
          { key: 'rdv', label: 'Rendez-vous', icon: 'ti-calendar' },
        ] as { key: Onglet; label: string; icon: string }[]).map(o => (
          <button
            key={o.key}
            onClick={() => setOnglet(o.key)}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: onglet === o.key ? 500 : 400,
              color: onglet === o.key ? 'var(--agro-green-dark)' : 'var(--agro-text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: onglet === o.key ? '2px solid var(--agro-green-dark)' : '2px solid transparent',
              marginBottom: '-0.5px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'inherit',
              transition: 'color var(--agro-transition)',
            }}
          >
            <i className={`ti ${o.icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
            {o.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      {onglet === 'profil' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Infos profil */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AccentStrip
              title="Spécialité principale"
              text={`${agronome.specialite} — ${agronome.anneesExperience} ans d'expérience terrain dans la région ${agronome.region ?? agronome.ville}.`}
              color="green"
            />
            <AccentStrip
              title="Localisation"
              text={`Basé à ${agronome.ville}${agronome.departement ? `, département du ${agronome.departement}` : ''}. Intervient sur toute la région ${agronome.region ?? ''}.`}
              color="yellow"
            />
          </div>

          {/* Évaluations publiques */}
          <div>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
              <i className="ti ti-star" style={{ marginRight: 8, color: 'var(--agro-yellow)' }} aria-hidden="true" />
              Avis des agriculteurs
            </h3>
            <ListeEvaluations
              agronomeId={agronome.id}
              noteMoyenne={agronome.noteMoyenne}
              nombreEvaluations={agronome.nombreEvaluations}
            />
          </div>

          {/* Formulaire d'évaluation */}
          <div>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
              <i className="ti ti-edit" style={{ marginRight: 8, color: 'var(--agro-green-dark)' }} aria-hidden="true" />
              Laisser un avis
            </h3>
            <FormulaireEvaluation
              agronomeId={agronome.id}
              agronomeNom={`${agronome.prenom} ${agronome.nom}`}
              agriculteurId={AGRICULTEUR_ID_TEMP}
              slotId={1}
              onEvaluationSoumise={(note) => {
                setAgronome(prev => prev ? {
                  ...prev,
                  noteMoyenne: Math.round(((prev.noteMoyenne * prev.nombreEvaluations + note) / (prev.nombreEvaluations + 1)) * 10) / 10,
                  nombreEvaluations: prev.nombreEvaluations + 1,
                } : prev);
              }}
            />
          </div>
        </div>
      )}

      {onglet === 'messages' && (
        <Messagerie
          agronome={agronome}
          agriculteurId={AGRICULTEUR_ID_TEMP}
          agriculteurInitiales={AGRICULTEUR_INITIALES_TEMP}
        />
      )}

      {onglet === 'rdv' && (
        <CalendrierDisponibilites
          agronomeId={agronome.id}
          agronomeNom={`${agronome.prenom} ${agronome.nom}`}
          agriculteurId={AGRICULTEUR_ID_TEMP}
          onReservationConfirmee={(slot: DisponibiliteSlot) => {
            // Basculer sur l'onglet messages après réservation
            setTimeout(() => setOnglet('messages'), 2000);
          }}
        />
      )}
    </div>
  );
}
