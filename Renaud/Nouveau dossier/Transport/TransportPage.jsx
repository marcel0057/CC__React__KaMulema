import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import Badge from '../../components/Badge';
import LeafletMapSync from '../../components/LeafletMapSync';
import LoadingSpinner from '../../components/LoadingSpinner';
import StarRating from '../../components/StarRating';
import { useAuth } from '../../context/AuthContext';
import { produitsService } from '../../services/produits.service';
import { createRealtimeStream } from '../../services/realtime.service';
import { transportsService } from '../../services/transports.service';
import {
  africaCountryOptions,
  calculateDistance,
  formatDate,
  formatMoney,
  getStatusVariant
} from '../../utils/helpers';

const hasValidCoordinates = (lat, lng) => {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  return (
    Number.isFinite(parsedLat) &&
    Number.isFinite(parsedLng) &&
    Math.abs(parsedLat) <= 90 &&
    Math.abs(parsedLng) <= 180 &&
    !(parsedLat === 0 && parsedLng === 0)
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
  const [estimateData, setEstimateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState({ lat: 4.05, lng: 11.5 });
  const [tab, setTab] = useState(searchParams.get('view') === 'livraisons' ? 'livraisons' : 'demande');
  const [demandeForm, setDemandeForm] = useState({
    produit_id: '',
    transporteur_id: '',
    adresse_depart: '',
    pays_depart: user?.pays || 'Cameroun',
    adresse_destination: '',
    pays_destination: user?.pays || 'Cameroun',
    lat_depart: '',
    lng_depart: '',
    lat_destination: '',
    lng_destination: ''
  });
  const [ratingForm, setRatingForm] = useState({ id: null, note: 0, commentaire: '' });
  const [realtimeActive, setRealtimeActive] = useState(false);

  const selectedProduct = useMemo(
    () => produits.find((item) => String(item.id) === String(demandeForm.produit_id)),
    [demandeForm.produit_id, produits]
  );
  const activeCurrency = selectedProduct?.devise || user?.devise_preferee || 'XAF';

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
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user?.role]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchData();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [user?.role]);

  useEffect(() => {
    if (!navigator.geolocation) {
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const nextPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setUserPosition(nextPosition);

        if (user?.role === 'transporteur') {
          try {
            await transportsService.updatePosition({
              latitude: nextPosition.lat,
              longitude: nextPosition.lng
            });
            setRealtimeActive(true);
          } catch (error) {
          }
        }
      },
      () => null,
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 15000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user?.role]);

  useEffect(() => {
    const source = createRealtimeStream('/api/transports/flux', (payload) => {
      if (payload.type === 'position' && payload.transporteur) {
        setTransporteurs((current) => {
          const exists = current.some((item) => item.id === payload.transporteur.id);
          if (!exists) {
            return current;
          }

          return current.map((item) =>
            item.id === payload.transporteur.id ? { ...item, ...payload.transporteur } : item
          );
        });
        setRealtimeActive(true);
      }
    });

    return () => source.close();
  }, []);

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

  const transporteursWithCoords = useMemo(
    () => sortedTransporteurs.filter((item) => hasValidCoordinates(item.latitude, item.longitude)),
    [sortedTransporteurs]
  );

  const mappedLivraisons = useMemo(
    () =>
      livraisons.filter(
        (item) =>
          ['confirme', 'en_route', 'livre'].includes(item.statut) &&
          hasValidCoordinates(item.lat_depart, item.lng_depart) &&
          hasValidCoordinates(item.lat_destination, item.lng_destination)
      ),
    [livraisons]
  );
  const mapPoints = useMemo(() => {
    const userPoint = hasValidCoordinates(userPosition.lat, userPosition.lng)
      ? [[userPosition.lat, userPosition.lng]]
      : [];
    const transporteurPoints = transporteursWithCoords.map((item) => [
      Number(item.latitude),
      Number(item.longitude)
    ]);
    const livraisonPoints = mappedLivraisons.flatMap((item) => [
      [Number(item.lat_depart), Number(item.lng_depart)],
      [Number(item.lat_destination), Number(item.lng_destination)]
    ]);
    return [...userPoint, ...transporteurPoints, ...livraisonPoints];
  }, [mappedLivraisons, transporteursWithCoords, userPosition]);

  const handleDemande = async (event) => {
    event.preventDefault();
    const data = await transportsService.createDemande({
      ...demandeForm,
      transporteur_id: demandeForm.transporteur_id || selectedTransporteur?.id
    });
    setEstimateData(data);
    setMessage(
      `Distance : ${data.estimation.distance_km} km - Duree estimee : ${data.estimation.duree_formatee} - Cout estime : ${formatMoney(data.estimation.cout_estime, activeCurrency)} - Source : ${data.estimation.source}`
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
        {realtimeActive ? <Badge variant="success">Suivi GPS en direct actif</Badge> : null}
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
        <article className="card map-card full-height">
          <div className="map-wrapper large">
            <MapContainer center={[userPosition.lat, userPosition.lng]} zoom={6} style={{ height: '100%', width: '100%' }}>
              <LeafletMapSync
                watchKey={`transport-${tab}-${transporteursWithCoords.length}-${mappedLivraisons.length}`}
                points={mapPoints}
                fallbackCenter={[userPosition.lat, userPosition.lng]}
                fallbackZoom={6}
              />
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={[userPosition.lat, userPosition.lng]}>
                <Popup>Votre position actuelle</Popup>
              </Marker>

              {transporteursWithCoords.map((item) => (
                <Marker
                  key={item.id}
                  position={[Number(item.latitude), Number(item.longitude)]}
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

              {mappedLivraisons.map((item) => (
                  <Polyline
                    key={item.id}
                    positions={[
                      [Number(item.lat_depart), Number(item.lng_depart)],
                      [Number(item.lat_destination), Number(item.lng_destination)]
                    ]}
                    pathOptions={{ color: item.statut === 'livre' ? '#2d8a4e' : '#e53e3e', weight: 4 }}
                  />
                ))}
            </MapContainer>
          </div>
          {!transporteursWithCoords.length && !mappedLivraisons.length && (
            <p className="muted">
              La carte est chargee, mais aucun transporteur geolocalise ni aucun trajet actif
              n est disponible pour l instant.
            </p>
          )}
        </article>

        <aside className="transport-panel">
          {tab === 'demande' ? (
            <>
              <article className="card">
                <h3>Transporteurs disponibles</h3>
                <div className="stack-list">
                  {sortedTransporteurs.length ? (
                    sortedTransporteurs.map((item) => (
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
                          <span>{formatMoney(item.tarif_km, user?.devise_preferee || 'XAF')} / km</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="info-box">
                      <strong>Aucun transporteur exploitable pour l instant.</strong>
                      <p className="muted">
                        Les transporteurs apparaissent ici des qu ils sont disponibles ou geolocalises.
                      </p>
                    </div>
                  )}
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
                    <select
                      value={demandeForm.pays_depart}
                      onChange={(event) =>
                        setDemandeForm((current) => ({ ...current, pays_depart: event.target.value }))
                      }
                    >
                      {africaCountryOptions.map((country) => (
                        <option key={country.code} value={country.name}>
                          Depart - {country.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={demandeForm.pays_destination}
                      onChange={(event) =>
                        setDemandeForm((current) => ({
                          ...current,
                          pays_destination: event.target.value
                        }))
                      }
                    >
                      {africaCountryOptions.map((country) => (
                        <option key={country.code} value={country.name}>
                          Destination - {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="muted">
                    Les coordonnees GPS sont facultatives. Si vous les laissez vides, AgroPlatform
                    tentera de geocoder les adresses et de calculer un vrai trajet routier.
                  </p>
                  <div className="filter-grid">
                    <input placeholder="Lat depart" value={demandeForm.lat_depart} onChange={(event) => setDemandeForm((current) => ({ ...current, lat_depart: event.target.value }))} />
                    <input placeholder="Lng depart" value={demandeForm.lng_depart} onChange={(event) => setDemandeForm((current) => ({ ...current, lng_depart: event.target.value }))} />
                    <input placeholder="Lat destination" value={demandeForm.lat_destination} onChange={(event) => setDemandeForm((current) => ({ ...current, lat_destination: event.target.value }))} />
                    <input placeholder="Lng destination" value={demandeForm.lng_destination} onChange={(event) => setDemandeForm((current) => ({ ...current, lng_destination: event.target.value }))} />
                  </div>
                  <button type="submit" className="btn-primary wide">
                    Envoyer la demande
                  </button>
                </form>
                {message && <div className="alert alert-success">{message}</div>}
                {estimateData?.corridor ? (
                  <div className="info-box">
                    <strong>{estimateData.corridor.corridor_name}</strong>
                    <p>{estimateData.corridor.advisory}</p>
                    <p className="muted">
                      {estimateData.corridor.depart_country} - {estimateData.corridor.destination_country}
                    </p>
                  </div>
                ) : null}
              </article>
            </>
          ) : (
            <article className="card">
              <h3>Mes livraisons</h3>
              <div className="stack-list">
                {livraisons.length ? (
                  livraisons.map((item) => (
                  <div key={item.id} className="delivery-item">
                    <div className="list-row">
                      <div>
                        <strong>{item.produit_nom}</strong>
                        <p className="muted">{formatDate(item.date_demande)} - {formatMoney(item.montant_total, user?.devise_preferee || 'XAF')}</p>
                      </div>
                      <Badge variant={getStatusVariant(item.statut)}>{item.statut}</Badge>
                    </div>

                    <div className="timeline-inline">
                      <span>Distance : {item.distance_km} km</span>
                      <span>Duree : {item.duree_formatee}</span>
                    </div>
                    <div className="timeline-inline">
                      <span>{item.pays_depart || 'Cameroun'} → {item.pays_destination || 'Cameroun'}</span>
                      {item.corridor_logistique ? <span>{item.corridor_logistique}</span> : null}
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
                ))
                ) : (
                  <div className="info-box">
                    <strong>Aucune livraison a afficher pour l instant.</strong>
                    <p className="muted">
                      Creez une demande ou attendez une mise a jour de statut pour voir vos trajets ici.
                    </p>
                  </div>
                )}
              </div>
            </article>
          )}
        </aside>
      </div>
    </div>
  );
};

export default TransportPage;
