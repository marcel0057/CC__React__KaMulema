import { useEffect, useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useSearchParams } from 'react-router-dom';
import AppModal from '../../components/AppModal';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { alertesService } from '../../services/alertes.service';
import { produitsService } from '../../services/produits.service';
import {
  addToCart,
  africaCountryOptions,
  currencyOptions,
  formatMoney,
  formatProductPrice,
  getDefaultCurrencyForCountry,
  qualityGradeOptions
} from '../../utils/helpers';

const categoryChips = [
  { label: '🌽 Cereales', value: 'cereales' },
  { label: '🍅 Legumes', value: 'legumes' },
  { label: '🍌 Fruits', value: 'fruits' },
  { label: '🥔 Tubercules', value: 'tubercules' },
  { label: '🌶 Epices', value: 'epices' },
  { label: '🌿 Autres', value: 'autres' }
];

const MarketplacePage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const preferredCountry = user?.pays || 'Cameroun';
  const preferredCurrency = user?.devise_preferee || getDefaultCurrencyForCountry(preferredCountry);
  const initialProductForm = useMemo(
    () => ({
      nom: '',
      categorie: 'cereales',
      description: '',
      prix: '',
      unite: 'kg',
      quantite_disponible: '',
      region: '',
      pays_origine: preferredCountry,
      devise: preferredCurrency,
      qualite_grade: 'standard',
      bio: false,
      exportable: false,
      disponible: true
    }),
    [preferredCountry, preferredCurrency]
  );

  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [trends, setTrends] = useState({ evolution: [], comparatif: [], devise: preferredCurrency });
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({
    categorie: searchParams.get('categorie') || '',
    region: '',
    pays: preferredCountry,
    devise: preferredCurrency,
    bio: '',
    exportable: '',
    prix_min: '',
    prix_max: '',
    recherche: searchParams.get('recherche') || ''
  });
  const [productForm, setProductForm] = useState(initialProductForm);
  const [editingId, setEditingId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertForm, setAlertForm] = useState({ produit_nom: '', prix_seuil: '' });
  const [feedback, setFeedback] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [contactTarget, setContactTarget] = useState(null);

  const activeView =
    user?.role === 'agriculteur' && searchParams.get('view') === 'mes-produits'
      ? 'mes-produits'
      : 'market';

  const marketInsights = useMemo(() => {
    const countries = new Set(products.map((item) => item.pays_origine).filter(Boolean)).size;
    const exportableCount = products.filter((item) => Boolean(item.exportable)).length;
    const bioCount = products.filter((item) => Boolean(item.bio)).length;
    return [
      { label: 'Pays visibles', value: countries || 0 },
      { label: 'Offres exportables', value: exportableCount },
      { label: 'Offres bio', value: bioCount },
      { label: 'Devise active', value: filters.devise || preferredCurrency }
    ];
  }, [filters.devise, preferredCurrency, products]);

  const fetchMarket = async () => {
    setLoading(true);
    const [marketData, trendData] = await Promise.all([
      produitsService.list(filters),
      produitsService.tendances({ devise: filters.devise || preferredCurrency })
    ]);
    setProducts(marketData.produits || []);
    setTrends(trendData);
    if (user?.role === 'agriculteur') {
      const mine = await produitsService.myProducts();
      setMyProducts(mine.produits || []);
    }
    if (user) {
      const myAlerts = await alertesService.mine();
      setAlerts(myAlerts.alertes || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMarket();
  }, [
    filters.categorie,
    filters.region,
    filters.pays,
    filters.devise,
    filters.bio,
    filters.exportable,
    filters.prix_min,
    filters.prix_max,
    filters.recherche,
    user?.role
  ]);

  useEffect(() => {
    setProductForm((current) => ({
      ...current,
      pays_origine: current.pays_origine || preferredCountry,
      devise: current.devise || preferredCurrency
    }));
  }, [preferredCountry, preferredCurrency]);

  const compareProducts = useMemo(
    () => products.filter((product) => compareIds.includes(product.id)),
    [compareIds, products]
  );

  const toggleCompare = (product) => {
    setCompareIds((current) => {
      if (current.includes(product.id)) {
        return current.filter((id) => id !== product.id);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, product.id];
    });
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();
    const payload = {
      ...productForm,
      prix: Number(productForm.prix),
      quantite_disponible: Number(productForm.quantite_disponible)
    };

    if (editingId) {
      await produitsService.update(editingId, payload);
      setFeedback({ type: 'success', text: 'Le produit a ete mis a jour avec succes.' });
    } else {
      await produitsService.create(payload);
      setFeedback({ type: 'success', text: 'Le produit a ete publie avec succes.' });
    }

    setEditingId(null);
    setProductForm(initialProductForm);
    fetchMarket();
  };

  const handleEditProduct = (product) => {
    setEditingId(product.id);
    setProductForm({
      nom: product.nom,
      categorie: product.categorie,
      description: product.description || '',
      prix: product.prix,
      unite: product.unite,
      quantite_disponible: product.quantite_disponible,
      region: product.region || '',
      pays_origine: product.pays_origine || preferredCountry,
      devise: product.devise || preferredCurrency,
      qualite_grade: product.qualite_grade || 'standard',
      bio: Boolean(product.bio),
      exportable: Boolean(product.exportable),
      disponible: Boolean(product.disponible)
    });
    setSearchParams({ view: 'mes-produits' });
  };

  const confirmDeleteProduct = async () => {
    if (!pendingDelete) {
      return;
    }
    await produitsService.remove(pendingDelete.id);
    setFeedback({ type: 'success', text: `${pendingDelete.nom} a ete supprime du marketplace.` });
    setPendingDelete(null);
    fetchMarket();
  };

  const handleCreateAlert = async (event) => {
    event.preventDefault();
    await alertesService.create(alertForm);
    setAlertForm({ produit_nom: '', prix_seuil: '' });
    setFeedback({ type: 'success', text: 'Votre alerte prix a bien ete enregistree.' });
    fetchMarket();
  };

  const handleContact = async (product) => {
    const data = await produitsService.detail(product.id);
    setContactTarget(data.produit);
  };

  return (
    <div className="page">
      <section className="section-heading left">
        <h1>Marketplace agricole panafricain</h1>
        <p>
          Comparez les prix, les devises, les pays d origine et les opportunites export pour faire
          circuler plus intelligemment les produits agricoles.
        </p>
      </section>

      {feedback ? (
        <div className={`alert alert-${feedback.type}`}>
          <div className="list-row">
            <span>{feedback.text}</span>
            <button type="button" className="btn-secondary" onClick={() => setFeedback(null)}>
              Fermer
            </button>
          </div>
        </div>
      ) : null}

      <div className="stats-grid compact">
        {marketInsights.map((item) => (
          <div key={item.label} className="stat-tile">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="chip-row">
        {categoryChips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`chip-button ${filters.categorie === chip.value ? 'active' : ''}`}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                categorie: current.categorie === chip.value ? '' : chip.value
              }))
            }
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="filter-grid">
        <input
          placeholder="Recherche produit ou description"
          value={filters.recherche}
          onChange={(event) => setFilters((current) => ({ ...current, recherche: event.target.value }))}
        />
        <select
          value={filters.pays}
          onChange={(event) => setFilters((current) => ({ ...current, pays: event.target.value }))}
        >
          {africaCountryOptions.map((country) => (
            <option key={country.code} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Region"
          value={filters.region}
          onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
        />
        <select
          value={filters.devise}
          onChange={(event) => setFilters((current) => ({ ...current, devise: event.target.value }))}
        >
          {currencyOptions.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
        <select
          value={filters.bio}
          onChange={(event) => setFilters((current) => ({ ...current, bio: event.target.value }))}
        >
          <option value="">Tous les modes de culture</option>
          <option value="true">Bio</option>
          <option value="false">Conventionnel</option>
        </select>
        <select
          value={filters.exportable}
          onChange={(event) => setFilters((current) => ({ ...current, exportable: event.target.value }))}
        >
          <option value="">Tous les circuits</option>
          <option value="true">Exportable</option>
          <option value="false">Marche domestique</option>
        </select>
        <input
          type="number"
          placeholder={`Prix min (${filters.devise})`}
          value={filters.prix_min}
          onChange={(event) => setFilters((current) => ({ ...current, prix_min: event.target.value }))}
        />
        <input
          type="number"
          placeholder={`Prix max (${filters.devise})`}
          value={filters.prix_max}
          onChange={(event) => setFilters((current) => ({ ...current, prix_max: event.target.value }))}
        />
      </div>

      {loading ? (
        <LoadingSpinner label="Chargement du marketplace..." />
      ) : (
        <>
          {activeView === 'market' && (
            <>
              <div className="cards-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(item) => addToCart(item)}
                    onCompare={toggleCompare}
                    compared={compareIds.includes(product.id)}
                    onContact={handleContact}
                  />
                ))}
              </div>

              <div className="dashboard-grid">
                <article className="card chart-card">
                  <h3>Evolution des prix sur 30 jours</h3>
                  <p className="muted">Courbe limitee a la devise {trends.devise || filters.devise}.</p>
                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={trends.evolution || []}>
                        <XAxis dataKey="jour" hide />
                        <YAxis />
                        <Tooltip />
                        <Line dataKey="prix_moyen" stroke="#2d8a4e" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="card">
                  <h3>Alertes prix</h3>
                  {user ? (
                    <>
                      <form className="stack-form" onSubmit={handleCreateAlert}>
                        <input
                          placeholder="Produit surveille"
                          value={alertForm.produit_nom}
                          onChange={(event) =>
                            setAlertForm((current) => ({ ...current, produit_nom: event.target.value }))
                          }
                        />
                        <input
                          type="number"
                          placeholder={`Prix seuil en ${preferredCurrency}`}
                          value={alertForm.prix_seuil}
                          onChange={(event) =>
                            setAlertForm((current) => ({ ...current, prix_seuil: event.target.value }))
                          }
                        />
                        <button type="submit" className="btn-primary wide">
                          Enregistrer l alerte
                        </button>
                      </form>
                      <div className="stack-list">
                        {alerts.map((item) => (
                          <div key={item.id} className="list-row">
                            <div>
                              <strong>{item.produit_nom}</strong>
                              <p className="muted">Seuil : {formatMoney(item.prix_seuil, preferredCurrency)}</p>
                            </div>
                            <Badge variant={item.active ? 'success' : 'neutral'}>
                              {item.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="muted">Connectez-vous pour enregistrer des alertes prix personnelles.</p>
                  )}
                </article>
              </div>

              {compareProducts.length > 0 && (
                <article className="card">
                  <h3>Comparateur de prix multi-pays</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Pays</th>
                        <th>Region</th>
                        <th>Prix</th>
                        <th>Qualite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareProducts.map((item) => (
                        <tr key={item.id}>
                          <td>{item.nom}</td>
                          <td>{item.pays_origine}</td>
                          <td>{item.region}</td>
                          <td>{formatProductPrice(item)}</td>
                          <td>{item.qualite_grade || 'standard'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </article>
              )}
            </>
          )}

          {user?.role === 'agriculteur' && (
            <div className="dashboard-grid">
              <article className="card">
                <div className="section-heading left compact">
                  <h3>Publier ou modifier un produit</h3>
                  <p>
                    Positionnez vos produits pour le marche local, regional ou export selon votre pays,
                    votre devise et votre qualite commerciale.
                  </p>
                </div>
                <form className="stack-form" onSubmit={handleSaveProduct}>
                  <input
                    placeholder="Nom du produit"
                    value={productForm.nom}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, nom: event.target.value }))
                    }
                  />
                  <select
                    value={productForm.categorie}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, categorie: event.target.value }))
                    }
                  >
                    <option value="cereales">Cereales</option>
                    <option value="legumes">Legumes</option>
                    <option value="fruits">Fruits</option>
                    <option value="tubercules">Tubercules</option>
                    <option value="epices">Epices</option>
                    <option value="autres">Autres</option>
                  </select>
                  <textarea
                    rows="4"
                    placeholder="Description"
                    value={productForm.description}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                  <div className="filter-grid">
                    <input
                      type="number"
                      placeholder="Prix"
                      value={productForm.prix}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, prix: event.target.value }))
                      }
                    />
                    <input
                      placeholder="Unite"
                      value={productForm.unite}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, unite: event.target.value }))
                      }
                    />
                    <input
                      type="number"
                      placeholder="Quantite disponible"
                      value={productForm.quantite_disponible}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          quantite_disponible: event.target.value
                        }))
                      }
                    />
                    <input
                      placeholder="Region"
                      value={productForm.region}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, region: event.target.value }))
                      }
                    />
                    <select
                      value={productForm.pays_origine}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          pays_origine: event.target.value,
                          devise: getDefaultCurrencyForCountry(event.target.value)
                        }))
                      }
                    >
                      {africaCountryOptions.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={productForm.devise}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, devise: event.target.value }))
                      }
                    >
                      {currencyOptions.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                    <select
                      value={productForm.qualite_grade}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          qualite_grade: event.target.value
                        }))
                      }
                    >
                      {qualityGradeOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={productForm.bio}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, bio: event.target.checked }))
                      }
                    />
                    Produit biologique
                  </label>
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={productForm.exportable}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          exportable: event.target.checked
                        }))
                      }
                    />
                    Pret pour un circuit regional ou export
                  </label>
                  <button type="submit" className="btn-primary wide">
                    {editingId ? 'Mettre a jour le produit' : 'Publier le produit'}
                  </button>
                </form>
              </article>

              <article className="card">
                <div className="section-heading left compact">
                  <h3>Mes produits</h3>
                  <p>La qualite, la devise et l exportabilite de chaque offre deviennent visibles.</p>
                </div>
                <div className="stack-list">
                  {myProducts.map((product) => (
                    <div key={product.id} className="list-row">
                      <div>
                        <strong>{product.nom}</strong>
                        <p className="muted">
                          {formatProductPrice(product)} - {product.quantite_disponible} {product.unite}
                        </p>
                        <p className="muted">
                          {product.pays_origine} - {product.qualite_grade || 'standard'}
                        </p>
                      </div>
                      <div className="list-row-end">
                        {Boolean(product.exportable) && <Badge variant="warning">Exportable</Badge>}
                        {Number(product.quantite_disponible) <= 200 && (
                          <Badge variant="warning">Priorite clients fideles</Badge>
                        )}
                        <button type="button" className="btn-secondary" onClick={() => handleEditProduct(product)}>
                          Modifier
                        </button>
                        <button type="button" className="btn-danger" onClick={() => setPendingDelete(product)}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          )}
        </>
      )}

      <AppModal
        open={Boolean(contactTarget)}
        title="Coordonnees du vendeur"
        subtitle={
          contactTarget
            ? `Informations utiles pour echanger au sujet de ${contactTarget.nom}.`
            : ''
        }
        onClose={() => setContactTarget(null)}
        size="small"
        footer={
          <button type="button" className="btn-primary" onClick={() => setContactTarget(null)}>
            J ai compris
          </button>
        }
      >
        {contactTarget ? (
          <>
            <div className="metric-box">
              <strong>
                {contactTarget.vendeur_prenom} {contactTarget.vendeur_nom}
              </strong>
              <span className="muted">
                {contactTarget.vendeur_telephone || 'Telephone non renseigne'}
              </span>
            </div>
            <p className="muted">
              Produit concerne : {contactTarget.nom} - {formatProductPrice(contactTarget)} /{' '}
              {contactTarget.unite}
            </p>
            <p className="muted">
              {contactTarget.pays_origine || contactTarget.vendeur_pays || 'Pays non renseigne'}
            </p>
          </>
        ) : null}
      </AppModal>

      <AppModal
        open={Boolean(pendingDelete)}
        title="Supprimer ce produit"
        subtitle={
          pendingDelete
            ? `Cette action retirera ${pendingDelete.nom} de votre espace vendeur.`
            : ''
        }
        onClose={() => setPendingDelete(null)}
        size="small"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setPendingDelete(null)}>
              Annuler
            </button>
            <button type="button" className="btn-danger" onClick={confirmDeleteProduct}>
              Confirmer la suppression
            </button>
          </>
        }
      >
        <p className="muted">
          Vous pourrez republier ce produit plus tard, mais son enregistrement actuel sera retire.
        </p>
      </AppModal>
    </div>
  );
};

export default MarketplacePage;
