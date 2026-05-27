package cm.agroplatform.agronomes.controller;

import cm.agroplatform.agronomes.dto.message.MessageEnvoiDTO;
import cm.agroplatform.agronomes.dto.message.MessageReponseDTO;
import cm.agroplatform.agronomes.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Gère la messagerie :
 *  - WebSocket STOMP : envoi en temps réel (/app/message.envoyer)
 *  - REST : historique, marquage lu
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final MessageService messageService;

    // ===== WebSocket =====

    /**
     * Le client envoie un message via STOMP sur /app/message.envoyer.
     * Le message est sauvegardé et rediffusé sur /topic/conversation.{agronomeId}.{agriculteurId}.
     */
    @MessageMapping("/message.envoyer")
    public void envoyerMessage(@Payload @Valid MessageEnvoiDTO dto) {
        log.debug("WS message reçu : agronome={} agriculteur={}", dto.getAgronomeId(), dto.getAgriculteurId());
        messageService.envoyerMessage(dto);
    }

    // ===== REST =====

    /**
     * GET /api/messages/conversation?agriculteurId=X&agronomeId=Y
     * Historique complet d'une conversation.
     */
    @GetMapping("/api/messages/conversation")
    @ResponseBody
    public ResponseEntity<List<MessageReponseDTO>> getConversation(
        @RequestParam Long agriculteurId,
        @RequestParam Long agronomeId
    ) {
        return ResponseEntity.ok(messageService.getConversation(agriculteurId, agronomeId));
    }

    /**
     * PATCH /api/messages/lus?agriculteurId=X&agronomeId=Y
     * Marque tous les messages d'une conversation comme lus.
     */
    @PatchMapping("/api/messages/lus")
    @ResponseBody
    public ResponseEntity<Map<String, Integer>> marquerLus(
        @RequestParam Long agriculteurId,
        @RequestParam Long agronomeId
    ) {
        int updated = messageService.marquerConversationLue(agriculteurId, agronomeId);
        return ResponseEntity.ok(Map.of("marquesLus", updated));
    }

    /**
     * GET /api/messages/non-lus?agriculteurId=X
     * Nombre de messages non lus pour un agriculteur.
     */
    @GetMapping("/api/messages/non-lus")
    @ResponseBody
    public ResponseEntity<Map<String, Long>> getNonLus(@RequestParam Long agriculteurId) {
        return ResponseEntity.ok(Map.of("nonLus", messageService.getNonLusAgriculteur(agriculteurId)));
    }
}
