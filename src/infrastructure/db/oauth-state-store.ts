import type { Database, Statement } from "bun:sqlite";
import type { OAuthStateStore, PendingOAuth } from "../../domain/oauth-state";
import type { ProviderName } from "../../domain/service-link";

const DEFAULT_TTL_MS = 10 * 60 * 1000;

type Row = {
	user_id: string;
	provider: ProviderName;
	created_at: number;
};

export class SqliteOAuthStateStore implements OAuthStateStore {
	private readonly insert: Statement;
	private readonly select: Statement<Row, [string]>;
	private readonly remove: Statement;
	private readonly sweepStmt: Statement;
	private readonly consumeTx: (state: string) => PendingOAuth | null;

	constructor(
		db: Database,
		private readonly ttlMs: number = DEFAULT_TTL_MS,
	) {
		this.insert = db.prepare(
			`INSERT INTO oauth_state (state, user_id, provider, created_at)
			VALUES (?, ?, ?, ?)`,
		);
		this.select = db.prepare<Row, [string]>(
			`SELECT user_id, provider, created_at FROM oauth_state WHERE state = ?`,
		);
		this.remove = db.prepare(`DELETE FROM oauth_state WHERE state = ?`);
		this.sweepStmt = db.prepare(
			`DELETE FROM oauth_state WHERE created_at <= ?`,
		);
		this.consumeTx = db.transaction((s: string): PendingOAuth | null => {
			const row = this.select.get(s);
			if (!row) return null;
			this.remove.run(s);
			if (Date.now() - row.created_at > this.ttlMs) return null;
			return { userId: row.user_id, provider: row.provider };
		});
	}

	async create(state: string, pending: PendingOAuth): Promise<void> {
		this.sweep();
		this.insert.run(state, pending.userId, pending.provider, Date.now());
	}

	async consume(state: string): Promise<PendingOAuth | null> {
		return this.consumeTx(state);
	}

	private sweep(): void {
		this.sweepStmt.run(Date.now() - this.ttlMs);
	}
}
