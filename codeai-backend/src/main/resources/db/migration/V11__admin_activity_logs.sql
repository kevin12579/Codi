CREATE TABLE user_activity_logs (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    email       VARCHAR(255) NOT NULL,
    action      VARCHAR(50)  NOT NULL
                CHECK (action IN ('로그인', '파이프라인 실행', '설정 변경')),
    result      VARCHAR(10)  NOT NULL
                CHECK (result IN ('성공', '실패')),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ual_created ON user_activity_logs(created_at DESC);
CREATE INDEX idx_ual_email   ON user_activity_logs(email);
