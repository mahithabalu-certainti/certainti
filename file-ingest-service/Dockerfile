# Dockerfile
FROM maven:3.8.4-openjdk-11 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package

FROM eclipse-temurin:11-jre
WORKDIR /app
COPY --from=build /app/target/file-ingest-service-1.0.0.jar .
CMD ["java", "-jar", "file-ingest-service-1.0.0.jar"]






