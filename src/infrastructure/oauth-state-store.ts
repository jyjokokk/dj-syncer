import type { OAuthStateStore, PendingOAuth } from "../domain/oauth-state";

const DEFAULT_TTL_MS = 10 * 60 * 1000;

type Entry = PendingOAuth & { createdAt: number };

export class InMemoryOAuthStateStore implements OAuthStateStore {
	private readonly entries = new Map<string, Entry>();

	constructor(private readonly ttlMs: number = DEFAULT_TTL_MS) {}

	async create(state: string, pending: PendingOAuth): Promise<void> {
		this.entries.set(state, { ...pending, createdAt: Date.now() });
	}

	async consume(state: string): Promise<PendingOAuth | null> {
		const entry = this.entries.get(state);
		if (!entry) return null;
		this.entries.delete(state);
		if (Date.now() - entry.createdAt > this.ttlMs) return null;
		return { userId: entry.userId, provider: entry.provider };
	}
}
