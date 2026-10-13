package com.cptm.showdotrilhao;

import com.cptm.showdotrilhao.config.DataSourceConfig;
import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DataSourceConfigTest {

    @Test
    @DisplayName("Converte DATABASE_URL do Render (postgres://) para JDBC PostgreSQL")
    void testRenderDatabaseUrlConversion() throws Exception {
        String url = "postgres://trilhao_user:SuperSecret123@dpg-abc12345.oregon-postgres.render.com:5432/show_do_trilhao";
        HikariConfig config = DataSourceConfig.parseRenderDatabaseUrl(url);

        assertNotNull(config);
        assertEquals("jdbc:postgresql://dpg-abc12345.oregon-postgres.render.com:5432/show_do_trilhao", config.getJdbcUrl());
        assertEquals("trilhao_user", config.getUsername());
        assertEquals("SuperSecret123", config.getPassword());
        assertEquals("org.postgresql.Driver", config.getDriverClassName());
        assertEquals(10, config.getMaximumPoolSize());
    }

    @Test
    @DisplayName("Converte DATABASE_URL com protocolo postgresql:// e query params para JDBC PostgreSQL")
    void testRenderPostgresqlProtocolConversion() throws Exception {
        String url = "postgresql://user_render:senha999@dpg-host.render.com:5432/db_prod?sslmode=require";
        HikariConfig config = DataSourceConfig.parseRenderDatabaseUrl(url);

        assertNotNull(config);
        assertEquals("jdbc:postgresql://dpg-host.render.com:5432/db_prod?sslmode=require", config.getJdbcUrl());
        assertEquals("user_render", config.getUsername());
        assertEquals("senha999", config.getPassword());
        assertEquals("org.postgresql.Driver", config.getDriverClassName());
    }
}
