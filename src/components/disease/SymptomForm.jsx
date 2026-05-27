import { useEffect, useRef, useState } from "react";

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function SymptomForm({ form, onChange, disabled }) {
  const recognitionRef = useRef(null);
  const descriptionRef = useRef(form.symptomDescription);
  const voiceBaseTextRef = useRef("");
  const manualStopRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognition()));
  }, []);

  useEffect(() => {
    descriptionRef.current = form.symptomDescription;
  }, [form.symptomDescription]);

  function startVoiceInput() {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || disabled) return;

    manualStopRef.current = false;
    voiceBaseTextRef.current = form.symptomDescription.trim();
    setVoiceMessage("Ecoute active : parlez maintenant. Si rien ne s'ecrit, verifiez l'autorisation du micro dans Chrome ou Edge.");
    setInterimTranscript("");

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      if (!manualStopRef.current) {
        setVoiceMessage("La dictee s'est arretee. Vous pouvez relancer si necessaire.");
      }
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript("");
      setVoiceMessage(getVoiceErrorMessage(event.error));
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) {
          finalText += `${transcript} `;
        } else {
          interimText += `${transcript} `;
        }
      }

      const spokenText = joinText(finalText.trim(), interimText.trim());
      if (spokenText) {
        onChange("symptomDescription", joinText(voiceBaseTextRef.current, spokenText));
      }
      setInterimTranscript(interimText.trim());
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setVoiceMessage("La dictee est deja active. Arretez-la puis relancez.");
    }
  }

  function stopVoiceInput() {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript("");
    setVoiceMessage("Dictee arretee.");
  }

  return (
    <section className="surface">
      <div className="section-title-row">
        <div>
          <h2>Description des symptomes</h2>
          <p>Ces informations aident l'IA a verifier son diagnostic image.</p>
        </div>
      </div>

      <div className="field-grid">
        <label>
          Identifiant agriculteur
          <input
            disabled={disabled}
            value={form.farmerId}
            onChange={(event) => onChange("farmerId", event.target.value)}
          />
        </label>

        <label>
          Culture concernee
          <input
            disabled={disabled}
            placeholder="Ex : tomate, cacao, manioc"
            value={form.cropName}
            onChange={(event) => onChange("cropName", event.target.value)}
          />
        </label>

        <label>
          Localisation
          <input
            disabled={disabled}
            placeholder="Ex : Bafoussam, Douala, Bertoua"
            value={form.location}
            onChange={(event) => onChange("location", event.target.value)}
          />
        </label>

        <label>
          Partie touchee
          <select
            disabled={disabled}
            value={form.affectedPart}
            onChange={(event) => onChange("affectedPart", event.target.value)}
          >
            <option value="">Selectionner</option>
            <option value="feuilles">Feuilles</option>
            <option value="tige">Tige</option>
            <option value="fruit">Fruit</option>
            <option value="racine">Racine</option>
            <option value="plante entiere">Plante entiere</option>
          </select>
        </label>

        <label>
          Age de la plante
          <input
            disabled={disabled}
            placeholder="Ex : 3 semaines"
            value={form.plantAge}
            onChange={(event) => onChange("plantAge", event.target.value)}
          />
        </label>
      </div>

      <label className="full-field">
        Symptomes observes
        <textarea
          disabled={disabled}
          rows="6"
          placeholder="Decrivez les taches, la couleur, les feuilles seches, la moisissure, les insectes visibles, l'evolution de la maladie..."
          value={form.symptomDescription}
          onChange={(event) => onChange("symptomDescription", event.target.value)}
        />
      </label>

      <div className="voice-row">
        <button
          className="secondary-action"
          disabled={!voiceSupported || disabled}
          type="button"
          onClick={isListening ? stopVoiceInput : startVoiceInput}
        >
          {isListening ? "Arreter la voix" : "Dicter les symptomes"}
        </button>
        <span>
          {voiceSupported
            ? "Saisie vocale disponible avec micro autorise"
            : "Saisie vocale non supportee : essayez Chrome ou Edge"}
        </span>
      </div>

      {(voiceMessage || interimTranscript) && (
        <div className={isListening ? "voice-feedback listening" : "voice-feedback"}>
          {voiceMessage && <p>{voiceMessage}</p>}
          {interimTranscript && <strong>{interimTranscript}</strong>}
        </div>
      )}
    </section>
  );
}

function joinText(currentText, nextText) {
  return [currentText, nextText].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function getVoiceErrorMessage(errorCode) {
  const messages = {
    "not-allowed": "Micro refuse. Autorisez le micro dans le navigateur puis recommencez.",
    "service-not-allowed": "Le navigateur bloque le service vocal. Essayez avec Chrome ou Edge.",
    "no-speech": "Aucune parole detectee. Parlez plus pres du micro puis relancez.",
    "audio-capture": "Aucun micro detecte. Verifiez le micro de l'ordinateur.",
    network: "La reconnaissance vocale a besoin d'une connexion internet stable.",
  };

  return messages[errorCode] || "La dictee vocale a rencontre une erreur. Essayez avec Chrome ou Edge.";
}
