package com.cptm.showdotrilhao;

import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FlywayMigrationTest {

    @Test
    @DisplayName("Executa migrações do Flyway (V1__init_schema.sql) com sucesso")
    void testFlywayMigration() {
        JdbcDataSource ds = new JdbcDataSource();
        ds.setURL("jdbc:h2:mem:flyway_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
        ds.setUser("sa");
        ds.setPassword("");

        Flyway flyway = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .load();

        var result = flyway.migrate();
        assertTrue(result.migrationsExecuted >= 3, "As migrações V1, V2 e V3 devem ser executadas com sucesso");
        assertEquals(0, flyway.validateWithResult().invalidMigrations.size(), "Todas as migrações devem ser válidas");
    }
}
