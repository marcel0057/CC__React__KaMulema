package cm.kamolema.modules.diagnosis;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/plant-diagnosis")
public class DiagnosisController {
    private final PlantIdService plantIdService;

    public DiagnosisController(PlantIdService plantIdService) {
        this.plantIdService = plantIdService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyze(
            @RequestPart("plantPhotos") MultipartFile[] plantPhotos,
            @RequestParam Map<String, String> fields
    ) {
        return ResponseEntity.ok(plantIdService.analyze(plantPhotos, fields));
    }
}
