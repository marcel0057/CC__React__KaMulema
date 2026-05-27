import { useEffect, useState } from "react";
import { soilRecommendations } from "../../data/platformData.js";
import { apiGet } from "../../services/platformApi.js";

export default function SoilAdvisorPage() {
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState(soilRecommendations);

  useEffect(() => {
    apiGet("/api/soil/recommendations", soilRecommendations).then(setRecommendations);
  }, []);

  return (
    <section className="module-page">
      <div className="section-heading left">
        <p className="eyebrow">Planification intelligente</p>
        <h2>Conseil intelligent de semis</h2>
        <p>Recommandations selon le type de sol, la localisation et les paramètres du terrain.</p>
      </div>

      <div className="workspace-grid">
        <article className="surface">
          <h3>Paramètres du terrain</h3>
          <div className="field-grid">
            <label>Type de sol<input placeholder="Ex : limono-sableux" /></label>
            <label>Localisation<input placeholder="Ex : Bafoussam" /></label>
            <label>Altitude<input placeholder="Ex : 1450 m" /></label>
            <label>Pente<select><option>Faible</option><option>Moyenne</option><option>Forte</option></select></label>
            <label>Humidité<select><option>Moyenne</option><option>Faible</option><option>Élevée</option></select></label>
          </div>
          <button type="button" className="primary-action wide" onClick={() => setShowResults(true)}>
            Obtenir les recommandations
          </button>
        </article>

        <aside className="surface">
          <h3>Cultures recommandées</h3>
          {!showResults ? (
            <p className="muted">Remplissez les paramètres pour afficher les cultures adaptées.</p>
          ) : (
            <div className="stack-list">
              {recommendations.map((item) => (
                <div className="recommendation-item" key={item.crop}>
                  <div className="list-row">
                    <strong>{item.crop}</strong>
                    <span className="badge success">{item.confidence}%</span>
                  </div>
                  <p className="muted">{item.reason}</p>
                  <p className="status-note">Saison : {item.season}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
