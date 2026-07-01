-- ============================================================
-- V15__settings_seed_v09.sql
-- v0.9: 설정 경계 정식화 (D20, §8-4)
--   ai.autofix.enabled (V1.x: 수정 제안 Autofix) / ai.routing.enabled (V2: 모델 라우팅)
--   둘 다 기본 false. 이미 있으면 건너뜀(idempotent).
-- ============================================================
INSERT INTO system_settings (setting_key, setting_value, category)
VALUES
    ('ai.autofix.enabled', 'false', 'ai'),
    ('ai.routing.enabled', 'false', 'ai')
ON CONFLICT (setting_key) DO NOTHING;
