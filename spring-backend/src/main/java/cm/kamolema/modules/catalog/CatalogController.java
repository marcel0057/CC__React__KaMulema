package cm.kamolema.modules.catalog;

import cm.kamolema.data.InMemoryStore;
import cm.kamolema.modules.certifications.Certification;
import cm.kamolema.modules.market.MarketOrder;
import cm.kamolema.modules.market.Product;
import cm.kamolema.modules.market.ProductProposal;
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

    // ===== Marketplace Agriculteur : Proposer un produit =====

    @GetMapping("/market/proposals")
    public List<ProductProposal> proposals() {
        return store.proposals();
    }

    @PostMapping("/market/proposals")
    public ProductProposal createProposal(@RequestBody Map<String, Object> payload) {
        ProductProposal proposal = new ProductProposal(
                "PROP-" + Instant.now().toEpochMilli(),
                String.valueOf(payload.getOrDefault("farmerName", "Agriculteur")),
                String.valueOf(payload.getOrDefault("farmerPhone", "")),
                String.valueOf(payload.getOrDefault("name", "Produit")),
                String.valueOf(payload.getOrDefault("category", "Autres")),
                String.valueOf(payload.getOrDefault("unit", "kg")),
                Integer.parseInt(String.valueOf(payload.getOrDefault("quantity", 0))),
                Integer.parseInt(String.valueOf(payload.getOrDefault("minOrder", 1))),
                Integer.parseInt(String.valueOf(payload.getOrDefault("price", 0))),
                String.valueOf(payload.getOrDefault("quality", "Standard")),
                String.valueOf(payload.getOrDefault("deliveryDelay", "A definir")),
                List.of(String.valueOf(payload.getOrDefault("paymentMode", "Mobile Money"))),
                String.valueOf(payload.getOrDefault("region", "")),
                String.valueOf(payload.getOrDefault("city", "")));
        store.proposals().add(0, proposal);
        return proposal;
    }

    // ===== Marketplace Client : Commander un produit proposé =====

    @GetMapping("/market/orders")
    public List<MarketOrder> orders() {
        return store.orders();
    }

    @PostMapping("/market/orders")
    public MarketOrder createOrder(@RequestBody Map<String, Object> payload) {
        int quantity = Integer.parseInt(String.valueOf(payload.getOrDefault("quantity", 1)));
        int price = Integer.parseInt(String.valueOf(payload.getOrDefault("price", 0)));
        MarketOrder order = new MarketOrder(
                "CMD-" + String.valueOf(Instant.now().toEpochMilli()).substring(8),
                String.valueOf(payload.getOrDefault("productId", "")),
                String.valueOf(payload.getOrDefault("productName", "Produit")),
                String.valueOf(payload.getOrDefault("farmerName", "")),
                String.valueOf(payload.getOrDefault("buyerName", "Client")),
                String.valueOf(payload.getOrDefault("buyerPhone", "")),
                quantity,
                (long) quantity * price,
                String.valueOf(payload.getOrDefault("deliveryMode", "Livraison simple")),
                String.valueOf(payload.getOrDefault("message", "")),
                "Demande envoyee");
        store.orders().add(0, order);
        return order;
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
                List.of("Demande reçue", "Dossier à vérifier", "Visite agronome à planifier"));
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
                0);
        store.tickets().add(0, ticket);
        return ticket;
    }
}
