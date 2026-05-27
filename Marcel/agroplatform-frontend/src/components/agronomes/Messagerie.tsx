// =========================================================
// components/agronomes/Messagerie.tsx — Tâche 3
// Chat WebSocket temps réel agriculteur <-> agronome
// =========================================================

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getConversation, marquerLus } from '../../services/agronomeService';
import { Avatar, Badge } from '../ui';
import type { Agronome } from '../../types/agronome.types';

// ===== Types =====
export interface MessageDTO {
  id: number;
  agriculteurId: number;
  agronomeId: number;
  agronomeNomComplet: string;
  expediteur: 'AGRICULTEUR' | 'AGRONOME';
  contenu: string;
  lu: boolean;
  createdAt: string;
}

interface Props {
  agronome: Agronome;
  agriculteurId: number;
  agriculteurInitiales?: string;
}

// ===== Helpers =====
function formatHeure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' });
}

// ===== Composant =====
export function Messagerie({ agronome, agriculteurId, agriculteurInitiales = 'AG' }: Props) {
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [saisie, setSaisie] = useState('');
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const basRef = useRef<HTMLDivElement>(null);

  const topic = `/topic/conversation.${agronome.id}.${agriculteurId}`;
  const agronomeInitiales = `${agronome.prenom[0]}${agronome.nom[0]}`.toUpperCase();

  // Chargement de l'historique au montage
  useEffect(() => {
    setChargement(true);
    getConversation(agriculteurId, agronome.id)
      .then(setMessages)
      .finally(() => setChargement(false));

    // Marquer comme lus
    marquerLus(agriculteurId, agronome.id).catch(console.error);
  }, [agronome.id, agriculteurId]);

  // Scroll automatique vers le bas
  useEffect(() => {
    basRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Abonnement WebSocket — reçoit les nouveaux messages en temps réel
  const { publish } = useWebSocket<MessageDTO>({
    topic,
    onMessage: (msg) => {
      setMessages(prev => {
        // Évite les doublons si le message vient de nous-mêmes
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
  });

  const envoyerMessage = async () => {
    const contenu = saisie.trim();
    if (!contenu || envoi) return;

    setEnvoi(true);
    setSaisie('');

    // Affichage optimiste immédiat
    const tempMsg: MessageDTO = {
      id: Date.now(), // id temporaire
      agriculteurId,
      agronomeId: agronome.id,
      agronomeNomComplet: `${agronome.prenom} ${agronome.nom}`,
      expediteur: 'AGRICULTEUR',
      contenu,
      lu: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    // Envoi via WebSocket
    publish('/app/message.envoyer', {
      agronomeId: agronome.id,
      agriculteurId,
      expediteur: 'AGRICULTEUR',
      contenu,
    });

    setEnvoi(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      envoyerMessage();
    }
  };

  return (
    <div style={{
      background: 'var(--agro-bg-card)',
      border: '0.5px solid var(--agro-border)',
      borderRadius: 'var(--agro-radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      height: 520,
      overflow: 'hidden',
    }}>

      {/* En-tête */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--agro-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--agro-bg-surface)',
      }}>
        <Avatar
          initiales={agronomeInitiales}
          photoUrl={agronome.photoUrl}
          disponible={agronome.disponible}
          size={38}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--agro-text-primary)' }}>
            {agronome.prenom} {agronome.nom}
          </div>
          <div style={{ fontSize: 12, color: 'var(--agro-green-light)' }}>
            {agronome.disponible ? 'En ligne' : 'Hors ligne'}
          </div>
        </div>
        <Badge variant="warning">
          <i className="ti ti-calendar" style={{ fontSize: 11 }} aria-hidden="true" />
          {agronome.specialite}
        </Badge>
      </div>

      {/* Zone de messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {chargement && (
          <div style={{ textAlign: 'center', color: 'var(--agro-text-muted)', fontSize: 13, padding: 20 }}>
            <i className="ti ti-loader-2" style={{ fontSize: 20, display: 'block', marginBottom: 6 }} aria-hidden="true" />
            Chargement…
          </div>
        )}

        {!chargement && messages.length === 0 && (
          <div style={{
            textAlign: 'center', color: 'var(--agro-text-muted)',
            fontSize: 13, padding: '32px 0',
          }}>
            <i className="ti ti-messages" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.4 }} aria-hidden="true" />
            Commencez la conversation avec {agronome.prenom}
          </div>
        )}

        {messages.map((msg) => {
          const estMoi = msg.expediteur === 'AGRICULTEUR';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: estMoi ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Bulle */}
              <div style={{
                maxWidth: '72%',
                padding: '10px 14px',
                borderRadius: estMoi ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: estMoi ? 'var(--agro-chat-out-bg)' : 'var(--agro-chat-in-bg)',
                color: estMoi ? 'var(--agro-chat-out-text)' : 'var(--agro-chat-in-text)',
                border: estMoi ? 'none' : '0.5px solid var(--agro-chat-in-border)',
                fontSize: 13,
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}>
                {msg.contenu}
              </div>

              {/* Heure */}
              <span style={{
                fontSize: 10,
                color: 'var(--agro-text-muted)',
                marginTop: 3,
                marginLeft: estMoi ? 0 : 4,
                marginRight: estMoi ? 4 : 0,
              }}>
                {formatHeure(msg.createdAt)}
                {estMoi && (
                  <i
                    className={`ti ${msg.lu ? 'ti-checks' : 'ti-check'}`}
                    style={{ fontSize: 10, marginLeft: 4, color: msg.lu ? 'var(--agro-green-light)' : 'inherit' }}
                    aria-hidden="true"
                  />
                )}
              </span>
            </div>
          );
        })}
        <div ref={basRef} />
      </div>

      {/* Zone de saisie */}
      <div style={{
        padding: '12px 14px',
        borderTop: '0.5px solid var(--agro-border)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        background: 'var(--agro-bg-surface)',
      }}>
        <textarea
          value={saisie}
          onChange={e => setSaisie(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message… (Entrée pour envoyer)"
          rows={1}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--agro-radius-md)',
            border: '0.5px solid var(--agro-border-strong)',
            background: 'var(--agro-bg-input)',
            color: 'var(--agro-text-primary)',
            fontSize: 13,
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            maxHeight: 100,
            overflowY: 'auto',
          }}
        />
        <button
          onClick={envoyerMessage}
          disabled={!saisie.trim() || envoi}
          style={{
            width: 38, height: 38,
            borderRadius: 'var(--agro-radius-md)',
            background: saisie.trim() ? 'var(--agro-green-dark)' : 'var(--agro-bg-surface)',
            border: '0.5px solid var(--agro-border)',
            color: saisie.trim() ? '#fff' : 'var(--agro-text-muted)',
            cursor: saisie.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background var(--agro-transition)',
          }}
        >
          <i className="ti ti-send" style={{ fontSize: 16 }} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
