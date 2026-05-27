const { execFile } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { normalizeCountryName } = require('./africa-meta.service');

const CAMEROON_REGION_COORDS = {
  yaounde: { lat: 3.848, lng: 11.5021, label: 'Yaounde' },
  douala: { lat: 4.0511, lng: 9.7679, label: 'Douala' },
  bafoussam: { lat: 5.4778, lng: 10.4176, label: 'Bafoussam' },
  garoua: { lat: 9.3014, lng: 13.3928, label: 'Garoua' },
  bertoua: { lat: 4.5773, lng: 13.6846, label: 'Bertoua' },
  maroua: { lat: 10.5913, lng: 14.3159, label: 'Maroua' },
  ebolowa: { lat: 2.9007, lng: 11.15, label: 'Ebolowa' },
  kribi: { lat: 2.9404, lng: 9.9109, label: 'Kribi' },
  limbe: { lat: 4.0236, lng: 9.2061, label: 'Limbe' },
  ngaoundere: { lat: 7.3277, lng: 13.5847, label: 'Ngaoundere' }
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const HUGGING_FACE_MODEL = process.env.HUGGING_FACE_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
const FETCH_TIMEOUT_MS = 25000;
const AFRICA_WIDE_CROP_CATALOG = [
  'mais',
  'manioc',
  'cacao',
  'cafe',
  'plantain',
  'tomate',
  'piment',
  'igname',
  'arachide',
  'soja',
  'haricot',
  'gombo',
  'riz',
  'sorgho',
  'mil',
  'sesame',
  'pomme de terre',
  'chou',
  'oignon',
  'carotte',
  'ble tendre',
  'banane dessert',
  'ananas',
  'avocat',
  'moringa',
  'the',
  'cafe arabica',
  'coton'
];
const OPEN_METEO_WEATHER_LABELS = {
  0: 'Ciel degage',
  1: 'Principalement degage',
  2: 'Partiellement nuageux',
  3: 'Couvert',
  45: 'Brouillard',
  48: 'Brouillard givrant',
  51: 'Bruine legere',
  53: 'Bruine moderee',
  55: 'Bruine dense',
  61: 'Pluie legere',
  63: 'Pluie moderee',
  65: 'Pluie forte',
  71: 'Neige legere',
  73: 'Neige moderee',
  75: 'Neige forte',
  80: 'Averses legeres',
  81: 'Averses moderees',
  82: 'Averses violentes',
  95: 'Orage'
};

const wait = (timeoutMs = FETCH_TIMEOUT_MS) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Temps de reponse depasse pour le service externe.')), timeoutMs)
  );

const parseResponsePayload = (payload, contentType = '') => {
  if (typeof payload !== 'string') {
    return payload;
  }

  const normalizedContentType = Array.isArray(contentType)
    ? contentType.join(';')
    : String(contentType || '');
  const trimmedPayload = payload.trim();

  if (
    normalizedContentType.includes('application/json') ||
    trimmedPayload.startsWith('{') ||
    trimmedPayload.startsWith('[')
  ) {
    return safeJsonParse(payload, payload);
  }

  return payload;
};

