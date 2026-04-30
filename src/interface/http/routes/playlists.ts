import type { PlaylistService } from "../../../application/playlist-service";
import { isProvider } from "../../../utils/provider-utils";

export function playlistRoutes(playlists: PlaylistService) {
	return {
		"/users/:id/playlists/:provider": {
			GET: async (req: Bun.BunRequest<"/users/:id/playlists/:provider">) => {
				if (!isProvider(req.params.provider)) {
					return Response.json({ error: "unknown_provider" }, { status: 404 });
				}
				const result = await playlists.listPlaylistsForUser(
					req.params.id,
					req.params.provider,
				);
				if (!result.ok) {
					return Response.json({ error: result.error }, { status: 400 });
				}
				return Response.json(result.value);
			},
		},
	};
}
