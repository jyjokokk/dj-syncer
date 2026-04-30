import { PROVIDERS } from "../constants";
import type { ProviderName } from "../domain/service-link";

export const isProvider = (s: string): s is ProviderName =>
	PROVIDERS.includes(s as ProviderName) as boolean;
