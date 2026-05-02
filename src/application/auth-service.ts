import type { MusicProvider } from "../domain/music-provider";
import type { OAuthStateStore } from "../domain/oauth-state";
import type {
	ProviderName,
	ServiceLink,
	ServiceLinkRepository,
} from "../domain/service-link";
import { errWrapper, okWrapper, type Result } from "../utils/result";

export type ProviderRegistry = Record<ProviderName, MusicProvider>;

export type StartOAuthResult = {
	authUrl: string;
	state: string;
};

export class AuthService {
	constructor(
		private readonly providers: ProviderRegistry,
		private readonly links: ServiceLinkRepository,
		private readonly states: OAuthStateStore,
	) {}

	async startOAuth(
		provider: ProviderName,
		userId: string,
	): Promise<StartOAuthResult> {
		const state = crypto.randomUUID();
		await this.states.create(state, { userId, provider });
		return {
			authUrl: this.providers[provider].getAuthUrl(state),
			state,
		};
	}

	async completeOAuth(
		provider: ProviderName,
		state: string,
		code: string,
	): Promise<Result<ServiceLink>> {
		const pending = await this.states.consume(state);
		if (!pending || pending.provider !== provider) {
			return errWrapper({ kind: "auth_failed", message: "invalid state" });
		}
		const tokens = await this.providers[provider].exchangeCodeForTokens(code);
		if (!tokens.ok) return tokens;
		const link: ServiceLink = {
			userId: pending.userId,
			provider,
			accessToken: tokens.value.accessToken,
			refreshToken: tokens.value.refreshToken,
			expiresAt: tokens.value.expiresAt,
		};
		await this.links.upsert(link);
		return okWrapper(link);
	}

	findLink(
		userId: string,
		provider: ProviderName,
	): Promise<ServiceLink | null> {
		return this.links.find(userId, provider);
	}

	async getValidLink(
		userId: string,
		provider: ProviderName,
	): Promise<Result<ServiceLink>> {
		const link = await this.links.find(userId, provider);
		if (!link) {
			return errWrapper({ kind: "auth_failed", message: "no link" });
		}
		if (!this.isExpired(link)) {
			return okWrapper(link);
		}
		if (!link.refreshToken) {
			return errWrapper({ kind: "auth_failed", message: "token expired" });
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
		return okWrapper(next);
	}

	private isExpired(link: ServiceLink): boolean {
		if (!link.expiresAt) return false;
		return link.expiresAt.getTime() <= Date.now();
	}
}
