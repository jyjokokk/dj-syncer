# Plan: Backend Project Scaffolding

## Context

The repo currently contains only a placeholder `src/index.ts` with toy `add`/`subtract` functions and an unused `UserService`. To build the DJ Playlist Syncer backend (per `README.md`), we need a basic clean-architecture skeleton that supports the three load-bearing capabilities:

1. **User management** — create/identify users (auth comes later; for now a minimal user record).
2. **Service authentication** — OAuth flows for Spotify and Tidal, with persisted tokens per user.
3. **Playlist retrieval** — fetch a user's playlists from each linked service through a uniform interface.

The goal is *basic structure, not full feature implementation*. Each layer gets just enough wiring to prove the architecture works end-to-end for one slice (e.g. "list a user's Spotify playlists"). Other features can be added later by following the same shape.

## Architecture (Clean Architecture, 4 layers)

```
src/
├── index.ts                    # Bun.serve() entrypoint — wires deps, mounts routes
├── config/
│   └── env.ts                  # Zod-validated env (PORT, DB_PATH, SPOTIFY_*, TIDAL_*)
├── domain/                     # Pure types + repository interfaces. No I/O.
│   ├── user.ts                 # User entity + UserRepository interface
│   ├── service-link.ts         # ServiceLink entity (userId, provider, tokens) + repo iface
│   ├── playlist.ts             # Playlist + Track entities (provider-agnostic shape)
│   └── music-provider.ts       # MusicProvider interface (getAuthUrl, exchangeCode, listPlaylists)
├── application/                # Use cases. Depend only on domain interfaces.
│   ├── user-service.ts         # createUser, getUser
│   ├── auth-service.ts         # startOAuth, completeOAuth (delegates to MusicProvider + repo)
│   └── playlist-service.ts     # listPlaylistsForUser(userId, provider)
├── infrastructure/             # Concrete adapters. The only layer that touches libs.
│   ├── db/
│   │   ├── sqlite.ts           # bun:sqlite Database singleton + migrations runner
│   │   ├── migrations/001_init.sql
│   │   ├── user-repository.ts
│   │   └── service-link-repository.ts
│   └── providers/
│       ├── spotify-provider.ts # implements MusicProvider via Spotify Web API
│       └── tidal-provider.ts   # implements MusicProvider via Tidal API
└── interface/
    └── http/
        ├── server.ts           # Bun.serve() with route table
        └── routes/
            ├── users.ts        # POST /users, GET /users/:id
            ├── auth.ts         # GET /auth/:provider/start, GET /auth/:provider/callback
            └── playlists.ts    # GET /users/:id/playlists/:provider
```

### Key design choices

- **Domain has zero dependencies** — pure TS types and interfaces. Use discriminated unions for errors (Result types) per `ts-dev.md`.
- **`MusicProvider` interface** is the seam that lets us add Apple Music later without touching `application/`. Each provider exposes the same shape: `{ name, getAuthUrl(state), exchangeCodeForTokens(code), refreshTokens(refreshToken), listPlaylists(accessToken) }`.
- **Token storage**: `service_links` table keyed by `(user_id, provider)` storing `access_token`, `refresh_token`, `expires_at`. `auth-service` handles refresh transparently before calling provider.
- **Composition root** is `src/index.ts` — instantiates DB, repos, providers, services, then passes the service bag to `server.ts`. No DI framework needed; constructor injection is enough and matches the test style in `ts-dev.md`.
- **Biome + Zod already installed**; no new deps for the scaffold itself. Real provider HTTP calls can use `fetch` (built into Bun) — no SDK needed.

## Files to create

Critical (must exist for the scaffold to run):

- `src/config/env.ts`
- `src/domain/user.ts`, `service-link.ts`, `playlist.ts`, `music-provider.ts`
- `src/application/user-service.ts`, `auth-service.ts`, `playlist-service.ts`
- `src/infrastructure/db/sqlite.ts` + `migrations/001_init.sql`
- `src/infrastructure/db/user-repository.ts`, `service-link-repository.ts`
- `src/infrastructure/providers/spotify-provider.ts` (Tidal can be a stub returning `notImplemented` for now to prove the interface)
- `src/interface/http/server.ts` + `routes/users.ts`, `auth.ts`, `playlists.ts`
- `src/index.ts` — replace toy code with composition root

Co-located tests (`.spec.ts`) for `user-service`, `auth-service`, `playlist-service` using the DI-based test-double style from `ts-dev.md`. Skip tests for thin adapters and routes in this scaffold pass.

## Files to remove / replace

- `src/index.ts` — toy `add`/`subtract`/`UserService` get deleted; replaced by composition root.
- `src/index.spec.ts` — delete; replaced by per-service `.spec.ts` files.

## Verification

1. `bun install` — no new deps expected.
2. `bun run lint` — Biome clean.
3. `bun test` — all service specs pass with injected fakes.
4. `bun run dev` — server starts on `PORT`, DB migrations run, `GET /users/:id` returns 404 for unknown user, `POST /users` creates one, `GET /auth/spotify/start` returns a redirect URL.
5. SQLite check: `sqlite3 database.sqlite3 ".tables"` shows `users` and `service_links`.

End-to-end smoke (manual, requires real Spotify creds in `.env`): hit `/auth/spotify/start`, complete the redirect, then `GET /users/:id/playlists/spotify` returns playlists.

## Out of scope for this scaffold

- Actual fuzzy matching algorithm (README feature)
- Cross-service playlist migration use case
- Apple Music provider (interface is ready; concrete adapter later)
- Session/cookie auth for the *user* (separate from *service* OAuth) — assume `userId` is passed in the URL for now
- Tidal provider beyond a stub
