import type { Result } from "../utils/result";
import type { Playlist } from "./playlist";
import type { ProviderName } from "./service-link";

export type OAuthTokens = {
	accessToken: string;
	refreshToken: string | null;
	expiresAt: Date | null;
};

export type ProviderError =
	| { kind: "not_implemented" }
	| { kind: "auth_failed"; message: string }
	| { kind: "network"; message: string };

export interface MusicProvider {
	readonly name: ProviderName;
	getAuthUrl(state: string): string;
	exchangeCodeForTokens(code: string): Promise<Result<OAuthTokens>>;
	refreshTokens(refreshToken: string): Promise<Result<OAuthTokens>>;
	listPlaylists(accessToken: string): Promise<Result<Playlist[]>>;
}
