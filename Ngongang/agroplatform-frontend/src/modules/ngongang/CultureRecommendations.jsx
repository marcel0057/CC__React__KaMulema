// src/modules/ngongang/CultureRecommendations.jsx

function CultureRecommendations({ recommendations }) {
  // Si aucune donnée n'est passée, on n'affiche rien
  if (!recommendations) return null;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🌾 Recommandations de Culture par IA</h2>

      {/* Résumé général */}
      {recommendations.summary && (
        <div style={styles.summaryBox}>
          <p style={styles.summaryText}>{recommendations.summary}</p>
        </div>
      )}

      {/* Liste des cultures recommandées */}
      {recommendations.cultures && recommendations.cultures.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🌱 Cultures adaptées à votre sol</h3>
          <div style={styles.cardsGrid}>
            {recommendations.cultures.map((culture, index) => (
              <div key={index} style={styles.card}>
                <h4 style={styles.cultureName}>{culture.name}</h4>

                {culture.confidence && (
                  <div style={styles.confidenceRow}>
                    <span style={styles.confidenceLabel}>Compatibilité :</span>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${culture.confidence}%`,
                          backgroundColor: getColor(culture.confidence),
                        }}
                      />
                    </div>
                    <span style={styles.confidenceValue}>
                      {culture.confidence}%
                    </span>
                  </div>
                )}

                {culture.description && (
                  <p style={styles.description}>{culture.description}</p>
                )}

                {culture.season && (
                  <p style={styles.tag}>📅 Saison : {culture.season}</p>
                )}

                {culture.yield && (
                  <p style={styles.tag}>📦 Rendement : {culture.yield}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conseils supplémentaires */}
      {recommendations.tips && recommendations.tips.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>💡 Conseils supplémentaires</h3>
          <ul style={styles.tipsList}>
            {recommendations.tips.map((tip, index) => (
              <li key={index} style={styles.tipItem}>
                ✅ {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Avertissements */}
      {recommendations.warnings && recommendations.warnings.length > 0 && (
        <div style={styles.section}>
          <h3 style={{ ...styles.sectionTitle, color: "#e65100" }}>
            ⚠️ Points d'attention
          </h3>
          <ul style={styles.tipsList}>
            {recommendations.warnings.map((warning, index) => (
              <li key={index} style={{ ...styles.tipItem, color: "#e65100" }}>
                ⚠️ {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Fonction utilitaire : retourne une couleur selon le score
// Verte si > 70%, orange si > 40%, rouge sinon
function getColor(value) {
  if (value >= 70) return "#2e7d32";
  if (value >= 40) return "#f57c00";
  return "#c62828";
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "32px auto",
    padding: "24px",
    fontFamily: "Arial",
  },
  title: {
    color: "#2e7d32",
    marginBottom: "20px",
    fontSize: "22px",
  },
  summaryBox: {
    backgroundColor: "#e8f5e9",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "24px",
    borderLeft: "4px solid #2e7d32",
  },
  summaryText: {
    margin: 0,
    color: "#1b5e20",
    fontSize: "15px",
  },
  section: {
    marginBottom: "28px",
  },
  sectionTitle: {
    color: "#388e3c",
    marginBottom: "12px",
    fontSize: "17px",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #c8e6c9",
    borderRadius: "10px",
    padding: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
  },
  cultureName: {
    margin: "0 0 10px 0",
    color: "#1b5e20",
    fontSize: "16px",
  },
  confidenceRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  confidenceLabel: {
    fontSize: "13px",
    color: "#555",
    whiteSpace: "nowrap",
  },
  progressBar: {
    flex: 1,
    height: "8px",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.5s ease",
  },
  confidenceValue: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#333",
    minWidth: "35px",
  },
  description: {
    fontSize: "13px",
    color: "#555",
    margin: "6px 0",
  },
  tag: {
    fontSize: "13px",
    color: "#666",
    margin: "4px 0",
  },
  tipsList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  tipItem: {
    padding: "8px 0",
    borderBottom: "1px solid #f1f1f1",
    fontSize: "14px",
    color: "#333",
  },
};

export default CultureRecommendations;