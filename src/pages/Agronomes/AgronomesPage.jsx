import { useEffect, useMemo, useState } from "react";
import { agronomes, agronomeRegions } from "../../data/platformData.js";
import { apiGet } from "../../services/platformApi.js";
import MapLibreView from "../../components/ui/MapLibreView";
import BottomSheet from "../../components/ui/BottomSheet";
import { useGeolocationTracker } from "../../hooks/useGeolocationTracker";

const initialContactForm = {
  senderName: "Utilisateur KA MOLEMA",
  senderEmail: "vous@example.com",
  message: "",
  date: "",
  time: "Matin",
  meetingMode: "Terrain",
};

export default function AgronomesPage() {
  const [filters, setFilters] = useState({
    region: "",
    city: "",
    experience: "0",
    availableOnly: false,
  });
  const [contact, setContact] = useState(null);
  const [agronomeList, setAgronomeList] = useState(agronomes);
  const [contactForm, setContactForm] = useState(initialContactForm);
  const [feedback, setFeedback] = useState(null);
  const [sending, setSending] = useState(false);
  const [mapSelectedAgronome, setMapSelectedAgronome] = useState(null);

  const geoTracker = useGeolocationTracker();

  useEffect(() => {
    apiGet("/api/agronomes", agronomes).then(setAgronomeList);
  }, []);

  const filteredAgronomes = useMemo(() => {
    return agronomeList.filter((agronome) => {
      const regionOk = filters.region ? agronome.region === filters.region : true;
      const cityOk = filters.city
        ? agronome.city.toLowerCase().includes(filters.city.toLowerCase()) ||
        agronome.zones.some((zone) => zone.toLowerCase().includes(filters.city.toLowerCase()))
        : true;
      const experienceOk = agronome.experience >= Number(filters.experience || 0);
      const availabilityOk = filters.availableOnly
        ? agronome.availability.toLowerCase().includes("disponible")
        : true;
      return regionOk && cityOk && experienceOk && availabilityOk;
    });
  }, [agronomeList, filters]);

  function openContact(agronome, mode) {
    setFeedback(null);
    setContact({ ...agronome, mode });
    setContactForm({ ...initialContactForm, meetingMode: mode === "appointment" ? "Terrain" : "Appel" });
  }

  function updateContactForm(field, value) {
    setContactForm((current) => ({ ...current, [field]: value }));
  }

  async function sendAgronomeEmail() {
    if (!contact) return;
    setSending(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/agronomes/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agronomeName: contact.name,
          agronomeEmail: contact.email,
          type: contact.mode,
          ...contactForm,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Envoi impossible.");
      setFeedback({ type: "success", text: data.message || "Email envoyé avec succès." });
    } catch (error) {
      setFeedback({ type: "danger", text: error.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="module-page">
      <div className="section-heading left">
        <p className="eyebrow">Réseau agronomique</p>
        <h2>Ingénieurs agronomes</h2>
        <p>
          Les agronomes sont filtrés par expérience, région et zones d'intervention déclarées.
          La localisation en direct n'est pas obligatoire.
        </p>
      </div>

      <div className="surface">
        <div className="filter-grid">
          <select value={filters.region} onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}>
            <option value="">Toutes les régions</option>
            {agronomeRegions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <input
            placeholder="Ville ou zone d'intervention"
            value={filters.city}
            onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
          />
          <select value={filters.experience} onChange={(event) => setFilters((current) => ({ ...current, experience: event.target.value }))}>
            <option value="0">Toute expérience</option>
            <option value="3">3 ans et plus</option>
            <option value="5">5 ans et plus</option>
            <option value="10">10 ans et plus</option>
          </select>
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(event) => setFilters((current) => ({ ...current, availableOnly: event.target.checked }))}
            />
            Disponibles seulement
          </label>
        </div>
      </div>

      {geoTracker.isTracking && (
        <p style={{ marginTop: '0.5rem', marginBottom: '1rem', color: '#2e7d32' }}>
          <i className="ti ti-map-pin"></i> Signal GPS de l'agronome activé et partagé en temps réel
        </p>
      )}

      <MapLibreView
        markers={filteredAgronomes}
        userPosition={geoTracker.position}
        onMarkerClick={(agronome) => setMapSelectedAgronome(agronome)}
        selectedMarkerId={mapSelectedAgronome?.id}
        onMapClick={() => setMapSelectedAgronome(null)}
      />

      <BottomSheet
        isOpen={Boolean(mapSelectedAgronome)}
        data={mapSelectedAgronome}
        onClose={() => setMapSelectedAgronome(null)}
        onContact={(agronome, mode) => {
          setMapSelectedAgronome(null);
          openContact(agronome, mode);
        }}
      />

      <div className="cards-grid">
        {filteredAgronomes.map((agronome) => (
          <article className="surface expert-card" key={agronome.id}>
            <div className="card-topline">
              <span className="avatar-badge">{agronome.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
              <span className="badge success">{agronome.rating}/5</span>
            </div>
            <h3>{agronome.name}</h3>
            <p className="muted">{agronome.specialty}</p>
            <div className="status-grid">
              <div>
                <span>Expérience</span>
                <strong>{agronome.experience} ans</strong>
              </div>
              <div>
                <span>Base</span>
                <strong>{agronome.city}</strong>
              </div>
            </div>
            <p className="status-note">{agronome.availability}</p>
            <div className="contact-mini">
              <a href={`mailto:${agronome.email}`}>{agronome.email}</a>
              <a href={`tel:${agronome.phone}`}>{agronome.phone}</a>
            </div>
            <div className="chip-row compact">
              {agronome.zones.map((zone) => (
                <span className="plain-chip" key={zone}>{zone}</span>
              ))}
            </div>
            <div className="card-actions">
              <button type="button" className="secondary-action" onClick={() => openContact(agronome, "contact")}>
                Contacter
              </button>
              <button type="button" className="primary-action" onClick={() => openContact(agronome, "appointment")}>
                Rendez-vous
              </button>
            </div>
          </article>
        ))}
      </div>

      {contact && (
        <div className="modal-backdrop" role="presentation" onClick={() => setContact(null)}>
          <article className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>{contact.mode === "appointment" ? "Planifier un rendez-vous" : "Contacter directement"}</h3>
            <p className="muted">{contact.name} accompagne les agriculteurs via {contact.modes.join(", ")}.</p>

            <div className="contact-lines">
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              <a href={`tel:${contact.phone}`}>{contact.phone}</a>
            </div>

            {feedback && <p className={`alert alert-${feedback.type}`}>{feedback.text}</p>}

            <div className="filter-grid">
              <label>
                Votre nom
                <input value={contactForm.senderName} onChange={(event) => updateContactForm("senderName", event.target.value)} />
              </label>
              <label>
                Votre email
                <input type="email" value={contactForm.senderEmail} onChange={(event) => updateContactForm("senderEmail", event.target.value)} />
              </label>
            </div>

            {contact.mode === "appointment" && (
              <div className="filter-grid">
                <label>
                  Date souhaitée
                  <input type="date" value={contactForm.date} onChange={(event) => updateContactForm("date", event.target.value)} />
                </label>
                <label>
                  Moment
                  <select value={contactForm.time} onChange={(event) => updateContactForm("time", event.target.value)}>
                    <option>Matin</option>
                    <option>Après-midi</option>
                    <option>Soir</option>
                  </select>
                </label>
                <label>
                  Type
                  <select value={contactForm.meetingMode} onChange={(event) => updateContactForm("meetingMode", event.target.value)}>
                    <option>Terrain</option>
                    <option>Appel</option>
                    <option>WhatsApp</option>
                    <option>Visio</option>
                  </select>
                </label>
              </div>
            )}

            <textarea
              rows="4"
              placeholder={contact.mode === "appointment" ? "Expliquez l'objectif du rendez-vous..." : "Décrivez votre besoin ou vos symptômes..."}
              value={contactForm.message}
              onChange={(event) => updateContactForm("message", event.target.value)}
            />

            <div className="card-actions">
              <button type="button" className="secondary-action" onClick={() => setContact(null)}>Annuler</button>
              <a className="secondary-action link-button" href={buildMailto(contact, contactForm)}>Ouvrir email</a>
              <button type="button" className="primary-action" disabled={sending} onClick={sendAgronomeEmail}>
                {sending ? "Envoi..." : "Envoyer le mail"}
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

function buildMailto(contact, form) {
  const subject = contact.mode === "appointment"
    ? `Demande de rendez-vous KA MOLEMA - ${form.senderName}`
    : `Contact KA MOLEMA - ${form.senderName}`;
  const appointmentLine = contact.mode === "appointment"
    ? `\nDate souhaitee: ${form.date || "A preciser"}\nMoment: ${form.time}\nType: ${form.meetingMode}\n`
    : "";
  const body = `Bonjour ${contact.name},\n\n${form.message || "Je souhaite echanger avec vous via KA MOLEMA."}${appointmentLine}\nNom: ${form.senderName}\nEmail: ${form.senderEmail}`;
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
