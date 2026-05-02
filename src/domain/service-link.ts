export const PROVIDERS = ["spotify", "tidal"] as const;
export type ProviderName = (typeof PROVIDERS)[number];
export const isProvider = (s: string): s is ProviderName =>
	(PROVIDERS as readonly string[]).includes(s);

export type ServiceLink = {
	userId: string;
	provider: ProviderName;
	accessToken: string;
	refreshToken: string | null;
	expiresAt: Date | null;
};

export interface ServiceLinkRepository {
	upsert(link: ServiceLink): Promise<void>;
	find(userId: string, provider: ProviderName): Promise<ServiceLink | null>;
}
