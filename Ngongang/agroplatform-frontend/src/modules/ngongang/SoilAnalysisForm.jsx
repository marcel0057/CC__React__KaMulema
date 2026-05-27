// src/modules/ngongang/SoilAnalysisForm.jsx
import { useState } from "react";
import CultureRecommendations from "./CultureRecommendations";

function SoilAnalysisForm() {
  const [formData, setFormData] = useState({
    region: "",
    soilColor: "",
    soilTexture: "",
    waterDrainage: "",
    lastCulture: "",
    rainLevel: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Convertit les réponses simples en données agronomiques
  const generateRecommendations = (data) => {
    const tips = [];
    const warnings = [];

    // Déduction du type de sol selon la couleur + texture
    let soilType = "argileux";
    if (data.soilColor === "clair" && data.soilTexture === "granuleux") soilType = "sableux";
    else if (data.soilColor === "brun" && data.soilTexture === "doux") soilType = "limoneux";
    else if (data.soilColor === "noir") soilType = "humifere";
    else if (data.soilTexture === "collant") soilType = "argileux";

    // Cultures selon le type de sol déduit
    const culturesBySoil = {
      argileux: [
        {
          name: "Maïs",
          confidence: 88,
          description: "Votre sol retient bien l'eau, le maïs poussera très bien. C'est la culture la plus cultivée au Cameroun.",
          season: "Mars - Juillet / Août - Novembre",
          yield: "2 à 5 sacs de 100kg par are",
        },
        {
          name: "Manioc",
          confidence: 82,
          description: "Le manioc est très résistant sur ce type de sol. Il peut rester en terre jusqu'à 2 ans avant récolte.",
          season: "Planter en début de saison des pluies",
          yield: "1 à 2 tonnes par are",
        },
        {
          name: "Haricot",
          confidence: 70,
          description: "Le haricot enrichit le sol pour les prochaines cultures. Bon choix après le maïs.",
          season: "Août - Novembre",
          yield: "50 à 100 kg par are",
        },
      ],
      sableux: [
        {
          name: "Arachide",
          confidence: 90,
          description: "Votre sol léger et bien drainé est parfait pour l'arachide. Facile à cultiver et très rentable.",
          season: "Mars - Juin",
          yield: "80 à 150 kg par are",
        },
        {
          name: "Patate douce",
          confidence: 78,
          description: "La patate douce adore les sols légers. Récolte rapide en 3 à 4 mois.",
          season: "Août - Décembre",
          yield: "500 kg à 1 tonne par are",
        },
        {
          name: "Manioc",
          confidence: 72,
          description: "Le manioc pousse bien avec un peu de compost ou fumier ajouté.",
          season: "Toute l'année",
          yield: "800 kg à 1,5 tonne par are",
        },
      ],
      limoneux: [
        {
          name: "Tomate",
          confidence: 87,
          description: "Votre sol est fertile et bien équilibré, parfait pour la tomate. Très bonne valeur sur le marché.",
          season: "Novembre - Février avec arrosage",
          yield: "1 à 3 tonnes par are",
        },
        {
          name: "Maïs",
          confidence: 85,
          description: "Sol très fertile — le maïs donnera d'excellents rendements avec peu d'engrais.",
          season: "Mars - Juillet",
          yield: "3 à 6 sacs de 100kg par are",
        },
        {
          name: "Chou",
          confidence: 80,
          description: "Le chou pousse très bien sur ce sol riche. Bonne demande sur les marchés locaux.",
          season: "Octobre - Janvier",
          yield: "2 à 4 tonnes par are",
        },
      ],
      humifere: [
        {
          name: "Cacao",
          confidence: 92,
          description: "Votre sol noir et riche est idéal pour le cacao, principale culture de rente du Cameroun.",
          season: "Planter en saison des pluies — premiers fruits après 3 à 5 ans",
          yield: "50 à 150 kg de fèves sèches par are",
        },
        {
          name: "Plantain",
          confidence: 88,
          description: "Le plantain aime les sols riches et humides. Production continue toute l'année.",
          season: "Toute l'année — premier régime après 9 à 12 mois",
          yield: "1 à 2 tonnes par are",
        },
        {
          name: "Macabo",
          confidence: 80,
          description: "Le macabo est parfait pour ce type de sol. Très consommé et bien vendu au Cameroun.",
          season: "Mars - Juin",
          yield: "500 kg à 1,5 tonne par are",
        },
      ],
    };

    // Conseils selon le drainage
    if (data.waterDrainage === "stagne") {
      warnings.push("L'eau stagne sur votre terrain — faites des billons (buttes de terre) pour surélever vos cultures et éviter la pourriture des racines");
      tips.push("Creuser des petits canaux entre les rangées pour évacuer l'eau en excès");
    } else if (data.waterDrainage === "rapide") {
      warnings.push("L'eau part trop vite — votre sol perd les nutriments. Ajoutez du compost ou des feuilles mortes pour retenir l'humidité");
      tips.push("Utiliser le paillage (couvrir le sol avec de la paille ou feuilles) pour garder l'humidité");
    } else {
      tips.push("Bon drainage — l'eau s'écoule normalement, vos racines ne pourriront pas");
    }

    // Conseils selon la pluie
    if (data.rainLevel === "peu") {
      warnings.push("Peu de pluie dans votre zone — prévoir un arrosage régulier, surtout en saison sèche");
      tips.push("Arroser tôt le matin ou en soirée pour éviter l'évaporation");
    } else if (data.rainLevel === "beaucoup") {
      tips.push("Beaucoup de pluie dans votre zone — profitez de la saison des pluies pour planter");
      warnings.push("Trop de pluie peut provoquer des maladies fongiques — espacez bien vos plants pour l'aération");
    } else {
      tips.push("Pluie normale — planifiez vos semis en début de saison des pluies pour de meilleurs résultats");
    }

    // Conseils selon la dernière culture
    if (data.lastCulture === "mais") {
      tips.push("Après le maïs, plantez du haricot ou de l'arachide — ils remettent de l'azote dans le sol");
    } else if (data.lastCulture === "manioc") {
      tips.push("Après le manioc, le sol est épuisé — ajoutez du fumier de bœuf ou compost avant de replanter");
    } else if (data.lastCulture === "rien") {
      tips.push("Sol non cultivé récemment — bonne nouvelle, il est probablement bien reposé et fertile !");
    }

    // Conseil universel
    tips.push("Toujours faire une rotation : ne pas planter la même culture deux fois de suite au même endroit");

    return {
      summary: `D'après vos réponses, votre sol de la région ${data.region} est de type ${soilType}. Voici les cultures les plus adaptées à votre terrain.`,
      cultures: culturesBySoil[soilType],
      tips,
      warnings,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const recommendations = generateRecommendations(formData);
      setResult(recommendations);
    } catch (err) {
      setError("Erreur lors de l'analyse. Veuillez réessayer.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🌱 Analyse de votre Terrain</h2>
      <p style={styles.subtitle}>
        Répondez aux questions simples ci-dessous — pas besoin d'être expert !
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Région */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>📍 Dans quelle région se trouve votre champ ?</label>
          <input
            type="text"
            name="region"
            value={formData.region}
            onChange={handleChange}
            placeholder="Ex: Bafoussam, Centre, Littoral..."
            required
            style={styles.input}
          />
        </div>

        {/* Couleur du sol */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>🎨 Quelle est la couleur de votre terre ?</label>
          <select name="soilColor" value={formData.soilColor} onChange={handleChange} required style={styles.input}>
            <option value="">-- Choisir --</option>
            <option value="noir">Noire ou très foncée</option>
            <option value="rouge">Rouge ou orangée</option>
            <option value="brun">Brune</option>
            <option value="clair">Claire ou jaunâtre</option>
          </select>
        </div>

        {/* Texture du sol */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>✋ Quand vous prenez la terre en main, elle est :</label>
          <select name="soilTexture" value={formData.soilTexture} onChange={handleChange} required style={styles.input}>
            <option value="">-- Choisir --</option>
            <option value="collant">Collante et se forme en boule (comme de l'argile)</option>
            <option value="granuleux">Granuleuse et s'émiette facilement (comme du sable)</option>
            <option value="doux">Douce et légère (ni collante ni granuleuse)</option>
          </select>
        </div>

        {/* Drainage */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>💧 Quand il pleut fort, que se passe-t-il sur votre terrain ?</label>
          <select name="waterDrainage" value={formData.waterDrainage} onChange={handleChange} required style={styles.input}>
            <option value="">-- Choisir --</option>
            <option value="stagne">L'eau reste longtemps et forme des flaques</option>
            <option value="normal">L'eau part progressivement en quelques heures</option>
            <option value="rapide">L'eau disparaît très vite, le sol sèche rapidement</option>
          </select>
        </div>

        {/* Dernière culture */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>🌾 Qu'avez-vous cultivé sur ce terrain la dernière fois ?</label>
          <select name="lastCulture" value={formData.lastCulture} onChange={handleChange} required style={styles.input}>
            <option value="">-- Choisir --</option>
            <option value="mais">Maïs</option>
            <option value="manioc">Manioc</option>
            <option value="arachide">Arachide</option>
            <option value="legumes">Légumes (tomate, chou, etc.)</option>
            <option value="rien">Rien, c'est un nouveau terrain</option>
          </select>
        </div>

        {/* Pluviométrie */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>🌧️ En général, comment est la pluie dans votre zone ?</label>
          <select name="rainLevel" value={formData.rainLevel} onChange={handleChange} required style={styles.input}>
            <option value="">-- Choisir --</option>
            <option value="peu">Peu de pluie — souvent sec</option>
            <option value="normal">Pluie normale — deux saisons des pluies par an</option>
            <option value="beaucoup">Beaucoup de pluie — presque toute l'année</option>
          </select>
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Analyse en cours..." : "🔍 Voir les cultures recommandées"}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {result && <CultureRecommendations recommendations={result} />}
    </div>
  );
}

const styles = {
  container: { maxWidth: "700px", margin: "40px auto", padding: "24px", fontFamily: "Arial" },
  title: { color: "#2e7d32", marginBottom: "8px" },
  subtitle: { color: "#666", marginBottom: "24px", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontWeight: "bold", color: "#333", fontSize: "15px" },
  input: { padding: "12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" },
  button: {
    padding: "14px", backgroundColor: "#2e7d32", color: "white",
    border: "none", borderRadius: "6px", fontSize: "16px", cursor: "pointer",
  },
  error: { color: "red", marginTop: "12px" },
};


export default SoilAnalysisForm;