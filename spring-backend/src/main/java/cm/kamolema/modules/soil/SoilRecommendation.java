package cm.kamolema.modules.soil;

public record SoilRecommendation(
        String crop,
        int confidence,
        String reason,
        String season
) {
}
