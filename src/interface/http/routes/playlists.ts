import type { PlaylistService } from "../../../application/playlist-service";
import { authErrorResponse, requireProvider } from "../helpers";

export function playlistRoutes(playlists: PlaylistService) {
	return {
		"/users/:id/playlists/:provider": {
			GET: async (req: Bun.BunRequest<"/users/:id/playlists/:provider">) => {
				const provider = requireProvider(req.params.provider);
				if (provider instanceof Response) return provider;
				const result = await playlists.listPlaylistsForUser(
					req.params.id,
					provider,
				);
				if (!result.ok) return authErrorResponse(result.error);
				return Response.json(result.value);
			},
		},
	};
}
