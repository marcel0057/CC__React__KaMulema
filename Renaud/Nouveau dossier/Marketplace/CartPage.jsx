import { useEffect, useState } from 'react';
import { transportsService } from '../../services/transports.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  clearCart,
  africaCountryOptions,
  formatMoney,
  formatProductPrice,
  getCartItems,
  removeFromCart,
  updateCartQuantity
} from '../../utils/helpers';

const CartPage = () => {
  const [items, setItems] = useState(getCartItems());
  const [transporteurs, setTransporteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    transporteur_id: '',
    adresse_depart: '',
    pays_depart: 'Cameroun',
    adresse_destination: '',
    pays_destination: 'Cameroun',
    lat_depart: '',
    lng_depart: '',
    lat_destination: '',
    lng_destination: ''
  });

  const totalsByCurrency = items.reduce((accumulator, item) => {
    const currency = item.devise || 'XAF';
    accumulator[currency] = (accumulator[currency] || 0) + Number(item.prix || 0) * Number(item.quantite || 1);
    return accumulator;
  }, {});

  useEffect(() => {
    transportsService
      .transporteurs()
      .then((data) => setTransporteurs(data.transporteurs || []))
      .finally(() => setLoading(false));
  }, []);

  const syncItems = () => setItems(getCartItems());

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (!items.length) {
      return;
    }

    for (const item of items) {
      await transportsService.createDemande({
        produit_id: item.id,
        transporteur_id: form.transporteur_id,
        adresse_depart: form.adresse_depart,
        pays_depart: form.pays_depart,
        adresse_destination: form.adresse_destination,
        pays_destination: form.pays_destination,
        lat_depart: form.lat_depart,
        lng_depart: form.lng_depart,
        lat_destination: form.lat_destination,
        lng_destination: form.lng_destination
      });
    }

    clearCart();
    syncItems();
    setMessage('Commandes creees avec succes. Vos livraisons sont maintenant suivies dans l application.');
  };

  if (loading) {
    return <LoadingSpinner label="Chargement du panier..." />;
  }

  return (
    <div className="page">
      <section className="section-heading left">
        <h1>Panier et validation</h1>
        <p>Regroupez vos produits puis transformez-les en demandes de livraison locales.</p>
      </section>

      <div className="dashboard-grid">
        <article className="card">
          <h3>Articles selectionnes</h3>
          {items.length === 0 ? (
            <p className="muted">Votre panier est vide pour le moment.</p>
          ) : (
            <div className="stack-list">
              {items.map((item) => (
                <div key={item.id} className="list-row">
                  <div>
                    <strong>{item.nom}</strong>
                    <p className="muted">{formatProductPrice(item)} / {item.unite}</p>
                  </div>
                  <div className="list-row-end">
                    <input
                      type="number"
                      min="1"
                      value={item.quantite}
                      onChange={(event) => {
                        updateCartQuantity(item.id, Number(event.target.value));
                        syncItems();
                      }}
                      className="quantity-input"
                    />
                    <button type="button" className="btn-danger" onClick={() => { removeFromCart(item.id); syncItems(); }}>
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="total-strip">
            <span>Total estime</span>
            <strong>{Object.entries(totalsByCurrency).map(([currency, amount]) => formatMoney(amount, currency)).join(' - ')}</strong>
          </div>
          {Object.keys(totalsByCurrency).length > 1 ? (
            <p className="muted">
              Plusieurs devises sont presentes dans ce panier. Les montants sont affiches separement.
            </p>
          ) : null}
        </article>

        <article className="card">
          <h3>Finaliser la commande</h3>
          <form className="stack-form" onSubmit={handleCheckout}>
            <select
              value={form.transporteur_id}
              onChange={(event) => setForm((current) => ({ ...current, transporteur_id: event.target.value }))}
              required
            >
              <option value="">Choisir un transporteur</option>
              {transporteurs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.prenom} {item.nom} - {item.nom_entreprise}
                </option>
              ))}
            </select>
            <input
              placeholder="Adresse de depart"
              value={form.adresse_depart}
              onChange={(event) => setForm((current) => ({ ...current, adresse_depart: event.target.value }))}
              required
            />
            <input
              placeholder="Adresse de destination"
              value={form.adresse_destination}
              onChange={(event) => setForm((current) => ({ ...current, adresse_destination: event.target.value }))}
              required
            />
            <div className="filter-grid">
              <select
                value={form.pays_depart}
                onChange={(event) => setForm((current) => ({ ...current, pays_depart: event.target.value }))}
              >
                {africaCountryOptions.map((country) => (
                  <option key={country.code} value={country.name}>
                    Depart - {country.name}
                  </option>
                ))}
              </select>
              <select
                value={form.pays_destination}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pays_destination: event.target.value }))
                }
              >
                {africaCountryOptions.map((country) => (
                  <option key={country.code} value={country.name}>
                    Destination - {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-grid">
              <input placeholder="Latitude depart" value={form.lat_depart} onChange={(event) => setForm((current) => ({ ...current, lat_depart: event.target.value }))} />
              <input placeholder="Longitude depart" value={form.lng_depart} onChange={(event) => setForm((current) => ({ ...current, lng_depart: event.target.value }))} />
              <input placeholder="Latitude destination" value={form.lat_destination} onChange={(event) => setForm((current) => ({ ...current, lat_destination: event.target.value }))} />
              <input placeholder="Longitude destination" value={form.lng_destination} onChange={(event) => setForm((current) => ({ ...current, lng_destination: event.target.value }))} />
            </div>

            <button type="submit" className="btn-primary wide" disabled={!items.length}>
              Commander
            </button>
          </form>

          {message && <div className="alert alert-success">{message}</div>}
        </article>
      </div>
    </div>
  );
};

export default CartPage;
