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

RUN mvn dependency:resolve -pl naming-server -q --no-transfer-progress

COPY naming-server/src naming-server/src
RUN mvn package -pl naming-server -DskipTests --no-transfer-progress

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/naming-server/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]