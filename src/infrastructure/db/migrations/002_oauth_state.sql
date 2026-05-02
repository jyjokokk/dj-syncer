CREATE TABLE oauth_state (
    state TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX idx_oauth_state_created_at ON oauth_state(created_at);
