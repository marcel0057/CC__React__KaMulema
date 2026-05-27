import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import nodemailer from "nodemailer";

loadEnvFile();

const PORT = Number(process.env.PORT || 3001);
const PLANT_ID_API_KEY = normalizeApiKey(process.env.PLANT_ID_API_KEY);
const MAIL_USERNAME = process.env.MAIL_USERNAME;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;
const MAIL_FROM = process.env.MAIL_FROM || MAIL_USERNAME;
const PLANT_ID_URL = "https://plant.id/api/v3/health_assessment";
const DETAILS = [
  "local_name",
  "description",
  "url",
  "treatment",
  "classification",
  "common_names",
  "cause",
].join(",");

const server = createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      plantIdConfigured: Boolean(PLANT_ID_API_KEY),
    });
    return;
  }

  if (req.method === "POST" && req.url?.startsWith("/api/plant-diagnosis/analyze")) {
    await handleAnalyze(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/agronomes/contact") {
    await handleAgronomeContact(req, res);
    return;
  }

  sendJson(res, 404, { message: "Route API introuvable." });
});

server.listen(PORT, () => {
  console.log(`Plant diagnosis API running on http://localhost:${PORT}`);
  console.log(`Plant.id key loaded: ${maskSecret(PLANT_ID_API_KEY)}`);
  console.log(`Mail account loaded: ${maskSecret(MAIL_USERNAME)}`);
});

