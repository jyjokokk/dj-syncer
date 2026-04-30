import { beforeEach, describe, expect, it } from "bun:test";
import type { MusicProvider } from "../domain/music-provider";
import type {
	ServiceLink,
	ServiceLinkRepository,
} from "../domain/service-link";
import { AuthService, type ProviderRegistry } from "./auth-service";

const calls: any = {};
let store: Map<string, ServiceLink>;
let links: ServiceLinkRepository;
let spotify: MusicProvider;
let providers: ProviderRegistry;
let service: AuthService;

beforeEach(() => {
	calls.spotify = {};
	store = new Map();
	links = {
		upsert: async (l) => {
			store.set(`${l.userId}:${l.provider}`, l);
		},
		find: async (userId, provider) =>
			store.get(`${userId}:${provider}`) ?? null,
	};
	spotify = {
		name: "spotify",
		getAuthUrl: (state) => `https://spotify.test/auth?state=${state}`,
		exchangeCodeForTokens: async (code) => {
			calls.spotify.exchanged = code;
			return {
				ok: true,
				value: {
					accessToken: "at",
					refreshToken: "rt",
					expiresAt: new Date(Date.now() + 60_000),
				},
			};
		},
		refreshTokens: async (rt) => {
			calls.spotify.refreshed = rt;
			return {
				ok: true,
				value: {
					accessToken: "at2",
					refreshToken: "rt2",
					expiresAt: new Date(Date.now() + 60_000),
				},
			};
		},
		listPlaylists: async () => ({ ok: true, value: [] }),
	};
	providers = { spotify, tidal: spotify };
	service = new AuthService(providers, links);
});

describe("AuthService", () => {
	it("returns provider auth url with state", () => {
		expect(service.startOAuth("spotify", "xyz")).toBe(
			"https://spotify.test/auth?state=xyz",
		);
	});

	it("persists link on successful oauth callback", async () => {
		const r = await service.completeOAuth({
			userId: "u_1",
			provider: "spotify",
			code: "abc",
		});
		expect(r.ok).toBe(true);
		expect(calls.spotify.exchanged).toBe("abc");
		expect(store.get("u_1:spotify")?.accessToken).toBe("at");
	});

	it("refreshes expired tokens before returning a link", async () => {
		store.set("u_1:spotify", {
			userId: "u_1",
			provider: "spotify",
			accessToken: "old",
			refreshToken: "rt",
			expiresAt: new Date(Date.now() - 1_000),
		});
		const r = await service.getValidLink("u_1", "spotify");
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.value.accessToken).toBe("at2");
		expect(calls.spotify.refreshed).toBe("rt");
	});

	it("returns auth_failed when user has no link", async () => {
		const r = await service.getValidLink("u_missing", "spotify");
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error.kind).toBe("auth_failed");
	});
});
