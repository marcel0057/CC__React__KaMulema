import { useEffect, useState } from "react";
import { tickets } from "../../data/platformData.js";
import { apiGet, apiPost } from "../../services/platformApi.js";

export default function TicketsPage() {
  const [ticketList, setTicketList] = useState(tickets);
  const [form, setForm] = useState({ product: "", beneficiary: "" });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiGet("/api/tickets", tickets).then(setTicketList);
  }, []);

  function generateTicket(event) {
    event.preventDefault();
    const fallbackTicket = {
      id: `TK-${Date.now().toString().slice(-4)}`,
      product: form.product,
      beneficiary: form.beneficiary,
      status: "Genere",
      qrValue: `KA-MOLEMA-${Date.now()}`,
      rating: 0,
    };
    apiPost("/api/tickets", fallbackTicket)
      .then((nextTicket) => {
        setTicketList((current) => [nextTicket, ...current]);
        setSelected(nextTicket);
      })
      .catch(() => {
        setTicketList((current) => [fallbackTicket, ...current]);
        setSelected(fallbackTicket);
      });
    setForm({ product: "", beneficiary: "" });
  }

  return (
    <section className="module-page">
      <div className="section-heading left">
        <p className="eyebrow">Traçabilité livraison</p>
        <h2>Tickets QR et notation</h2>
        <p>Génération de tickets, scan de réception et notation après livraison.</p>
      </div>

      <div className="workspace-grid">
        <article className="surface">
          <h3>Générer un ticket</h3>
          <form className="stack-form" onSubmit={generateTicket}>
            <input required placeholder="Produit" value={form.product} onChange={(event) => setForm((current) => ({ ...current, product: event.target.value }))} />
            <input required placeholder="Bénéficiaire" value={form.beneficiary} onChange={(event) => setForm((current) => ({ ...current, beneficiary: event.target.value }))} />
            <button type="submit" className="primary-action wide">Générer le QR</button>
          </form>

          {selected && (
            <div className="qr-ticket">
              <div className="fake-qr" aria-label="QR code visuel">
                {Array.from({ length: 25 }).map((_, index) => (
                  <span key={index} className={index % 2 === 0 || index % 7 === 0 ? "dark" : ""} />
                ))}
              </div>
              <strong>{selected.id}</strong>
              <p className="muted">{selected.qrValue}</p>
            </div>
          )}
        </article>

        <aside className="surface">
          <h3>Historique des tickets</h3>
          <div className="stack-list">
            {ticketList.map((ticket) => (
              <button type="button" className="history-item" key={ticket.id} onClick={() => setSelected(ticket)}>
                <strong>{ticket.id}</strong>
                <span>{ticket.product} - {ticket.beneficiary}</span>
                <em>{ticket.status}</em>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <article className="surface">
        <h3>Notation après scan</h3>
        <div className="filter-grid">
          <select>
            <option>Produit bien reçu</option>
            <option>Produit abîmé</option>
            <option>Quantité incorrecte</option>
          </select>
          <select>
            <option>5 étoiles</option>
            <option>4 étoiles</option>
            <option>3 étoiles</option>
            <option>2 étoiles</option>
            <option>1 étoile</option>
          </select>
          <button type="button" className="secondary-action">Enregistrer la note</button>
        </div>
      </article>
    </section>
  );
}
