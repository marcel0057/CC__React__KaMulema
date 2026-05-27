package cm.kamolema.config;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public final class DotenvLoader {
    private DotenvLoader() {
    }

    public static void load() {
        Path envPath = findEnvPath();
        if (!Files.exists(envPath)) {
            return;
        }

        try {
            for (String line : Files.readAllLines(envPath)) {
                String trimmed = line.trim();
                if (trimmed.isBlank() || trimmed.startsWith("#") || !trimmed.contains("=")) {
                    continue;
                }
                int separator = trimmed.indexOf('=');
                String key = trimmed.substring(0, separator).trim().replace("\uFEFF", "");
                String value = trimmed.substring(separator + 1).trim().replaceAll("^['\"]|['\"]$", "");
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException ignored) {
        }
    }

    private static Path findEnvPath() {
        List<Path> candidates = new ArrayList<>();
        Path userDir = Path.of(System.getProperty("user.dir", ".")).toAbsolutePath();
        candidates.add(userDir.resolve(".env"));
        candidates.add(userDir.resolve("..").resolve(".env"));

        try {
            Path codePath = Path.of(DotenvLoader.class.getProtectionDomain().getCodeSource().getLocation().toURI()).toAbsolutePath();
            Path base = Files.isRegularFile(codePath) ? codePath.getParent() : codePath;
            candidates.add(base.resolve(".env"));
            candidates.add(base.resolve("..").resolve(".env"));
            candidates.add(base.resolve("..").resolve("..").resolve(".env"));
        } catch (URISyntaxException | RuntimeException ignored) {
        }

        for (String classpathItem : System.getProperty("java.class.path", "").split(System.getProperty("path.separator"))) {
            if (classpathItem.isBlank()) {
                continue;
            }
            Path classpathPath = Path.of(classpathItem).toAbsolutePath();
            Path base = Files.isRegularFile(classpathPath) ? classpathPath.getParent() : classpathPath;
            candidates.add(base.resolve(".env"));
            candidates.add(base.resolve("..").resolve(".env"));
            candidates.add(base.resolve("..").resolve("..").resolve(".env"));
        }

        return candidates.stream()
                .map(Path::normalize)
                .filter(Files::exists)
                .findFirst()
                .orElse(userDir.resolve(".env"));
    }
}
