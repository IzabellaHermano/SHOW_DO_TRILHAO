# ========================================================
# ETAPA 1: Build da Aplicação Java com Maven
# ========================================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Cache de dependências do Maven
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia código-fonte e compila pacote JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ========================================================
# ETAPA 2: Imagem Final Enxuta para Produção
# ========================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Cria usuário não-root por segurança
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copia o JAR otimizado do estágio de build
COPY --from=build --chown=spring:spring /app/target/show-do-trilhao-*.jar app.jar

# Variáveis padrão de ambiente para o Render
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

# Health check local do contêiner
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
