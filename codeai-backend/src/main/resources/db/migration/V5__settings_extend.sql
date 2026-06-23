-- ============================================================
-- V5__settings_extend.sql
-- system_settings 확장 + 플러그인 활성값 시드 (Phase 2)
-- ⚠️ 기존 system_settings(V4) 재생성 금지 — ALTER/INSERT 만. 컬럼명 key/value 유지.
-- ============================================================

-- 1) 카테고리 / 암호화 여부 컬럼 추가 (멱등)
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS category     VARCHAR(30);
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) 기존 시드 키 카테고리 백필 (값이 있을 때만)
UPDATE system_settings SET category = 'notify' WHERE key = 'slack.webhook.url'                          AND category IS NULL;
UPDATE system_settings SET category = 'ai'     WHERE key IN ('claude.prompt.version','claude.max.tokens') AND category IS NULL;

-- 3) 플러그인 활성값 시드 — ProviderRegistry 가 런타임 선택에 사용.
--    이미 존재하는 키는 유지(ON CONFLICT DO NOTHING). 값은 V1 기본값과 동일하므로 동작 불변.
INSERT INTO system_settings (key, value, category) VALUES
    ('ai.engine',        'claude',         'ai'),
    ('notify.channels',  'slack',          'notify'),
    ('test.runner',      'playwright',     'test'),
    ('deploy.provider',  'github-actions', 'deploy'),
    ('claude.max.chunks','10',             'ai')
ON CONFLICT (key) DO NOTHING;
