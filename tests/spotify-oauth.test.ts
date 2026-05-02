import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import { buildApp } from "../src/app";
import type { Env } from "../src/config/env";
import { createSpotifyFake, type SpotifyFake } from "./helpers/spotify-fake";

const env: Env = {
	PORT: 0,
	DB_PATH: ":memory:",
	SPOTIFY_CLIENT_ID: "test-client-id",
	SPOTIFY_CLIENT_SECRET: "test-client-secret",
	SPOTIFY_REDIRECT_URI: "http://127.0.0.1/auth/spotify/callback",
};

let baseUrl: string;
let app: ReturnType<typeof buildApp>;
let spotifyFake: SpotifyFake;

beforeAll(() => {
	spotifyFake = createSpotifyFake();
	app = buildApp(env, { spotifyFetch: spotifyFake.fetch });
	baseUrl = `http://127.0.0.1:${app.server.port}`;
});

beforeEach(() => {
	spotifyFake.calls.length = 0;
});

afterAll(() => {
	app.server.stop(true);
	app.db.close();
});

async function createUser(email: string): Promise<string> {
	const res = await fetch(`${baseUrl}/users`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email }),
	});
	expect(res.status).toBe(201);
	const user = (await res.json()) as { id: string };
	return user.id;
}

describe("Spotify OAuth + playlists (integration)", () => {
	it("walks the full oauth + playlists flow", async () => {
		const userId = await createUser("happy@test.dev");

		const startRes = await fetch(
			`${baseUrl}/auth/spotify/start?userId=${encodeURIComponent(userId)}`,
		);
		expect(startRes.status).toBe(200);
		const { authUrl, state } = (await startRes.json()) as {
			authUrl: string;
			state: string;
		};
		const authParams = new URL(authUrl).searchParams;
		expect(authParams.get("client_id")).toBe("test-client-id");
		expect(authParams.get("state")).toBe(state);
		expect(authParams.get("scope")).toBe(
			"playlist-read-private playlist-read-collaborative",
		);

		const callbackRes = await fetch(
			`${baseUrl}/auth/spotify/callback?code=auth-code-xyz&state=${encodeURIComponent(state)}`,
		);
		expect(callbackRes.status).toBe(200);
		expect(await callbackRes.json()).toEqual({ ok: true });

		const tokenCall = spotifyFake.calls.find(
			(c) => c.url === "https://accounts.spotify.com/api/token",
		);
		expect(tokenCall).toBeDefined();
		expect(tokenCall?.method).toBe("POST");
		const tokenBody = new URLSearchParams(tokenCall?.body ?? "");
		expect(tokenBody.get("grant_type")).toBe("authorization_code");
		expect(tokenBody.get("code")).toBe("auth-code-xyz");
		const expectedBasic = Buffer.from(
			"test-client-id:test-client-secret",
		).toString("base64");
		expect(tokenCall?.headers.authorization).toBe(`Basic ${expectedBasic}`);

		const playlistsRes = await fetch(
			`${baseUrl}/users/${encodeURIComponent(userId)}/playlists/spotify`,
		);
		expect(playlistsRes.status).toBe(200);
		const playlists = await playlistsRes.json();
		expect(playlists).toEqual([
			{
				provider: "spotify",
				providerPlaylistId: "p1",
				name: "Playlist One",
				trackCount: 12,
			},
			{
				provider: "spotify",
				providerPlaylistId: "p2",
				name: "Playlist Two",
				trackCount: 7,
			},
		]);

		const playlistsCall = spotifyFake.calls.find((c) =>
			c.url.startsWith("https://api.spotify.com/v1/me/playlists"),
		);
		expect(playlistsCall?.headers.authorization).toBe(
			"Bearer test-access-token",
		);
	});

	it("rejects callback with unknown state and never calls the token endpoint", async () => {
		const res = await fetch(
			`${baseUrl}/auth/spotify/callback?code=whatever&state=not-a-real-state`,
		);
		expect(res.status).toBe(400);
		expect(
			spotifyFake.calls.filter(
				(c) => c.url === "https://accounts.spotify.com/api/token",
			),
		).toHaveLength(0);
	});
});
