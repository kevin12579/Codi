-- ============================================================
-- V12__pipeline_deploy_candidate.sql
-- v0.9: 자동 배포 → 승인 게이트 (D10)
--   pipeline_executions.status 에 DEPLOY_CANDIDATE 추가.
--   배포 조건(HIGH==0 && PASSED) 충족 시 SUCCESS 가 아니라 DEPLOY_CANDIDATE 로 표시,
--   ADMIN 승인(POST /api/pipelines/{id}/deploy) 후에야 SUCCESS + 배포 트리거.
-- ============================================================
ALTER TABLE pipeline_executions DROP CONSTRAINT IF EXISTS pipeline_executions_status_check;
ALTER TABLE pipeline_executions
    ADD CONSTRAINT pipeline_executions_status_check
    CHECK (status IN ('PENDING','RUNNING','DEPLOY_CANDIDATE','SUCCESS','FAILED'));
