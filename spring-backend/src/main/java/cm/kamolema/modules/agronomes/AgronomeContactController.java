package cm.kamolema.modules.agronomes;

import cm.kamolema.data.InMemoryStore;
import cm.kamolema.common.ApiResponse;
import cm.kamolema.modules.mail.MailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agronomes")
public class AgronomeContactController {
    private final MailService mailService;
    private final InMemoryStore store;

    public AgronomeContactController(MailService mailService, InMemoryStore store) {
        this.mailService = mailService;
        this.store = store;
    }

    @GetMapping
    public List<Agronome> agronomes() {
        return store.agronomes();
    }

    @PostMapping("/contact")
    public ResponseEntity<ApiResponse> contact(@RequestBody AgronomeContactRequest request) {
        mailService.sendAgronomeContact(request);
        return ResponseEntity.ok(new ApiResponse("Email envoye avec succes a l'agronome."));
    }

    @GetMapping("/{id}/slots")
    public List<DisponibiliteSlot> slots(@PathVariable String id) {
        return store.slots().stream()
                .filter(s -> s.agronomeId().equals(id) && s.statut().equals("LIBRE"))
                .toList();
    }

    @PostMapping("/slots/reserver")
    public DisponibiliteSlot reserveSlot(@RequestBody Map<String, String> payload) {
        String slotId = payload.get("slotId");
        for (int i = 0; i < store.slots().size(); i++) {
            DisponibiliteSlot s = store.slots().get(i);
            if (s.id().equals(slotId)) {
                DisponibiliteSlot reserved = new DisponibiliteSlot(s.id(), s.agronomeId(), s.dateDebut(), s.dateFin(),
                        "RESERVE", payload.getOrDefault("notesAgriculteur", ""));
                store.slots().set(i, reserved);
                return reserved;
            }
        }
        throw new RuntimeException("Slot non trouve");
    }

    @GetMapping("/conversation/{agriculteurId}/{agronomeId}")
    public List<Message> conversation(@PathVariable String agriculteurId, @PathVariable String agronomeId) {
        return store.messages().stream()
                .filter(m -> m.agriculteurId().equals(agriculteurId) && m.agronomeId().equals(agronomeId))
                .toList();
    }

    @PostMapping("/messages")
    public Message sendMessage(@RequestBody Map<String, String> payload) {
        String agriculteurId = payload.get("agriculteurId");
        String agronomeId = payload.get("agronomeId");
        String expediteur = payload.getOrDefault("expediteur", "AGRICULTEUR");
        String contenu = payload.get("contenu");

        Message msg = new Message("MSG-" + Instant.now().toEpochMilli(), agriculteurId, agronomeId, expediteur, contenu,
                false, Instant.now().toString());
        store.messages().add(msg);

        return msg;
    }
}
