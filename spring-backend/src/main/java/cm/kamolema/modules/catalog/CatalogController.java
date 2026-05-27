package cm.kamolema.modules.catalog;

import cm.kamolema.data.InMemoryStore;
import cm.kamolema.modules.certifications.Certification;
import cm.kamolema.modules.market.Product;
import cm.kamolema.modules.soil.SoilRecommendation;
import cm.kamolema.modules.tickets.Ticket;
import cm.kamolema.modules.transport.Delivery;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CatalogController {
    private final InMemoryStore store;

    public CatalogController(InMemoryStore store) {
        this.store = store;
    }

    @GetMapping("/agronomes")
    public List<?> agronomes() {
        return store.agronomes();
    }

    @GetMapping("/products")
    public List<Product> products() {
        return store.products();
    }

    @PostMapping("/market/requests")
    public Map<String, Object> marketRequest(@RequestBody Map<String, Object> payload) {
        return Map.of(
                "id", "CMD-" + Instant.now().toEpochMilli(),
                "status", "Demande envoyee",
                "payload", payload
        );
    }

    @GetMapping("/certifications")
    public List<Certification> certifications() {
        return store.certifications();
    }

    @PostMapping("/certifications")
    public Certification createCertification(@RequestBody Map<String, Object> payload) {
        Certification certification = new Certification(
                "REQ-" + Instant.now().toEpochMilli(),
                String.valueOf(payload.getOrDefault("farmer", "Agriculteur")),
                String.valueOf(payload.getOrDefault("product", "Produit agricole")),
                String.valueOf(payload.getOrDefault("region", "Ouest")),
                "En attente",
                String.valueOf(payload.getOrDefault("level", "Argent")).replace("Certification ", ""),
                35,
                List.of("Demande reçue", "Dossier à vérifier", "Visite agronome à planifier")
        );
        store.certifications().add(0, certification);
        return certification;
    }

    @GetMapping("/transports/deliveries")
    public List<Delivery> deliveries() {
        return store.deliveries();
    }

    @GetMapping("/soil/recommendations")
    public List<SoilRecommendation> soilRecommendations() {
        return store.soilRecommendations();
    }

    @GetMapping("/tickets")
    public List<Ticket> tickets() {
        return store.tickets();
    }

    @PostMapping("/tickets")
    public Ticket createTicket(@RequestBody Map<String, Object> payload) {
        Ticket ticket = new Ticket(
                "TK-" + String.valueOf(Instant.now().toEpochMilli()).substring(8),
                String.valueOf(payload.getOrDefault("product", "Produit agricole")),
                String.valueOf(payload.getOrDefault("beneficiary", "Beneficiaire")),
                "Genere",
                "KA-MOLEMA-" + Instant.now().toEpochMilli(),
                0
        );
        store.tickets().add(0, ticket);
        return ticket;
    }
}
