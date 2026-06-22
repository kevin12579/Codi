-- ============================================================
-- V9__schema_align.sql
-- 설계 §3 DDL 기준 스키마 정합 (Phase P9-G1)
-- ⚠️ 이 마이그레이션과 G2(엔티티) 코드 변경을 함께 배포해야 함
--    (system_settings 컬럼 rename → SettingsEntity @Column 변경 필수)
-- ============================================================

-- ============================================================
-- 1. notification_messages: channel(대문자 enum) → channel_id(소문자 string)
--    설계 §3: channel_id VARCHAR(30) CHECK IN ('slack','discord','teams')
-- ============================================================
ALTER TABLE notification_messages DROP CONSTRAINT IF EXISTS notification_messages_channel_check;

-- 기존 값 소문자 변환 (SLACK→slack, GITHUB→slack — GITHUB는 설계에 없는 값)
UPDATE notification_messages SET channel = LOWER(channel);
UPDATE notification_messages SET channel = 'slack' WHERE channel = 'github';

ALTER TABLE notification_messages RENAME COLUMN channel TO channel_id;
ALTER TABLE notification_messages ALTER COLUMN channel_id TYPE VARCHAR(30);
ALTER TABLE notification_messages
    ADD CONSTRAINT chk_nm_channel CHECK (channel_id IN ('slack','discord','teams'));

-- ============================================================
-- 2. pipeline_executions: vcs_id, head_branch 컬럼 추가
--    설계 §3: 멀티 VCS 확장성 컬럼. V1은 github 고정.
-- ============================================================
ALTER TABLE pipeline_executions
    ADD COLUMN IF NOT EXISTS vcs_id      VARCHAR(30) NOT NULL DEFAULT 'github',
    ADD COLUMN IF NOT EXISTS head_branch VARCHAR(200);

-- ============================================================
-- 3. test_runs: runner_id 컬럼 추가
--    설계 §3: 멀티 테스트 러너 확장성 컬럼. V1은 playwright 고정.
-- ============================================================
ALTER TABLE test_runs
    ADD COLUMN IF NOT EXISTS runner_id VARCHAR(30) NOT NULL DEFAULT 'playwright';

-- ============================================================
-- 4. repositories: 설계 §3 누락 컬럼 추가 (vcs_id, url, default_branch)
--    기존 컬럼(github_repo_id, owner, name, webhook_secret 등) 유지.
-- ============================================================
ALTER TABLE repositories
    ADD COLUMN IF NOT EXISTS vcs_id         VARCHAR(30)  NOT NULL DEFAULT 'github',
    ADD COLUMN IF NOT EXISTS url            VARCHAR(500),
    ADD COLUMN IF NOT EXISTS default_branch VARCHAR(100) NOT NULL DEFAULT 'main';

-- 기존 레포의 url을 full_name 에서 도출
UPDATE repositories SET url = 'https://github.com/' || full_name WHERE url IS NULL;

-- ============================================================
-- 5. system_settings: key → setting_key, value → setting_value
--    설계 §3 DDL 컬럼명 기준. SettingsEntity @Column 어노테이션과 함께 배포.
-- ============================================================
ALTER TABLE system_settings RENAME COLUMN "key"   TO setting_key;
ALTER TABLE system_settings RENAME COLUMN "value" TO setting_value;

-- ============================================================
-- 6. ai.engine 기본값 openai (gpt)
-- ============================================================
UPDATE system_settings SET setting_value = 'openai' WHERE setting_key = 'ai.engine';

-- ============================================================
-- 7. uq_pe_active: 같은 레포+PR에 활성 파이프라인 1개만 허용 (설계 §3 무결성)
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_pe_active
    ON pipeline_executions(repository_id, pr_number)
    WHERE status IN ('PENDING', 'RUNNING');
