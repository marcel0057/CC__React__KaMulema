// =========================================================
// pages/ListeAgronomes.tsx — version thème (Tâches 1 & 2)
// =========================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgronomeCard } from '../components/agronomes/AgronomeCard';
import { Banner, Select, StatCard } from '../components/ui';
import { useAgronomes } from '../hooks/useAgronomes';
import { useGeolocation } from '../hooks/useGeolocation';
import type { FiltreAgronomes } from '../types/agronome.types';

const SPECIALITES = [
  { value: '',                          label: 'Toutes les spécialités' },
  { value: 'Phytopathologie',           label: 'Phytopathologie' },
  { value: 'Sol & Fertilisation',       label: 'Sol & Fertilisation' },
  { value: 'Agronomie générale',        label: 'Agronomie générale' },
  { value: 'Élevage & Zootechnie',      label: 'Élevage & Zootechnie' },
  { value: "Cultures d'exportation",    label: "Cultures d'exportation" },
  { value: 'Agriculture biologique',    label: 'Agriculture biologique' },
  { value: 'Irrigation & Hydraulique',  label: 'Irrigation & Hydraulique' },
  { value: 'Cultures céréalières',      label: 'Cultures céréalières' },
  { value: 'Maraîchage',               label: 'Maraîchage' },
  { value: 'Agroforesterie',           label: 'Agroforesterie' },
];

const EXPERIENCES = [
  { value: '0',  label: 'Toutes' },
  { value: '3',  label: '3+ ans' },
  { value: '5',  label: '5+ ans' },
  { value: '10', label: '10+ ans' },
  { value: '15', label: '15+ ans' },
];

export function ListeAgronomes() {
  const navigate = useNavigate();
  const { position, loading: geoLoading, error: geoError, retry: retryGeo } = useGeolocation();

  const [filtres, setFiltres] = useState<FiltreAgronomes>({
    rayonKm: 50,
    disponibleSeulement: false,
  });

  const { agronomes, loading, error, rayonActuel, rayonElargi, elargirRecherche } = useAgronomes({
    ...filtres,
    latitude: position?.latitude,
    longitude: position?.longitude,
  });

  const disponibles = agronomes.filter(a => a.disponible).length;
  const noteMoy = agronomes.length
    ? (agronomes.reduce((s, a) => s + a.noteMoyenne, 0) / agronomes.length).toFixed(1)
    : '—';

  return (
    <div style={{
      maxWidth: 960,
      margin: '0 auto',
      padding: '28px 20px',
    }}>

      {/* En-tête */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
          Ingénieurs agronomes
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--agro-text-muted)' }}>
          Trouvez un expert près de chez vous
        </p>
      </div>

      {/* Bannières géolocalisation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {geoLoading && (
          <Banner variant="warning" icon="map-pin">
            Récupération de votre position en cours…
          </Banner>
        )}
        {geoError && (
          <Banner variant="danger" icon="map-pin-off" action={{ label: 'Réessayer', onClick: retryGeo }}>
            {geoError}
          </Banner>
        )}
        {position && (
          <Banner variant="success" icon="map-pin">
            Position détectée — rayon de{' '}
            <strong>{rayonActuel} km</strong>
            {rayonElargi && ' (élargi automatiquement)'}
          </Banner>
        )}
      </div>

      {/* Stats rapides */}
      {!loading && agronomes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          <StatCard label="Trouvés" value={agronomes.length} sub="dans la zone" color="green" />
          <StatCard label="Disponibles" value={disponibles} sub="en ce moment" color="green" />
          <StatCard label="Note moyenne" value={noteMoy} sub="sur 5 étoiles" color="yellow" />
          <StatCard label="Rayon actuel" value={`${rayonActuel} km`} sub="autour de vous" color="default" />
        </div>
      )}

      {/* Barre de filtres */}
      <div style={{
        background: 'var(--agro-bg-surface)',
        border: '0.5px solid var(--agro-border)',
        borderRadius: 'var(--agro-radius-lg)',
        padding: '14px 16px',
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
      }}>
        <Select
          label="Spécialité"
          options={SPECIALITES}
          value={filtres.specialite ?? ''}
          onChange={e => setFiltres(f => ({ ...f, specialite: e.target.value || undefined }))}
        />
        <Select
          label="Expérience min."
          options={EXPERIENCES}
          value={String(filtres.experienceMin ?? 0)}
          onChange={e => setFiltres(f => ({ ...f, experienceMin: Number(e.target.value) || undefined }))}
        />
        <label style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 13, color: 'var(--agro-text-secondary)', cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={filtres.disponibleSeulement}
            onChange={e => setFiltres(f => ({ ...f, disponibleSeulement: e.target.checked }))}
            style={{ width: 15, height: 15, accentColor: 'var(--agro-green-dark)' }}
          />
          Disponibles uniquement
        </label>
        {!loading && (
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--agro-text-muted)' }}>
            {agronomes.length} agronome{agronomes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Chargement */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--agro-text-muted)' }}>
          <i className="ti ti-loader-2" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} aria-hidden="true" />
          Recherche en cours…
        </div>
      )}

      {/* Erreur */}
      {error && (
        <Banner variant="danger" icon="alert-circle">{error}</Banner>
      )}

      {/* Aucun résultat */}
      {!loading && !error && agronomes.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'var(--agro-bg-surface)',
          borderRadius: 'var(--agro-radius-lg)',
          border: '0.5px dashed var(--agro-border-strong)',
        }}>
          <i className="ti ti-seeding" style={{ fontSize: 40, color: 'var(--agro-green-light)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--agro-text-primary)', margin: '0 0 6px' }}>
            Aucun agronome dans un rayon de {rayonActuel} km
          </p>
          <p style={{ fontSize: 13, color: 'var(--agro-text-muted)', margin: '0 0 18px' }}>
            Élargissez la zone de recherche pour trouver des experts disponibles
          </p>
          <button
            onClick={elargirRecherche}
            style={{
              padding: '10px 24px',
              background: 'var(--agro-green-dark)',
              color: '#fff', border: 'none',
              borderRadius: 'var(--agro-radius-md)',
              fontWeight: 500, fontSize: 14, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <i className="ti ti-zoom-in" style={{ marginRight: 6 }} aria-hidden="true" />
            Élargir la recherche
          </button>
        </div>
      )}

      {/* Grille */}
      {!loading && agronomes.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))',
          gap: 16,
        }}>
          {agronomes.map(a => (
            <AgronomeCard
              key={a.id}
              agronome={a}
              onVoirProfil={id => navigate(`/agronomes/${id}`)}
              onContacter={id => navigate(`/agronomes/${id}/contacter`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
