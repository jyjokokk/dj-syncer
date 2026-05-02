import type { ProviderError } from "../domain/music-provider";

export type AuthUseCaseError =
	| { kind: "no_link" }
	| { kind: "token_expired" }
	| { kind: "invalid_state" }
	| { kind: "provider_error"; cause: ProviderError };

export type PlaylistUseCaseError = AuthUseCaseError;
