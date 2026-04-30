export type ProviderName = "spotify" | "tidal";

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