const escapePowerShellLiteral = (value = '') => String(value).replace(/'/g, "''");

const runPowerShellRequest = async (url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
  const tempToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const headersPath = path.join(os.tmpdir(), `agro-headers-${tempToken}.json`);
  const bodyPath = path.join(os.tmpdir(), `agro-body-${tempToken}.txt`);
  const scriptPath = path.join(os.tmpdir(), `agro-request-${tempToken}.ps1`);

  const headers = options.headers || {};
  const contentType = headers['Content-Type'] || headers['content-type'] || '';
  await fs.writeFile(headersPath, JSON.stringify(headers), 'utf8');

  if (options.body !== undefined) {
    await fs.writeFile(bodyPath, String(options.body), 'utf8');
  }

  const script = `
$headersFile = '${escapePowerShellLiteral(headersPath)}'
$bodyFile = '${escapePowerShellLiteral(bodyPath)}'
$headers = @{}
if (Test-Path -LiteralPath $headersFile) {
  $rawHeaders = Get-Content -LiteralPath $headersFile -Raw | ConvertFrom-Json
  foreach ($prop in $rawHeaders.PSObject.Properties) {
    $headers[$prop.Name] = [string]$prop.Value
  }
}
$body = $null
if (Test-Path -LiteralPath $bodyFile) {
  $body = Get-Content -LiteralPath $bodyFile -Raw
}
try {
  $params = @{
    Method = '${escapePowerShellLiteral((options.method || 'GET').toUpperCase())}'
    Uri = '${escapePowerShellLiteral(url)}'
    Headers = $headers
    TimeoutSec = ${Math.max(5, Math.ceil(timeoutMs / 1000))}
    UseBasicParsing = $true
  }
  if ($body -ne $null) { $params['Body'] = $body }
  if ('${escapePowerShellLiteral(contentType)}' -ne '') { $params['ContentType'] = '${escapePowerShellLiteral(contentType)}' }
  $response = Invoke-WebRequest @params
  @{ ok = $true; status = [int]$response.StatusCode; contentType = [string]$response.Headers['Content-Type']; body = $response.Content } | ConvertTo-Json -Compress
} catch {
  $statusCode = 500
  $contentType = 'text/plain'
  $bodyText = $_.Exception.Message
  if ($_.Exception.Response) {
    try { $statusCode = [int]$_.Exception.Response.StatusCode.value__ } catch {}
    try { $contentType = [string]$_.Exception.Response.Headers['Content-Type'] } catch {}
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $bodyText = $reader.ReadToEnd()
    } catch {}
  }
  @{ ok = $false; status = $statusCode; contentType = $contentType; body = $bodyText } | ConvertTo-Json -Compress
}
`;
  await fs.writeFile(scriptPath, script, 'utf8');

  try {
    const stdout = await new Promise((resolve, reject) => {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
        {
          timeout: timeoutMs + 5000,
          maxBuffer: 20 * 1024 * 1024
        },
        (error, standardOutput, standardError) => {
          if (error && !standardOutput && !standardError) {
            reject(error);
            return;
          }

          resolve(standardOutput || standardError);
        }
      );
    });

    const envelope = safeJsonParse(String(stdout).trim(), null);
    if (!envelope) {
      throw new Error('Reponse PowerShell externe invalide.');
    }

    const payload = parseResponsePayload(envelope.body, envelope.contentType || '');
    if (!envelope.ok) {
      throw new Error(
        typeof payload === 'string'
          ? payload
          : payload.message || payload.error?.message || 'Echec de l appel PowerShell externe.'
      );
    }

    return payload;
  } finally {
    await fs.unlink(headersPath).catch(() => null);
    await fs.unlink(bodyPath).catch(() => null);
    await fs.unlink(scriptPath).catch(() => null);
  }
};

const fetchJson = async (url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
  try {
    if (typeof fetch !== 'function') {
      throw new Error('Fetch global indisponible sur cette version de Node.js.');
    }

    const response = await Promise.race([fetch(url, options), wait(timeoutMs)]);
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new Error(
        typeof payload === 'string'
          ? payload
          : payload.message || payload.error?.message || 'Echec de l appel au service externe.'
      );
    }

    return payload;
  } catch (error) {
    if (process.platform === 'win32') {
      return runPowerShellRequest(url, options, timeoutMs);
    }
    throw error;
  }
};

const stripCodeFences = (value = '') =>
  String(value)
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const extractJsonObject = (value) => {
  const clean = stripCodeFences(value);
  const direct = safeJsonParse(clean);
  if (direct) {
    return direct;
  }

  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return safeJsonParse(clean.slice(start, end + 1));
  }

  throw new Error('La reponse JSON du modele IA est invalide.');
};

const encodeImagePart = (imageBase64, mimeType = 'image/jpeg') => ({
  inline_data: {
    mime_type: mimeType,
    data: imageBase64
  }
});

