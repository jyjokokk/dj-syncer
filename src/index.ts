import { AuthService, type ProviderRegistry } from "./application/auth-service";
import { PlaylistService } from "./application/playlist-service";
import { UserService } from "./application/user-service";
import { loadEnv } from "./config/env";
import { SqliteServiceLinkRepository } from "./infrastructure/db/service-link-repository";
import { openDatabase, runMigrations } from "./infrastructure/db/sqlite";
import { SqliteUserRepository } from "./infrastructure/db/user-repository";
import { InMemoryOAuthStateStore } from "./infrastructure/oauth-state-store";
import {
	type SpotifyConfig,
	SpotifyProvider,
} from "./infrastructure/providers/spotify-provider";
import { TidalProvider } from "./infrastructure/providers/tidal-provider";
import { buildServer } from "./interface/http/server";

const env = loadEnv();
const db = openDatabase(env.DB_PATH);
runMigrations(db);

const userRepo = new SqliteUserRepository(db);
const linkRepo = new SqliteServiceLinkRepository(db);
const oauthStateStore = new InMemoryOAuthStateStore();

const spotifyConfig: SpotifyConfig = {
	clientId: env.SPOTIFY_CLIENT_ID ?? "missing",
	clientSecret: env.SPOTIFY_CLIENT_SECRET ?? "missing",
	redirectUri:
		env.SPOTIFY_REDIRECT_URI ??
		`http://localhost:${env.PORT}/auth/spotify/callback`,
};

const providers: ProviderRegistry = {
	spotify: new SpotifyProvider(spotifyConfig),
	tidal: new TidalProvider(),
};

const userService = new UserService(userRepo);
const authService = new AuthService(providers, linkRepo, oauthStateStore);
const playlistService = new PlaylistService(providers, authService);

const server = buildServer(env.PORT, {
	users: userService,
	auth: authService,
	playlists: playlistService,
});

console.log(`dj-syncer listening on :${server.port}`);
