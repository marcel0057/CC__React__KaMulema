package cm.agroplatform.agronomes.service;

import cm.agroplatform.agronomes.dto.slot.SlotCreationDTO;
import cm.agroplatform.agronomes.dto.slot.SlotReponseDTO;
import cm.agroplatform.agronomes.entity.Agronome;
import cm.agroplatform.agronomes.entity.DisponibiliteSlot;
import cm.agroplatform.agronomes.entity.DisponibiliteSlot.StatutSlot;
import cm.agroplatform.agronomes.repository.AgronomeRepository;
import cm.agroplatform.agronomes.repository.DisponibiliteSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisponibiliteService {

    private final DisponibiliteSlotRepository slotRepository;
    private final AgronomeRepository agronomeRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ===== Créneaux =====

    /**
     * L'agronome crée un nouveau créneau de disponibilité.
     */
    @Transactional
    public SlotReponseDTO creerCreneau(SlotCreationDTO dto) {
        Agronome agronome = agronomeRepository.findById(dto.getAgronomeId())
            .orElseThrow(() -> new IllegalArgumentException("Agronome introuvable"));

        if (!dto.getDateFin().isAfter(dto.getDateDebut())) {
            throw new IllegalArgumentException("La date de fin doit être après la date de début");
        }

        DisponibiliteSlot slot = DisponibiliteSlot.builder()
            .agronome(agronome)
            .dateDebut(dto.getDateDebut())
            .dateFin(dto.getDateFin())
            .statut(StatutSlot.LIBRE)
            .build();

        SlotReponseDTO reponse = SlotReponseDTO.from(slotRepository.save(slot));

        // Notifie les clients abonnés au calendrier de cet agronome
        diffuserMiseAJourSlot(agronome.getId(), reponse);
        return reponse;
    }

    /**
     * Créneaux libres futurs d'un agronome (pour le calendrier).
     */
    @Transactional(readOnly = true)
    public List<SlotReponseDTO> getCreneauxLibres(Long agronomeId) {
        return slotRepository.findCreneauxLibresFuturs(agronomeId, LocalDateTime.now())
            .stream()
            .map(SlotReponseDTO::from)
            .toList();
    }

    /**
     * Tous les créneaux d'un agronome (pour son tableau de bord).
     */
    @Transactional(readOnly = true)
    public List<SlotReponseDTO> getTousCreneaux(Long agronomeId) {
        return slotRepository.findByAgronomeId(agronomeId)
            .stream()
            .map(SlotReponseDTO::from)
            .toList();
    }

    // ===== Réservations =====

    /**
     * L'agriculteur réserve un créneau libre.
     */
    @Transactional
    public SlotReponseDTO reserverCreneau(Long slotId, Long agriculteurId, String notes) {
        DisponibiliteSlot slot = slotRepository.findById(slotId)
            .orElseThrow(() -> new IllegalArgumentException("Créneau introuvable"));

        if (slot.getStatut() != StatutSlot.LIBRE) {
            throw new IllegalStateException("Ce créneau n'est plus disponible (statut: " + slot.getStatut() + ")");
        }
        if (slot.getDateDebut().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Ce créneau est passé");
        }

        slot.setAgriculteurId(agriculteurId);
        slot.setNotesAgriculteur(notes);
        slot.setStatut(StatutSlot.RESERVE);

        SlotReponseDTO reponse = SlotReponseDTO.from(slotRepository.save(slot));

        // Notifie l'agronome en temps réel
        diffuserMiseAJourSlot(slot.getAgronome().getId(), reponse);

        // Notifie aussi l'agriculteur
        messagingTemplate.convertAndSend(
            "/topic/reservations." + agriculteurId, reponse);

        log.info("Créneau {} réservé par l'agriculteur {}", slotId, agriculteurId);
        return reponse;
    }

    /**
     * L'agronome confirme ou refuse une réservation.
     */
    @Transactional
    public SlotReponseDTO repondreReservation(Long slotId, StatutSlot statut, String notesAgronome) {
        if (statut != StatutSlot.CONFIRME && statut != StatutSlot.REFUSE) {
            throw new IllegalArgumentException("Statut invalide : doit être CONFIRME ou REFUSE");
        }

        DisponibiliteSlot slot = slotRepository.findById(slotId)
            .orElseThrow(() -> new IllegalArgumentException("Créneau introuvable"));

        if (slot.getStatut() != StatutSlot.RESERVE) {
            throw new IllegalStateException("Ce créneau n'est pas en attente de confirmation");
        }

        slot.setStatut(statut);
        slot.setNotesAgronome(notesAgronome);

        SlotReponseDTO reponse = SlotReponseDTO.from(slotRepository.save(slot));

        // Notifie les deux parties en temps réel
        diffuserMiseAJourSlot(slot.getAgronome().getId(), reponse);
        if (slot.getAgriculteurId() != null) {
            messagingTemplate.convertAndSend(
                "/topic/reservations." + slot.getAgriculteurId(), reponse);
        }

        log.info("Créneau {} → {}", slotId, statut);
        return reponse;
    }

    /**
     * Réservations d'un agriculteur (son agenda).
     */
    @Transactional(readOnly = true)
    public List<SlotReponseDTO> getReservationsAgriculteur(Long agriculteurId) {
        return slotRepository.findReservationsAgriculteur(agriculteurId)
            .stream()
            .map(SlotReponseDTO::from)
            .toList();
    }

    // ===== Utilitaire =====

    private void diffuserMiseAJourSlot(Long agronomeId, SlotReponseDTO reponse) {
        messagingTemplate.convertAndSend("/topic/slots." + agronomeId, reponse);
    }
}
