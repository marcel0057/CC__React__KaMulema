package cm.kamolema.data;

import cm.kamolema.modules.agronomes.Agronome;
import cm.kamolema.modules.agronomes.DisponibiliteSlot;
import cm.kamolema.modules.agronomes.Message;
import cm.kamolema.modules.certifications.Certification;
import cm.kamolema.modules.market.MarketOrder;
import cm.kamolema.modules.market.Product;
import cm.kamolema.modules.market.ProductProposal;
import cm.kamolema.modules.soil.SoilRecommendation;
import cm.kamolema.modules.tickets.Ticket;
import cm.kamolema.modules.transport.Delivery;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class InMemoryStore {
        private final List<Agronome> agronomes = new CopyOnWriteArrayList<>();
        private final List<Product> products = new CopyOnWriteArrayList<>();
        private final List<ProductProposal> proposals = new CopyOnWriteArrayList<>();
        private final List<MarketOrder> orders = new CopyOnWriteArrayList<>();
        private final List<Certification> certifications = new CopyOnWriteArrayList<>();
        private final List<Delivery> deliveries = new CopyOnWriteArrayList<>();
        private final List<Ticket> tickets = new CopyOnWriteArrayList<>();
        private final List<DisponibiliteSlot> slots = new CopyOnWriteArrayList<>();
        private final List<Message> messages = new CopyOnWriteArrayList<>();

        @PostConstruct
        void seed() {
                agronomes.addAll(List.of(
                                new Agronome("AGR-01", "Dr Marcel Tchoumi", "Phytopathologie", "Bafoussam", "Ouest",
                                                List.of("Bafoussam", "Dschang", "Mbouda", "Foumbot"), 9,
                                                "Disponible cette semaine", List.of("WhatsApp", "Appel", "Terrain"),
                                                "akilanneaxel@gmail.com", "+237 690 11 22 33", 4.8, 42),
                                new Agronome("AGR-02", "Ing. Carine Mballa", "Sol et fertilisation", "Yaounde",
                                                "Centre", List.of("Yaounde", "Mbalmayo", "Obala"), 6,
                                                "Rendez-vous sous 48h", List.of("Messagerie", "Visio", "Terrain"),
                                                "auroreluna8@gmail.com", "+237 677 24 18 90", 4.6, 28),
                                new Agronome("AGR-03", "Dr Alain Njoya", "Cacao et cultures d'exportation", "Ebolowa",
                                                "Sud", List.of("Ebolowa", "Sangmelima", "Kribi"), 14,
                                                "Disponible demain", List.of("WhatsApp", "Terrain"),
                                                "akilanneaxel@gmail.com", "+237 699 45 67 10", 4.9, 61),
                                new Agronome("AGR-04", "Ing. Nadine Fotso", "Maraichage", "Douala", "Littoral",
                                                List.of("Douala", "Edea", "Nkongsamba"), 4, "Disponible aujourd'hui",
                                                List.of("Appel", "Messagerie"), "auroreluna8@gmail.com",
                                                "+237 650 83 74 22", 4.4, 19)));

                products.addAll(List.of(
                                new Product("P-01", "Tomates fraiches", "Michelle Farm", "Ouest", "Bafoussam", 850,
                                                "kg", 320, 20, "24h - 48h",
                                                List.of("Mobile Money", "Cash a la livraison"), "Extra frais",
                                                "Legumes", true, true),
                                new Product("P-02", "Cacao grade A", "Cooperative Ntem", "Sud", "Ebolowa", 2400, "kg",
                                                1200, 100, "3 - 5 jours", List.of("Virement", "Mobile Money"),
                                                "Grade A export", "Exportation", true, false),
                                new Product("P-03", "Manioc doux", "Ferme Kedis", "Centre", "Mbalmayo", 420, "kg", 180,
                                                30, "48h", List.of("Mobile Money"), "Transformable", "Tubercules",
                                                false, true),
                                new Product("P-04", "Plantain mur", "Ngongang Agro", "Littoral", "Nkongsamba", 1800,
                                                "regime", 75, 5, "24h", List.of("Cash a la livraison", "Mobile Money"),
                                                "Mature", "Fruits", true, true)));

                certifications.addAll(List.of(
                                new Certification("C-01", "Michelle Farm", "Tomates fraiches", "Ouest", "Certifie",
                                                "Or", 88,
                                                List.of("Traçabilite", "Qualite produit", "Avis clients",
                                                                "Evaluation agronome")),
                                new Certification("C-02", "Ferme Kedis", "Manioc doux", "Centre", "En attente",
                                                "Argent", 64, List.of("Traçabilite", "Volume stable")),
                                new Certification("C-03", "Ngongang Agro", "Plantain mur", "Littoral", "A corriger",
                                                "Bronze", 51, List.of("Photos produits", "Evaluation terrain"))));

                deliveries.addAll(List.of(
                                new Delivery("TR-001", "Tomates fraiches", "Express Agro Cameroun", "Bafoussam",
                                                "Yaounde", "En route", 68, "2h 15min", 45000, 288),
                                new Delivery("TR-002", "Plantain mur", "LogiVert", "Nkongsamba", "Douala", "Confirme",
                                                32, "1h 40min", 28000, 142),
                                new Delivery("TR-003", "Cacao grade A", "Cam Freight Rural", "Ebolowa",
                                                "Port de Douala", "Livre", 100, "Termine", 92000, 314)));

                tickets.addAll(List.of(
                                new Ticket("TK-2401", "Tomates fraiches", "Marche Mfoundi", "Genere",
                                                "KA-MOLEMA-TK-2401", 0),
                                new Ticket("TK-2402", "Cacao grade A", "Exportateur Douala", "Confirme",
                                                "KA-MOLEMA-TK-2402", 5)));

                Instant tomorrow = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);
                slots.addAll(List.of(
                                new DisponibiliteSlot("SLOT-1", "AGR-01",
                                                tomorrow.plus(10, ChronoUnit.HOURS).toString(),
                                                tomorrow.plus(11, ChronoUnit.HOURS).toString(), "LIBRE", ""),
                                new DisponibiliteSlot("SLOT-2", "AGR-01",
                                                tomorrow.plus(14, ChronoUnit.HOURS).toString(),
                                                tomorrow.plus(15, ChronoUnit.HOURS).toString(), "LIBRE", ""),
                                new DisponibiliteSlot("SLOT-3", "AGR-02", tomorrow.plus(9, ChronoUnit.HOURS).toString(),
                                                tomorrow.plus(12, ChronoUnit.HOURS).toString(), "LIBRE", "")));

                messages.addAll(List.of(
                                new Message("MSG-1", "User", "AGR-01", "AGRONOME",
                                                "Bonjour, comment puis-je vous aider ?", false,
                                                Instant.now().minus(2, ChronoUnit.HOURS).toString())));
        }

        public List<Agronome> agronomes() {
                return agronomes;
        }

        public List<Product> products() {
                return products;
        }

        public List<ProductProposal> proposals() {
                return proposals;
        }

        public List<MarketOrder> orders() {
                return orders;
        }

        public List<Certification> certifications() {
                return certifications;
        }

        public List<Delivery> deliveries() {
                return deliveries;
        }

        public List<Ticket> tickets() {
                return tickets;
        }

        public List<DisponibiliteSlot> slots() {
                return slots;
        }

        public List<Message> messages() {
                return messages;
        }

        public List<SoilRecommendation> soilRecommendations() {
                return new ArrayList<>(List.of(
                                new SoilRecommendation("Tomate", 87,
                                                "Sol limono-sableux, bonne exposition et humidite moderee.",
                                                "Mars - Juin"),
                                new SoilRecommendation("Mais", 78,
                                                "Bonne tolerance aux variations de pluie et cycle court.",
                                                "Mars - Mai"),
                                new SoilRecommendation("Haricot", 71,
                                                "Ameliore le sol et s'adapte aux zones de moyenne altitude.",
                                                "Avril - Juillet")));
        }
}
