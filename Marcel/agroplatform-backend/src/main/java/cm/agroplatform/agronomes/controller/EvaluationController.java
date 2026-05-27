package cm.agroplatform.agronomes.controller;

import cm.agroplatform.agronomes.dto.evaluation.EvaluationReponseDTO;
import cm.agroplatform.agronomes.dto.evaluation.EvaluationRequeteDTO;
import cm.agroplatform.agronomes.service.EvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    /**
     * POST /api/evaluations
     * Soumettre une évaluation après un RDV confirmé.
     */
    @PostMapping("/api/evaluations")
    public ResponseEntity<EvaluationReponseDTO> soumettre(
        @Valid @RequestBody EvaluationRequeteDTO dto
    ) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(evaluationService.soumettre(dto));
    }

    /**
     * GET /api/agronomes/{agronomeId}/evaluations
     * Évaluations publiques d'un agronome.
     */
    @GetMapping("/api/agronomes/{agronomeId}/evaluations")
    public ResponseEntity<List<EvaluationReponseDTO>> getEvaluations(
        @PathVariable Long agronomeId
    ) {
        return ResponseEntity.ok(evaluationService.getEvaluations(agronomeId));
    }

    /**
     * GET /api/evaluations/peut-evaluer
     * Vérifie si un agriculteur peut évaluer un agronome pour un slot donné.
     * Utilisé par le frontend pour afficher ou masquer le formulaire.
     */
    @GetMapping("/api/evaluations/peut-evaluer")
    public ResponseEntity<Map<String, Boolean>> peutEvaluer(
        @RequestParam Long agronomeId,
        @RequestParam Long agriculteurId,
        @RequestParam Long slotId
    ) {
        boolean peut = evaluationService.peutEvaluer(agronomeId, agriculteurId, slotId);
        return ResponseEntity.ok(Map.of("peutEvaluer", peut));
    }
}
