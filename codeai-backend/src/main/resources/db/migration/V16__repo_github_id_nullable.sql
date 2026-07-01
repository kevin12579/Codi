-- ============================================================
-- V16__repo_github_id_nullable.sql
-- v0.9: 레포 수동 등록(D21, §4-3-1) 대응.
--   수동 등록 시점에는 GitHub repo id 를 알 수 없으므로 github_repo_id 를 nullable 로 완화.
--   첫 Webhook 수신 시 full_name 매칭으로 백필(backfill)한다.
--   UNIQUE 제약은 유지(Postgres 는 NULL 다중 허용).
-- ============================================================
ALTER TABLE repositories ALTER COLUMN github_repo_id DROP NOT NULL;
