import { PROVIDERS } from "../constants";
import type { ProviderName } from "../domain/service-link";

export const isProvider = (s: string): s is ProviderName =>
	(PROVIDERS as readonly string[]).includes(s);