const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);
const isHuggingFaceConfigured = () => Boolean(process.env.HUGGING_FACE_API_KEY);
const isPlantIdConfigured = () => Boolean(process.env.PLANT_ID_API_KEY);
const isGraphHopperConfigured = () => Boolean(process.env.GRAPHHOPPER_API_KEY);
const isWeatherApiConfigured = () => Boolean(process.env.WEATHER_API_KEY);

const callGemini = async (parts, systemInstruction) => {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY manquante.');
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  if (systemInstruction) {
    payload.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const data = await fetchJson(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((item) => item.text || '')
      .join('')
      .trim() || '';

  if (!text) {
    throw new Error('Le modele Gemini a renvoye une reponse vide.');
  }

  return extractJsonObject(text);
};

const buildDiseaseCatalog = (maladies = []) =>
  maladies.map((maladie) => ({
    id: maladie.id,
    nom: maladie.nom,
    culture: maladie.culture,
    niveau_gravite: maladie.niveau_gravite,
    description: maladie.description,
    symptomes: maladie.symptomes,
    mots_cles: maladie.mots_cles
  }));

const toArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return [value].filter(Boolean);
};

const sanitizeConfidence = (value, fallback = 0) => {
  const confidence = Number(value);
  if (Number.isNaN(confidence)) {
    return fallback;
  }
  return Math.min(99, Math.max(1, Math.round(confidence)));
};

const pickFirstNumeric = (values = []) => {
  if (!Array.isArray(values)) {
    return 0;
  }

  const item = values.find((value) => value !== null && value !== undefined && !Number.isNaN(Number(value)));
  return Number(item || 0);
};

const analyzeDiseaseTextWithGemini = async (description, maladies) => {
  const catalog = buildDiseaseCatalog(maladies);
  const result = await callGemini(
    [
      {
        text: [
          'Analyse cette description de symptomes agricoles.',
          'Choisis exclusivement une maladie parmi le catalogue fourni.',
          'Retourne uniquement un objet JSON avec les champs suivants :',
          'maladie_id, confiance, correspondances, resume.',
          'correspondances doit etre un tableau de mots ou expressions courts.',
          `Description utilisateur: ${description}`,
          `Catalogue maladies: ${JSON.stringify(catalog)}`
        ].join('\n')
      }
    ],
    'Tu es un assistant agronome francophone. Tu dois repondre uniquement en JSON valide.'
  );

  return {
    maladie_id: Number(result.maladie_id),
    confiance: sanitizeConfidence(result.confiance, 65),
    correspondances: Array.isArray(result.correspondances) ? result.correspondances : [],
    resume: result.resume || ''
  };
};

const callHuggingFaceChat = async (messages, model = HUGGING_FACE_MODEL) => {
  if (!isHuggingFaceConfigured()) {
    throw new Error('HUGGING_FACE_API_KEY manquante.');
  }

  const data = await fetchJson(
    'https://router.huggingface.co/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 700,
        messages,
        response_format: {
          type: 'json_object'
        }
      })
    }
  );

  const content = data.choices?.[0]?.message?.content || '';
  if (!content) {
    throw new Error('Hugging Face a renvoye une reponse vide.');
  }

  return extractJsonObject(content);
};

const analyzeDiseaseTextWithHuggingFace = async (description, maladies) => {
  const catalog = buildDiseaseCatalog(maladies);
  const result = await callHuggingFaceChat([
    {
      role: 'system',
      content:
        'Tu es un assistant agronome francophone. Tu dois choisir uniquement dans le catalogue et repondre en JSON valide.'
    },
    {
      role: 'user',
      content: [
        'Analyse cette description de symptomes agricoles.',
        'Choisis exclusivement une maladie parmi le catalogue fourni.',
        'Retourne seulement un JSON avec maladie_id, confiance, correspondances et resume.',
        `Description utilisateur: ${description}`,
        `Catalogue maladies: ${JSON.stringify(catalog)}`
      ].join('\n')
    }
  ]);

  return {
    maladie_id: Number(result.maladie_id),
    confiance: sanitizeConfidence(result.confiance, 60),
    correspondances: Array.isArray(result.correspondances) ? result.correspondances : [],
    resume: result.resume || ''
  };
};

