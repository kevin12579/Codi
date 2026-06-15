CREATE TABLE system_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT,
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value) VALUES
  ('slack.webhook.url', NULL),
  ('claude.prompt.version', 'v3'),
  ('claude.max.tokens', '3000');
