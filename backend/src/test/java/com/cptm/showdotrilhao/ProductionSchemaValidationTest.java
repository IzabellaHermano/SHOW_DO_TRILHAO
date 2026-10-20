package com.cptm.showdotrilhao;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:prod_validate_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.flyway.enabled=true",
        "spring.flyway.baseline-on-migrate=true",
        "spring.flyway.locations=classpath:db/migration",
        "spring.jpa.hibernate.ddl-auto=validate"
})
class ProductionSchemaValidationTest {

    @Test
    @DisplayName("Garante que todas as entidades JPA são 100% válidas contra o schema gerado pelo Flyway (ddl-auto=validate)")
    void contextLoadsWithSchemaValidation() {
        // Se este teste carregar sem SchemaManagementException, o banco de produção funcionará perfeitamente
    }
}
