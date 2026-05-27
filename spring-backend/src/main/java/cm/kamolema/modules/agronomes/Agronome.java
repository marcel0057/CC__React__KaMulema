package cm.kamolema.modules.agronomes;

import java.util.List;

public record Agronome(
        String id,
        String name,
        String specialty,
        String city,
        String region,
        List<String> zones,
        int experience,
        String availability,
        List<String> modes,
        String email,
        String phone,
        double rating,
        int reviews
) {
}
