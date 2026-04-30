import type { AuthService } from "../../../application/auth-service";
import { isProvider } from "../../../utils/provider-utils";

export function authRoutes(auth: AuthService) {
	return {
		"/auth/:provider/start": {
			GET: (req: Bun.BunRequest<"/auth/:provider/start">) => {
				if (!isProvider(req.params.provider)) {
					return Response.json({ error: "unknown_provider" }, { status: 404 });
				}
				const url = new URL(req.url);
				const state = url.searchParams.get("state") ?? crypto.randomUUID();
				const authUrl = auth.startOAuth(req.params.provider, state);
				return Response.json({ authUrl, state });
			},
		},
		"/auth/:provider/callback": {
			GET: async (req: Bun.BunRequest<"/auth/:provider/callback">) => {
				if (!isProvider(req.params.provider)) {
					return Response.json({ error: "unknown_provider" }, { status: 404 });
				}
				const url = new URL(req.url);
				const code = url.searchParams.get("code");
				const userId = url.searchParams.get("state");
				if (!code || !userId) {
					return Response.json({ error: "missing_params" }, { status: 400 });
				}
				const result = await auth.completeOAuth({
					userId,
					provider: req.params.provider,
					code,
				});
				if (!result.ok) {
					return Response.json({ error: result.error }, { status: 400 });
				}
				return Response.json({ ok: true });
			},
		},
	};
}
