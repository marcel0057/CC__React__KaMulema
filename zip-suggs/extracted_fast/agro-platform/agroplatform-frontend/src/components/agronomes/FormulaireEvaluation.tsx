// =========================================================
// components/agronomes/FormulaireEvaluation.tsx — Tâche 5
// Formulaire de notation d'un agronome après RDV confirmé
// =========================================================

import React, { useState, useEffect } from 'react';
import { Btn, Card } from '../ui';
import { soumettreEvaluation, peutEvaluer } from '../../services/agronomeService';
import type { EvaluationRequest } from '../../types/agronome.types';

interface Props {
  agronomeId: number;
  agronomeNom: string;
  agriculteurId: number;
  slotId: number;
  onEvaluationSoumise?: (note: number) => void;
}

const LABELS_NOTE: Record<number, string> = {
  1: 'Très insatisfait',
  2: 'Insatisfait',
  3: 'Correct',
  4: 'Satisfait',
  5: 'Excellent !',
};

export function FormulaireEvaluation({
  agronomeId,
  agronomeNom,
  agriculteurId,
  slotId,
  onEvaluationSoumise,
}: Props) {
  const [note, setNote] = useState<number>(0);
  const [survol, setSurvol] = useState<number>(0);
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [autorise, setAutorise] = useState<boolean | null>(null);
  const [verification, setVerification] = useState(true);

  // Vérifier si l'agriculteur peut évaluer
  useEffect(() => {
    peutEvaluer(agronomeId, agriculteurId, slotId)
      .then(r => setAutorise(r.peutEvaluer))
      .catch(() => setAutorise(false))
      .finally(() => setVerification(false));
  }, [agronomeId, agriculteurId, slotId]);

  const handleSoumettre = async () => {
    if (note === 0) {
      setErreur('Veuillez sélectionner une note.');
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      const req: EvaluationRequest = {
        agronomeId,
        agriculteurId,
        slotId,
        note,
        commentaire: commentaire.trim() || undefined,
      };
      await soumettreEvaluation(req);
      setSucces(true);
      onEvaluationSoumise?.(note);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de l\'envoi.');
    } finally {
      setEnvoi(false);
    }
  };

  // Chargement vérification
  if (verification) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--agro-text-muted)', fontSize: 13 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 20, display: 'block', marginBottom: 6 }} aria-hidden="true" />
          Vérification en cours…
        </div>
      </Card>
    );
  }

  // Non autorisé
  if (!autorise) {
    return (
      <Card>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '4px 0',
        }}>
          <i className="ti ti-info-circle" style={{ fontSize: 20, color: 'var(--agro-text-muted)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
              Évaluation non disponible
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--agro-text-muted)', lineHeight: 1.5 }}>
              Vous pourrez évaluer {agronomeNom} uniquement après un rendez-vous confirmé,
              et une seule fois par rendez-vous.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Succès
  if (succes) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <i className="ti ti-circle-check" style={{ fontSize: 36, color: 'var(--agro-green-dark)', display: 'block', marginBottom: 10 }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
            Merci pour votre évaluation !
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '10px 0 6px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} style={{ fontSize: 22, color: i <= note ? 'var(--agro-yellow)' : 'var(--agro-border-strong)' }}>★</span>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--agro-text-muted)' }}>
            Votre note de <strong>{note}/5</strong> a bien été enregistrée
            et la note de {agronomeNom} a été mise à jour.
          </p>
        </div>
      </Card>
    );
  }

  const noteAffichee = survol || note;

  return (
    <Card>
      {/* Titre */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
          <i className="ti ti-star" style={{ marginRight: 8, color: 'var(--agro-yellow)' }} aria-hidden="true" />
          Évaluer {agronomeNom}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--agro-text-muted)' }}>
          Votre avis aide les autres agriculteurs à choisir le bon expert.
        </p>
      </div>

      {/* Étoiles cliquables */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--agro-text-secondary)', fontWeight: 500 }}>
          Note *
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <span
              key={i}
              onMouseEnter={() => setSurvol(i)}
              onMouseLeave={() => setSurvol(0)}
              onClick={() => setNote(i)}
              style={{
                fontSize: 32,
                cursor: 'pointer',
                color: i <= noteAffichee ? 'var(--agro-yellow)' : 'var(--agro-border-strong)',
                transition: 'color 0.1s, transform 0.1s',
                transform: i <= noteAffichee ? 'scale(1.15)' : 'scale(1)',
                display: 'inline-block',
                userSelect: 'none',
              }}
              role="button"
              aria-label={`Note ${i}`}
            >
              ★
            </span>
          ))}
          {noteAffichee > 0 && (
            <span style={{
              fontSize: 13, color: 'var(--agro-text-secondary)',
              marginLeft: 8, fontWeight: 500,
            }}>
              {LABELS_NOTE[noteAffichee]}
            </span>
          )}
        </div>
      </div>

      {/* Commentaire */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--agro-text-secondary)', fontWeight: 500, marginBottom: 6 }}>
          Commentaire (optionnel)
        </label>
        <textarea
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Décrivez votre expérience avec cet agronome…"
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
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--agro-green-light)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--agro-border-strong)'; }}
        />
        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--agro-text-muted)', marginTop: 3 }}>
          {commentaire.length}/1000
        </div>
      </div>

      {/* Erreur */}
      {erreur && (
        <div style={{
          padding: '8px 12px', borderRadius: 'var(--agro-radius-md)',
          background: 'var(--agro-danger-bg)', color: 'var(--agro-danger-text)',
          fontSize: 13, marginBottom: 12,
        }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 6 }} aria-hidden="true" />
          {erreur}
        </div>
      )}

      {/* Bouton */}
      <Btn
        variant="yellow"
        fullWidth
        disabled={envoi || note === 0}
        onClick={handleSoumettre}
        icon={<i className="ti ti-send" style={{ fontSize: 14 }} aria-hidden="true" />}
        style={note === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
      >
        {envoi ? 'Envoi en cours…' : 'Soumettre mon évaluation'}
      </Btn>
    </Card>
  );
}
