import type { MusicProvider, OAuthTokens } from "../../domain/music-provider";
import type { Playlist } from "../../domain/playlist";
import { err, type Result } from "../../utils/result";

export class TidalProvider implements MusicProvider {
	readonly name = "tidal" as const;

	getAuthUrl(): string {
		return "https://tidal.example/not-implemented";
	}

	async exchangeCodeForTokens(): Promise<Result<OAuthTokens>> {
		return err({ kind: "not_implemented" });
	}

	async refreshTokens(): Promise<Result<OAuthTokens>> {
		return err({ kind: "not_implemented" });
	}

	async listPlaylists(): Promise<Result<Playlist[]>> {
		return err({ kind: "not_implemented" });
	}
}
