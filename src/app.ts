import type { Database } from "bun:sqlite";
import { AuthService, type ProviderRegistry } from "./application/auth-service";
import { PlaylistService } from "./application/playlist-service";
import { UserService } from "./application/user-service";
import type { Env } from "./config/env";
import { SqliteServiceLinkRepository } from "./infrastructure/db/service-link-repository";
import {
	closeDatabase,
	openDatabase,
	runMigrations,
} from "./infrastructure/db/sqlite";
import { SqliteUserRepository } from "./infrastructure/db/user-repository";
import { InMemoryOAuthStateStore } from "./infrastructure/oauth-state-store";
import {
	type SpotifyConfig,
	SpotifyProvider,
} from "./infrastructure/providers/spotify-provider";
import { TidalProvider } from "./infrastructure/providers/tidal-provider";
import { buildServer, type Services } from "./interface/http/server";

export type App = {
	server: ReturnType<typeof buildServer>;
	services: Services;
	db: Database;
	close: () => Promise<void>;
};

export type BuildAppOptions = {
	spotifyFetch?: typeof fetch;
};

export function buildApp(env: Env, options: BuildAppOptions = {}): App {
	const db = openDatabase(env.DB_PATH);
	runMigrations(db);

	const userRepo = new SqliteUserRepository(db);
	const linkRepo = new SqliteServiceLinkRepository(db);
	const oauthStateStore = new InMemoryOAuthStateStore();

	const spotifyConfig: SpotifyConfig = {
		clientId: env.SPOTIFY_CLIENT_ID,
		clientSecret: env.SPOTIFY_CLIENT_SECRET,
		redirectUri: env.SPOTIFY_REDIRECT_URI,
	};

	const providers: ProviderRegistry = {
		spotify: new SpotifyProvider(spotifyConfig, options.spotifyFetch),
		tidal: new TidalProvider(),
	};

	const userService = new UserService(userRepo);
	const authService = new AuthService(providers, linkRepo, oauthStateStore);
	const playlistService = new PlaylistService(providers, authService);

	const services: Services = {
		users: userService,
		auth: authService,
		playlists: playlistService,
	};

	const server = buildServer(env.PORT, services);

	let closing: Promise<void> | null = null;
	const close = (): Promise<void> => {
		if (closing) return closing;
		closing = (async () => {
			await server.stop(true);
			await closeDatabase(db);
		})();
		return closing;
	};

	return { server, services, db, close };
}
