import type {
	MusicProvider,
	OAuthTokens,
	Result,
} from "../../domain/music-provider";
import type { Playlist } from "../../domain/playlist";

export class TidalProvider implements MusicProvider {
	readonly name = "tidal" as const;

	getAuthUrl(): string {
		return "https://tidal.example/not-implemented";
	}

	async exchangeCodeForTokens(): Promise<Result<OAuthTokens>> {
		return { ok: false, error: { kind: "not_implemented" } };
	}

	async refreshTokens(): Promise<Result<OAuthTokens>> {
		return { ok: false, error: { kind: "not_implemented" } };
	}

	async listPlaylists(): Promise<Result<Playlist[]>> {
		return { ok: false, error: { kind: "not_implemented" } };
	}
}
