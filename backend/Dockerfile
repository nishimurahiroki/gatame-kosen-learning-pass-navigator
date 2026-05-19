# Gatame Learning Pass — Spring Boot API for Render (Docker)
# https://render.com/docs/docker

# ---------- build ----------
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn -B -DskipTests clean package

# ---------- runtime ----------
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/target/learning-pass-0.0.1-SNAPSHOT.jar /app/app.jar

# Render injects PORT at runtime; local default matches application.yml
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
