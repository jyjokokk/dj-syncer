import type { Database } from "bun:sqlite";
import type {
	ProviderName,
	ServiceLink,
	ServiceLinkRepository,
} from "../../domain/service-link";

type Row = {
	user_id: string;
	provider: ProviderName;
	access_token: string;
	refresh_token: string | null;
	expires_at: string | null;
};

const toLink = (row: Row): ServiceLink => ({
	userId: row.user_id,
	provider: row.provider,
	accessToken: row.access_token,
	refreshToken: row.refresh_token,
	expiresAt: row.expires_at ? new Date(row.expires_at) : null,
});

export class SqliteServiceLinkRepository implements ServiceLinkRepository {
	constructor(private readonly db: Database) {}

	async upsert(link: ServiceLink): Promise<void> {
		this.db
			.query(
				`INSERT INTO service_links (user_id, provider, access_token, refresh_token, expires_at)
				VALUES (?, ?, ?, ?, ?)
				ON CONFLICT(user_id, provider) DO UPDATE SET
					access_token = excluded.access_token,
					refresh_token = excluded.refresh_token,
					expires_at = excluded.expires_at`,
			)
			.run(
				link.userId,
				link.provider,
				link.accessToken,
				link.refreshToken,
				link.expiresAt ? link.expiresAt.toISOString() : null,
			);
	}

	async find(
		userId: string,
		provider: ProviderName,
	): Promise<ServiceLink | null> {
		const row = this.db
			.query<Row, [string, ProviderName]>(
				`SELECT user_id, provider, access_token, refresh_token, expires_at
				FROM service_links WHERE user_id = ? AND provider = ?`,
			)
			.get(userId, provider);
		return row ? toLink(row) : null;
	}
}
