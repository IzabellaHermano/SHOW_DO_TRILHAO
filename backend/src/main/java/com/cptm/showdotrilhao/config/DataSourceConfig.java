package com.cptm.showdotrilhao.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(Environment env) {
        String databaseUrl = env.getProperty("DATABASE_URL");

        if (databaseUrl != null && !databaseUrl.isBlank() && 
                (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
            log.info("Configuring PostgreSQL DataSource from Render DATABASE_URL");
            try {
                HikariConfig config = parseRenderDatabaseUrl(databaseUrl);
                return new HikariDataSource(config);
            } catch (Exception e) {
                log.error("Erro ao converter DATABASE_URL: {}. Usando propriedades padrão.", e.getMessage(), e);
            }
        }

        // Padrão para perfil local (H2) ou propriedades explícitas
        HikariConfig config = new HikariConfig();
        String url = env.getProperty("spring.datasource.url");
        String driver = env.getProperty("spring.datasource.driver-class-name");
        String user = env.getProperty("spring.datasource.username", "");
        String pass = env.getProperty("spring.datasource.password", "");

        if (url != null) config.setJdbcUrl(url);
        if (driver != null) config.setDriverClassName(driver);
        config.setUsername(user);
        config.setPassword(pass);

        return new HikariDataSource(config);
    }

    public static HikariConfig parseRenderDatabaseUrl(String databaseUrl) throws Exception {
        // Converte postgres:// ou postgresql:// para JDBC de forma segura via parser HTTP
        URI uri = new URI(databaseUrl.replaceFirst("^(postgres|postgresql)://", "http://"));
        String host = uri.getHost();
        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String path = uri.getPath(); // /dbname
        String userInfo = uri.getUserInfo();

        String username = "";
        String password = "";
        if (userInfo != null && userInfo.contains(":")) {
            String[] parts = userInfo.split(":", 2);
            username = parts[0];
            password = parts[1];
        } else if (userInfo != null) {
            username = userInfo;
        }

        String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
        if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
            jdbcUrl += "?" + uri.getQuery();
        }

        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(300000);
        config.setConnectionTimeout(30000);
        // Não quebra durante startup se o banco estiver em cold-start
        config.setInitializationFailTimeout(-1);

        return config;
    }
}
