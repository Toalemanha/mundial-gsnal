-- ============================================================
-- MUNDIAL GSNAL 2026 — Tabelas Supabase
-- Copia este SQL todo e corre em Supabase → SQL Editor → New Query
-- ============================================================

-- Jogadores (nome, senha, pontos, campeão, marcador)
CREATE TABLE IF NOT EXISTS jogadores (
  nome      TEXT PRIMARY KEY,
  senha     TEXT NOT NULL DEFAULT '1111',
  pontos    INTEGER NOT NULL DEFAULT 0,
  campeao   TEXT,
  marcador  TEXT
);

-- Insere os 8 jogadores com as senhas default
INSERT INTO jogadores (nome, senha) VALUES
  ('André',   '1111'),
  ('Filipe',  '2222'),
  ('Paulo',   '3333'),
  ('Tiago',   '4444'),
  ('Hugo',    '5555'),
  ('Raul',    '6666'),
  ('Tó',      '7777'),
  ('Ricardo', '8888')
ON CONFLICT (nome) DO NOTHING;

-- Palpites de jogos (resultado marcador: casa X fora)
CREATE TABLE IF NOT EXISTS palpites (
  id       BIGSERIAL PRIMARY KEY,
  jogador  TEXT NOT NULL REFERENCES jogadores(nome),
  id_jogo  TEXT NOT NULL,
  casa     INTEGER,
  fora     INTEGER,
  UNIQUE(jogador, id_jogo)
);

-- Palpites de vencedores de grupos
CREATE TABLE IF NOT EXISTS palpites_grupos (
  id       BIGSERIAL PRIMARY KEY,
  jogador  TEXT NOT NULL REFERENCES jogadores(nome),
  grupo    TEXT NOT NULL,
  primeiro TEXT,
  segundo  TEXT,
  UNIQUE(jogador, grupo)
);

-- Resultados reais dos jogos (Admin preenche)
CREATE TABLE IF NOT EXISTS resultados (
  id_jogo  TEXT PRIMARY KEY,
  casa     INTEGER,
  fora     INTEGER
);

-- Resultados reais dos grupos
CREATE TABLE IF NOT EXISTS resultados_grupos (
  grupo    TEXT PRIMARY KEY,
  primeiro TEXT,
  segundo  TEXT
);

-- Config geral (campeão real, melhor marcador real)
CREATE TABLE IF NOT EXISTS config (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  campeao_real  TEXT,
  marcador_real TEXT
);

INSERT INTO config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEGURANÇA: Row Level Security (RLS)
-- Permite leitura a todos; escrita apenas com a anon key
-- (suficiente para um grupo pequeno de amigos)
-- ============================================================

ALTER TABLE jogadores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE palpites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE palpites_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados      ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE config          ENABLE ROW LEVEL SECURITY;

-- Política: qualquer um pode ler e escrever (app de amigos, sem auth externa)
CREATE POLICY "allow all" ON jogadores       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON palpites        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON palpites_grupos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON resultados      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON resultados_grupos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON config          FOR ALL USING (true) WITH CHECK (true);
