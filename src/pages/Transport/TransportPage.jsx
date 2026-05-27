import { useEffect, useState } from "react";
import { deliveries } from "../../data/platformData.js";
import { apiGet } from "../../services/platformApi.js";
import { formatFcfa } from "../../utils/formatters.js";

export default function TransportPage() {
  const [deliveryList, setDeliveryList] = useState(deliveries);

  useEffect(() => {
    apiGet("/api/transports/deliveries", deliveries).then(setDeliveryList);
  }, []);

  return (
    <section className="module-page">
      <div className="section-heading left">
        <p className="eyebrow">Logistique agricole</p>
        <h2>Transport et suivi des marchandises</h2>
        <p>Choix du transporteur, suivi du trajet, estimation du temps et confirmation de livraison.</p>
      </div>

      <div className="transport-layout-simple">
        <article className="surface map-simulation">
          <div className="map-path">
            <span className="map-point start">Départ</span>
            <span className="map-road" />
            <span className="truck-dot" />
            <span className="map-road second" />
            <span className="map-point end">Arrivée</span>
          </div>
          <h3>Carte de suivi</h3>
          <p className="muted">Vue simplifiée du trajet. Une carte réelle pourra être branchée avec Leaflet ou Google Maps.</p>
        </article>

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
