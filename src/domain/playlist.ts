import type { ProviderName } from "./service-link";

export type Track = {
	providerTrackId: string;
	title: string;
	artists: string[];
	durationMs: number;
};

export type Playlist = {
	provider: ProviderName;
	providerPlaylistId: string;
	name: string;
	trackCount: number;
};
