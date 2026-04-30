import type {
	MusicProvider,
	OAuthTokens,
	Result,
} from "../../domain/music-provider";
import type { Playlist } from "../../domain/playlist";

export type SpotifyConfig = {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
};

const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";
const SCOPES = ["playlist-read-private", "playlist-read-collaborative"].join(
	" ",
);

type TokenResponse = {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
};

type PlaylistsResponse = {
	items: Array<{
		id: string;
		name: string;
		tracks: { total: number };
	}>;
};

export class SpotifyProvider implements MusicProvider {
	readonly name = "spotify" as const;

	constructor(private readonly config: SpotifyConfig) {}

	getAuthUrl(state: string): string {
		const params = new URLSearchParams({
			response_type: "code",
			client_id: this.config.clientId,
			redirect_uri: this.config.redirectUri,
			state,
			scope: SCOPES,
		});
		return `${AUTH_URL}?${params.toString()}`;
	}

	async exchangeCodeForTokens(code: string): Promise<Result<OAuthTokens>> {
		const body = new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: this.config.redirectUri,
		});
		return this.tokenRequest(body);
	}

	async refreshTokens(refreshToken: string): Promise<Result<OAuthTokens>> {
		const body = new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: refreshToken,
		});
		return this.tokenRequest(body);
	}

	async listPlaylists(accessToken: string): Promise<Result<Playlist[]>> {
		try {
			const res = await fetch(`${API_BASE}/me/playlists?limit=50`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			if (!res.ok) {
				return {
					ok: false,
					error: { kind: "auth_failed", message: `status ${res.status}` },
				};
			}
			const data = (await res.json()) as PlaylistsResponse;
			const value: Playlist[] = data.items.map((p) => ({
				provider: this.name,
				providerPlaylistId: p.id,
				name: p.name,
				trackCount: p.tracks.total,
			}));
			return { ok: true, value };
		} catch (err) {
			return {
				ok: false,
				error: { kind: "network", message: String(err) },
			};
		}
	}

	private async tokenRequest(
		body: URLSearchParams,
	): Promise<Result<OAuthTokens>> {
		const basic = Buffer.from(
			`${this.config.clientId}:${this.config.clientSecret}`,
		).toString("base64");
		try {
			const res = await fetch(TOKEN_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${basic}`,
				},
				body,
			});
			if (!res.ok) {
				return {
					ok: false,
					error: { kind: "auth_failed", message: `status ${res.status}` },
				};
			}
			const data = (await res.json()) as TokenResponse;
			return {
				ok: true,
				value: {
					accessToken: data.access_token,
					refreshToken: data.refresh_token ?? null,
					expiresAt: new Date(Date.now() + data.expires_in * 1000),
				},
			};
		} catch (err) {
			return {
				ok: false,
				error: { kind: "network", message: String(err) },
			};
		}
	}
}
