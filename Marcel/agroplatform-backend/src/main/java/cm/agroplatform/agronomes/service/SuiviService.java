package cm.agroplatform.agronomes.service;

import cm.agroplatform.agronomes.config.AppProperties;
import cm.agroplatform.agronomes.dto.position.PositionUpdateDTO;
import cm.agroplatform.agronomes.dto.suivi.SuiviRequeteDTO;
import cm.agroplatform.agronomes.dto.suivi.SuiviReponseDTO;
import cm.agroplatform.agronomes.entity.Agronome;
import cm.agroplatform.agronomes.entity.SuiviAgriculteur;
import cm.agroplatform.agronomes.entity.SuiviAgriculteur.StatutSuivi;
import cm.agroplatform.agronomes.repository.AgronomeRepository;
import cm.agroplatform.agronomes.repository.SuiviAgriculteurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SuiviService {

    private final SuiviAgriculteurRepository suiviRepository;
    private final AgronomeRepository agronomeRepository;
    private final AppProperties appProperties;

    // ===== Position GPS temps réel =====

    /**
     * @Async — ne bloque pas le thread HTTP.
     * Appelé toutes les 30s par le frontend ; la réponse 204 est
     * renvoyée immédiatement pendant que la mise à jour se fait en arrière-plan.
     */
    @Async("agroTaskExecutor")
    @Transactional
    public void mettreAJourPosition(Long agronomeId, PositionUpdateDTO dto) {
        agronomeRepository.findById(agronomeId).ifPresent(agronome -> {
            agronome.setLatitude(dto.getLatitude());
            agronome.setLongitude(dto.getLongitude());
            agronome.setPositionUpdatedAt(LocalDateTime.now());
            agronomeRepository.save(agronome);
            log.debug("📍 [async] Position agronome {} → {}, {}",
                agronomeId, dto.getLatitude(), dto.getLongitude());
        });
    }

    // ===== Suivi des agriculteurs =====

    /**
     * Un agriculteur envoie une demande de suivi à un agronome.
     */
    @Transactional
    public SuiviReponseDTO demanderSuivi(SuiviRequeteDTO dto) {
        Agronome agronome = agronomeRepository.findById(dto.getAgronomeId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Agronome introuvable."
            ));

        suiviRepository.findByAgronomeIdAndAgriculteurId(dto.getAgronomeId(), dto.getAgriculteurId())
            .ifPresent(s -> {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Une demande existe déjà (statut : " + s.getStatut() + ")."
                );
            });

        SuiviAgriculteur suivi = SuiviAgriculteur.builder()
            .agronome(agronome)
            .agriculteurId(dto.getAgriculteurId())
            .agriculteurNom(dto.getAgriculteurNom())
            .cultures(dto.getCultures())
            .localisation(dto.getLocalisation())
            .statut(StatutSuivi.EN_ATTENTE)
            .build();

        suiviRepository.save(suivi);
        log.info("📩 Demande de suivi — agriculteur {} → agronome {}",
            dto.getAgriculteurId(), dto.getAgronomeId());

        // Notification asynchrone à l'agronome
        notifierAgronomeNouvelledemande(agronome.getId(), suivi.getAgriculteurNom());

        return SuiviReponseDTO.from(suivi);
    }

    /**
     * @Async — notifie l'agronome d'une nouvelle demande sans bloquer la réponse HTTP.
     * Prêt à brancher sur un système email/push quand le module Auth de Joumessi sera prêt.
     */
    @Async("agroTaskExecutor")
    public void notifierAgronomeNouvelledemande(Long agronomeId, String agriculteurNom) {
        log.info("🔔 [async] Notification — nouvelle demande de suivi de {} pour l'agronome {}",
            agriculteurNom, agronomeId);
        // TODO: brancher sur le service de notifications (email/push) de Joumessi
    }

    /**
     * L'agronome accepte ou refuse une demande de suivi.
     */
    @Transactional
    public SuiviReponseDTO repondreDemandesuivi(Long suiviId, StatutSuivi nouveauStatut) {
        SuiviAgriculteur suivi = suiviRepository.findById(suiviId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Demande introuvable."
            ));

        if (suivi.getStatut() != StatutSuivi.EN_ATTENTE) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Cette demande a déjà été traitée."
            );
        }

        if (nouveauStatut == StatutSuivi.ACCEPTE) {
            int max = appProperties.getSuivi().getMaxAgriculteurs();
            long actifs = suiviRepository.countSuivisActifs(suivi.getAgronome().getId());
            if (actifs >= max) {
                throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Limite atteinte : " + max + " agriculteurs max. Retirez-en un d'abord."
                );
            }
        }

        suivi.setStatut(nouveauStatut);
        suiviRepository.save(suivi);

        // Notification asynchrone à l'agriculteur
        notifierAgriculteurReponse(suivi.getAgriculteurId(), nouveauStatut);

        log.info("✅ Suivi {} — agriculteur {} / agronome {}",
            nouveauStatut, suivi.getAgriculteurId(), suivi.getAgronome().getId());
        return SuiviReponseDTO.from(suivi);
    }

    /**
     * @Async — notifie l'agriculteur de la réponse (accepté/refusé) sans bloquer.
     */
    @Async("agroTaskExecutor")
    public void notifierAgriculteurReponse(Long agriculteurId, StatutSuivi statut) {
        log.info("🔔 [async] Notification — agriculteur {} : demande de suivi {}",
            agriculteurId, statut);
        // TODO: brancher sur le service de notifications de Joumessi
    }

    /**
     * L'agronome retire un agriculteur de son suivi.
     */
    @Transactional
    public void retirerSuivi(Long suiviId) {
        SuiviAgriculteur suivi = suiviRepository.findById(suiviId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Suivi introuvable."
            ));
        suiviRepository.delete(suivi);
        log.info("🗑️ Suivi retiré — agriculteur {} / agronome {}",
            suivi.getAgriculteurId(), suivi.getAgronome().getId());
    }

    /**
     * L'agronome met à jour le diagnostic d'un agriculteur suivi.
     * @Async — écriture non critique, ne bloque pas l'UI.
     */
    @Async("agroTaskExecutor")
    @Transactional
    public void mettreAJourDiagnosticAsync(Long suiviId, String diagnostic) {
        suiviRepository.findById(suiviId).ifPresent(suivi -> {
            suivi.setDernierDiagnostic(diagnostic);
            suiviRepository.save(suivi);
            log.debug("📝 [async] Diagnostic mis à jour — suivi {}", suiviId);
        });
    }

    /** Version synchrone pour le retour immédiat au frontend */
    @Transactional
    public SuiviReponseDTO mettreAJourDiagnostic(Long suiviId, String diagnostic) {
        SuiviAgriculteur suivi = suiviRepository.findById(suiviId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Suivi introuvable."
            ));
        suivi.setDernierDiagnostic(diagnostic);
        return SuiviReponseDTO.from(suiviRepository.save(suivi));
    }

    @Transactional(readOnly = true)
    public List<SuiviReponseDTO> getSuivisActifs(Long agronomeId) {
        return suiviRepository.findByAgronomeIdAndStatut(agronomeId, StatutSuivi.ACCEPTE)
            .stream().map(SuiviReponseDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<SuiviReponseDTO> getDemandesEnAttente(Long agronomeId) {
        return suiviRepository.findDemandesEnAttente(agronomeId)
            .stream().map(SuiviReponseDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTableauBord(Long agronomeId) {
        int max = appProperties.getSuivi().getMaxAgriculteurs();
        long actifs = suiviRepository.countSuivisActifs(agronomeId);
        return Map.of(
            "suivisActifs",       getSuivisActifs(agronomeId),
            "demandesEnAttente",  getDemandesEnAttente(agronomeId),
            "nombreActifs",       actifs,
            "nombreMax",          max,
            "placesDisponibles",  max - actifs
        );
    }
}
