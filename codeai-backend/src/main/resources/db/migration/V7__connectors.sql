-- ============================================================
-- V7__connectors.sql
-- 플러그인 커넥터 설정·암호화 키 저장 (Phase 5)
-- 기존 테이블 스타일(BIGSERIAL/TIMESTAMP)에 맞춤. config_json 은 AES-256 암호문.
-- ============================================================
CREATE TABLE connectors (
    id          BIGSERIAL PRIMARY KEY,
    category    VARCHAR(20)  NOT NULL CHECK (category IN ('vcs','ai','notify','test','deploy')),
    provider_id VARCHAR(30)  NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT FALSE,
    config_json TEXT,                       -- AES-256(GCM) 암호화된 JSON (API 키 등)
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_conn UNIQUE (category, provider_id)
);
CREATE INDEX idx_conn_active ON connectors(category, is_active);
