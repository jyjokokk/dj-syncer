import type { MusicProvider, Result } from "../domain/music-provider";
import type {
	ProviderName,
	ServiceLink,
	ServiceLinkRepository,
} from "../domain/service-link";

export type ProviderRegistry = Record<ProviderName, MusicProvider>;

export type CompleteOAuthInput = {
	userId: string;
	provider: ProviderName;
	code: string;
};

export class AuthService {
	constructor(
		private readonly providers: ProviderRegistry,
		private readonly links: ServiceLinkRepository,
	) {}

	startOAuth(provider: ProviderName, state: string): string {
		return this.providers[provider].getAuthUrl(state);
	}

	async completeOAuth(input: CompleteOAuthInput): Promise<Result<ServiceLink>> {
		const provider = this.providers[input.provider];
		const tokens = await provider.exchangeCodeForTokens(input.code);
		if (!tokens.ok) return tokens;
		const link: ServiceLink = {
			userId: input.userId,
			provider: input.provider,
			accessToken: tokens.value.accessToken,
			refreshToken: tokens.value.refreshToken,
			expiresAt: tokens.value.expiresAt,
		};
		await this.links.upsert(link);
		return { ok: true, value: link };
	}

	async getValidLink(
		userId: string,
		provider: ProviderName,
	): Promise<Result<ServiceLink>> {
		const link = await this.links.find(userId, provider);
		if (!link) {
			return { ok: false, error: { kind: "auth_failed", message: "no link" } };
		}
		if (!this.isExpired(link)) {
			return { ok: true, value: link };
		}
		if (!link.refreshToken) {
			return {
				ok: false,
				error: { kind: "auth_failed", message: "token expired" },
			};
		}
		const refreshed = await this.providers[provider].refreshTokens(
			link.refreshToken,
		);
		if (!refreshed.ok) return refreshed;
		const next: ServiceLink = {
			...link,
			accessToken: refreshed.value.accessToken,
			refreshToken: refreshed.value.refreshToken ?? link.refreshToken,
			expiresAt: refreshed.value.expiresAt,
		};
		await this.links.upsert(next);
		return { ok: true, value: next };
	}

	private isExpired(link: ServiceLink): boolean {
		if (!link.expiresAt) return false;
		return link.expiresAt.getTime() <= Date.now();
	}
}
