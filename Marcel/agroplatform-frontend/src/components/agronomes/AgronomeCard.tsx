// =========================================================
// components/agronomes/AgronomeCard.tsx — version thème
// =========================================================

import React from 'react';
import { Avatar, Badge, Btn, Etoiles } from '../ui';
import type { Agronome } from '../../types/agronome.types';

interface Props {
  agronome: Agronome;
  onVoirProfil: (id: number) => void;
  onContacter: (id: number) => void;
}

export function AgronomeCard({ agronome, onVoirProfil, onContacter }: Props) {
  const initiales = `${agronome.prenom[0]}${agronome.nom[0]}`.toUpperCase();

  return (
    <div style={{
      background: 'var(--agro-bg-card)',
      border: '0.5px solid var(--agro-border)',
      borderRadius: 'var(--agro-radius-lg)',
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: 'var(--agro-shadow-card)',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Avatar
          initiales={initiales}
          photoUrl={agronome.photoUrl}
          disponible={agronome.disponible}
          size={48}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
              {agronome.prenom} {agronome.nom}
            <Badge variant={agronome.disponible ? 'success' : 'danger'}>
              {agronome.disponible ? '● Disponible' : '○ Indisponible'}
            </Badge>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--agro-text-secondary)' }}>
            {agronome.specialite} · {agronome.anneesExperience} ans d'expérience
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--agro-text-muted)' }}>
            <i className="ti ti-map-pin" style={{ fontSize: 11 }} aria-hidden="true" />{' '}
            {agronome.ville}{agronome.departement && `, ${agronome.departement}`}
            {agronome.distanceKm !== undefined && (
              <span style={{ color: 'var(--agro-green-dark)', fontWeight: 600 }}>
                {' '}· {agronome.distanceKm} km
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Notation */}
      <Etoiles note={agronome.noteMoyenne} count={agronome.nombreEvaluations} />

      {/* Bio */}
      {agronome.bio && (
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--agro-text-muted)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {agronome.bio}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <Btn variant="outline" size="sm" fullWidth onClick={() => onVoirProfil(agronome.id)}>
          Voir le profil
        </Btn>
        <Btn
          variant="primary" size="sm" fullWidth
          disabled={!agronome.disponible}
          onClick={() => onContacter(agronome.id)}
          icon={<i className="ti ti-message" style={{ fontSize: 13 }} aria-hidden="true" />}
          style={!agronome.disponible ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          Contacter
        </Btn>
      </div>
    </div>
  );
}
