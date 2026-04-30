import type { AuthService } from "../../../application/auth-service";
import { isProvider } from "../../../utils/provider-utils";

export function authRoutes(auth: AuthService) {
	return {
		"/auth/:provider/start": {
			GET: async (req: Bun.BunRequest<"/auth/:provider/start">) => {
				if (!isProvider(req.params.provider)) {
					return Response.json({ error: "unknown_provider" }, { status: 404 });
				}
				const url = new URL(req.url);
				const userId = url.searchParams.get("userId");
				if (!userId) {
					return Response.json({ error: "missing_user_id" }, { status: 400 });
				}
				const result = await auth.startOAuth(req.params.provider, userId);
				return Response.json(result);
			},
		},
		"/auth/:provider/callback": {
			GET: async (req: Bun.BunRequest<"/auth/:provider/callback">) => {
				if (!isProvider(req.params.provider)) {
					return Response.json({ error: "unknown_provider" }, { status: 404 });
				}
				const url = new URL(req.url);
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");
				if (!code || !state) {
					return Response.json({ error: "missing_params" }, { status: 400 });
				}
				const result = await auth.completeOAuth(
					req.params.provider,
					state,
					code,
				);
				if (!result.ok) {
					return Response.json({ error: result.error }, { status: 400 });
				}
				return Response.json({ ok: true });
			},
		},
	};
}
