import type {
	MusicProvider,
	OAuthTokens,
	ProviderResult,
} from "../../domain/music-provider";
import type { Playlist } from "../../domain/playlist";
import { err } from "../../utils/result";

export class TidalProvider implements MusicProvider {
	readonly name = "tidal" as const;

	getAuthUrl(): string {
		return "https://tidal.example/not-implemented";
	}

	async exchangeCodeForTokens(): Promise<ProviderResult<OAuthTokens>> {
		return err({ kind: "not_implemented" });
	}

	async refreshTokens(): Promise<ProviderResult<OAuthTokens>> {
		return err({ kind: "not_implemented" });
	}

	async listPlaylists(): Promise<ProviderResult<Playlist[]>> {
		return err({ kind: "not_implemented" });
	}
}
