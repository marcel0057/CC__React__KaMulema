package cm.agroplatform.agronomes.init;

import cm.agroplatform.agronomes.entity.Agronome;
import cm.agroplatform.agronomes.entity.DisponibiliteSlot;
import cm.agroplatform.agronomes.entity.DisponibiliteSlot.StatutSlot;
import cm.agroplatform.agronomes.repository.AgronomeRepository;
import cm.agroplatform.agronomes.repository.DisponibiliteSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final AgronomeRepository agronomeRepository;
    private final DisponibiliteSlotRepository slotRepository;

    @Override
    public void run(String... args) {
        if (agronomeRepository.count() > 0) {
            log.info("Données déjà présentes — initialisation ignorée.");
            return;
        }

        log.info("Initialisation des données de test AgroPlatform...");

        List<Agronome> agronomes = List.of(
            Agronome.builder()
                .nom("MBARGA").prenom("Jean-Pierre")
                .email("jp.mbarga@agroplatform.cm")
                .telephone("+237 699 123 456")
                .specialite("Phytopathologie")
                .anneesExperience(12)
                .ville("Yaoundé").departement("Mfoundi").region("Centre")
                .latitude(3.8480).longitude(11.5021)
                .bio("Expert en diagnostic et traitement des maladies fongiques et bactériennes du cacao et du café. 12 ans d'expérience terrain dans la région Centre.")
                .disponible(true).noteMoyenne(4.8).nombreEvaluations(23)
                .build(),

            Agronome.builder()
                .nom("NGONO").prenom("Marie-Claire")
                .email("mc.ngono@agroplatform.cm")
                .telephone("+237 677 234 567")
                .specialite("Sol & Fertilisation")
                .anneesExperience(8)
                .ville("Douala").departement("Wouri").region("Littoral")
                .latitude(4.0511).longitude(9.7679)
                .bio("Spécialiste de l'analyse des sols tropicaux et de la gestion de la fertilité. Travaille principalement avec les maraîchers de la région Littoral.")
                .disponible(true).noteMoyenne(4.5).nombreEvaluations(17)
                .build(),

            Agronome.builder()
                .nom("FOMETHE").prenom("Aristide")
                .email("a.fomethe@agroplatform.cm")
                .telephone("+237 655 345 678")
                .specialite("Agronomie générale")
                .anneesExperience(15)
                .ville("Bafoussam").departement("Mifi").region("Ouest")
                .latitude(5.4764).longitude(10.4176)
                .bio("Agronome généraliste avec une expertise particulière sur les cultures vivrières de la région Ouest : maïs, haricot, pomme de terre.")
                .disponible(true).noteMoyenne(4.9).nombreEvaluations(31)
                .build(),

            Agronome.builder()
                .nom("BELLO").prenom("Fadimatou")
                .email("f.bello@agroplatform.cm")
                .telephone("+237 690 456 789")
                .specialite("Élevage & Zootechnie")
                .anneesExperience(6)
                .ville("Garoua").departement("Bénoué").region("Nord")
                .latitude(9.3017).longitude(13.3922)
                .bio("Spécialiste de l'élevage bovin et ovin dans les zones semi-arides du Nord Cameroun. Accompagnement en santé animale et nutrition.")
                .disponible(true).noteMoyenne(4.3).nombreEvaluations(9)
                .build(),

            Agronome.builder()
                .nom("ONDO").prenom("Serge Hilaire")
                .email("sh.ondo@agroplatform.cm")
                .telephone("+237 670 567 890")
                .specialite("Cultures d'exportation")
                .anneesExperience(10)
                .ville("Kribi").departement("Océan").region("Sud")
                .latitude(2.9391).longitude(9.9094)
                .bio("Expert en cacao, café et hévéa. Accompagne les producteurs dans la certification internationale (UTZ, Rainforest Alliance) et l'amélioration de la qualité.")
                .disponible(false).noteMoyenne(4.7).nombreEvaluations(14)
                .build(),

            Agronome.builder()
                .nom("TCHINDA").prenom("Rosine")
                .email("r.tchinda@agroplatform.cm")
                .telephone("+237 698 678 901")
                .specialite("Agriculture biologique")
                .anneesExperience(5)
                .ville("Dschang").departement("Menoua").region("Ouest")
                .latitude(5.4437).longitude(10.0567)
                .bio("Pionnière de l'agroécologie dans l'Ouest Cameroun. Accompagne les agriculteurs dans la transition vers des pratiques biologiques certifiées.")
                .disponible(true).noteMoyenne(4.6).nombreEvaluations(11)
                .build(),

            Agronome.builder()
                .nom("ATANGANA").prenom("Bruno")
                .email("b.atangana@agroplatform.cm")
                .telephone("+237 656 789 012")
                .specialite("Irrigation & Hydraulique agricole")
                .anneesExperience(9)
                .ville("Yaoundé").departement("Mfoundi").region("Centre")
                .latitude(3.8667).longitude(11.5167)
                .bio("Ingénieur hydraulicien spécialisé dans les systèmes d'irrigation goutte-à-goutte adaptés aux petits exploitants. Projets dans les régions Centre et Sud.")
                .disponible(true).noteMoyenne(4.4).nombreEvaluations(8)
                .build(),

            Agronome.builder()
                .nom("HAMIDOU").prenom("Oumarou")
                .email("o.hamidou@agroplatform.cm")
                .telephone("+237 677 890 123")
                .specialite("Cultures céréalières")
                .anneesExperience(18)
                .ville("Ngaoundéré").departement("Vina").region("Adamaoua")
                .latitude(7.3167).longitude(13.5833)
                .bio("Vétéran de l'agriculture céréalière dans l'Adamaoua. Expert en mil, sorgho et riz pluvial. Conseille plus de 200 agriculteurs dans sa région.")
                .disponible(true).noteMoyenne(4.9).nombreEvaluations(42)
                .build(),

            Agronome.builder()
                .nom("EKANGA").prenom("Patricia")
                .email("p.ekanga@agroplatform.cm")
                .telephone("+237 691 901 234")
                .specialite("Maraîchage")
                .anneesExperience(7)
                .ville("Douala").departement("Wouri").region("Littoral")
                .latitude(4.0612).longitude(9.7741)
                .bio("Spécialiste du maraîchage urbain et péri-urbain. Accompagne les producteurs de légumes de la région Littoral dans l'amélioration de leurs rendements.")
                .disponible(true).noteMoyenne(4.2).nombreEvaluations(13)
                .build(),

            Agronome.builder()
                .nom("MVONDO").prenom("Didier")
                .email("d.mvondo@agroplatform.cm")
                .telephone("+237 675 012 345")
                .specialite("Agroforesterie")
                .anneesExperience(11)
                .ville("Bertoua").departement("Lom-et-Djérem").region("Est")
                .latitude(4.5833).longitude(13.6833)
                .bio("Expert en systèmes agroforestiers dans la région Est. Spécialiste de l'intégration arbres-cultures pour améliorer la biodiversité et les revenus des agriculteurs.")
                .disponible(true).noteMoyenne(4.6).nombreEvaluations(19)
                .build()
        );

        List<Agronome> savedAgronomes = agronomeRepository.saveAll(agronomes);
        log.info("✅ {} agronomes créés.", savedAgronomes.size());

        // Crée des créneaux de disponibilité pour la semaine à venir
        LocalDateTime debut = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS).plusDays(1);

        for (Agronome agronome : savedAgronomes) {
            if (!agronome.getDisponible()) continue;

            for (int jour = 0; jour < 5; jour++) {
                LocalDateTime base = debut.plusDays(jour);

                slotRepository.save(DisponibiliteSlot.builder()
                    .agronome(agronome)
                    .dateDebut(base.withHour(8).withMinute(0))
                    .dateFin(base.withHour(9).withMinute(0))
                    .statut(StatutSlot.LIBRE)
                    .build());

                slotRepository.save(DisponibiliteSlot.builder()
                    .agronome(agronome)
                    .dateDebut(base.withHour(14).withMinute(0))
                    .dateFin(base.withHour(15).withMinute(0))
                    .statut(StatutSlot.LIBRE)
                    .build());
            }
        }

        log.info("✅ Créneaux de disponibilité générés pour la semaine.");
        log.info("🌱 Initialisation AgroPlatform terminée. Bonne session Marcel !");
    }
}
