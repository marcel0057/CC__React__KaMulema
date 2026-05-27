package cm.agroplatform.agronomes.controller;

import cm.agroplatform.agronomes.dto.slot.SlotCreationDTO;
import cm.agroplatform.agronomes.dto.slot.SlotReponseDTO;
import cm.agroplatform.agronomes.entity.DisponibiliteSlot.StatutSlot;
import cm.agroplatform.agronomes.service.DisponibiliteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DisponibiliteController {

    private final DisponibiliteService disponibiliteService;

    // ===== Créneaux =====

    /**
     * POST /api/agronomes/{agronomeId}/creneaux
     * L'agronome crée un créneau.
     */
    @PostMapping("/api/agronomes/{agronomeId}/creneaux")
    public ResponseEntity<SlotReponseDTO> creerCreneau(
        @PathVariable Long agronomeId,
        @Valid @RequestBody SlotCreationDTO dto
    ) {
        dto.setAgronomeId(agronomeId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(disponibiliteService.creerCreneau(dto));
    }

    /**
     * GET /api/agronomes/{agronomeId}/creneaux
     * Créneaux libres futurs d'un agronome (pour la vue agriculteur).
     */
    @GetMapping("/api/agronomes/{agronomeId}/creneaux")
    public ResponseEntity<List<SlotReponseDTO>> getCreneauxLibres(@PathVariable Long agronomeId) {
        return ResponseEntity.ok(disponibiliteService.getCreneauxLibres(agronomeId));
    }

    // ===== Réservations =====

    /**
     * POST /api/slots/{slotId}/reserver
     * L'agriculteur réserve un créneau.
     */
    @PostMapping("/api/slots/{slotId}/reserver")
    public ResponseEntity<SlotReponseDTO> reserverCreneau(
        @PathVariable Long slotId,
        @RequestParam Long agriculteurId,
        @RequestParam(required = false) String notes
    ) {
        return ResponseEntity.ok(disponibiliteService.reserverCreneau(slotId, agriculteurId, notes));
    }

    /**
     * PATCH /api/slots/{slotId}/repondre
     * L'agronome confirme ou refuse.
     * Body: { "statut": "CONFIRME", "notesAgronome": "..." }
     */
    @PatchMapping("/api/slots/{slotId}/repondre")
    public ResponseEntity<SlotReponseDTO> repondreReservation(
        @PathVariable Long slotId,
        @RequestBody Map<String, String> body
    ) {
        StatutSlot statut = StatutSlot.valueOf(body.get("statut"));
        String notes = body.get("notesAgronome");
        return ResponseEntity.ok(disponibiliteService.repondreReservation(slotId, statut, notes));
    }

    /**
     * GET /api/agriculteurs/{agriculteurId}/reservations
     * Toutes les réservations d'un agriculteur.
     */
    @GetMapping("/api/agriculteurs/{agriculteurId}/reservations")
    public ResponseEntity<List<SlotReponseDTO>> getReservationsAgriculteur(
        @PathVariable Long agriculteurId,
        @RequestParam(required = false) Long agronomeId,
        @RequestParam(required = false) String statut
    ) {
        return ResponseEntity.ok(
            disponibiliteService.getReservationsAgriculteur(agriculteurId, agronomeId, statut)
        );
    }
}
