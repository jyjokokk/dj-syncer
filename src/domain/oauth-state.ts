import type { ProviderName } from "./service-link";

export type PendingOAuth = {
	userId: string;
	provider: ProviderName;
};

export interface OAuthStateStore {
	create(state: string, pending: PendingOAuth): Promise<void>;
	consume(state: string): Promise<PendingOAuth | null>;
}
