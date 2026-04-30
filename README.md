# DJ Playlist Syncer (Backend)

> Backend for the DJ Playlist Syncer application

Sync, view, and combine your playlists across streaming services like Tidal, Spotify, and Apple Music.

In addition to copying playlists from one service to another, you can view, merge, and edit playlists across services from a single place.

## Getting Started

1. Create an account.
2. Link each streaming service via OAuth.
3. Browse your playlists per service, then migrate or modify them as needed.

## Features

- Cross-service playlist migration
- Unified view across linked services
- Playlist merging and editing
- Fuzzy track matching with user confirmation (see below)

### Fuzzy track matching

If an exact Artist + Song match isn't available on the target service, the syncer searches the artist's catalogue for a near-match and prompts you before adding it.

For example, if Tidal has *"Megaminds — Summer Sky (Live in Leipzig)"* and Spotify only has *"Megamind — Summer Sky (Live)"*, you'll be asked whether to add the Spotify version. If no near-match is found, the track is skipped.

This behaviour can be disabled in settings.

## Development

This project uses [Bun](https://bun.sh).

```sh
bun install
bun run dev      # run with --watch
bun test         # run tests
bun run lint     # biome check
bun run format   # biome format --write
```

## License

MIT — see [LICENSE](./LICENSE).
