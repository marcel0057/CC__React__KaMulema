import { useEffect, useState } from "react";
import { apiGet } from "../../services/platformApi.js";
import Messagerie from "./Messagerie.jsx";

export default function SuiviAgriculteursPage({ user }) {
    const [dashboardData, setDashboardData] = useState({ agriculteursSuivis: [], demandesEnAttente: [] });
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState(null); // stores the agriculteur context for chat
    const agronomeId = "AGR-01"; // Mock for the connected agronome

    useEffect(() => {
        // Actually we could use the data strictly for display, but here we just mock the fetch
        apiGet("/api/suivi/tableau-bord", {
            agriculteursSuivis: [
                { id: "USER", nom: "Marcel Agriculteur", culture: "Cacao", surface: "5 ha", region: "Ouest", dernierDiagnostic: "Sain" },
                { id: "FRM-02", nom: "Jeannette Ngo", culture: "Plantain", surface: "2 ha", region: "Littoral", dernierDiagnostic: "Maladie fongique suspectée" }
            ],
            demandesEnAttente: [
                { id: "REQ-01", agriculteurNom: "Paul M.", agriculteurId: "FRM-03", dateDemande: "Aujourd'hui", type: "Rejoindre le suivi" }
            ]
        }).then(data => {
            setDashboardData(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div style={{ padding: "2rem" }}>Chargement du tableau de bord...</div>;
    }

    return (
        <section className="module-page">
            <div className="section-heading left">
                <p className="eyebrow">Tableau de Bord Agronome</p>
                <h2>Suivi des agriculteurs</h2>
                <p>Gérez vos agriculteurs, répondez aux messages et consultez leurs diagnostics.</p>
            </div>

            <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="surface" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #f5a623' }}>
                    <h3 style={{ margin: 0, fontSize: '2rem' }}>{dashboardData.demandesEnAttente.length}</h3>
                    <span className="muted">Demandes en attente</span>
                </div>
                <div className="surface" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #4caf50' }}>
                    <h3 style={{ margin: 0, fontSize: '2rem' }}>{dashboardData.agriculteursSuivis.length}</h3>
                    <span className="muted">Agriculteurs suivis</span>
                </div>
                <div className="surface" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #e91e63' }}>
                    <h3 style={{ margin: 0, fontSize: '2rem' }}>1</h3>
                    <span className="muted">Alertes IA critiques</span>
                </div>
            </div>

            <div className="two-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Demandes en attente */}
                <div className="requests-section">
                    <h3>Demandes de suivi</h3>
                    <div className="stack-list">
                        {dashboardData.demandesEnAttente.length === 0 && <p className="muted">Aucune demande en attente.</p>}
                        {dashboardData.demandesEnAttente.map(req => (
                            <article key={req.id} className="surface" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{req.agriculteurNom}</h4>
                                    <span className="muted" style={{ fontSize: '0.9rem' }}>{req.type} - {req.dateDemande}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="secondary-action">Refuser</button>
                                    <button className="primary-action">Accepter</button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                {/* Agriculteurs suivis */}
                <div className="tracked-section">
                    <h3>Vos Agriculteurs</h3>
                    <div className="stack-list">
                        {dashboardData.agriculteursSuivis.map(agr => (
                            <article key={agr.id} className="surface" style={{ padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0 }}>{agr.nom}</h4>
                                    <span className="badge" style={{ background: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' }}>{agr.culture}</span>
                                </div>
                                <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    <i className="ti ti-map-pin"></i> {agr.region} · {agr.surface}
                                    <br />
                                    <span style={{ color: agr.dernierDiagnostic.includes("Maladie") ? "#ff9800" : "inherit" }}>
                                        Status IA: {agr.dernierDiagnostic}
                                    </span>
                                </p>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="secondary-action" style={{ flex: 1, padding: '0.5rem' }}>Dossier</button>
                                    <button className="primary-action" style={{ flex: 1, padding: '0.5rem' }} onClick={() => setActiveChat(agr)}>
                                        <i className="ti ti-message"></i> Message
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>

            {activeChat && (
                <div className="modal-overlay" onClick={() => setActiveChat(null)}>
                    <div className="modal-content contact-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Discussion avec {activeChat.nom}</h2>
                            <button className="icon-btn" onClick={() => setActiveChat(null)}>&times;</button>
                        </div>
                        <Messagerie
                            agriculteurId={activeChat.id}
                            agronomeId={agronomeId}
                            role="AGRONOME" // Allows the Messagerie to invert chat bubbles
                        />
                    </div>
                </div>
            )}
        </section>
    );
}
