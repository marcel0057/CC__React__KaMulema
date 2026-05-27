# =========================================================
# Dockerfile — AgroPlatform Backend (Module Agronomes)
# Build multi-stage : build Maven puis image légère JRE
# =========================================================

# --- Étape 1 : Build avec Maven ---
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
# Copie le pom.xml en premier pour profiter du cache Maven
COPY pom.xml .
RUN mvn dependency:go-offline -B
# Copie le code source
COPY src ./src
# Build sans tests (les tests tournent séparément en CI)
RUN mvn package -DskipTests -B

# --- Étape 2 : Image finale légère ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Crée un utilisateur non-root pour la sécurité
RUN addgroup -S agroplatform && adduser -S agroplatform -G agroplatform
USER agroplatform

# Copie le JAR depuis l'étape de build
COPY --from=build /app/target/*.jar app.jar

# Port exposé
EXPOSE 8086

# Variables d'environnement (surchargeables via docker-compose)
ENV DB_HOST=mysql \
    DB_PORT=3306 \
    DB_USER=root \
    DB_PASSWORD=agroplatform \
    JWT_SECRET=agroplatform-secret-change-in-production-min64chars-secure \
    CORS_ORIGINS=http://localhost:5173,http://localhost:3000

ENTRYPOINT ["java", "-jar", "app.jar"]
