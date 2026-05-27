import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import StarRating from '../../components/StarRating';
import { useAuth } from '../../context/AuthContext';
import { produitsService } from '../../services/produits.service';
import { transportsService } from '../../services/transports.service';
import { routingService } from '../../services/routing.service';
import { TransporteurMarkerIcon, UserMarkerIcon } from '../../components/Map/CustomMarkers';
import MapLayers from '../../components/Map/MapLayers';
import {
  calculateDistance,
  formatDate,
  formatFcfa,
  getStatusVariant
} from '../../utils/helpers';

const MapController = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    // Force a resize calculation to prevent grey areas when the tab changes
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);

  return (
    <button 
      type="button" 
      onClick={(e) => {
         e.preventDefault();
         e.stopPropagation();
         if (position) {
           map.flyTo(position, 13, { duration: 1.5 });
         } else {
           map.flyTo([4.05, 11.5], 6);
         }
      }}
      style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, padding: '10px 16px', background: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      📍 Recenter
    </button>
  );
};

const TransportPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [transporteurs, setTransporteurs] = useState([]);
  const [livraisons, setLivraisons] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedTransporteur, setSelectedTransporteur] = useState(null);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState({ lat: 4.05, lng: 11.5 });
  const [tab, setTab] = useState(searchParams.get('view') === 'livraisons' ? 'livraisons' : 'demande');
  const [demandeForm, setDemandeForm] = useState({
    produit_id: '',
    transporteur_id: '',
    adresse_depart: '',
    adresse_destination: '',
    lat_depart: '',
    lng_depart: '',
    lat_destination: '',
    lng_destination: ''
  });
  const [ratingForm, setRatingForm] = useState({ id: null, note: 0, commentaire: '' });
  const [routesMap, setRoutesMap] = useState({}); // Stores polyline coordinates for each delivery

  const fetchData = async () => {
    setLoading(true);
    const [transportData, livraisonData, produitData] = await Promise.all([
      transportsService.transporteurs(),
      transportsService.myLivraisons(),
      user?.role === 'agriculteur'
        ? produitsService.myProducts()
        : produitsService.list()
    ]);

    setTransporteurs(transportData.transporteurs || []);
    setLivraisons(livraisonData.livraisons || []);
    setProduits(produitData.produits || []);

    // Load OSRM routes for active deliveries
    const newRoutesMap = {};
    const activeDeliveries = (livraisonData.livraisons || []).filter(
      (item) => ['confirme', 'en_route', 'livre'].includes(item.statut)
    );
    
    for (const item of activeDeliveries) {
      if (item.lat_depart && item.lng_depart && item.lat_destination && item.lng_destination) {
        const routeData = await routingService.getRoute(
          [Number(item.lat_depart), Number(item.lng_depart)],
          [Number(item.lat_destination), Number(item.lng_destination)]
        );
        if (routeData && routeData.coordinates) {
          newRoutesMap[item.id] = routeData.coordinates;
        }
      }
    }
    setRoutesMap(newRoutesMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    navigator.geolocation?.getCurrentPosition((position) => {
      setUserPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    });
  }, [user?.role]);

  const sortedTransporteurs = useMemo(() => {
    return [...transporteurs].sort((a, b) => {
      if (Boolean(a.disponible) !== Boolean(b.disponible)) {
        return Number(b.disponible) - Number(a.disponible);
      }

      const distanceA = calculateDistance(
        userPosition.lat,
        userPosition.lng,
        Number(a.latitude || 0),
        Number(a.longitude || 0)
      );
      const distanceB = calculateDistance(
        userPosition.lat,
        userPosition.lng,
        Number(b.latitude || 0),
        Number(b.longitude || 0)
      );
      return distanceA - distanceB;
    });
  }, [transporteurs, userPosition]);

  const handleDemande = async (event) => {
    event.preventDefault();
    const data = await transportsService.createDemande({
      ...demandeForm,
      transporteur_id: demandeForm.transporteur_id || selectedTransporteur?.id
    });
    setMessage(
      `Distance : ${data.estimation.distance_km} km - Duree estimee : ${data.estimation.duree_formatee} - Cout estime : ${formatFcfa(data.estimation.cout_estime)}`
    );
    fetchData();
    setTab('livraisons');
  };

  const handleStatus = async (id, statut) => {
    await transportsService.updateStatus(id, { statut });
    fetchData();
  };

  const submitRating = async () => {
    if (!ratingForm.id || !ratingForm.note) {
      return;
    }
    await transportsService.noterTransporteur(ratingForm.id, {
      note: ratingForm.note,
      commentaire: ratingForm.commentaire
    });
    setRatingForm({ id: null, note: 0, commentaire: '' });
    fetchData();
  };

  if (loading) {
    return <LoadingSpinner label="Chargement du module transport..." />;
  }

  return (
    <div className="page">
      <section className="section-heading left">
        <h1>Transport et suivi logistique</h1>
        <p>Choisissez un transporteur, estimez vos trajets et gardez un oeil sur chaque livraison.</p>
      </section>

      <div className="tab-row">
        <button type="button" className={`tab-button ${tab === 'demande' ? 'active' : ''}`} onClick={() => setTab('demande')}>
          Demander un transporteur
        </button>
        <button type="button" className={`tab-button ${tab === 'livraisons' ? 'active' : ''}`} onClick={() => setTab('livraisons')}>
          Mes livraisons
        </button>
      </div>

      <div className="transport-layout">
        <article className="card map-card full-height" style={{ position: 'relative' }}>
          <div className="map-wrapper large">
            <MapContainer 
              key={`map-${userPosition.lat}-${userPosition.lng}`}
              center={[userPosition.lat, userPosition.lng]} 
              zoom={6} 
              style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
              <MapLayers />
              <MapController position={[userPosition.lat, userPosition.lng]} />

              <Marker position={[userPosition.lat, userPosition.lng]} icon={UserMarkerIcon}>
                <Popup>Votre position actuelle</Popup>
              </Marker>

              {sortedTransporteurs.map((item) => (
                <Marker
                  key={item.id}
                  position={[Number(item.latitude || 0), Number(item.longitude || 0)]}
                  icon={TransporteurMarkerIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedTransporteur(item);
                      setDemandeForm((current) => ({ ...current, transporteur_id: item.id }));
                    }
                  }}
                >
                  <Popup>
                    <strong>{item.prenom} {item.nom}</strong>
                    <p>{item.nom_entreprise}</p>
                  </Popup>
                </Marker>
              ))}

              {livraisons
                .filter((item) => ['confirme', 'en_route', 'livre'].includes(item.statut))
                .map((item) => {
                  const pathOpts = { color: item.statut === 'livre' ? '#2d8a4e' : '#e53e3e', weight: 4 };
                  if (routesMap[item.id]) {
                    return <Polyline key={item.id} positions={routesMap[item.id]} pathOptions={pathOpts} />;
                  }
                  // Fallback to straight line
                  return (
                    <Polyline
                      key={`fallback-${item.id}`}
                      positions={[
                        [Number(item.lat_depart), Number(item.lng_depart)],
                        [Number(item.lat_destination), Number(item.lng_destination)]
                      ]}
                      pathOptions={pathOpts}
                    />
                  );
                })}
            </MapContainer>
          </div>
        </article>

        <aside className="transport-panel">
          {tab === 'demande' ? (
            <>
              <article className="card">
                <h3>Transporteurs disponibles</h3>
                <div className="stack-list">
                  {sortedTransporteurs.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`transporteur-row ${selectedTransporteur?.id === item.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedTransporteur(item);
                        setDemandeForm((current) => ({ ...current, transporteur_id: item.id }));
                      }}
                    >
                      <div>
                        <strong>{item.prenom} {item.nom}</strong>
                        <p className="muted">{item.nom_entreprise} - {item.type_vehicule}</p>
                      </div>
                      <div className="list-row-end">
                        <Badge variant={item.disponible ? 'success' : 'danger'}>
                          {item.disponible ? 'Disponible' : 'Occupe'}
                        </Badge>
                        <span>{formatFcfa(item.tarif_km)} / km</span>
                      </div>
                    </button>
                  ))}
                </div>
              </article>

              <article className="card">
                <h3>Demande de transport</h3>
                <form className="stack-form" onSubmit={handleDemande}>
                  <select
                    value={demandeForm.produit_id}
                    onChange={(event) => setDemandeForm((current) => ({ ...current, produit_id: event.target.value }))}
                    required
                  >
                    <option value="">Choisir un produit</option>
                    {produits.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nom} - {item.region}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Adresse depart"
                    value={demandeForm.adresse_depart}
                    onChange={(event) => setDemandeForm((current) => ({ ...current, adresse_depart: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="Adresse destination"
                    value={demandeForm.adresse_destination}
                    onChange={(event) => setDemandeForm((current) => ({ ...current, adresse_destination: event.target.value }))}
                    required
                  />
                  <div className="filter-grid">
                    <input placeholder="Lat depart" value={demandeForm.lat_depart} onChange={(event) => setDemandeForm((current) => ({ ...current, lat_depart: event.target.value }))} />
                    <input placeholder="Lng depart" value={demandeForm.lng_depart} onChange={(event) => setDemandeForm((current) => ({ ...current, lng_depart: event.target.value }))} />
                    <input placeholder="Lat destination" value={demandeForm.lat_destination} onChange={(event) => setDemandeForm((current) => ({ ...current, lat_destination: event.target.value }))} />
                    <input placeholder="Lng destination" value={demandeForm.lng_destination} onChange={(event) => setDemandeForm((current) => ({ ...current, lng_destination: event.target.value }))} />
                  </div>
                  <button type="button" className="btn-secondary wide" style={{ marginBottom: '1rem' }} onClick={() => setDemandeForm((current) => ({ ...current, lat_depart: String(userPosition.lat), lng_depart: String(userPosition.lng) }))}>
                    📍 Utiliser ma position GPS pour le depart
                  </button>
                  <button type="submit" className="btn-primary wide">
                    Envoyer la demande
                  </button>
                </form>
                {message && <div className="alert alert-success">{message}</div>}
              </article>
            </>
          ) : (
            <article className="card">
              <h3>Mes livraisons</h3>
              <div className="stack-list">
                {livraisons.map((item) => (
                  <div key={item.id} className="delivery-item">
                    <div className="list-row">
                      <div>
                        <strong>{item.produit_nom}</strong>
                        <p className="muted">{formatDate(item.date_demande)} - {formatFcfa(item.montant_total)}</p>
                      </div>
                      <Badge variant={getStatusVariant(item.statut)}>{item.statut}</Badge>
                    </div>

                    <div className="timeline-inline">
                      <span>Distance : {item.distance_km} km</span>
                      <span>Duree : {item.duree_formatee}</span>
                    </div>

                    {(user?.role === 'transporteur' || user?.role === 'admin') && (
                      <div className="card-actions">
                        <button type="button" className="btn-secondary" onClick={() => handleStatus(item.id, 'confirme')}>
                          Confirmer
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => handleStatus(item.id, 'en_route')}>
                          En route
                        </button>
                        <button type="button" className="btn-primary" onClick={() => handleStatus(item.id, 'livre')}>
                          Livre
                        </button>
                      </div>
                    )}

                    {item.statut === 'livre' && (user?.role === 'client' || user?.role === 'admin') && (
                      <div className="rating-box">
                        <StarRating value={ratingForm.id === item.id ? ratingForm.note : 0} onChange={(note) => setRatingForm({ id: item.id, note, commentaire: ratingForm.commentaire })} />
                        <textarea
                          rows="3"
                          placeholder="Votre commentaire sur le transport"
                          value={ratingForm.id === item.id ? ratingForm.commentaire : ''}
                          onChange={(event) => setRatingForm((current) => ({ ...current, id: item.id, commentaire: event.target.value }))}
                        />
                        <button type="button" className="btn-primary" onClick={submitRating}>
                          Noter le transporteur
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          )}
        </aside>
      </div>
    </div>
  );
};

export default TransportPage;
