-- ============================================================
-- V6__review_engine.sql
-- code_reviews 에 AI 엔진 식별자 추가 (Phase 4) — claude | openai | gemini
-- 기존 행은 'claude' 로 채워진다. (가산적, 멱등)
-- ============================================================
ALTER TABLE code_reviews ADD COLUMN IF NOT EXISTS engine_id VARCHAR(30) NOT NULL DEFAULT 'claude';
