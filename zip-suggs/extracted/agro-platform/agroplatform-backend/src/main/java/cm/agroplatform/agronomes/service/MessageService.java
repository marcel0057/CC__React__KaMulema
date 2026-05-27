package cm.agroplatform.agronomes.service;

import cm.agroplatform.agronomes.dto.message.MessageEnvoiDTO;
import cm.agroplatform.agronomes.dto.message.MessageReponseDTO;
import cm.agroplatform.agronomes.entity.Agronome;
import cm.agroplatform.agronomes.entity.Message;
import cm.agroplatform.agronomes.repository.AgronomeRepository;
import cm.agroplatform.agronomes.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final AgronomeRepository agronomeRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Envoie un message et le diffuse en temps réel via WebSocket.
     */
    @Transactional
    public MessageReponseDTO envoyerMessage(MessageEnvoiDTO dto) {
        Agronome agronome = agronomeRepository.findById(dto.getAgronomeId())
            .orElseThrow(() -> new IllegalArgumentException("Agronome introuvable : " + dto.getAgronomeId()));

        Message message = Message.builder()
            .agriculteurId(dto.getAgriculteurId())
            .agronome(agronome)
            .expediteur(dto.getExpediteur())
            .contenu(dto.getContenu())
            .lu(false)
            .build();

        Message saved = messageRepository.save(message);
        MessageReponseDTO reponse = MessageReponseDTO.from(saved);

        // Diffuse le message sur le topic de la conversation
        // Le frontend s'abonne à /topic/conversation.{agronomeId}.{agriculteurId}
        String topic = String.format("/topic/conversation.%d.%d",
            dto.getAgronomeId(), dto.getAgriculteurId());

        messagingTemplate.convertAndSend(topic, reponse);
        log.debug("Message envoyé sur {}", topic);

        return reponse;
    }

    /**
     * Historique complet d'une conversation.
     */
    @Transactional(readOnly = true)
    public List<MessageReponseDTO> getConversation(Long agriculteurId, Long agronomeId) {
        return messageRepository.findConversation(agriculteurId, agronomeId)
            .stream()
            .map(MessageReponseDTO::from)
            .toList();
    }

    /**
     * Derniers N messages (pour charger rapidement au premier affichage).
     */
    @Transactional(readOnly = true)
    public List<MessageReponseDTO> getDerniersMessages(Long agriculteurId, Long agronomeId, int n) {
        return messageRepository.findDerniersMessages(
            agriculteurId, agronomeId, PageRequest.of(0, n))
            .stream()
            .map(MessageReponseDTO::from)
            .toList();
    }

    /**
     * Marque tous les messages d'une conversation comme lus.
     */
    @Transactional
    @Async("agroTaskExecutor")
    public int marquerConversationLue(Long agriculteurId, Long agronomeId) {
        int updated = messageRepository.marquerTousLus(agriculteurId, agronomeId);
        log.debug("{} messages marqués comme lus pour la conversation {}/{}", updated, agriculteurId, agronomeId);
        return updated;
    }

    /**
     * Nombre de messages non lus pour un agriculteur.
     */
    @Transactional(readOnly = true)
    public long getNonLusAgriculteur(Long agriculteurId) {
        return messageRepository.countNonLusAgriculteur(agriculteurId);
    }
}
