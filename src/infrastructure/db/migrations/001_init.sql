CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT UNIQUE NOT NULL,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS service_links (
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	provider TEXT NOT NULL,
	access_token TEXT NOT NULL,
	refresh_token TEXT,
	expires_at TEXT,
	PRIMARY KEY (user_id, provider)
);