const analyzeDiseasePhotoWithGemini = async ({ imageBase64, mimeType, maladies }) => {
  const catalog = buildDiseaseCatalog(maladies);
  const result = await callGemini(
    [
      {
        text: [
          'Observe cette image de culture malade.',
          'Choisis exclusivement une maladie parmi le catalogue fourni.',
          'Retourne uniquement un objet JSON avec les champs suivants :',
          'maladie_id, confiance, correspondances, resume.',
          'correspondances doit contenir les indices visuels observes.',
          `Catalogue maladies: ${JSON.stringify(catalog)}`
        ].join('\n')
      },
      encodeImagePart(imageBase64, mimeType)
    ],
    'Tu es un assistant agronome specialise en diagnostic visuel. Tu dois repondre uniquement en JSON valide.'
  );

  return {
    maladie_id: Number(result.maladie_id),
    confiance: sanitizeConfidence(result.confiance, 72),
    correspondances: Array.isArray(result.correspondances) ? result.correspondances : [],
    resume: result.resume || ''
  };
};

const normalizePlantIdDetails = (suggestion = {}) => {
  const details = suggestion.details || {};
  const treatment = details.treatment || {};

  return {
    nom: details.local_name || suggestion.name || 'Diagnostic Plant.id',
    description: details.description || 'Diagnostic visuel detecte par Plant.id.',
    symptomes: toArray(details.cause || details.common_names || []),
    traitements: [
      ...toArray(treatment.biological),
      ...toArray(treatment.chemical),
      ...toArray(treatment.prevention)
    ],
    produits_traitement: [
      ...toArray(treatment.chemical),
      ...toArray(treatment.biological)
    ]
  };
};

const analyzeDiseasePhotoWithPlantId = async ({ imageBase64, latitude, longitude }) => {
  if (!isPlantIdConfigured()) {
    throw new Error('PLANT_ID_API_KEY manquante.');
  }

  const url =
    'https://plant.id/api/v3/health_assessment' +
    '?language=fr&details=local_name,description,treatment,classification,common_names,cause,url' +
    '&full_disease_list=true';
  const data = await fetchJson(
    url,
    {
      method: 'POST',
      headers: {
        'Api-Key': process.env.PLANT_ID_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        images: [imageBase64],
        latitude: latitude || undefined,
        longitude: longitude || undefined
      })
    },
    30000
  );

  const suggestion = data.result?.disease?.suggestions?.[0];
  if (!suggestion) {
    throw new Error('Plant.id n a retourne aucune suggestion de maladie.');
  }

  return {
    maladie: {
      id: null,
      nom: normalizePlantIdDetails(suggestion).nom,
      culture: 'Culture analysee',
      description: normalizePlantIdDetails(suggestion).description,
      symptomes: normalizePlantIdDetails(suggestion).symptomes,
      traitements: normalizePlantIdDetails(suggestion).traitements,
      produits_traitement: normalizePlantIdDetails(suggestion).produits_traitement,
      niveau_gravite:
        suggestion.probability >= 0.8
          ? 'eleve'
          : suggestion.probability >= 0.55
            ? 'moyen'
            : 'faible',
      mots_cles: normalizePlantIdDetails(suggestion).symptomes
    },
    confiance: sanitizeConfidence((suggestion.probability || 0) * 100, 70),
    correspondances: [
      normalizePlantIdDetails(suggestion).nom,
      ...(normalizePlantIdDetails(suggestion).symptomes || []).slice(0, 3)
    ].filter(Boolean),
    resume:
      data.result?.is_healthy?.binary === false
        ? 'Plant.id confirme que la plante presente des signes de stress ou de maladie.'
        : 'Plant.id a etabli un diagnostic photo a partir de l image fournie.'
  };
};

