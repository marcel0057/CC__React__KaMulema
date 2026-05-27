package cm.agroplatform.agronomes.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * Configuration WebSocket STOMP.
 *
 * Canaux utilisés :
 *  - /topic/conversation.{agronomeId}.{agriculteurId}  → messages en temps réel
 *  - /topic/slots.{agronomeId}                         → mises à jour des créneaux
 *  - /topic/notifications.{userId}                     → notifications générales
 *
 * Le client React se connecte sur /ws et s'abonne aux topics ci-dessus.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.websocket.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String[] allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
            .addEndpoint("/ws")
            .setAllowedOrigins(allowedOrigins)
            .withSockJS();   // fallback pour les navigateurs sans WebSocket natif
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Préfixe pour les messages envoyés par le client vers le serveur
        registry.setApplicationDestinationPrefixes("/app");

        // Broker en mémoire pour les topics de diffusion
        // En production : remplacer par un broker externe Redis/RabbitMQ
        registry.enableSimpleBroker("/topic", "/queue");

        // Préfixe pour les messages privés (point à point)
        registry.setUserDestinationPrefix("/user");
    }
}