async function handleAgronomeContact(req, res) {
  if (!MAIL_USERNAME || !MAIL_PASSWORD || !MAIL_FROM) {
    sendJson(res, 500, {
      message: "Configuration mail absente. Ajoutez MAIL_USERNAME, MAIL_PASSWORD et MAIL_FROM dans .env ou PowerShell.",
    });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const requiredFields = ["agronomeEmail", "agronomeName", "senderName", "senderEmail"];
    const missingField = requiredFields.find((field) => !payload[field]);
    if (missingField) {
      sendJson(res, 400, { message: `Champ obligatoire manquant : ${missingField}` });
      return;
    }

    const isAppointment = payload.type === "appointment";
    const subject = isAppointment
      ? `KA MOLEMA - Demande de rendez-vous avec ${payload.senderName}`
      : `KA MOLEMA - Nouveau message de ${payload.senderName}`;
    const appointmentLines = isAppointment
      ? [
          `Date souhaitee : ${payload.date || "A preciser"}`,
          `Moment : ${payload.time || "A preciser"}`,
          `Type : ${payload.meetingMode || "A preciser"}`,
          "",
        ].join("\n")
      : "";

    const text = [
      `Bonjour ${payload.agronomeName},`,
      "",
      payload.message || "Un utilisateur souhaite vous contacter via KA MOLEMA.",
      "",
      appointmentLines,
      `Nom : ${payload.senderName}`,
      `Email : ${payload.senderEmail}`,
      "",
      "Message envoye depuis KA MOLEMA.",
    ].join("\n");
    const html = buildAgronomeEmailHtml({
      ...payload,
      isAppointment,
      subject,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAIL_USERNAME,
        pass: MAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"KA MOLEMA" <${MAIL_FROM}>`,
      to: payload.agronomeEmail,
      replyTo: payload.senderEmail,
      subject,
      text,
      html,
    });

    sendJson(res, 200, { message: "Email envoye avec succes a l'agronome." });
  } catch (error) {
    sendJson(res, 500, {
      message: "Impossible d'envoyer le mail pour le moment.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

function buildAgronomeEmailHtml(payload) {
  const typeLabel = payload.isAppointment ? "Demande de rendez-vous" : "Nouveau message";
  const actionLabel = payload.isAppointment ? "Rendez-vous agronomique" : "Contact agronome";
  const message = escapeHtml(payload.message || "Un utilisateur souhaite echanger avec vous via KA MOLEMA.");
  const appointmentHtml = payload.isAppointment
    ? `
      <tr>
        <td style="padding:10px 0;color:#745f47;font-weight:700;">Date souhaitee</td>
        <td style="padding:10px 0;color:#3e2c1b;text-align:right;">${escapeHtml(payload.date || "A preciser")}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#745f47;font-weight:700;">Moment</td>
        <td style="padding:10px 0;color:#3e2c1b;text-align:right;">${escapeHtml(payload.time || "A preciser")}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#745f47;font-weight:700;">Type</td>
        <td style="padding:10px 0;color:#3e2c1b;text-align:right;">${escapeHtml(payload.meetingMode || "A preciser")}</td>
      </tr>
    `
    : "";

  return `
<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#f4efe3;font-family:Arial,Helvetica,sans-serif;color:#3e2c1b;">
    <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
      <div style="height:7px;background:linear-gradient(90deg,#1f6b3a 0 33%,#c7362f 33% 66%,#f2bd2f 66% 100%);border-radius:8px 8px 0 0;"></div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf2;border:1px solid #e1caa7;border-top:0;border-radius:0 0 8px 8px;box-shadow:0 18px 45px rgba(62,44,27,.14);overflow:hidden;">
        <tr>
          <td style="padding:26px 28px;background:#174d2d;color:white;">
            <table role="presentation" width="100%">
              <tr>
                <td>
                  <div style="font-size:13px;font-weight:800;color:#f2bd2f;text-transform:uppercase;">KA MOLEMA</div>
                  <h1 style="margin:6px 0 0;font-size:26px;line-height:1.15;color:white;">${actionLabel}</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,.82);">Plateforme agricole intelligente du Cameroun</p>
                </td>
                <td style="text-align:right;vertical-align:top;">
                  <span style="display:inline-block;background:#f2bd2f;color:#3e2c1b;border-radius:8px;padding:10px 12px;font-weight:900;">KM</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <span style="display:inline-block;background:#e8f3df;color:#174d2d;border:1px solid #b7d5a6;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:900;">${typeLabel}</span>
            <h2 style="margin:18px 0 8px;font-size:20px;color:#174d2d;">Bonjour ${escapeHtml(payload.agronomeName)},</h2>
            <p style="margin:0 0 18px;color:#745f47;line-height:1.65;">Vous avez reçu une demande depuis KA MOLEMA.</p>
            <div style="background:#fffdf7;border:1px solid #e1caa7;border-radius:8px;padding:16px;margin:18px 0;">
              <p style="margin:0;color:#3e2c1b;line-height:1.7;">${message.replace(/\n/g, "<br>")}</p>
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #e1caa7;border-bottom:1px solid #e1caa7;margin:18px 0;">
              ${appointmentHtml}
              <tr>
                <td style="padding:10px 0;color:#745f47;font-weight:700;">Demandeur</td>
                <td style="padding:10px 0;color:#3e2c1b;text-align:right;">${escapeHtml(payload.senderName)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#745f47;font-weight:700;">Email de réponse</td>
                <td style="padding:10px 0;text-align:right;"><a href="mailto:${escapeHtml(payload.senderEmail)}" style="color:#1f6b3a;font-weight:800;">${escapeHtml(payload.senderEmail)}</a></td>
              </tr>
            </table>
            <p style="margin:18px 0 0;color:#745f47;line-height:1.6;">Vous pouvez répondre directement à cet email : la réponse sera adressée au demandeur.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;background:#f7ead4;color:#745f47;font-size:12px;">
            Message automatique envoyé par KA MOLEMA. Ne partagez pas vos informations sensibles en dehors des canaux officiels.
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;
}

async function handleAnalyze(req, res) {
  if (!PLANT_ID_API_KEY) {
    sendJson(res, 500, {
      message: "La cle Plant.id est absente. Ajoutez PLANT_ID_API_KEY dans le fichier .env.",
    });
    return;
  }

  try {
    const request = new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req,
      duplex: "half",
    });

    const inputForm = await request.formData();
    const plantPhotos = inputForm
      .getAll("plantPhotos")
      .filter((photo) => photo && typeof photo !== "string");
    const legacyPlantPhoto = inputForm.get("plantPhoto");

    if (plantPhotos.length === 0 && legacyPlantPhoto && typeof legacyPlantPhoto !== "string") {
      plantPhotos.push(legacyPlantPhoto);
    }

    if (plantPhotos.length === 0) {
      sendJson(res, 400, { message: "Ajoutez au moins une photo de plante valide." });
      return;
    }

    const plantIdForm = new FormData();
    plantPhotos.slice(0, 5).forEach((photo, index) => {
      plantIdForm.append("images", photo, photo.name || `plant-photo-${index + 1}.jpg`);
    });

    const plantIdResponse = await fetch(
      `${PLANT_ID_URL}?language=fr&details=${encodeURIComponent(DETAILS)}&full_disease_list=true`,
      {
        method: "POST",
        headers: {
          "Api-Key": PLANT_ID_API_KEY,
        },
        body: plantIdForm,
      },
    );

    const plantIdData = await readJsonResponse(plantIdResponse);

    if (!plantIdResponse.ok) {
      sendJson(res, plantIdResponse.status, {
        message: plantIdData?.message || "Plant.id n'a pas pu analyser cette image.",
        details: plantIdData,
      });
      return;
    }

    const normalized = normalizePlantIdResult(plantIdData, inputForm);
    sendJson(res, 200, normalized);
  } catch (error) {
    sendJson(res, 500, {
      message: "Erreur pendant l'analyse Plant.id.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

function normalizePlantIdResult(data, inputForm) {
  const suggestions = data?.result?.disease?.suggestions || [];
  const topSuggestion = suggestions[0];
  const confidence = Math.round((topSuggestion?.probability || 0) * 100);
  const details = topSuggestion?.details || {};
  const isPlant = data?.result?.is_plant;
  const isHealthy = data?.result?.is_healthy;
  const diseaseName = details.local_name || topSuggestion?.name || "Maladie non identifiee";
  const needsExpertReview =
    !topSuggestion ||
    confidence < 60 ||
    isPlant?.binary === false ||
    isHealthy?.binary === true;

  if (!topSuggestion) {
    return unknownDiseaseResult(data, inputForm, "Plant.id ne propose aucune maladie fiable pour cette image.");
  }

  return {
    id: data.access_token || crypto.randomUUID(),
    analyzedAt: new Date().toISOString(),
    diseaseName,
    scientificName: topSuggestion.name || "",
    confidence,
    severity: estimateSeverity(confidence, isHealthy?.probability),
    nationalStatus: "unknown",
    statusMessage:
      "Plant.id a identifie une maladie probable, mais le statut national doit etre verifie avec la base phytosanitaire locale.",
    cropName: String(inputForm.get("cropName") || ""),
    causes: splitDetailText(details.cause || details.description),
    observedSymptoms: buildObservedSymptoms(inputForm, details.description),
    likelyProgression: [
      "Sans intervention, la maladie peut progresser sur d'autres parties de la plante.",
      "Le rendement peut diminuer si les symptomes continuent a se propager.",
    ],
    urgentActions: buildUrgentActions(needsExpertReview, confidence),
    treatmentSteps: splitDetailText(details.treatment?.biological || details.treatment?.chemical),
    preventionSteps: splitDetailText(details.treatment?.prevention),
    recommendedProducts: buildRecommendedProducts(details.treatment),
    needsExpertReview,
    sources: buildSources(details),
  };
}

function unknownDiseaseResult(data, inputForm, reason) {
  return {
    id: data?.access_token || crypto.randomUUID(),
    analyzedAt: new Date().toISOString(),
    diseaseName: "Maladie non identifiee",
    scientificName: "",
    confidence: 0,
    severity: "A confirmer",
    nationalStatus: "unlisted",
    statusMessage: `${reason} Le cas doit etre transmis a un ingenieur agronome pour validation.`,
    cropName: String(inputForm.get("cropName") || ""),
    causes: [],
    observedSymptoms: buildObservedSymptoms(inputForm, ""),
    likelyProgression: [],
    urgentActions: [
      "Isoler la plante ou la zone touchee si les symptomes se propagent.",
      "Prendre plusieurs photos nettes : feuille, tige, fruit et vue generale.",
      "Contacter un ingenieur agronome avant d'appliquer un traitement chimique.",
    ],
    treatmentSteps: [],
    preventionSteps: [],
    recommendedProducts: [],
    needsExpertReview: true,
    sources: [],
  };
}

function buildObservedSymptoms(inputForm, description) {
  const symptoms = [];
  const affectedPart = String(inputForm.get("affectedPart") || "").trim();
  const symptomDescription = String(inputForm.get("symptomDescription") || "").trim();

  if (affectedPart) symptoms.push(`Partie touchee : ${affectedPart}.`);
  if (symptomDescription) symptoms.push(`Description agriculteur : ${symptomDescription}`);
  symptoms.push(...splitDetailText(description).slice(0, 3));

  return symptoms;
}

function buildUrgentActions(needsExpertReview, confidence) {
  const actions = [
    "Eviter de melanger les plantes touchees avec les plantes saines.",
    "Limiter l'arrosage sur les feuilles en attendant la confirmation du diagnostic.",
  ];

  if (needsExpertReview) {
    actions.unshift(`Faire verifier le cas par un agronome, car la confiance IA est de ${confidence}%.`);
  }

  return actions;
}

function buildRecommendedProducts(treatment) {
  const products = [];
  if (treatment?.chemical) {
    products.push("Traitement chimique homologue localement, selon les instructions d'un agronome.");
  }
  if (treatment?.biological) {
    products.push("Solution biologique ou pratique culturale adaptee si disponible localement.");
  }
  return products;
}

function buildSources(details) {
  const sources = [];
  if (details.url) {
    sources.push({ title: details.local_name || "Fiche maladie Plant.id", url: details.url });
  }
  sources.push({ title: "Plant.id", url: "https://plant.id/" });
  return sources;
}

function estimateSeverity(confidence, healthyProbability = 0) {
  if (healthyProbability >= 0.7) return "Faible";
  if (confidence >= 80) return "Elevee";
  if (confidence >= 60) return "Moyenne";
  return "A confirmer";
}

function splitDetailText(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split(/\n+|(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function readJsonBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        rejectBody(new Error("Payload JSON trop volumineux."));
      }
    });
    req.on("end", () => {
      try {
        resolveBody(body ? JSON.parse(body) : {});
      } catch {
        rejectBody(new Error("JSON invalide."));
      }
    });
    req.on("error", rejectBody);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Api-Key");
}

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim().replace(/^\uFEFF/, "");
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function normalizeApiKey(value) {
  if (!value) return "";

  return value
    .trim()
    .replace(/^Api-Key\s*:\s*/i, "")
    .replace(/^Bearer\s+/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function maskSecret(value) {
  if (!value) return "missing";
  if (value.length <= 8) return `present, length=${value.length}`;
  return `${value.slice(0, 4)}...${value.slice(-4)} length=${value.length}`;
}
