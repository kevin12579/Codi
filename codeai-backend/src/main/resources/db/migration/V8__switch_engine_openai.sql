-- ============================================================
-- V8__switch_engine_openai.sql
-- ai.engine 기본값을 openai 로 전환 (Claude API 잔액 소진)
-- P1 회귀 + P4 엔진 전환 테스트에서 GPT-4o-mini 사용
-- ============================================================

UPDATE system_settings
SET value = 'openai'
WHERE key = 'ai.engine';
