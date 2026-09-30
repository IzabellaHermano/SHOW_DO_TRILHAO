-- ========================================================
-- SCRIPT DE MIGRAÇÃO: TABELA partidas_perguntas
-- Show do Trilhão • CPTM
-- Compatível com MySQL e H2 Database
-- ========================================================

CREATE TABLE IF NOT EXISTS partidas_perguntas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    partida_id BIGINT NOT NULL,
    pergunta_id BIGINT NOT NULL,
    ordem INT NOT NULL,
    nivel_dificuldade INT NOT NULL,
    CONSTRAINT fk_partida_pergunta_partida FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE,
    CONSTRAINT fk_partida_pergunta_pergunta FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE RESTRICT,
    CONSTRAINT uk_partida_pergunta UNIQUE (partida_id, pergunta_id),
    CONSTRAINT uk_partida_ordem UNIQUE (partida_id, ordem)
);

-- Índices para otimização de busca rápida durante o jogo
CREATE INDEX IF NOT EXISTS idx_partida_perguntas_partida ON partidas_perguntas(partida_id);
CREATE INDEX IF NOT EXISTS idx_partida_perguntas_ordem ON partidas_perguntas(partida_id, ordem);
