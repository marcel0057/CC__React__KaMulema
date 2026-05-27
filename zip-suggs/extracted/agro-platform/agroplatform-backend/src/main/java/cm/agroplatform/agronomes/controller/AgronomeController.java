package cm.agroplatform.agronomes.controller;

import cm.agroplatform.agronomes.entity.Agronome;
import cm.agroplatform.agronomes.repository.AgronomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agronomes")
@RequiredArgsConstructor
public class AgronomeController {

    private final AgronomeRepository agronomeRepository;

    @GetMapping
    public ResponseEntity<List<Agronome>> getAll(
        @RequestParam(required = false) Boolean disponible,
        @RequestParam(required = false) String specialite,
        @RequestParam(required = false) Integer experienceMin
    ) {
        List<Agronome> agronomes = agronomeRepository.findAllDisponiblesTriesParNote();

        if (disponible != null && disponible) {
            agronomes = agronomes.stream()
                .filter(Agronome::getDisponible)
                .toList();
        }
        if (specialite != null && !specialite.isBlank()) {
            agronomes = agronomes.stream()
                .filter(a -> a.getSpecialite().toLowerCase().contains(specialite.toLowerCase()))
                .toList();
        }
        if (experienceMin != null) {
            agronomes = agronomes.stream()
                .filter(a -> a.getAnneesExperience() >= experienceMin)
                .toList();
        }
        return ResponseEntity.ok(agronomes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Agronome> getById(@PathVariable Long id) {
        return agronomeRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}