type TokenResponse = {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
};

type PlaylistsResponse = {
	items: Array<{
		id: string;
		name: string;
		tracks: { total: number };
	}>;
};

export type SpotifyFakeCall = {
	url: string;
	method: string;
	headers: Record<string, string>;
	body: string | null;
};

export type SpotifyFake = {
	fetch: typeof fetch;
	calls: SpotifyFakeCall[];
	setTokenResponse: (res: TokenResponse) => void;
	setPlaylistsResponse: (res: PlaylistsResponse) => void;
};

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const PLAYLISTS_URL = "https://api.spotify.com/v1/me/playlists";

export function createSpotifyFake(): SpotifyFake {
	let tokenResponse: TokenResponse = {
		access_token: "test-access-token",
		refresh_token: "test-refresh-token",
		expires_in: 3600,
	};
	let playlistsResponse: PlaylistsResponse = {
		items: [
			{ id: "p1", name: "Playlist One", tracks: { total: 12 } },
			{ id: "p2", name: "Playlist Two", tracks: { total: 7 } },
		],
	};
	const calls: SpotifyFakeCall[] = [];

	const fakeFetch = (async (
		input: Parameters<typeof fetch>[0],
		init?: Parameters<typeof fetch>[1],
	) => {
		const url =
			typeof input === "string"
				? input
				: input instanceof URL
					? input.toString()
					: input.url;
		const method = (init?.method ?? "GET").toUpperCase();
		const headers: Record<string, string> = {};
		const rawHeaders = init?.headers;
		if (rawHeaders) {
			const normalized = new Headers(
				rawHeaders as ConstructorParameters<typeof Headers>[0],
			);
			normalized.forEach((v, k) => {
				headers[k.toLowerCase()] = v;
			});
		}
		let body: string | null = null;
		if (init?.body != null) {
			if (typeof init.body === "string") body = init.body;
			else if (init.body instanceof URLSearchParams)
				body = init.body.toString();
			else
				throw new Error(
					`spotify-fake: unsupported body type ${Object.prototype.toString.call(init.body)}`,
				);
		}
		calls.push({ url, method, headers, body });

		if (url === TOKEN_URL) {
			return Response.json(tokenResponse);
		}
		if (url === PLAYLISTS_URL || url.startsWith(`${PLAYLISTS_URL}?`)) {
			return Response.json(playlistsResponse);
		}
		throw new Error(`spotify-fake: unrecognized URL ${url}`);
	}) as typeof fetch;

	return {
		fetch: fakeFetch,
		calls,
		setTokenResponse: (res) => {
			tokenResponse = res;
		},
		setPlaylistsResponse: (res) => {
			playlistsResponse = res;
		},
	};
}
