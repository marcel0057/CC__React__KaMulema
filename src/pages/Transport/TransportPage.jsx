import { useEffect, useState } from "react";
import { deliveries } from "../../data/platformData.js";
import { apiGet } from "../../services/platformApi.js";
import { formatFcfa } from "../../utils/formatters.js";
import MapLibreView from "../../components/ui/MapLibreView";
import BottomSheet from "../../components/ui/BottomSheet";

export default function TransportPage() {
  const [deliveryList, setDeliveryList] = useState(deliveries);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);

  useEffect(() => {
    apiGet("/api/transports/deliveries", deliveries).then(setDeliveryList);
  }, []);

  const transportMarkers = deliveryList.map((d, index) => ({
    ...d,
    id: d.id,
    name: d.transporter,
    specialty: d.product,
    city: `${d.progress}% (de ${d.from} vers ${d.to})`,
    experience: Math.floor(d.distance / 10),
    rating: 4.8,
    availability: d.status === "Livre" ? "Disponible" : "En mission",
    longitude: 11.5 + (index % 5) * 0.1,
    latitude: 3.8 + index * 0.05
  }));

  return (
    <section className="module-page">
      <div className="section-heading left">
        <p className="eyebrow">Logistique agricole</p>
        <h2>Transport et suivi des marchandises</h2>
        <p>Choix du transporteur, suivi du trajet, estimation du temps et confirmation de livraison.</p>
      </div>

      <div className="transport-layout-simple">
        <div style={{ flex: 1, minWidth: '350px' }}>
          <MapLibreView
            markers={transportMarkers}
            onMarkerClick={(m, coords) => { setSelectedTransport(m); setSelectedCoords(coords); }}
            selectedMarkerId={selectedTransport?.id}
            onMapClick={() => { setSelectedTransport(null); setSelectedCoords(null); }}
            mode="transport"
          />
        </div>

        <BottomSheet
          isOpen={Boolean(selectedTransport)}
          data={selectedTransport}
          markerCoords={selectedCoords}
          onClose={() => { setSelectedTransport(null); setSelectedCoords(null); }}
          onContact={() => { setSelectedTransport(null); setSelectedCoords(null); }}
          mode="transport"
        />

        <div className="stack-list">
          {deliveryList.map((delivery) => (
            <article className="surface delivery-item" key={delivery.id}>
              <div className="list-row">
                <div>
                  <h3>{delivery.product}</h3>
                  <p className="muted">{delivery.from} vers {delivery.to}</p>
                </div>
                <span className={delivery.status === "Livre" ? "badge success" : "badge warning"}>{delivery.status}</span>
              </div>
              <p className="muted">{delivery.transporter} - {delivery.distance} km - {delivery.eta}</p>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${delivery.progress}%` }} />
              </div>
              <div className="list-row">
                <span>{delivery.progress}% du trajet</span>
                <strong>{formatFcfa(delivery.cost)}</strong>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
