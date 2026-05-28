package cm.kamolema.modules.agronomes;

import cm.kamolema.data.InMemoryStore;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suivi")
@CrossOrigin(origins = "*") // For development frontend
public class SuiviController {

    private final InMemoryStore store;

    public SuiviController(InMemoryStore store) {
        this.store = store;
    }

    // Mock endpoint to simulate getting the dashboard data for an agronomist
    @GetMapping("/tableau-bord")
    public Map<String, Object> getTableauBord() {
        return Map.of(
                "agriculteursSuivis", List.of(
                        Map.of(
                                "id", "user123",
                                "nom", "Jean Agriculteur",
                                "culture", "Maïs",
                                "surface", "2.5 ha",
                                "region", "Ouest",
                                "dernierDiagnostic", "Rien à signaler"),
                        Map.of(
                                "id", "user456",
                                "nom", "Marie Ndoye",
                                "culture", "Tomate",
                                "surface", "1.0 ha",
                                "region", "Littoral",
                                "dernierDiagnostic", "Traitement fongicide recommandé")),
                "demandesEnAttente", List.of(
                        Map.of(
                                "id", "req789",
                                "agriculteurNom", "Paul Biya",
                                "dateDemande", "2026-05-27",
                                "type", "Nouveau Suivi")));
    }
}
