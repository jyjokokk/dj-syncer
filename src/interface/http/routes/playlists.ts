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
					switch (result.error.kind) {
						case "invalid_state":
							return Response.json({ error: "invalid_state" }, { status: 400 });
						case "no_link":
							return Response.json({ error: "no_link" }, { status: 404 });
						case "token_expired":
							return Response.json({ error: "token_expired" }, { status: 401 });
						case "provider_error":
							console.error("provider_error", result.error.cause);
							return Response.json(
								{ error: "provider_error" },
								{ status: 502 },
							);
					}
				}
				return Response.json(result.value);
			},
		},
	};
}
