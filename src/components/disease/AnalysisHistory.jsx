export default function AnalysisHistory({ history, onSelect }) {
  return (
    <section className="surface history-section">
      <div className="section-title-row">
        <div>
          <h2>Historique des analyses</h2>
          <p>Les diagnostics valides sont conserves localement pour l'agriculteur.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="muted">Aucune analyse enregistree pour le moment.</p>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <button key={item.id} type="button" onClick={() => onSelect(item)} className="history-item">
              <span>{new Date(item.analyzedAt).toLocaleDateString("fr-FR")}</span>
              <strong>{item.cropName || "Culture non precisee"}</strong>
              <span>{item.diseaseName}</span>
              <em>{Math.round(item.confidence)}% confiance</em>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
