import type { ProviderName } from "./domain/service-link";

export const PROVIDERS: ReadonlyArray<ProviderName> = [
	"spotify",
	"tidal",
] as const;