const geocodeWithOpenMeteo = async ({ region, country = 'Cameroun' }) => {
  const query = encodeURIComponent([region, country].filter(Boolean).join(' '));
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=fr&format=json`;
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } }, 15000);
  const result = data.results?.[0];

  if (!result) {
    throw new Error('Aucune coordonnee geographique trouvee pour cette region.');
  }

  return {
    lat: Number(result.latitude),
    lng: Number(result.longitude),
    name: result.name || region || country,
    country: result.country || country,
    source: 'open-meteo'
  };
};

const getFallbackRegionCoordinates = (region, country = 'Cameroun') => {
  if (normalizeCountryName(country) !== 'Cameroun') {
    return null;
  }

  const key = String(region || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return CAMEROON_REGION_COORDS[key] || null;
};

const resolveRegionCoordinates = async (region, country = 'Cameroun') => {
  try {
    return await geocodeWithOpenMeteo({ region, country });
  } catch (error) {
    const fallback = getFallbackRegionCoordinates(region, country);
    if (fallback) {
      return {
        lat: fallback.lat,
        lng: fallback.lng,
        name: fallback.label,
        country: normalizeCountryName(country),
        source: 'coordonnees locales'
      };
    }
    throw error;
  }
};

const getElevation = async (lat, lng) => {
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } }, 15000);
  return Number(data.elevation?.[0] ?? data.elevation ?? 0);
};

const getWeatherContext = async (lat, lng) => {
  if (isWeatherApiConfigured()) {
    try {
      const url = `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${lat},${lng}&lang=fr&aqi=no`;
      const data = await fetchJson(url, { headers: { Accept: 'application/json' } }, 15000);

      return {
        temperature_c: Number(data.current?.temp_c || 0),
        humidite: Number(data.current?.humidity || 0),
        vent_kph: Number(data.current?.wind_kph || 0),
        precipitation_mm: Number(data.current?.precip_mm || 0),
        condition: data.current?.condition?.text || 'Condition inconnue',
        observation_time: data.current?.last_updated || null,
        ville_api: data.location?.name || null,
        source: 'weatherapi'
      };
    } catch (error) {
    }
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code`;
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } }, 15000);

  return {
    temperature_c: Number(data.current?.temperature_2m || 0),
    humidite: Number(data.current?.relative_humidity_2m || 0),
    vent_kph: Number(data.current?.wind_speed_10m || 0),
    precipitation_mm: Number(data.current?.precipitation || 0),
    condition: OPEN_METEO_WEATHER_LABELS[data.current?.weather_code] || 'Condition locale',
    observation_time: data.current?.time || null,
    ville_api: null,
    source: 'open-meteo'
  };
};

