import { buildApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import type { ProviderError } from "../src/domain/music-provider";

const STATE_FILE = ".smoke-state.json";
const DB_PATH = ".smoke.sqlite3";
const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

type SmokeState = { userId: string };

async function readState(): Promise<SmokeState | null> {
	const file = Bun.file(STATE_FILE);
	if (!(await file.exists())) return null;
	try {
		const data = (await file.json()) as Partial<SmokeState>;
		if (typeof data.userId === "string" && data.userId.length > 0) {
			return { userId: data.userId };
		}
		return null;
	} catch {
		return null;
	}
}

async function writeState(state: SmokeState): Promise<void> {
	await Bun.write(STATE_FILE, JSON.stringify(state, null, 2));
}

function explainSpotifyError(status: number, body: string): string | null {
	const lower = body.toLowerCase();
	if (lower.includes("redirect_uri_mismatch")) {
		return "Spotify rejected the redirect URI. Update your Spotify app dashboard to include SPOTIFY_REDIRECT_URI exactly.";
	}
	if (lower.includes("invalid_client")) {
		return "Spotify rejected the client credentials. Double-check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.";
	}
	if (status === 401) {
		return "Spotify returned 401 — token may be invalid or scopes insufficient.";
	}
	return null;
}

const loggingFetch: typeof fetch = (async (input, init) => {
	const res = await fetch(input as Parameters<typeof fetch>[0], init);
	if (!res.ok) {
		const body = await res.clone().text();
		const url =
			typeof input === "string"
				? input
				: input instanceof URL
					? input.toString()
					: input.url;
		console.error(`[spotify ${res.status}] ${url}\n${body.slice(0, 500)}`);
		const hint = explainSpotifyError(res.status, body);
		if (hint) console.error(`hint: ${hint}`);
	}
	return res;
}) as typeof fetch;

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

function formatError(e: ProviderError): string {
	return "message" in e ? `${e.kind}: ${e.message}` : e.kind;
}

async function main(): Promise<number> {
	const baseEnv = loadEnv();

	if (!baseEnv.SPOTIFY_CLIENT_ID || !baseEnv.SPOTIFY_CLIENT_SECRET) {
		console.error(
			"SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in the environment.",
		);
		return 1;
	}

	const env = { ...baseEnv, DB_PATH };
	const app = buildApp(env, { spotifyFetch: loggingFetch });
	console.log(`smoke server listening on :${app.server.port}`);
	const redirectUri =
		baseEnv.SPOTIFY_REDIRECT_URI ??
		`http://localhost:${app.server.port}/auth/spotify/callback`;
	console.log(`redirect_uri: ${redirectUri}`);

	try {
		const cached = await readState();
		if (cached) {
			console.log(`trying cached user ${cached.userId}…`);
			const existing = await app.services.auth.findLink(
				cached.userId,
				"spotify",
			);
			if (existing) {
				const result = await app.services.playlists.listPlaylistsForUser(
					cached.userId,
					"spotify",
				);
				if (result.ok) {
					console.log(
						`OK — refresh + playlists succeeded, ${result.value.length} playlists fetched`,
					);
					return 0;
				}
				console.warn(
					`cached path failed (${formatError(result.error)}); falling through to full OAuth`,
				);
			} else {
				console.warn(
					"cached userId has no service link; falling through to full OAuth",
				);
			}
		}

		// Reuse the cached userId on fall-through so a fresh OAuth upserts over the dead link.
		const userId =
			cached?.userId ??
			(
				await app.services.users.createUser({
					email: `smoke+${Date.now()}@dj-syncer.local`,
				})
			).id;

		const { authUrl } = await app.services.auth.startOAuth("spotify", userId);
		console.log("");
		console.log("=".repeat(72));
		console.log(
			"Open this URL in your browser, approve, and the script will continue automatically.",
		);
		console.log(authUrl);
		console.log("=".repeat(72));
		console.log("");

		const deadline = Date.now() + POLL_TIMEOUT_MS;
		let link = await app.services.auth.findLink(userId, "spotify");
		while (!link && Date.now() < deadline) {
			await sleep(POLL_INTERVAL_MS);
			link = await app.services.auth.findLink(userId, "spotify");
		}
		if (!link) {
			console.error(
				`timed out after ${POLL_TIMEOUT_MS / 1000}s waiting for OAuth callback`,
			);
			return 2;
		}

		const playlists = await app.services.playlists.listPlaylistsForUser(
			userId,
			"spotify",
		);
		if (!playlists.ok) {
			console.error(`playlist fetch failed: ${formatError(playlists.error)}`);
			return 3;
		}

		console.log(`fetched ${playlists.value.length} playlists; first 5:`);
		for (const p of playlists.value.slice(0, 5)) {
			console.log(`  - ${p.name} (${p.trackCount} tracks)`);
		}

		await writeState({ userId });
		console.log(`cached userId in ${STATE_FILE} for next run`);
		return 0;
	} finally {
		await app.close();
	}
}

const code = await main();
process.exit(code);
