-- =============================================
-- 코디(Code AI) — 인덱스 추가
-- =============================================

CREATE INDEX idx_pipeline_repo_id    ON pipeline_executions(repository_id);
CREATE INDEX idx_pipeline_status     ON pipeline_executions(status);
CREATE INDEX idx_pipeline_created_at ON pipeline_executions(created_at DESC);

CREATE INDEX idx_steps_pipeline_id ON pipeline_steps(pipeline_execution_id);

CREATE INDEX idx_reviews_pipeline_id ON code_reviews(pipeline_execution_id);

CREATE INDEX idx_review_comments_review_id ON review_comments(code_review_id);
CREATE INDEX idx_review_comments_severity  ON review_comments(severity);

CREATE INDEX idx_test_runs_pipeline_id ON test_runs(pipeline_execution_id);

CREATE INDEX idx_test_cases_run_id ON test_cases(test_run_id);

CREATE INDEX idx_notifications_pipeline_id ON notification_messages(pipeline_execution_id);