const getAirQualityContext = async (lat, lng) => {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` +
    '&hourly=pm10,pm2_5';
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } }, 15000);

  return {
    pm10: pickFirstNumeric(data.hourly?.pm10),
    pm2_5: pickFirstNumeric(data.hourly?.pm2_5),
    source: 'open-meteo-air-quality'
  };
};

const getFloodRiskContext = async (lat, lng) => {
  const url =
    `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lng}` +
    '&daily=river_discharge';
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } }, 15000);
  const riverDischarge = pickFirstNumeric(data.daily?.river_discharge);

  return {
    river_discharge: riverDischarge,
    risk_level:
      riverDischarge >= 450 ? 'eleve' : riverDischarge >= 250 ? 'moyen' : 'faible',
    source: 'open-meteo-flood'
  };
};

const getSolarContext = async (lat, lng) => {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    '&hourly=shortwave_radiation';
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } }, 15000);
  const shortwaveRadiation = pickFirstNumeric(data.hourly?.shortwave_radiation);

  return {
    shortwave_radiation: shortwaveRadiation,
    solar_potential:
      shortwaveRadiation >= 500 ? 'fort' : shortwaveRadiation >= 250 ? 'moyen' : 'faible',
    source: 'open-meteo-radiation'
  };
};

const buildClimateRiskSummary = ({ weather, airQuality, flood, solar, altitude }) => {
  const heatRisk =
    Number(weather?.temperature_c || 0) >= 33 ? 'eleve' : Number(weather?.temperature_c || 0) >= 28 ? 'moyen' : 'faible';
  const waterStress =
    Number(weather?.precipitation_mm || 0) <= 0.5 && Number(weather?.humidite || 0) <= 45
      ? 'eleve'
      : Number(weather?.precipitation_mm || 0) <= 2
        ? 'moyen'
        : 'faible';
  const altitudeBand = Number(altitude || 0) >= 1500 ? 'haute' : Number(altitude || 0) >= 500 ? 'moyenne' : 'basse';

  return {
    chaleur: heatRisk,
    stress_hydrique: waterStress,
    inondation: flood?.risk_level || 'inconnu',
    qualite_air:
      Number(airQuality?.pm2_5 || 0) >= 55 ? 'degradee' : Number(airQuality?.pm2_5 || 0) >= 25 ? 'moyenne' : 'bonne',
    potentiel_solaire: solar?.solar_potential || 'moyen',
    bande_altitude: altitudeBand
  };
};

const getRegionAgronomicContext = async ({ region, country = 'Cameroun' }) => {
  const coordinates = await resolveRegionCoordinates(region, country);
  const [altitude, weather, airQuality, flood, solar] = await Promise.all([
    getElevation(coordinates.lat, coordinates.lng).catch(() => null),
    getWeatherContext(coordinates.lat, coordinates.lng).catch(() => null),
    getAirQualityContext(coordinates.lat, coordinates.lng).catch(() => null),
    getFloodRiskContext(coordinates.lat, coordinates.lng).catch(() => null),
    getSolarContext(coordinates.lat, coordinates.lng).catch(() => null)
  ]);

  return {
    region,
    pays: normalizeCountryName(country),
    latitude: coordinates.lat,
    longitude: coordinates.lng,
    altitude_reelle: altitude,
    meteo: weather,
    qualite_air: airQuality,
    risque_inondation: flood,
    rayonnement_solaire: solar,
    signaux_climatiques: buildClimateRiskSummary({
      weather,
      airQuality,
      flood,
      solar,
      altitude
    }),
    source_geocodage: coordinates.source || 'coordonnees locales'
  };
};

const normalizeRecommendation = (item = {}, index = 0) => ({
  id: item.id || `ia-${index + 1}`,
  culture_recommandee: item.culture_recommandee || item.culture || 'Culture recommandee',
  saison_semis: item.saison_semis || item.periode_semis || 'Selon la saison locale',
  rendement_estime: item.rendement_estime || 'A confirmer selon terrain',
  conseils_specifiques:
    item.conseils_specifiques ||
    item.conseil ||
    'Préparer le sol, surveiller l humidite et securiser les intrants.',
  niveau_difficulte: item.niveau_difficulte || 'moyen',
  adequation: item.adequation || 'Bon',
  pertinence: Number(item.pertinence || 7),
  prix_moyen_marche: Number(item.prix_moyen_marche || 0),
  source_recommandation: item.source_recommandation || 'ia'
});

const buildHeuristicPanAfricanRecommendations = ({ criteria, context }) => {
  const normalizedCountry = normalizeCountryName(criteria.pays || context?.pays || 'Cameroun');
  const rainfall = Number(criteria.pluviometrie || 0);
  const altitude = Number(criteria.altitude || 0);
  const objective = criteria.objectif || 'Vente locale';
  const wetTropics = rainfall >= 1200 && altitude <= 1200;
  const dryLowlands = rainfall <= 900 && altitude <= 700;
  const highlands = altitude >= 1300;

  let base = [
    {
      culture_recommandee: 'mais',
      saison_semis: 'Debut des pluies',
      rendement_estime: '2 a 4 tonnes/hectare',
      conseils_specifiques: `Culture polyvalente pour ${normalizedCountry}, adaptee a l objectif ${objective.toLowerCase()}.`,
      niveau_difficulte: 'facile',
      adequation: 'Bon',
      pertinence: 7
    },
    {
      culture_recommandee: 'haricot',
      saison_semis: 'Debut et milieu de saison',
      rendement_estime: '1 a 1.8 tonne/hectare',
      conseils_specifiques: 'Associer a une rotation culturale et surveiller les maladies foliaires.',
      niveau_difficulte: 'moyen',
      adequation: 'Bon',
      pertinence: 6
    }
  ];

  if (wetTropics) {
    base = [
      {
        culture_recommandee: 'manioc',
        saison_semis: 'Saison des pluies',
        rendement_estime: '15 a 25 tonnes/hectare',
        conseils_specifiques: 'Tres adapte aux zones tropicales humides et a la securite alimentaire.',
        niveau_difficulte: 'facile',
        adequation: 'Excellent',
        pertinence: 10
      },
      {
        culture_recommandee: 'plantain',
        saison_semis: 'Toute l annee avec bonne humidite',
        rendement_estime: '12 a 20 tonnes/hectare',
        conseils_specifiques: 'Exiger un paillage, une bonne humidite et un suivi phytosanitaire.',
        niveau_difficulte: 'moyen',
        adequation: 'Excellent',
        pertinence: 9
      },
      {
        culture_recommandee: 'cacao',
        saison_semis: 'Debut de saison humide',
        rendement_estime: '0.8 a 1.5 tonne/hectare',
        conseils_specifiques: 'Pertinent pour les zones forestieres avec strategie de vente/export.',
        niveau_difficulte: 'difficile',
        adequation: 'Bon',
        pertinence: 8
      }
    ];
  } else if (dryLowlands) {
    base = [
      {
        culture_recommandee: 'sorgho',
        saison_semis: 'Debut des pluies courtes',
        rendement_estime: '1.5 a 3 tonnes/hectare',
        conseils_specifiques: 'Bonne tolerance a la secheresse et forte resilience en zone soudano-sahelienne.',
        niveau_difficulte: 'facile',
        adequation: 'Excellent',
        pertinence: 10
      },
      {
        culture_recommandee: 'mil',
        saison_semis: 'Debut de saison',
        rendement_estime: '1 a 2 tonnes/hectare',
        conseils_specifiques: 'A privilegier en faible pluviometrie et sur sols legers.',
        niveau_difficulte: 'facile',
        adequation: 'Excellent',
        pertinence: 9
      },
      {
        culture_recommandee: 'sesame',
        saison_semis: 'Debut des pluies',
        rendement_estime: '0.6 a 1.2 tonne/hectare',
        conseils_specifiques: 'Convient bien aux debouches commerciaux regionaux et export.',
        niveau_difficulte: 'moyen',
        adequation: 'Bon',
        pertinence: 8
      }
    ];
  } else if (highlands) {
    base = [
      {
        culture_recommandee: 'pomme de terre',
        saison_semis: 'Saison fraiche ou debut des pluies',
        rendement_estime: '18 a 30 tonnes/hectare',
        conseils_specifiques: 'Tres performante en altitude avec bon drainage et suivi sanitaire.',
        niveau_difficulte: 'moyen',
        adequation: 'Excellent',
        pertinence: 10
      },
      {
        culture_recommandee: 'chou',
        saison_semis: 'Saison fraiche',
        rendement_estime: '20 a 35 tonnes/hectare',
        conseils_specifiques: 'Bien adapter les densites et la fertilisation selon le marche cible.',
        niveau_difficulte: 'moyen',
        adequation: 'Bon',
        pertinence: 8
      },
      {
        culture_recommandee: 'carotte',
        saison_semis: 'Saison fraiche',
        rendement_estime: '15 a 25 tonnes/hectare',
        conseils_specifiques: 'Besoin d un sol meuble et d une gestion rigoureuse de l humidite.',
        niveau_difficulte: 'moyen',
        adequation: 'Bon',
        pertinence: 7
      }
    ];
  }

  return base.map((item, index) => normalizeRecommendation(item, index));
};

const buildPanAfricanRecommendationPrompt = ({ criteria, context }) =>
  [
    'Tu es un expert agronome panafricain.',
    'Produis uniquement du JSON valide avec un tableau recommendations de 4 a 6 objets.',
    'Chaque objet doit contenir: culture_recommandee, saison_semis, rendement_estime, conseils_specifiques, niveau_difficulte, adequation, pertinence.',
    'Niveau difficulte doit etre facile, moyen ou difficile.',
    'Adequation doit etre Excellent, Bon ou Acceptable.',
    `Pays: ${criteria.pays || context?.pays || 'Cameroun'}`,
    `Region: ${criteria.region}`,
    `Type de sol: ${criteria.type_sol_nom || 'non precise'}`,
    `Altitude: ${criteria.altitude} m`,
    `Pluviometrie annuelle estimee: ${criteria.pluviometrie} mm`,
    `Objectif: ${criteria.objectif || 'Vente locale'}`,
    `Signaux climatiques: ${JSON.stringify(context?.signaux_climatiques || {})}`,
    `Catalogue cultures prefere: ${JSON.stringify(AFRICA_WIDE_CROP_CATALOG)}`
  ].join('\n');

const generatePanAfricanSeedRecommendations = async ({ criteria, context }) => {
  const prompt = buildPanAfricanRecommendationPrompt({ criteria, context });

  try {
    if (isGeminiConfigured()) {
      const data = await callGemini(
        [{ text: prompt }],
        'Tu reponds uniquement en JSON valide pour des recommandations agronomiques panafricaines.'
      );

      if (Array.isArray(data.recommendations)) {
        return data.recommendations.map(normalizeRecommendation);
      }
    }
  } catch (error) {
  }

  try {
    if (isHuggingFaceConfigured()) {
      const data = await callHuggingFaceChat([
        {
          role: 'system',
          content:
            'Tu es un expert agronome panafricain. Tu reponds uniquement en JSON valide.'
        },
        { role: 'user', content: prompt }
      ]);

      if (Array.isArray(data.recommendations)) {
        return data.recommendations.map(normalizeRecommendation);
      }
    }
  } catch (error) {
  }

  return buildHeuristicPanAfricanRecommendations({ criteria, context });
};

const geocodeWithGraphHopper = async (query) => {
  if (!isGraphHopperConfigured()) {
    throw new Error('GRAPHHOPPER_API_KEY manquante.');
  }

  const url =
    `https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(query)}` +
    `&locale=fr&limit=1&provider=nominatim&key=${process.env.GRAPHHOPPER_API_KEY}`;
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } }, 20000);
  const hit = data.hits?.[0];

  if (!hit?.point) {
    throw new Error('Adresse introuvable via GraphHopper.');
  }

  return {
    lat: Number(hit.point.lat),
    lng: Number(hit.point.lng),
    label: hit.name || query
  };
};

const getRouteFromGraphHopper = async (start, end) => {
  if (!isGraphHopperConfigured()) {
    throw new Error('GRAPHHOPPER_API_KEY manquante.');
  }

  const url =
    `https://graphhopper.com/api/1/route?profile=car&locale=fr&calc_points=false&instructions=false` +
    `&point=${start.lat},${start.lng}&point=${end.lat},${end.lng}` +
    `&key=${process.env.GRAPHHOPPER_API_KEY}`;
  const data = await fetchJson(url, { headers: { Accept: 'application/json' } }, 25000);
  const route = data.paths?.[0] || data.routes?.[0];

  if (!route) {
    throw new Error('Aucun itineraire routier trouve via GraphHopper.');
  }

  return {
    distanceKm: Number((route.distance / 1000).toFixed(2)),
    dureeHeures: Number((route.time / 3600000).toFixed(2)),
    source: 'graphhopper'
  };
};

module.exports = {
  analyzeDiseasePhotoWithPlantId,
  analyzeDiseasePhotoWithGemini,
  analyzeDiseaseTextWithHuggingFace,
  analyzeDiseaseTextWithGemini,
  getRegionAgronomicContext,
  generatePanAfricanSeedRecommendations,
  getRouteFromGraphHopper,
  geocodeWithGraphHopper,
  isGeminiConfigured,
  isGraphHopperConfigured,
  isHuggingFaceConfigured,
  isPlantIdConfigured,
  isWeatherApiConfigured,
  resolveRegionCoordinates,
  __debugRunPowerShellRequest: runPowerShellRequest
};
