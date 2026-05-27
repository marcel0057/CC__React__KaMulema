import { useEffect, useMemo, useState } from "react";
import AnalysisHistory from "../../components/disease/AnalysisHistory.jsx";
import DiagnosisResult from "../../components/disease/DiagnosisResult.jsx";
import ImageUploader from "../../components/disease/ImageUploader.jsx";
import SymptomForm from "../../components/disease/SymptomForm.jsx";
import TreatmentRecommendations from "../../components/disease/TreatmentRecommendations.jsx";
import { analyzePlantDisease, DiagnosisApiError, isDiagnosisApiConfigured } from "../../services/diagnosisApi.js";
import { getAnalysisHistory, saveAnalysisHistory } from "../../utils/historyStorage.js";

const initialForm = {
  farmerId: "AGR-001",
  cropName: "",
  location: "",
  symptomDescription: "",
  affectedPart: "",
  plantAge: "",
};

export default function DiseaseAnalysisPage() {
  const [plantPhotos, setPlantPhotos] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [diagnosis, setDiagnosis] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setHistory(getAnalysisHistory());
  }, []);

  const isFormReady = useMemo(() => {
    return plantPhotos.length > 0 && form.cropName && form.location && form.symptomDescription;
  }, [form.cropName, form.location, form.symptomDescription, plantPhotos.length]);

  async function handleAnalyze(event) {
    event.preventDefault();
    setError("");
    setDiagnosis(null);

    if (!isFormReady) {
      setError("Ajoutez au moins une photo, la culture, la localisation et une description des symptomes.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzePlantDisease({ ...form, plantPhotos });
      const savedItem = {
        ...result,
        cropName: result.cropName || form.cropName,
        farmerId: form.farmerId,
        location: form.location,
      };

      setDiagnosis(savedItem);
      setHistory(saveAnalysisHistory(savedItem));
    } catch (apiError) {
      if (apiError instanceof DiagnosisApiError) {
        setError(apiError.message);
      } else {
        setError("Une erreur inattendue est survenue pendant l'analyse IA.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="module-page">
      <div className={`api-inline-status ${isDiagnosisApiConfigured() ? "ready" : "missing"}`}>
        <strong>{isDiagnosisApiConfigured() ? "API Plant.id connectée" : "API Plant.id non configurée"}</strong>
        <span>Upload multiple, symptômes texte/vocal et rapport détaillé.</span>
      </div>

      <section className="workspace-grid">
        <form className="analysis-panel" onSubmit={handleAnalyze}>
          <ImageUploader value={plantPhotos} onChange={setPlantPhotos} />
          <SymptomForm form={form} onChange={updateForm} disabled={isAnalyzing} />

          {error && <p className="error-message">{error}</p>}

          <button className="primary-action" type="submit" disabled={!isFormReady || isAnalyzing}>
            {isAnalyzing ? "Analyse en cours..." : "Lancer le diagnostic IA"}
          </button>
        </form>

        <aside className="result-column">
          <DiagnosisResult diagnosis={diagnosis} />
          <TreatmentRecommendations diagnosis={diagnosis} />
        </aside>
      </section>

      <AnalysisHistory history={history} onSelect={setDiagnosis} />
    </section>
  );
}
