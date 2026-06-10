-- =============================================
-- 코디(Code AI) Database Schema
-- PostgreSQL 15+
-- =============================================

-- 1. repositories
CREATE TABLE repositories (
    id              BIGSERIAL PRIMARY KEY,
    github_repo_id  BIGINT        NOT NULL UNIQUE,
    owner           VARCHAR(100)  NOT NULL,
    name            VARCHAR(200)  NOT NULL,
    full_name       VARCHAR(300)  NOT NULL UNIQUE,
    webhook_secret  VARCHAR(500)  NOT NULL,
    webhook_id      BIGINT,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE repositories IS '연결된 GitHub 레포지토리';
COMMENT ON COLUMN repositories.webhook_secret IS 'AES-256 암호화 저장';

-- 2. pipeline_executions
CREATE TABLE pipeline_executions (
    id              BIGSERIAL PRIMARY KEY,
    repository_id   BIGINT        NOT NULL REFERENCES repositories(id),
    pr_number       INT           NOT NULL,
    pr_title        VARCHAR(500)  NOT NULL,
    pr_url          VARCHAR(1000) NOT NULL,
    pr_author       VARCHAR(100)  NOT NULL,
    head_sha        VARCHAR(40)   NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED')),
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pipeline_executions IS 'PR 1개 = PipelineExecution 1개';

-- 3. pipeline_steps
CREATE TABLE pipeline_steps (
    id                      BIGSERIAL PRIMARY KEY,
    pipeline_execution_id   BIGINT       NOT NULL REFERENCES pipeline_executions(id),
    step_type               VARCHAR(50)  NOT NULL
                            CHECK (step_type IN ('WEBHOOK','REVIEW','TEST','NOTIFY','DEPLOY')),
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED','SKIPPED')),
    started_at              TIMESTAMP,
    completed_at            TIMESTAMP,
    error_message           TEXT,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 4. code_reviews
CREATE TABLE code_reviews (
    id                      BIGSERIAL PRIMARY KEY,
    pipeline_execution_id   BIGINT       NOT NULL UNIQUE REFERENCES pipeline_executions(id),
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','COMPLETED','FAILED')),
    prompt_version          VARCHAR(10)  NOT NULL DEFAULT 'v1',
    total_issues            INT          NOT NULL DEFAULT 0,
    high_count              INT          NOT NULL DEFAULT 0,
    medium_count            INT          NOT NULL DEFAULT 0,
    low_count               INT          NOT NULL DEFAULT 0,
    tokens_used             INT,
    github_comment_id       BIGINT,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    completed_at            TIMESTAMP
);

COMMENT ON COLUMN code_reviews.prompt_version IS '프롬프트 엔지니어링 버전 추적용 (v1/v2/v3)';
COMMENT ON COLUMN code_reviews.tokens_used    IS 'Claude API 비용 추적용';

-- 5. review_comments
CREATE TABLE review_comments (
    id              BIGSERIAL PRIMARY KEY,
    code_review_id  BIGINT        NOT NULL REFERENCES code_reviews(id),
    severity        VARCHAR(10)   NOT NULL
                    CHECK (severity IN ('HIGH','MEDIUM','LOW')),
    file_path       VARCHAR(500)  NOT NULL,
    line_number     INT,
    content         TEXT          NOT NULL,
    suggestion      TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 6. test_runs
CREATE TABLE test_runs (
    id                      BIGSERIAL PRIMARY KEY,
    pipeline_execution_id   BIGINT         NOT NULL UNIQUE REFERENCES pipeline_executions(id),
    status                  VARCHAR(20)    NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','RUNNING','PASSED','FAILED')),
    total_tests             INT            NOT NULL DEFAULT 0,
    passed                  INT            NOT NULL DEFAULT 0,
    failed                  INT            NOT NULL DEFAULT 0,
    coverage_pct            DECIMAL(5,2),
    started_at              TIMESTAMP,
    completed_at            TIMESTAMP,
    created_at              TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- 7. test_cases
CREATE TABLE test_cases (
    id              BIGSERIAL PRIMARY KEY,
    test_run_id     BIGINT        NOT NULL REFERENCES test_runs(id),
    test_name       VARCHAR(500)  NOT NULL,
    status          VARCHAR(10)   NOT NULL
                    CHECK (status IN ('PASSED','FAILED','SKIPPED')),
    duration_ms     INT,
    error_message   TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 8. notification_messages
CREATE TABLE notification_messages (
    id                      BIGSERIAL PRIMARY KEY,
    pipeline_execution_id   BIGINT       NOT NULL REFERENCES pipeline_executions(id),
    channel                 VARCHAR(20)  NOT NULL
                            CHECK (channel IN ('SLACK','GITHUB')),
    message                 TEXT         NOT NULL,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','SENT','FAILED')),
    sent_at                 TIMESTAMP,
    error_message           TEXT,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);
