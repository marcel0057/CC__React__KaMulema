import { useEffect, useMemo, useState } from "react";
import { products, productRegions, productCategories } from "../../data/platformData.js";
import { apiGet, apiPost } from "../../services/platformApi.js";
import { formatFcfa } from "../../utils/formatters.js";

const CATEGORIES = ["Legumes", "Fruits", "Tubercules", "Cereales", "Exportation", "Elevage", "Autres"];
const UNITS = ["kg", "g", "tonne", "regime", "sac", "carton", "litre", "cageot"];
const PAYMENT_MODES = ["Mobile Money", "Cash a la livraison", "Virement", "Orange Money"];

const initialProposalForm = {
  farmerName: "",
  farmerPhone: "",
  name: "",
  category: "Legumes",
  unit: "kg",
  quantity: "",
  minOrder: "",
  price: "",
  quality: "",
  deliveryDelay: "",
  paymentMode: "Mobile Money",
  region: "",
  city: "",
};

const initialOrderForm = {
  buyerName: "",
  buyerPhone: "+237 ",
  quantity: "",
  deliveryMode: "Livraison simple",
  message: "",
};

export default function MarketplacePage() {
  const [filters, setFilters] = useState({ query: "", region: "", category: "", certified: "" });
  const [productList, setProductList] = useState(products);
  const [proposals, setProposals] = useState([]);
  const [orders, setOrders] = useState([]);

  // Modals
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedForOrder, setSelectedForOrder] = useState(null); // product or proposal

  const [proposalForm, setProposalForm] = useState(initialProposalForm);
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const [proposalSending, setProposalSending] = useState(false);
  const [orderSending, setOrderSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    apiGet("/api/products", products).then(setProductList);
    apiGet("/api/market/proposals", []).then(setProposals);
    apiGet("/api/market/orders", []).then(setOrders);
  }, []);

  const allOffers = useMemo(() => {
    const adaptedProposals = proposals.map(p => ({
      ...p,
      isProposal: true,
      certified: false,
      loyalPriority: false,
      paymentModes: p.paymentModes ?? [p.paymentMode],
      farmer: p.farmerName,
    }));
    const filteredProducts = productList.filter((product) => {
      const queryOk = filters.query
        ? `${product.name} ${product.farmer} ${product.city}`.toLowerCase().includes(filters.query.toLowerCase())
        : true;
      const regionOk = filters.region ? product.region === filters.region : true;
      const categoryOk = filters.category ? product.category === filters.category : true;
      const certifiedOk = filters.certified ? String(product.certified) === filters.certified : true;
      return queryOk && regionOk && categoryOk && certifiedOk;
    });
    return [...adaptedProposals, ...filteredProducts];
  }, [filters, productList, proposals]);

  const marketStats = useMemo(() => ({
    offers: allOffers.length,
    certified: allOffers.filter((p) => p.certified).length,
    proposals: proposals.length,
    orders: orders.length,
  }), [allOffers, proposals, orders]);

  function openOrder(offer) {
    setFeedback(null);
    setOrderForm({ ...initialOrderForm, quantity: String(offer.minOrder ?? 1) });
    setSelectedForOrder(offer);
  }

  async function submitProposal(event) {
    event.preventDefault();
    setProposalSending(true);
    setFeedback(null);
    try {
      const created = await apiPost("/api/market/proposals", proposalForm);
      setProposals(current => [created, ...current]);
      setShowProposalModal(false);
      setProposalForm(initialProposalForm);
      setFeedback({ type: "success", text: "Votre offre a bien été publiée sur le marché !" });
    } catch (err) {
      setFeedback({ type: "danger", text: err.message });
    } finally {
      setProposalSending(false);
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    setOrderSending(true);
    setFeedback(null);
    try {
      const qty = Number(orderForm.quantity);
      const payload = {
        productId: selectedForOrder.id,
        productName: selectedForOrder.name,
        farmerName: selectedForOrder.farmer ?? selectedForOrder.farmerName,
        price: selectedForOrder.price,
        ...orderForm,
        quantity: qty,
      };
      const created = await apiPost("/api/market/orders", payload);
      setOrders(current => [created, ...current]);
      setSelectedForOrder(null);
      setFeedback({ type: "success", text: `Commande ${created.id} envoyée au vendeur !` });
    } catch (err) {
      setFeedback({ type: "danger", text: err.message });
    } finally {
      setOrderSending(false);
    }
  }

  function updateProposalForm(field, value) {
    setProposalForm(f => ({ ...f, [field]: value }));
  }
  function updateOrderForm(field, value) {
    setOrderForm(f => ({ ...f, [field]: value }));
  }

  return (
    <section className="module-page">
      <div className="section-heading left">
        <p className="eyebrow">Marché agricole</p>
        <h2>Matching agriculteurs, clients et produits</h2>
        <p>Les <strong>agriculteurs</strong> proposent leurs récoltes. Les <strong>clients</strong> commandent ce qui les intéresse.</p>
      </div>

      {feedback && (
        <p className={`alert alert-${feedback.type}`} style={{ marginBottom: "1rem" }}>
          {feedback.text}
        </p>
      )}

      {/* Stats */}
      <div className="stats-grid compact">
        <div className="stat-tile"><span>Offres visibles</span><strong>{marketStats.offers}</strong></div>
        <div className="stat-tile"><span>Dont certifiés</span><strong>{marketStats.certified}</strong></div>
        <div className="stat-tile"><span>Propositions récentes</span><strong>{marketStats.proposals}</strong></div>
        <div className="stat-tile"><span>Commandes reçues</span><strong>{marketStats.orders}</strong></div>
      </div>

      {/* CTA Agriculteur */}
      <div className="surface" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "1.5rem" }}>
        <div>
          <strong>🌾 Vous êtes agriculteur ?</strong>
          <p className="muted" style={{ margin: "2px 0 0", fontSize: "0.9rem" }}>Publiez votre récolte et trouvez des acheteurs directement.</p>
        </div>
        <button type="button" className="primary-action" onClick={() => { setFeedback(null); setShowProposalModal(true); }}>
          + Proposer un produit
        </button>
      </div>

      {/* Filtres */}
      <div className="surface">
        <div className="filter-grid">
          <input placeholder="Produit, vendeur ou ville" value={filters.query} onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))} />
          <select value={filters.region} onChange={(e) => setFilters(f => ({ ...f, region: e.target.value }))}>
            <option value="">Toutes les régions</option>
            {productRegions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">Toutes les catégories</option>
            {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.certified} onChange={(e) => setFilters(f => ({ ...f, certified: e.target.value }))}>
            <option value="">Tous les statuts</option>
            <option value="true">Certifiés</option>
            <option value="false">Non certifiés</option>
          </select>
        </div>
      </div>

      {/* Grille d'offres */}
      <div className="cards-grid">
        {allOffers.map((offer) => (
          <article className="surface product-card" key={offer.id}>
            <div className="product-visual">{offer.name[0]}</div>
            <div className="card-topline">
              <span className="badge warning">{offer.category}</span>
              {offer.certified && <span className="badge success">Certifié</span>}
              {offer.isProposal && <span className="badge" style={{ background: "var(--accent, #4caf50)", color: "#fff" }}>Nouvelle offre</span>}
            </div>
            <h3>{offer.name}</h3>
            <p className="muted">{offer.farmer ?? offer.farmerName} — {offer.city}, {offer.region}</p>
            <strong className="price-line">{formatFcfa(offer.price)} / {offer.unit}</strong>
            <div className="status-grid">
              <div><span>Stock</span><strong>{offer.quantity} {offer.unit}</strong></div>
              <div><span>Commande min.</span><strong>{offer.minOrder} {offer.unit}</strong></div>
            </div>
            {offer.quality && <p className="muted">Qualité : {offer.quality} — Délai : {offer.deliveryDelay}</p>}
            <div className="chip-row compact">
              {(offer.paymentModes ?? []).map(m => <span className="plain-chip" key={m}>{m}</span>)}
            </div>
            {offer.loyalPriority && <p className="review-alert">Priorité aux anciens clients si le stock baisse.</p>}

            {/* Seuls les clients commandent */}
            <button type="button" className="primary-action wide" onClick={() => openOrder(offer)}>
              Commander ce produit
            </button>
          </article>
        ))}
      </div>

      {/* Historique des commandes */}
      {orders.length > 0 && (
        <article className="surface" style={{ marginTop: "2rem" }}>
          <h3>Commandes clients récentes</h3>
          <div className="stack-list">
            {orders.map((order) => (
              <div className="list-row" key={order.id}>
                <div>
                  <strong>{order.productName}</strong>
                  <p className="muted">{order.quantity} {" "}{order.productName && "×"} — {order.buyerName}</p>
                </div>
                <div className="list-row-end">
                  <span className="badge success">{order.status}</span>
                  <strong>{formatFcfa(order.total)}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* === Modale : Agriculteur propose un produit === */}
      {showProposalModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowProposalModal(false)}>
          <article className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>🌾 Proposer un produit / une récolte</h3>
            <p className="muted">Renseignez les détails de votre offre. Les clients pourront la voir et commander.</p>
            <form className="stack-form" onSubmit={submitProposal}>
              <div className="filter-grid">
                <label>Votre nom<input required placeholder="Ex: Ferme Mbem" value={proposalForm.farmerName} onChange={(e) => updateProposalForm("farmerName", e.target.value)} /></label>
                <label>Votre téléphone<input placeholder="+237 6XX XX XX XX" value={proposalForm.farmerPhone} onChange={(e) => updateProposalForm("farmerPhone", e.target.value)} /></label>
                <label>Nom du produit<input required placeholder="Ex: Tomates cerises" value={proposalForm.name} onChange={(e) => updateProposalForm("name", e.target.value)} /></label>
                <label>Catégorie
                  <select value={proposalForm.category} onChange={(e) => updateProposalForm("category", e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label>Unité
                  <select value={proposalForm.unit} onChange={(e) => updateProposalForm("unit", e.target.value)}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </label>
                <label>Quantité disponible<input required type="number" min="1" placeholder="Ex: 200" value={proposalForm.quantity} onChange={(e) => updateProposalForm("quantity", e.target.value)} /></label>
                <label>Commande minimum<input required type="number" min="1" placeholder="Ex: 10" value={proposalForm.minOrder} onChange={(e) => updateProposalForm("minOrder", e.target.value)} /></label>
                <label>Prix unitaire (FCFA)<input required type="number" min="0" placeholder="Ex: 750" value={proposalForm.price} onChange={(e) => updateProposalForm("price", e.target.value)} /></label>
                <label>Qualité<input placeholder="Extra frais, Grade A…" value={proposalForm.quality} onChange={(e) => updateProposalForm("quality", e.target.value)} /></label>
                <label>Délai de livraison<input placeholder="Ex: 24h - 48h" value={proposalForm.deliveryDelay} onChange={(e) => updateProposalForm("deliveryDelay", e.target.value)} /></label>
                <label>Mode de paiement accepté
                  <select value={proposalForm.paymentMode} onChange={(e) => updateProposalForm("paymentMode", e.target.value)}>
                    {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </label>
                <label>Région<input placeholder="Ex: Ouest" value={proposalForm.region} onChange={(e) => updateProposalForm("region", e.target.value)} /></label>
                <label>Ville<input placeholder="Ex: Bafoussam" value={proposalForm.city} onChange={(e) => updateProposalForm("city", e.target.value)} /></label>
              </div>
              <div className="card-actions">
                <button type="button" className="secondary-action" onClick={() => setShowProposalModal(false)}>Annuler</button>
                <button type="submit" className="primary-action" disabled={proposalSending}>
                  {proposalSending ? "Publication..." : "Publier l'offre"}
                </button>
              </div>
            </form>
          </article>
        </div>
      )}

      {/* === Modale : Client commande un produit === */}
      {selectedForOrder && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedForOrder(null)}>
          <article className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Commander un produit</h3>
            <p className="muted">
              <strong>{selectedForOrder.name}</strong> — vendu par {selectedForOrder.farmer ?? selectedForOrder.farmerName}
              <br />Prix : {formatFcfa(selectedForOrder.price)} / {selectedForOrder.unit} · Commande min. : {selectedForOrder.minOrder} {selectedForOrder.unit}
            </p>
            <form className="stack-form" onSubmit={submitOrder}>
              <div className="filter-grid">
                <label>Votre nom<input required value={orderForm.buyerName} onChange={(e) => updateOrderForm("buyerName", e.target.value)} /></label>
                <label>Votre téléphone<input required value={orderForm.buyerPhone} onChange={(e) => updateOrderForm("buyerPhone", e.target.value)} /></label>
                <label>
                  Quantité ({selectedForOrder.unit})
                  <input required type="number" min={selectedForOrder.minOrder} value={orderForm.quantity} onChange={(e) => updateOrderForm("quantity", e.target.value)} />
                </label>
                <label>Mode de livraison
                  <select value={orderForm.deliveryMode} onChange={(e) => updateOrderForm("deliveryMode", e.target.value)}>
                    <option>Livraison simple</option>
                    <option>Livraison prioritaire</option>
                    <option>Retrait au point relais</option>
                  </select>
                </label>
              </div>
              <textarea rows="3" placeholder="Message au vendeur (optionnel)…" value={orderForm.message} onChange={(e) => updateOrderForm("message", e.target.value)} />
              <div className="metric-box">
                <strong>Total estimé : {formatFcfa(Number(orderForm.quantity || 0) * selectedForOrder.price)}</strong>
                <span className="muted">Hors frais de transport.</span>
              </div>
              <div className="card-actions">
                <button type="button" className="secondary-action" onClick={() => setSelectedForOrder(null)}>Annuler</button>
                <button type="submit" className="primary-action" disabled={orderSending}>
                  {orderSending ? "Envoi..." : "Envoyer la commande"}
                </button>
              </div>
            </form>
          </article>
        </div>
      )}
    </section>
  );
}
