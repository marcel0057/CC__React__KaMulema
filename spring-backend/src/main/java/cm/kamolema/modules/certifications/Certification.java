package cm.kamolema.modules.certifications;

import java.util.List;

public record Certification(
        String id,
        String farmer,
        String product,
        String region,
        String status,
        String level,
        int score,
        List<String> criteria
) {
}
