import type { MusicProvider } from "../domain/music-provider";
import type { Playlist } from "../domain/playlist";
import type { ProviderName } from "../domain/service-link";
import type { Result } from "../utils/result";
import type { AuthService, ProviderRegistry } from "./auth-service";

export class PlaylistService {
	constructor(
		private readonly providers: ProviderRegistry,
		private readonly auth: AuthService,
	) {}

	async listPlaylistsForUser(
		userId: string,
		provider: ProviderName,
	): Promise<Result<Playlist[]>> {
		const link = await this.auth.getValidLink(userId, provider);
		if (!link.ok) return link;
		const adapter: MusicProvider = this.providers[provider];
		return adapter.listPlaylists(link.value.accessToken);
	}
}
