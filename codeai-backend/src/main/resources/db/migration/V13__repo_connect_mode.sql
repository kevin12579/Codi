-- ============================================================
-- V13__repo_connect_mode.sql
-- v0.9: 레포 연결 정식화 (D21, §4-3-1)
--   connect_mode: MANUAL(V1 — 사용자가 GitHub Webhook 직접 등록) | AUTO(V2 — GitHub App)
-- ============================================================
ALTER TABLE repositories
    ADD COLUMN IF NOT EXISTS connect_mode VARCHAR(10) NOT NULL DEFAULT 'MANUAL';

ALTER TABLE repositories DROP CONSTRAINT IF EXISTS chk_repo_connect;
ALTER TABLE repositories
    ADD CONSTRAINT chk_repo_connect CHECK (connect_mode IN ('MANUAL','AUTO'));

COMMENT ON COLUMN repositories.connect_mode IS 'MANUAL(V1 수동 등록) | AUTO(V2 GitHub App)';
