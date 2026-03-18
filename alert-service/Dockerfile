FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

COPY pom.xml .
COPY naming-server/pom.xml           naming-server/
COPY config-server/pom.xml           config-server/
COPY api-gateway/pom.xml             api-gateway/
COPY celestial-body-service/pom.xml  celestial-body-service/
COPY threat-tracker-service/pom.xml  threat-tracker-service/
COPY observer-service/pom.xml        observer-service/
COPY alert-service/pom.xml           alert-service/

RUN mvn dependency:resolve -pl alert-service -q --no-transfer-progress

COPY alert-service/src alert-service/src
RUN mvn package -pl alert-service -DskipTests --no-transfer-progress

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/alert-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]