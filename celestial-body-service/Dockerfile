FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

COPY pom.xml .
COPY naming-server/pom.xml           naming-server/
COPY config-server/pom.xml           config-server/
COPY auth-service/pom.xml            auth-service/
COPY api-gateway/pom.xml             api-gateway/
COPY celestial-body-service/pom.xml  celestial-body-service/
COPY threat-tracker-service/pom.xml  threat-tracker-service/
COPY alert-service/pom.xml           alert-service/

RUN mvn dependency:resolve -pl celestial-body-service -q --no-transfer-progress

COPY celestial-body-service/src celestial-body-service/src
RUN mvn package -pl celestial-body-service -DskipTests --no-transfer-progress

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/celestial-body-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
