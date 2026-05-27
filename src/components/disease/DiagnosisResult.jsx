export default function DiagnosisResult({ diagnosis }) {
  if (!diagnosis) {
    return (
      <section className="surface empty-state">
        <h2>Resultat du diagnostic</h2>
        <p>
          Le rapport IA apparaitra ici apres l'analyse : maladie probable, niveau de confiance,
          causes, symptomes, statut national et besoin de verification par un agronome.
        </p>
      </section>
    );
  }

  const confidence = Math.round(diagnosis.confidence);
  const nationalStatusLabel = {
    listed: "Repertoriee nationalement",
    unlisted: "Non repertoriee nationalement",
    unknown: "Statut national a verifier",
  }[diagnosis.nationalStatus] || "Statut national a verifier";

  return (
    <section className="surface diagnosis-result">
      <div className="result-heading">
        <div>
          <p className="eyebrow">Diagnostic IA</p>
          <h2>{diagnosis.diseaseName}</h2>
          {diagnosis.scientificName && <p className="scientific-name">{diagnosis.scientificName}</p>}
        </div>
        <div className="confidence-badge">
          <strong>{confidence}%</strong>
          <span>confiance</span>
        </div>
      </div>

      <div className="status-grid">
        <div>
          <span>Gravite</span>
          <strong>{diagnosis.severity}</strong>
        </div>
        <div>
          <span>Statut</span>
          <strong>{nationalStatusLabel}</strong>
        </div>
      </div>

      <p className={diagnosis.needsExpertReview ? "review-alert" : "status-note"}>
        {diagnosis.statusMessage}
      </p>

      <DetailList title="Ce qui peut causer la maladie" items={diagnosis.causes} />
      <DetailList title="Symptomes detectes ou coherents" items={diagnosis.observedSymptoms} />
      <DetailList title="Evolution probable sans traitement" items={diagnosis.likelyProgression} />

      {diagnosis.sources.length > 0 && (
        <div className="sources">
          <h3>Sources utilisees</h3>
          {diagnosis.sources.map((source) => (
            <a key={source.url || source.title} href={source.url} target="_blank" rel="noreferrer">
              {source.title || source.url}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailList({ title, items }) {
  if (!items?.length) return null;

  return (
    <div className="detail-block">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={String(item)}>{String(item)}</li>
        ))}
      </ul>
    </div>
  );
}
