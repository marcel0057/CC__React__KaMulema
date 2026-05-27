const API_URL = import.meta.env.VITE_AI_DIAGNOSIS_API_URL || "/api/plant-diagnosis/analyze";

export class DiagnosisApiError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = "DiagnosisApiError";
    this.details = details;
  }
}

export function isDiagnosisApiConfigured() {
  return Boolean(API_URL);
}

export async function analyzePlantDisease(payload) {
  const formData = new FormData();
  payload.plantPhotos.forEach((photo) => {
    formData.append("plantPhotos", photo);
  });
  formData.append("farmerId", payload.farmerId);
  formData.append("cropName", payload.cropName);
  formData.append("location", payload.location);
  formData.append("symptomDescription", payload.symptomDescription);
  formData.append("affectedPart", payload.affectedPart);
  formData.append("plantAge", payload.plantAge);

  const response = await fetch(API_URL, {
    method: "POST",
    body: formData,
  });

  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();
  let data = null;

  if (contentType.includes("application/json")) {
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      throw new DiagnosisApiError("Le serveur IA a renvoye un JSON illisible.");
    }
  } else {
    const hint = rawText.includes("<!doctype html") || rawText.includes("<html")
      ? "Le frontend a repondu a la place du backend. Lancez aussi `npm.cmd run server` dans un deuxieme terminal."
      : rawText.slice(0, 160);
    throw new DiagnosisApiError(
      `La reponse du serveur IA n'est pas un JSON valide. ${hint}`,
    );
  }

  if (!response.ok) {
    throw new DiagnosisApiError(
      data?.message || "Le serveur IA n'a pas pu traiter cette analyse.",
      data,
    );
  }

  return normalizeDiagnosis(data);
}

function normalizeDiagnosis(data) {
  return {
    id: data.id || crypto.randomUUID(),
    analyzedAt: data.analyzedAt || new Date().toISOString(),
    diseaseName: data.diseaseName || "Maladie non identifiee",
    scientificName: data.scientificName || "",
    confidence: Number(data.confidence || 0),
    severity: data.severity || "A confirmer",
    nationalStatus: data.nationalStatus || "unknown",
    statusMessage:
      data.statusMessage ||
      "Le statut national de cette maladie doit etre verifie par un agronome.",
    cropName: data.cropName || "",
    causes: asArray(data.causes),
    observedSymptoms: asArray(data.observedSymptoms),
    likelyProgression: asArray(data.likelyProgression),
    treatmentSteps: asArray(data.treatmentSteps),
    preventionSteps: asArray(data.preventionSteps),
    recommendedProducts: asArray(data.recommendedProducts),
    urgentActions: asArray(data.urgentActions),
    sources: asArray(data.sources),
    needsExpertReview: Boolean(data.needsExpertReview),
  };
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
