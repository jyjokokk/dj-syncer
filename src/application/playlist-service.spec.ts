import { beforeEach, describe, expect, it } from "bun:test";
import type { MusicProvider } from "../domain/music-provider";
import type { Playlist } from "../domain/playlist";
import type { ProviderRegistry } from "./auth-service";
import { PlaylistService } from "./playlist-service";

const calls: any = {};
const spotify: MusicProvider = {
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

let providers: ProviderRegistry;
let service: PlaylistService;

const samplePlaylist: Playlist = {
	provider: "spotify",
	providerPlaylistId: "p1",
	name: "House Set",
	trackCount: 12,
};

const accessToken = "tok";
const refreshToken = null;
const expiresAt = null;

const authService: any = {
	getValidLink: async (userId: string, provider: string) => {
		return {
			ok: true,
			value: {
				userId,
				provider,
				accessToken,
				refreshToken,
				expiresAt,
			},
		} as any;
	},
};

beforeEach(() => {
	calls.spotify = {};
	providers = { spotify, tidal: spotify };
	service = new PlaylistService(providers, authService);
});

describe("PlaylistService", () => {
	it("uses the stored access token to list playlists", async () => {
		const r = await service.listPlaylistsForUser("u_1", "spotify");
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.value).toEqual([samplePlaylist]);
		expect(calls.spotify.listed).toBe("tok");
	});
});
