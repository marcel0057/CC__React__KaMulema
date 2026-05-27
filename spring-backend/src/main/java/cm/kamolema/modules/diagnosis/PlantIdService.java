package cm.kamolema.modules.diagnosis;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class PlantIdService {
    private static final String DETAILS = "local_name,description,url,treatment,classification,common_names,cause";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${plant.id.api-key:}")
    private String plantIdApiKey;

    @Value("${plant.id.url}")
    private String plantIdUrl;

    public PlantIdService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> analyze(MultipartFile[] plantPhotos, Map<String, String> fields) {
        if (plantIdApiKey == null || plantIdApiKey.isBlank()) {
            throw new IllegalStateException("La cle Plant.id est absente.");
        }
        if (plantPhotos == null || plantPhotos.length == 0) {
            throw new IllegalArgumentException("Ajoutez au moins une photo de plante valide.");
        }

        try {
            String boundary = "----KaMolemaBoundary" + System.currentTimeMillis();
            byte[] multipartBody = buildMultipartBody(plantPhotos, boundary);
            URI uri = UriComponentsBuilder.fromUriString(plantIdUrl)
                    .queryParam("language", "fr")
                    .queryParam("details", DETAILS)
                    .queryParam("full_disease_list", "true")
                    .build()
                    .toUri();

            HttpRequest request = HttpRequest.newBuilder(uri)
                    .header("Api-Key", plantIdApiKey.trim())
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(multipartBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode data = parseJson(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String message = data.path("message").asText("Plant.id n'a pas pu analyser cette image.");
                throw new IllegalStateException(message);
            }
            return normalize(data, fields);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Analyse Plant.id interrompue.", interruptedException);
        } catch (IOException exception) {
            throw new IllegalStateException("Erreur reseau pendant l'analyse Plant.id.", exception);
        }
    }

    private byte[] buildMultipartBody(MultipartFile[] files, String boundary) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        int count = Math.min(files.length, 5);
        for (int index = 0; index < count; index++) {
            MultipartFile file = files[index];
            if (file == null || file.isEmpty()) continue;

            write(output, "--" + boundary + "\r\n");
            write(output, "Content-Disposition: form-data; name=\"images\"; filename=\"" + safeFilename(file.getOriginalFilename(), index) + "\"\r\n");
            write(output, "Content-Type: " + Optional.ofNullable(file.getContentType()).orElse("image/jpeg") + "\r\n\r\n");
            output.write(file.getBytes());
            write(output, "\r\n");
        }
        write(output, "--" + boundary + "--\r\n");
        return output.toByteArray();
    }

    private void write(ByteArrayOutputStream output, String value) throws IOException {
        output.write(value.getBytes(StandardCharsets.UTF_8));
    }

    private String safeFilename(String filename, int index) {
        if (filename == null || filename.isBlank()) {
            return "plant-photo-" + (index + 1) + ".jpg";
        }
        return filename.replace("\"", "");
    }

    private JsonNode parseJson(String body) throws IOException {
        return objectMapper.readTree(body == null || body.isBlank() ? "{}" : body);
    }

    private Map<String, Object> normalize(JsonNode data, Map<String, String> fields) {
        JsonNode suggestions = data.at("/result/disease/suggestions");
        JsonNode topSuggestion = suggestions.isArray() && !suggestions.isEmpty() ? suggestions.get(0) : null;
        if (topSuggestion == null) {
            return unknownResult(data, fields, "Plant.id ne propose aucune maladie fiable pour cette image.");
        }

        JsonNode details = topSuggestion.path("details");
        int confidence = (int) Math.round(topSuggestion.path("probability").asDouble(0) * 100);
        boolean isHealthy = data.at("/result/is_healthy/binary").asBoolean(false);
        boolean needsExpertReview = confidence < 60 || isHealthy;
        String diseaseName = firstNonBlank(details.path("local_name").asText(""), topSuggestion.path("name").asText("Maladie non identifiee"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", firstNonBlank(data.path("access_token").asText(""), UUID.randomUUID().toString()));
        result.put("analyzedAt", Instant.now().toString());
        result.put("diseaseName", diseaseName);
        result.put("scientificName", topSuggestion.path("name").asText(""));
        result.put("confidence", confidence);
        result.put("severity", estimateSeverity(confidence, data.at("/result/is_healthy/probability").asDouble(0)));
        result.put("nationalStatus", "unknown");
        result.put("statusMessage", "Plant.id a identifie une maladie probable, mais le statut national doit etre verifie avec la base phytosanitaire locale.");
        result.put("cropName", fields.getOrDefault("cropName", ""));
        result.put("causes", splitDetails(firstNonBlank(details.path("cause").asText(""), details.path("description").asText(""))));
        result.put("observedSymptoms", observedSymptoms(fields, details.path("description").asText("")));
        result.put("likelyProgression", List.of("Propagation possible aux parties voisines.", "Baisse du rendement si aucun traitement n'est applique."));
        result.put("urgentActions", urgentActions(needsExpertReview, confidence));
        result.put("treatmentSteps", splitDetails(firstNonBlank(details.at("/treatment/biological").asText(""), details.at("/treatment/chemical").asText(""))));
        result.put("preventionSteps", splitDetails(details.at("/treatment/prevention").asText("")));
        result.put("recommendedProducts", recommendedProducts(details.path("treatment")));
        result.put("needsExpertReview", needsExpertReview);
        result.put("sources", sources(details));
        return result;
    }

    private Map<String, Object> unknownResult(JsonNode data, Map<String, String> fields, String reason) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", firstNonBlank(data.path("access_token").asText(""), UUID.randomUUID().toString()));
        result.put("analyzedAt", Instant.now().toString());
        result.put("diseaseName", "Maladie non identifiee");
        result.put("scientificName", "");
        result.put("confidence", 0);
        result.put("severity", "A confirmer");
        result.put("nationalStatus", "unlisted");
        result.put("statusMessage", reason + " Le cas doit etre transmis a un ingenieur agronome.");
        result.put("cropName", fields.getOrDefault("cropName", ""));
        result.put("causes", List.of());
        result.put("observedSymptoms", observedSymptoms(fields, ""));
        result.put("likelyProgression", List.of());
        result.put("urgentActions", List.of("Isoler la plante ou la zone touchee.", "Prendre plusieurs photos nettes.", "Contacter un ingenieur agronome."));
        result.put("treatmentSteps", List.of());
        result.put("preventionSteps", List.of());
        result.put("recommendedProducts", List.of());
        result.put("needsExpertReview", true);
        result.put("sources", List.of(Map.of("title", "Plant.id", "url", "https://plant.id/")));
        return result;
    }

    private List<String> observedSymptoms(Map<String, String> fields, String description) {
        List<String> symptoms = new ArrayList<>();
        if (fields.containsKey("affectedPart") && !fields.get("affectedPart").isBlank()) {
            symptoms.add("Partie touchee : " + fields.get("affectedPart"));
        }
        if (fields.containsKey("symptomDescription") && !fields.get("symptomDescription").isBlank()) {
            symptoms.add("Description agriculteur : " + fields.get("symptomDescription"));
        }
        symptoms.addAll(splitDetails(description).stream().limit(3).toList());
        return symptoms;
    }

    private List<String> urgentActions(boolean needsExpertReview, int confidence) {
        List<String> actions = new ArrayList<>();
        if (needsExpertReview) {
            actions.add("Faire verifier le cas par un agronome, car la confiance IA est de " + confidence + "%.");
        }
        actions.add("Eviter de melanger les plantes touchees avec les plantes saines.");
        actions.add("Limiter l'arrosage sur les feuilles en attendant confirmation.");
        return actions;
    }

    private List<String> recommendedProducts(JsonNode treatment) {
        List<String> products = new ArrayList<>();
        if (!treatment.path("chemical").asText("").isBlank()) {
            products.add("Traitement chimique homologue localement, selon les instructions d'un agronome.");
        }
        if (!treatment.path("biological").asText("").isBlank()) {
            products.add("Solution biologique ou pratique culturale adaptee si disponible localement.");
        }
        return products;
    }

    private List<Map<String, String>> sources(JsonNode details) {
        List<Map<String, String>> sources = new ArrayList<>();
        if (!details.path("url").asText("").isBlank()) {
            sources.add(Map.of("title", firstNonBlank(details.path("local_name").asText(""), "Fiche maladie Plant.id"), "url", details.path("url").asText()));
        }
        sources.add(Map.of("title", "Plant.id", "url", "https://plant.id/"));
        return sources;
    }

    private String estimateSeverity(int confidence, double healthyProbability) {
        if (healthyProbability >= 0.7) return "Faible";
        if (confidence >= 80) return "Elevee";
        if (confidence >= 60) return "Moyenne";
        return "A confirmer";
    }

    private List<String> splitDetails(String value) {
        if (value == null || value.isBlank()) return List.of();
        return Arrays.stream(value.split("\\n+|(?<=[.!?])\\s+"))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .limit(8)
                .toList();
    }

    private String firstNonBlank(String first, String second) {
        return first != null && !first.isBlank() ? first : second;
    }
}
