import { beforeEach, describe, expect, it } from "bun:test";
import type { MusicProvider } from "../domain/music-provider";
import type { Playlist } from "../domain/playlist";
import type {
	ServiceLink,
	ServiceLinkRepository,
} from "../domain/service-link";
import { AuthService, type ProviderRegistry } from "./auth-service";
import { PlaylistService } from "./playlist-service";

const calls: any = {};
let store: Map<string, ServiceLink>;
let links: ServiceLinkRepository;
let spotify: MusicProvider;
let providers: ProviderRegistry;
let service: PlaylistService;

const samplePlaylist: Playlist = {
	provider: "spotify",
	providerPlaylistId: "p1",
	name: "House Set",
	trackCount: 12,
};

beforeEach(() => {
	calls.spotify = {};
	store = new Map();
	links = {
		upsert: async (l) => void store.set(`${l.userId}:${l.provider}`, l),
		find: async (u, p) => store.get(`${u}:${p}`) ?? null,
	};
	spotify = {
		name: "spotify",
		getAuthUrl: () => "x",
		exchangeCodeForTokens: async () => ({
			ok: false,
			error: { kind: "not_implemented" },
		}),
		refreshTokens: async () => ({
			ok: false,
			error: { kind: "not_implemented" },
		}),
		listPlaylists: async (token) => {
			calls.spotify.listed = token;
			return { ok: true, value: [samplePlaylist] };
		},
	};
	providers = { spotify, tidal: spotify };
	service = new PlaylistService(providers, new AuthService(providers, links));
});

describe("PlaylistService", () => {
	it("uses the stored access token to list playlists", async () => {
		store.set("u_1:spotify", {
			userId: "u_1",
			provider: "spotify",
			accessToken: "tok",
			refreshToken: null,
			expiresAt: null,
		});
		const r = await service.listPlaylistsForUser("u_1", "spotify");
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.value).toEqual([samplePlaylist]);
		expect(calls.spotify.listed).toBe("tok");
	});

	it("propagates auth failure when user has no link", async () => {
		const r = await service.listPlaylistsForUser("nobody", "spotify");
		expect(r.ok).toBe(false);
	});
});
