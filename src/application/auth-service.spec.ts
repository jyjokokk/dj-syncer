import { beforeEach, describe, expect, it } from "bun:test";
import type { MusicProvider } from "../domain/music-provider";
import type { OAuthStateStore, PendingOAuth } from "../domain/oauth-state";
import type {
	ServiceLink,
	ServiceLinkRepository,
} from "../domain/service-link";
import { AuthService, type ProviderRegistry } from "./auth-service";

const calls: any = {};
let store: Map<string, ServiceLink>;
let stateStore: Map<string, PendingOAuth>;
const links: ServiceLinkRepository = {
	upsert: async (l) => {
		store.set(`${l.userId}:${l.provider}`, l);
	},
	find: async (userId, provider) => store.get(`${userId}:${provider}`) ?? null,
};
const states: OAuthStateStore = {
	create: async (state, pending) => void stateStore.set(state, pending),
	consume: async (state) => {
		const pending = stateStore.get(state) ?? null;
		if (pending) stateStore.delete(state);
		return pending;
	},
};
const spotify = {
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
} as MusicProvider;
let providers: ProviderRegistry;
let service: AuthService;

beforeEach(() => {
	calls.spotify = {};
	store = new Map();
	stateStore = new Map();
	providers = { spotify, tidal: spotify };
	service = new AuthService(providers, links, states);
});

describe("AuthService", () => {
	it("returns provider auth url with a server-minted state bound to the user", async () => {
		const { authUrl, state } = await service.startOAuth("spotify", "u_1");
		expect(authUrl).toBe(`https://spotify.test/auth?state=${state}`);
		expect(stateStore.get(state)).toEqual({
			userId: "u_1",
			provider: "spotify",
		});
	});

	it("persists link on successful oauth callback", async () => {
		const { state } = await service.startOAuth("spotify", "u_1");
		const r = await service.completeOAuth("spotify", state, "abc");
		expect(r.ok).toBe(true);
		expect(calls.spotify.exchanged).toBe("abc");
		expect(store.get("u_1:spotify")?.accessToken).toBe("at");
	});

	it("rejects callback when state is unknown", async () => {
		const r = await service.completeOAuth("spotify", "nope", "abc");
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error.kind).toBe("invalid_state");
		expect(calls.spotify.exchanged).toBeUndefined();
	});

	it("rejects callback when state is replayed", async () => {
		const { state } = await service.startOAuth("spotify", "u_1");
		await service.completeOAuth("spotify", state, "abc");
		const r = await service.completeOAuth("spotify", state, "abc");
		expect(r.ok).toBe(false);
	});

	it("rejects callback when provider does not match the one state was issued for", async () => {
		const { state } = await service.startOAuth("spotify", "u_1");
		const r = await service.completeOAuth("tidal", state, "abc");
		expect(r.ok).toBe(false);
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

	it("returns no_link when user has no link", async () => {
		const r = await service.getValidLink("u_missing", "spotify");
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error.kind).toBe("no_link");
	});
});
