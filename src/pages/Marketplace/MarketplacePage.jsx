import { useEffect, useMemo, useState } from "react";
import { products, productRegions, productCategories } from "../../data/platformData.js";
import { apiGet, apiPost } from "../../services/platformApi.js";
import { formatFcfa } from "../../utils/formatters.js";

export default function MarketplacePage() {
  const [filters, setFilters] = useState({ query: "", region: "", category: "", certified: "" });
  const [productList, setProductList] = useState(products);
  const [selected, setSelected] = useState(null);
  const [requests, setRequests] = useState([]);
  const [orderForm, setOrderForm] = useState({
    buyerName: "Client KA MOLEMA",
    buyerPhone: "+237 ",
    quantity: "",
    deliveryMode: "Livraison simple",
    message: "",
  });

  const filteredProducts = useMemo(() => {
    return productList.filter((product) => {
      const queryOk = filters.query
        ? `${product.name} ${product.farmer} ${product.city}`.toLowerCase().includes(filters.query.toLowerCase())
        : true;
      const regionOk = filters.region ? product.region === filters.region : true;
      const categoryOk = filters.category ? product.category === filters.category : true;
      const certifiedOk = filters.certified ? String(product.certified) === filters.certified : true;
      return queryOk && regionOk && categoryOk && certifiedOk;
    });
  }, [filters, productList]);

  useEffect(() => {
    apiGet("/api/products", products).then(setProductList);
  }, []);

  const marketStats = useMemo(() => {
    return {
      products: filteredProducts.length,
      certified: filteredProducts.filter((product) => product.certified).length,
      stock: filteredProducts.reduce((sum, product) => sum + product.quantity, 0),
      requests: requests.length,
    };
  }, [filteredProducts, requests]);

  function openOrder(product) {
    setSelected(product);
    setOrderForm((current) => ({
      ...current,
      quantity: product.minOrder,
      message: "",
    }));
  }

  function submitRequest(event) {
    event.preventDefault();
    const quantity = Number(orderForm.quantity);
    const nextRequest = {
      id: `CMD-${Date.now().toString().slice(-5)}`,
      product: selected.name,
      farmer: selected.farmer,
      buyerName: orderForm.buyerName,
      buyerPhone: orderForm.buyerPhone,
      quantity,
      total: quantity * selected.price,
      status: selected.loyalPriority ? "Priorité fidélité appliquée" : "Demande envoyée",
      deliveryMode: orderForm.deliveryMode,
    };
    apiPost("/api/market/requests", nextRequest).catch(() => null);
    setRequests((current) => [nextRequest, ...current]);
    setSelected(null);
  }

  return (
    <section className="module-page">
      <div className="section-heading left">
        <p className="eyebrow">Marché agricole</p>
        <h2>Matching agriculteurs, clients et produits</h2>
        <p>Les clients trouvent les produits disponibles, comparent les offres, demandent la livraison et bénéficient d'une priorité fidélité.</p>
      </div>

      <div className="stats-grid compact">
        <div className="stat-tile"><span>Produits visibles</span><strong>{marketStats.products}</strong></div>
        <div className="stat-tile"><span>Certifiés</span><strong>{marketStats.certified}</strong></div>
        <div className="stat-tile"><span>Stock total</span><strong>{marketStats.stock}</strong></div>
        <div className="stat-tile"><span>Demandes</span><strong>{marketStats.requests}</strong></div>
      </div>

      <div className="surface">
        <div className="filter-grid">
          <input placeholder="Produit, vendeur ou ville" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} />
          <select value={filters.region} onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}>
            <option value="">Toutes les régions</option>
            {productRegions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
            <option value="">Toutes les catégories</option>
            {productCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select value={filters.certified} onChange={(event) => setFilters((current) => ({ ...current, certified: event.target.value }))}>
            <option value="">Tous les statuts</option>
            <option value="true">Agriculteurs certifiés</option>
            <option value="false">Non certifiés</option>
          </select>
        </div>
      </div>

      <div className="cards-grid">
        {filteredProducts.map((product) => (
          <article className="surface product-card" key={product.id}>
            <div className="product-visual">{product.name[0]}</div>
            <div className="card-topline">
              <span className="badge warning">{product.category}</span>
              {product.certified && <span className="badge success">Certifié</span>}
            </div>
            <h3>{product.name}</h3>
            <p className="muted">{product.farmer} - {product.city}, {product.region}</p>
            <strong className="price-line">{formatFcfa(product.price)} / {product.unit}</strong>
            <div className="status-grid">
              <div><span>Stock</span><strong>{product.quantity} {product.unit}</strong></div>
              <div><span>Commande min.</span><strong>{product.minOrder} {product.unit}</strong></div>
            </div>
            <p className="muted">Qualité : {product.quality} - Délai : {product.deliveryDelay}</p>
            <div className="chip-row compact">
              {product.paymentModes.map((mode) => <span className="plain-chip" key={mode}>{mode}</span>)}
            </div>
            {product.loyalPriority && <p className="review-alert">Priorité aux anciens utilisateurs si le stock baisse.</p>}
            <button type="button" className="primary-action wide" onClick={() => openOrder(product)}>
              Demander ce produit
            </button>
          </article>
        ))}
      </div>

      {requests.length > 0 && (
        <article className="surface">
          <h3>Demandes clients récentes</h3>
          <div className="stack-list">
            {requests.map((request) => (
              <div className="list-row" key={request.id}>
                <div>
                  <strong>{request.product}</strong>
                  <p className="muted">{request.quantity} unité(s) - {request.buyerName}</p>
                </div>
                <div className="list-row-end">
                  <span className="badge success">{request.status}</span>
                  <strong>{formatFcfa(request.total)}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <article className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>Demande client</h3>
            <p className="muted">Produit : {selected.name} vendu par {selected.farmer}</p>
            <form className="stack-form" onSubmit={submitRequest}>
              <div className="filter-grid">
                <label>Nom client<input required value={orderForm.buyerName} onChange={(event) => setOrderForm((current) => ({ ...current, buyerName: event.target.value }))} /></label>
                <label>Téléphone<input required value={orderForm.buyerPhone} onChange={(event) => setOrderForm((current) => ({ ...current, buyerPhone: event.target.value }))} /></label>
                <label>Quantité<input required type="number" min={selected.minOrder} value={orderForm.quantity} onChange={(event) => setOrderForm((current) => ({ ...current, quantity: event.target.value }))} /></label>
                <label>Livraison<select value={orderForm.deliveryMode} onChange={(event) => setOrderForm((current) => ({ ...current, deliveryMode: event.target.value }))}>
                  <option>Livraison simple</option>
                  <option>Livraison prioritaire</option>
                  <option>Retrait au point relais</option>
                </select></label>
              </div>
              <textarea rows="4" placeholder="Message au vendeur..." value={orderForm.message} onChange={(event) => setOrderForm((current) => ({ ...current, message: event.target.value }))} />
              <div className="metric-box">
                <strong>Total estimé : {formatFcfa(Number(orderForm.quantity || 0) * selected.price)}</strong>
                <span className="muted">Hors frais de transport. Le module transport finalise la logistique.</span>
              </div>
              <div className="card-actions">
                <button type="button" className="secondary-action" onClick={() => setSelected(null)}>Annuler</button>
                <button type="submit" className="primary-action">Envoyer la demande</button>
              </div>
            </form>
          </article>
        </div>
      )}
    </section>
  );
}
