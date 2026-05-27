package cm.agroplatform.agronomes.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Message échangé entre un agriculteur et un agronome.
 * Stocké en base pour l'historique de conversation.
 */
@Entity
@Table(name = "messages", indexes = {
    @Index(name = "idx_messages_conversation", columnList = "agriculteur_id, agronome_id"),
    @Index(name = "idx_messages_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID de l'agriculteur (référence inter-module vers le module Auth de Joumessi).
     */
    @Column(name = "agriculteur_id", nullable = false)
    private Long agriculteurId;

    /**
     * L'agronome destinataire ou expéditeur.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agronome_id", nullable = false)
    private Agronome agronome;

    /**
     * Qui a envoyé ce message.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Expediteur expediteur;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    /**
     * true = message lu par le destinataire.
     */
    @Builder.Default
    @Column(nullable = false)
    private Boolean lu = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum Expediteur {
        AGRICULTEUR,
        AGRONOME
    }
}
