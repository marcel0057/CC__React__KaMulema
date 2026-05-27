import { useEffect, useMemo, useState } from "react";
import { certifications, certificationRegions, certificationLevels } from "../../data/platformData.js";
import { apiGet, apiPost } from "../../services/platformApi.js";

const initialForm = {
  farmer: "",
  product: "",
  level: "Certification argent",
  region: "Ouest",
};

export default function CertificationPage() {
  const [requests, setRequests] = useState([]);
  const [certificationList, setCertificationList] = useState(certifications);
  const [form, setForm] = useState(initialForm);
  const [activeView, setActiveView] = useState("overview");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const stats = useMemo(() => {
    const allItems = [...certificationList, ...requests];
    return {
      total: allItems.length,
      certified: allItems.filter((item) => item.status === "Certifie").length,
      pending: allItems.filter((item) => item.status === "En attente").length,
      average: Math.round(allItems.reduce((sum, item) => sum + Number(item.score || 0), 0) / allItems.length),
    };
  }, [certificationList, requests]);

  useEffect(() => {
    apiGet("/api/certifications", certifications).then(setCertificationList);
  }, []);

  async function submitRequest(event) {
    event.preventDefault();
    const newRequest = await apiPost("/api/certifications", form).catch(() => ({
      id: `REQ-${Date.now()}`,
      farmer: form.farmer,
      product: form.product,
      region: form.region,
      status: "En attente",
      level: form.level.replace("Certification ", ""),
      score: 35,
      date: new Date().toLocaleDateString("fr-FR"),
      criteria: ["Demande reçue", "Dossier à vérifier", "Visite agronome à planifier"],
    }));
    setRequests((current) => [newRequest, ...current]);
    setSelectedRequest(newRequest);
    setForm(initialForm);
    setActiveView("history");
  }

  const allCertifications = [...requests, ...certificationList];

  return (
    <section className="module-page">
      <div className="section-heading left">
        <p className="eyebrow">Qualité et confiance</p>
        <h2>Certification des agriculteurs</h2>
        <p>Évaluation des produits, statut de certification, suivi des demandes et badges visibles sur la plateforme.</p>
      </div>

      <div className="tab-row">
        <button type="button" className={activeView === "overview" ? "tab-button active" : "tab-button"} onClick={() => setActiveView("overview")}>
          Vue d'ensemble
        </button>
        <button type="button" className={activeView === "history" ? "tab-button active" : "tab-button"} onClick={() => setActiveView("history")}>
          Statistiques et historique
        </button>
      </div>

      {activeView === "overview" && (
        <>
          <div className="dashboard-grid">
            {certificationList.map((item) => (
              <CertificationCard key={item.id} item={item} onOpen={setSelectedRequest} />
            ))}
          </div>

          <article className="surface">
            <h3>Nouvelle demande d'évaluation</h3>
            <form className="filter-grid" onSubmit={submitRequest}>
              <input required placeholder="Nom de l'agriculteur" value={form.farmer} onChange={(event) => setForm((current) => ({ ...current, farmer: event.target.value }))} />
              <input required placeholder="Produit principal" value={form.product} onChange={(event) => setForm((current) => ({ ...current, product: event.target.value }))} />
              <select value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}>
                {certificationRegions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <select value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}>
                {certificationLevels.map((level) => (
                  <option key={level} value={`Certification ${level.toLowerCase()}`}>Certification {level}</option>
                ))}
              </select>
              <button type="submit" className="primary-action">Envoyer la demande</button>
            </form>
          </article>
        </>
      )}

      {activeView === "history" && (
        <>
          <div className="stats-grid compact">
            <div className="stat-tile"><span>Total dossiers</span><strong>{stats.total}</strong></div>
            <div className="stat-tile"><span>Certifiés</span><strong>{stats.certified}</strong></div>
            <div className="stat-tile"><span>En attente</span><strong>{stats.pending}</strong></div>
            <div className="stat-tile"><span>Score moyen</span><strong>{stats.average}%</strong></div>
          </div>

          <div className="workspace-grid">
            <article className="surface">
              <h3>Historique des demandes</h3>
              <div className="stack-list">
                {allCertifications.map((item) => (
                  <button type="button" className="history-item" key={item.id} onClick={() => setSelectedRequest(item)}>
                    <strong>{item.farmer}</strong>
                    <span>{item.product || "Produit agricole"} - {item.region}</span>
                    <em>{item.status}</em>
                  </button>
                ))}
              </div>
            </article>

            <article className="surface">
              <h3>Détails du dossier</h3>
              {selectedRequest ? (
                <>
                  <p><strong>Agriculteur :</strong> {selectedRequest.farmer}</p>
                  <p><strong>Produit :</strong> {selectedRequest.product || "Non précisé"}</p>
                  <p><strong>Région :</strong> {selectedRequest.region}</p>
                  <p><strong>Niveau :</strong> {selectedRequest.level}</p>
                  <span className={selectedRequest.status === "Certifie" ? "badge success" : selectedRequest.status === "En attente" ? "badge warning" : "badge danger"}>
                    {selectedRequest.status}
                  </span>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${selectedRequest.score}%` }} />
                  </div>
                  <ul>
                    {selectedRequest.criteria.map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="muted">Cliquez sur une demande pour voir les détails.</p>
              )}
            </article>
          </div>
        </>
      )}
    </section>
  );
}

function CertificationCard({ item, onOpen }) {
  return (
    <article className="surface certificate-card">
      <span className="certificate-emoji">{item.level === "Or" ? "★" : item.level === "Argent" ? "◆" : "●"}</span>
      <h3>{item.farmer}</h3>
      <p className="muted">{item.region} - Niveau {item.level}</p>
      <span className={item.status === "Certifie" ? "badge success" : item.status === "En attente" ? "badge warning" : "badge danger"}>
        {item.status}
      </span>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${item.score}%` }} />
      </div>
      <p className="muted">Score d'évaluation : {item.score}%</p>
      <button type="button" className="secondary-action wide" onClick={() => onOpen(item)}>
        Voir le dossier
      </button>
    </article>
  );
}
