# Multi-stage Docker build for Spring Boot Backend
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Cache dependencies first
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# Copy source code and build package
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

ENV PORT=8082
EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
