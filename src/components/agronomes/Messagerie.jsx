import React, { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost } from "../../services/platformApi.js";

// ===== Helpers =====
function formatHeure(iso) {
    return new Date(iso).toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' });
}

export default function Messagerie({ agronome, agriculteurId, role = 'AGRICULTEUR' }) {
    const [messages, setMessages] = useState([]);
    const [saisie, setSaisie] = useState('');
    const [chargement, setChargement] = useState(true);
    const [envoi, setEnvoi] = useState(false);
    const basRef = useRef(null);

    // Polling fetching
    const fetchMessages = async () => {
        try {
            const msgs = await apiGet(`/api/agronomes/conversation/${agriculteurId}/${agronome.id}`, null, false);
            if (msgs) {
                setMessages(prev => {
                    if (msgs.length !== prev.length) return msgs;
                    return prev; // evite les re-renders inutiles
                });
            }
        } catch (err) {
            console.error("Erreur polling messages", err);
        }
    };

    useEffect(() => {
        setChargement(true);
        fetchMessages().finally(() => setChargement(false));

        // Polling toutes les 2 secondes
        const intervalId = setInterval(fetchMessages, 2000);
        return () => clearInterval(intervalId);
    }, [agronome.id, agriculteurId]);

    // Scroll automatique vers le bas
    useEffect(() => {
        basRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const envoyerMessage = async () => {
        const contenu = saisie.trim();
        if (!contenu || envoi) return;

        setEnvoi(true);
        setSaisie('');

        // Affichage optimiste immédiat
        const tempMsg = {
            id: Date.now(),
            agriculteurId,
            agronomeId: agronome.id,
            expediteur: role,
            contenu,
            lu: false,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            await apiPost('/api/agronomes/messages', {
                agronomeId: agronome.id,
                agriculteurId,
                expediteur: role,
                contenu,
            });
            fetchMessages(); // re-fetch immédiatement 
        } catch (err) {
            console.error(err);
        } finally {
            setEnvoi(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            envoyerMessage();
        }
    };

    return (
        <div style={{
            borderTop: '0.5px solid var(--border)',
            marginTop: '1rem',
            paddingTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            height: '400px',
        }}>

            {/* En-tête */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                    <h5 style={{ margin: 0 }}>{agronome.name}</h5>
                    <span style={{ fontSize: '12px', color: agronome.availability?.toLowerCase().includes("disponible") ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {agronome.availability}
                    </span>
                </div>
                <span className="badge warning">
                    {agronome.specialty}
                </span>
            </div>

            {/* Zone de messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '16px 0',
                display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
                {chargement && messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        Chargement...
                    </div>
                )}

                {!chargement && messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', margin: 'auto' }}>
                        Commencez la conversation.
                    </div>
                )}

                {messages.map((msg) => {
                    const estMoi = msg.expediteur === role;
                    return (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: estMoi ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                                maxWidth: '85%', padding: '10px 14px',
                                borderRadius: estMoi ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                background: estMoi ? 'var(--accent)' : 'var(--surface-hover)',
                                color: estMoi ? '#fff' : 'var(--text)',
                                fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word',
                            }}>
                                {msg.contenu}
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                                {formatHeure(msg.createdAt)}
                            </span>
                        </div>
                    );
                })}
                <div ref={basRef} />
            </div>

            {/* Zone de saisie */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '0.5px solid var(--border)' }}>
                <textarea
                    value={saisie}
                    onChange={e => setSaisie(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrire un message..."
                    rows={1}
                    style={{
                        flex: 1, padding: '8px 12px', borderRadius: '8px',
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text)', fontFamily: 'inherit', resize: 'none'
                    }}
                />
                <button
                    onClick={envoyerMessage}
                    disabled={!saisie.trim() || envoi}
                    className="primary-action"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', padding: '0' }}
                >
                    <i className="ti ti-send" />
                </button>
            </div>
        </div>
    );
}
