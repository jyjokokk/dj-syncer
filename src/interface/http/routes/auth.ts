import type { AuthService } from "../../../application/auth-service";
import { authErrorResponse, requireProvider } from "../helpers";

export function authRoutes(auth: AuthService) {
	return {
		"/auth/:provider/start": {
			GET: async (req: Bun.BunRequest<"/auth/:provider/start">) => {
				const provider = requireProvider(req.params.provider);
				if (provider instanceof Response) return provider;
				const url = new URL(req.url);
				const userId = url.searchParams.get("userId");
				if (!userId) {
					return Response.json({ error: "missing_user_id" }, { status: 400 });
				}
				const result = await auth.startOAuth(provider, userId);
				return Response.json(result);
			},
		},
		"/auth/:provider/callback": {
			GET: async (req: Bun.BunRequest<"/auth/:provider/callback">) => {
				const provider = requireProvider(req.params.provider);
				if (provider instanceof Response) return provider;
				const url = new URL(req.url);
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");
				if (!code || !state) {
					return Response.json({ error: "missing_params" }, { status: 400 });
				}
				const result = await auth.completeOAuth(provider, state, code);
				if (!result.ok) return authErrorResponse(result.error);
				return Response.json({ ok: true });
			},
		},
	};
}
