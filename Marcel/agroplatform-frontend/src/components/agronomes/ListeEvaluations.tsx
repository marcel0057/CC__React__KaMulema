// =========================================================
// components/agronomes/ListeEvaluations.tsx — Tâche 5
// Affichage public des évaluations sur le profil agronome
// =========================================================

import React, { useState, useEffect } from 'react';
import { Etoiles, Card } from '../ui';
import { getEvaluations } from '../../services/agronomeService';
import type { EvaluationAgronome } from '../../types/agronome.types';

interface Props {
  agronomeId: number;
  noteMoyenne: number;
  nombreEvaluations: number;
}

/** Barre de distribution des notes (5★, 4★, 3★...) */
function BarreDistribution({ evaluations }: { evaluations: EvaluationAgronome[] }) {
  const total = evaluations.length;
  if (total === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 20 }}>
      {[5, 4, 3, 2, 1].map(n => {
        const count = evaluations.filter(e => e.note === n).length;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--agro-text-muted)', width: 20, textAlign: 'right' }}>{n}</span>
            <span style={{ fontSize: 12, color: 'var(--agro-yellow)' }}>★</span>
            <div style={{
              flex: 1, height: 8, borderRadius: 4,
              background: 'var(--agro-bg-surface)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: n >= 4
                  ? 'var(--agro-green-dark)'
                  : n === 3
                    ? 'var(--agro-yellow)'
                    : 'var(--agro-danger-text)',
                borderRadius: 4,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--agro-text-muted)', width: 24 }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Formate une date ISO en "21 mai 2026" */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function ListeEvaluations({ agronomeId, noteMoyenne, nombreEvaluations }: Props) {
  const [evaluations, setEvaluations] = useState<EvaluationAgronome[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    getEvaluations(agronomeId)
      .then(setEvaluations)
      .catch(() => setErreur('Impossible de charger les évaluations.'))
      .finally(() => setChargement(false));
  }, [agronomeId]);

  if (chargement) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--agro-text-muted)', fontSize: 13 }}>
        <i className="ti ti-loader-2" style={{ fontSize: 20, display: 'block', marginBottom: 6 }} aria-hidden="true" />
        Chargement des avis…
      </div>
    );
  }

  if (erreur) {
    return (
      <div style={{ color: 'var(--agro-danger-text)', fontSize: 13, padding: '12px 0' }}>
        <i className="ti ti-alert-circle" style={{ marginRight: 6 }} aria-hidden="true" />
        {erreur}
      </div>
    );
  }

  return (
    <div>
      {/* Résumé global */}
      <div style={{
        display: 'flex', gap: 24, alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap',
      }}>
        {/* Note globale */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 300, color: 'var(--agro-green-dark)', lineHeight: 1 }}>
            {noteMoyenne.toFixed(1)}
          </div>
          <Etoiles note={noteMoyenne} size={16} />
          <div style={{ fontSize: 12, color: 'var(--agro-text-muted)', marginTop: 4 }}>
            {nombreEvaluations} avis
          </div>
        </div>

        {/* Barres de distribution */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <BarreDistribution evaluations={evaluations} />
        </div>
      </div>

      {/* Liste des avis */}
      {evaluations.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 20px',
          background: 'var(--agro-bg-surface)',
          borderRadius: 'var(--agro-radius-lg)',
          border: '0.5px dashed var(--agro-border-strong)',
        }}>
          <i className="ti ti-star-off" style={{ fontSize: 32, color: 'var(--agro-text-muted)', display: 'block', marginBottom: 10 }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 14, color: 'var(--agro-text-muted)' }}>
            Aucune évaluation pour le moment.
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--agro-text-muted)' }}>
            Soyez le premier à laisser un avis après votre rendez-vous.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {evaluations.map(ev => (
            <Card key={ev.id} padding="14px 16px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                {/* Avatar anonyme + note */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--agro-bg-surface)',
                    border: '0.5px solid var(--agro-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: 'var(--agro-text-muted)',
                  }}>
                    <i className="ti ti-user" aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
                      Agriculteur #{ev.agriculteurId}
                    </div>
                    <Etoiles note={ev.note} size={13} />
                  </div>
                </div>

                {/* Date */}
                <span style={{ fontSize: 11, color: 'var(--agro-text-muted)' }}>
                  {ev.createdAt ? formatDate(ev.createdAt) : ''}
                </span>
              </div>

              {/* Commentaire */}
              {ev.commentaire && (
                <p style={{
                  margin: 0, fontSize: 13, color: 'var(--agro-text-secondary)',
                  lineHeight: 1.6, fontStyle: 'italic',
                  paddingLeft: 46,
                }}>
                  "{ev.commentaire}"
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
