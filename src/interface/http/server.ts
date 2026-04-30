import type { AuthService } from "../../application/auth-service";
import type { PlaylistService } from "../../application/playlist-service";
import type { UserService } from "../../application/user-service";
import { authRoutes } from "./routes/auth";
import { playlistRoutes } from "./routes/playlists";
import { userRoutes } from "./routes/users";

export type Services = {
	users: UserService;
	auth: AuthService;
	playlists: PlaylistService;
};

export function buildServer(port: number, services: Services) {
	return Bun.serve({
		port,
		routes: {
			...userRoutes(services.users),
			...authRoutes(services.auth),
			...playlistRoutes(services.playlists),
		},
		fetch() {
			return new Response("Not Found", { status: 404 });
		},
	});
}
