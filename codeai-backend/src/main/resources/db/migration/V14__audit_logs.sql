-- ============================================================
-- V14__audit_logs.sql
-- v0.8/0.9: 감사 로그 (D11, §2-3 권한·감사)
--   설계 §3 audit_logs 와 1:1. 기존 user_activity_logs(V11)는 사용자용 화면 유지,
--   audit_logs 는 보안/행위 감사(LOGIN·CONNECTOR_UPDATE·DEPLOY_APPROVE·MCP_TOOL_CALL ...).
--   action 은 자유 문자열(확장 대비 CHECK 미부여), 시스템 행위는 actor_id NULL.
-- ============================================================
CREATE TABLE audit_logs (
    id          BIGSERIAL    PRIMARY KEY,
    actor_id    BIGINT       REFERENCES users(id),
    action      VARCHAR(60)  NOT NULL,
    target      VARCHAR(200),
    ip          VARCHAR(45),
    user_agent  VARCHAR(300),
    detail      TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor   ON audit_logs(actor_id);
CREATE INDEX idx_audit_action  ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS '보안/행위 감사 이력 (누가·언제·무엇을·어디서)';
