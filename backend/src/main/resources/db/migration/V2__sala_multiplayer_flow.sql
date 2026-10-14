-- ========================================================
-- SHOW DO TRILHÃO • CPTM QUIZ
-- V2__sala_multiplayer_flow.sql
-- Migração para fluxo multiplayer em tempo real (H2 & PostgreSQL)
-- ========================================================

-- 1. Novos campos de controle na tabela de salas
ALTER TABLE salas ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'AGUARDANDO';
ALTER TABLE salas ADD COLUMN IF NOT EXISTS pergunta_atual_index INT DEFAULT 0;
ALTER TABLE salas ADD COLUMN IF NOT EXISTS fase_rodada VARCHAR(30) DEFAULT 'LOBBY';
ALTER TABLE salas ADD COLUMN IF NOT EXISTS prazo_final TIMESTAMP;
ALTER TABLE salas ADD COLUMN IF NOT EXISTS aberta_em TIMESTAMP;
ALTER TABLE salas ADD COLUMN IF NOT EXISTS versao_estado BIGINT DEFAULT 0;

-- Salas legadas criadas antes da V2 são finalizadas para segurança
UPDATE salas SET status = 'FINALIZADA' WHERE status = 'AGUARDANDO' AND criada_em < CURRENT_TIMESTAMP;

-- 2. Tabela de ligação oficial sala_perguntas com constraints de unicidade
CREATE TABLE IF NOT EXISTS sala_perguntas (
    id BIGSERIAL PRIMARY KEY,
    sala_id BIGINT NOT NULL,
    pergunta_id BIGINT NOT NULL,
    ordem INT NOT NULL,
    CONSTRAINT fk_sp_sala FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE,
    CONSTRAINT fk_sp_pergunta FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE RESTRICT,
    CONSTRAINT uk_sala_ordem UNIQUE (sala_id, ordem),
    CONSTRAINT uk_sala_pergunta UNIQUE (sala_id, pergunta_id)
);

CREATE INDEX IF NOT EXISTS idx_sp_sala ON sala_perguntas(sala_id);

-- 3. Identificador de sessão opaco e tempo de resposta na tabela de partidas
ALTER TABLE partidas ADD COLUMN IF NOT EXISTS token_sessao VARCHAR(64);
ALTER TABLE partidas ADD COLUMN IF NOT EXISTS tempo_total_resposta_ms BIGINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_partidas_token ON partidas(token_sessao);

-- 4. Constraint de unicidade: 1 resposta por partida e pergunta
ALTER TABLE respostas_partida ADD CONSTRAINT uk_resposta_partida_pergunta UNIQUE (partida_id, pergunta_id);
