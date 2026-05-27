package cm.agroplatform.agronomes.service;

import cm.agroplatform.agronomes.dto.evaluation.EvaluationReponseDTO;
import cm.agroplatform.agronomes.dto.evaluation.EvaluationRequeteDTO;
import cm.agroplatform.agronomes.entity.Agronome;
import cm.agroplatform.agronomes.entity.EvaluationAgronome;
import cm.agroplatform.agronomes.repository.AgronomeRepository;
import cm.agroplatform.agronomes.repository.DisponibiliteSlotRepository;
import cm.agroplatform.agronomes.repository.EvaluationAgronomeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvaluationService {

    private final EvaluationAgronomeRepository evaluationRepository;
    private final AgronomeRepository agronomeRepository;
    private final DisponibiliteSlotRepository slotRepository;

    /**
     * Soumet une évaluation après vérification que :
     * 1. L'agronome existe
     * 2. L'agriculteur a eu au moins un RDV CONFIRME avec cet agronome
     * 3. L'agriculteur n'a pas déjà évalué ce slot précis
     */
    @Transactional
    public EvaluationReponseDTO soumettre(EvaluationRequeteDTO dto) {

        // 1. Vérifier que l'agronome existe
        Agronome agronome = agronomeRepository.findById(dto.getAgronomeId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Agronome introuvable : " + dto.getAgronomeId()
            ));

        // 2. Vérifier que l'agriculteur a eu un RDV confirmé
        boolean rdvConfirme = slotRepository.agriculteurAEuRdvConfirme(
            dto.getAgronomeId(), dto.getAgriculteurId()
        );
        if (!rdvConfirme) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Vous ne pouvez évaluer un agronome qu'après un rendez-vous confirmé."
            );
        }

        // 3. Vérifier qu'il n'a pas déjà évalué ce slot
        boolean dejaEvalue = evaluationRepository.existsByAgronomeIdAndAgriculteurIdAndSlotId(
            dto.getAgronomeId(), dto.getAgriculteurId(), dto.getSlotId()
        );
        if (dejaEvalue) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Vous avez déjà évalué ce rendez-vous."
            );
        }

        // 4. Enregistrer l'évaluation
        EvaluationAgronome evaluation = EvaluationAgronome.builder()
            .agronome(agronome)
            .agriculteurId(dto.getAgriculteurId())
            .slotId(dto.getSlotId())
            .note(dto.getNote())
            .commentaire(dto.getCommentaire())
            .build();

        evaluationRepository.save(evaluation);

        log.info("✅ Évaluation soumise — agronome {} noté {} par agriculteur {}",
            dto.getAgronomeId(), dto.getNote(), dto.getAgriculteurId());

        // 5. Recalcul de la note moyenne en arrière-plan
        recalculerNoteMoyenneAsync(agronome.getId(), dto.getNote());

        return EvaluationReponseDTO.from(evaluation);
    }

    /**
     * Retourne toutes les évaluations publiques d'un agronome, triées par date décroissante.
     */
    @Transactional(readOnly = true)
    public List<EvaluationReponseDTO> getEvaluations(Long agronomeId) {
        if (!agronomeRepository.existsById(agronomeId)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Agronome introuvable : " + agronomeId
            );
        }
        return evaluationRepository
            .findByAgronomeIdOrderByCreatedAtDesc(agronomeId)
            .stream()
            .map(EvaluationReponseDTO::from)
            .toList();
    }

    /**
     * @Async — recalcul de la note moyenne en arrière-plan.
     * Ne bloque pas la réponse HTTP après soumission de l'évaluation.
     */
    @Async("agroTaskExecutor")
    @org.springframework.transaction.annotation.Transactional
    public void recalculerNoteMoyenneAsync(Long agronomeId, int nouvelleNote) {
        agronomeRepository.findById(agronomeId).ifPresent(agronome -> {
            agronome.ajouterEvaluation(nouvelleNote);
            agronomeRepository.save(agronome);
            log.debug("⭐ [async] Note moyenne recalculée — agronome {} → {}",
                agronomeId, agronome.getNoteMoyenne());
        });
    }

    /**
     * Vérifie si un agriculteur peut évaluer un agronome donné
     * (utilisé par le frontend pour afficher ou masquer le formulaire).
     */
    @Transactional(readOnly = true)
    public boolean peutEvaluer(Long agronomeId, Long agriculteurId, Long slotId) {
        boolean rdvConfirme = slotRepository.agriculteurAEuRdvConfirme(agronomeId, agriculteurId);
        boolean dejaEvalue = evaluationRepository.existsByAgronomeIdAndAgriculteurIdAndSlotId(
            agronomeId, agriculteurId, slotId
        );
        return rdvConfirme && !dejaEvalue;
    }
}
