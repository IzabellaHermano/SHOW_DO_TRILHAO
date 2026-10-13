-- ========================================================
-- SHOW DO TRILHÃO • CPTM QUIZ
-- V1__init_schema.sql - Schema Inicial Compatível com PostgreSQL e H2
-- ========================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salas (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    apresentador_id BIGINT NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sala_apresentador FOREIGN KEY (apresentador_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS perguntas (
    id BIGSERIAL PRIMARY KEY,
    enunciado VARCHAR(1000) NOT NULL,
    nivel_dificuldade INT NOT NULL,
    valor_premio BIGINT NOT NULL,
    explicacao VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS alternativas (
    id BIGSERIAL PRIMARY KEY,
    pergunta_id BIGINT NOT NULL,
    numero INT NOT NULL,
    texto VARCHAR(500) NOT NULL,
    correta BOOLEAN NOT NULL,
    CONSTRAINT fk_alternativa_pergunta FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partidas (
    id BIGSERIAL PRIMARY KEY,
    sala_id BIGINT NOT NULL,
    usuario_id BIGINT,
    nome_visitante VARCHAR(100),
    pontuacao_final BIGINT NOT NULL DEFAULT 0,
    nivel_alcancado INT NOT NULL DEFAULT 0,
    pergunta_atual_index INT NOT NULL DEFAULT 0,
    perguntas_ids VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'EM_ANDAMENTO',
    iniciada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalizada_em TIMESTAMP,
    CONSTRAINT fk_partida_sala FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE RESTRICT,
    CONSTRAINT fk_partida_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS partidas_perguntas (
    id BIGSERIAL PRIMARY KEY,
    partida_id BIGINT NOT NULL,
    pergunta_id BIGINT NOT NULL,
    ordem INT NOT NULL,
    nivel_dificuldade INT NOT NULL,
    CONSTRAINT fk_pp_partida FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pp_pergunta FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE RESTRICT,
    CONSTRAINT uk_partida_pergunta UNIQUE (partida_id, pergunta_id),
    CONSTRAINT uk_partida_ordem UNIQUE (partida_id, ordem)
);

CREATE TABLE IF NOT EXISTS respostas_partida (
    id BIGSERIAL PRIMARY KEY,
    partida_id BIGINT NOT NULL,
    pergunta_id BIGINT NOT NULL,
    alternativa_escolhida_id BIGINT,
    acertou BOOLEAN NOT NULL,
    tempo_esgotado BOOLEAN NOT NULL DEFAULT FALSE,
    respondida_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resposta_partida FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE,
    CONSTRAINT fk_resposta_pergunta FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE RESTRICT,
    CONSTRAINT fk_resposta_alternativa FOREIGN KEY (alternativa_escolhida_id) REFERENCES alternativas(id) ON DELETE SET NULL
);

-- Índices para alta performance em consultas do Game Show e Rankings
CREATE INDEX IF NOT EXISTS idx_salas_codigo ON salas(codigo);
CREATE INDEX IF NOT EXISTS idx_perguntas_nivel ON perguntas(nivel_dificuldade);
CREATE INDEX IF NOT EXISTS idx_partidas_ranking ON partidas(pontuacao_final DESC, nivel_alcancado DESC);
CREATE INDEX IF NOT EXISTS idx_partidas_sala ON partidas(sala_id);
