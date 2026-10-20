-- ========================================================
-- SHOW DO TRILHÃO • CPTM QUIZ
-- V3__fix_multiplayer_schema_and_tempo_resposta.sql
-- Alinhamento estrito de schema entre entidades JPA e Flyway (compatível com PostgreSQL e H2)
-- ========================================================

-- 1. Garante que perguntas_ids em partidas permita NULL (no fluxo multiplayer as perguntas ficam vinculadas à sala_perguntas)
ALTER TABLE partidas ALTER COLUMN perguntas_ids DROP NOT NULL;

-- 2. Adiciona coluna tempo_resposta_ms na tabela respostas_partida exigida pelo Hibernate ddl-auto: validate em produção
ALTER TABLE respostas_partida ADD COLUMN IF NOT EXISTS tempo_resposta_ms BIGINT DEFAULT 0;
