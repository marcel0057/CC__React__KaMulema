package cm.agroplatform.agronomes.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configuration du pool de threads pour les tâches @Async.
 *
 * Tâches asynchrones dans ce module :
 * - Mise à jour position GPS (toutes les 30s)
 * - Recalcul note moyenne après évaluation
 * - Marquage des messages comme lus
 * - Notification agriculteur après acceptation/refus de suivi
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "agroTaskExecutor")
    public Executor agroTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // Threads toujours actifs (tâches légères et fréquentes)
        executor.setCorePoolSize(4);

        // Maximum en cas de pic (ex: beaucoup d'agronomes actifs simultanément)
        executor.setMaxPoolSize(10);

        // File d'attente si tous les threads sont occupés
        executor.setQueueCapacity(50);

        // Préfixe visible dans les logs pour identifier les threads async
        executor.setThreadNamePrefix("agro-async-");

        // Attendre la fin des tâches en cours avant l'arrêt de l'application
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);

        executor.initialize();
        return executor;
    }
}
