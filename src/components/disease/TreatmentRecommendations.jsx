export default function TreatmentRecommendations({ diagnosis }) {
  if (!diagnosis) {
    return null;
  }

  return (
    <section className="surface treatment-card">
      <h2>Recommandations de traitement</h2>
      <RecommendationList title="Actions urgentes" items={diagnosis.urgentActions} important />
      <RecommendationList title="Etapes de traitement" items={diagnosis.treatmentSteps} />
      <RecommendationList title="Prevention" items={diagnosis.preventionSteps} />
      <RecommendationList title="Produits recommandes" items={diagnosis.recommendedProducts} />
    </section>
  );
}

function RecommendationList({ title, items, important = false }) {
  if (!items?.length) return null;

  return (
    <div className={important ? "recommendation-block urgent" : "recommendation-block"}>
      <h3>{title}</h3>
      <ol>
        {items.map((item) => (
          <li key={String(item)}>{String(item)}</li>
        ))}
      </ol>
    </div>
  );
}
