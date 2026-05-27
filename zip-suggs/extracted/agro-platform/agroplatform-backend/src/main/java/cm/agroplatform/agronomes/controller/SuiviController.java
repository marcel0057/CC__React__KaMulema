package cm.agroplatform.agronomes.controller;

import cm.agroplatform.agronomes.dto.position.PositionUpdateDTO;
import cm.agroplatform.agronomes.dto.suivi.SuiviRequeteDTO;
import cm.agroplatform.agronomes.dto.suivi.SuiviReponseDTO;
import cm.agroplatform.agronomes.entity.SuiviAgriculteur.StatutSuivi;
import cm.agroplatform.agronomes.service.SuiviService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SuiviController {

    private final SuiviService suiviService;

    // ===== Position GPS =====

    /**
     * PATCH /api/agronomes/{id}/position
     * L'agronome met à jour sa position GPS en temps réel.
     * Appelé toutes les 30 secondes par le frontend.
     */
    @PatchMapping("/api/agronomes/{id}/position")
    public ResponseEntity<Void> mettreAJourPosition(
        @PathVariable Long id,
        @Valid @RequestBody PositionUpdateDTO dto
    ) {
        suiviService.mettreAJourPosition(id, dto);
        return ResponseEntity.noContent().build();
    }

    // ===== Suivi agriculteurs =====

    /**
     * POST /api/suivi/demander
     * Un agriculteur demande à être suivi par un agronome.
     */
    @PostMapping("/api/suivi/demander")
    public ResponseEntity<SuiviReponseDTO> demanderSuivi(
        @Valid @RequestBody SuiviRequeteDTO dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(suiviService.demanderSuivi(dto));
    }

    /**
     * PATCH /api/suivi/{suiviId}/repondre
     * L'agronome accepte ou refuse une demande.
     * Body: { "statut": "ACCEPTE" } ou { "statut": "REFUSE" }
     */
    @PatchMapping("/api/suivi/{suiviId}/repondre")
    public ResponseEntity<SuiviReponseDTO> repondre(
        @PathVariable Long suiviId,
        @RequestBody Map<String, String> body
    ) {
        StatutSuivi statut = StatutSuivi.valueOf(body.get("statut"));
        return ResponseEntity.ok(suiviService.repondreDemandesuivi(suiviId, statut));
    }

    /**
     * DELETE /api/suivi/{suiviId}
     * L'agronome retire un agriculteur de son suivi.
     */
    @DeleteMapping("/api/suivi/{suiviId}")
    public ResponseEntity<Void> retirerSuivi(@PathVariable Long suiviId) {
        suiviService.retirerSuivi(suiviId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/suivi/{suiviId}/diagnostic
     * L'agronome met à jour les notes/diagnostic d'un agriculteur suivi.
     * Body: { "diagnostic": "Traitement fongique appliqué le 20/05..." }
     */
    @PatchMapping("/api/suivi/{suiviId}/diagnostic")
    public ResponseEntity<SuiviReponseDTO> mettreAJourDiagnostic(
        @PathVariable Long suiviId,
        @RequestBody Map<String, String> body
    ) {
        return ResponseEntity.ok(
            suiviService.mettreAJourDiagnostic(suiviId, body.get("diagnostic"))
        );
    }

    /**
     * GET /api/agronomes/{agronomeId}/suivi
     * Tableau de bord complet : suivis actifs + demandes en attente + stats.
     */
    @GetMapping("/api/agronomes/{agronomeId}/suivi")
    public ResponseEntity<Map<String, Object>> getTableauBord(
        @PathVariable Long agronomeId
    ) {
        return ResponseEntity.ok(suiviService.getTableauBord(agronomeId));
    }

    /**
     * GET /api/agronomes/{agronomeId}/suivi/actifs
     * Uniquement les agriculteurs activement suivis.
     */
    @GetMapping("/api/agronomes/{agronomeId}/suivi/actifs")
    public ResponseEntity<List<SuiviReponseDTO>> getSuivisActifs(
        @PathVariable Long agronomeId
    ) {
        return ResponseEntity.ok(suiviService.getSuivisActifs(agronomeId));
    }

    /**
     * GET /api/agronomes/{agronomeId}/suivi/en-attente
     * Demandes en attente de réponse.
     */
    @GetMapping("/api/agronomes/{agronomeId}/suivi/en-attente")
    public ResponseEntity<List<SuiviReponseDTO>> getDemandesEnAttente(
        @PathVariable Long agronomeId
    ) {
        return ResponseEntity.ok(suiviService.getDemandesEnAttente(agronomeId));
    }
}
