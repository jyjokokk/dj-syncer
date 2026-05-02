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
					switch (result.error.kind) {
						case "invalid_state":
							return Response.json({ error: "invalid_state" }, { status: 400 });
						case "no_link":
							return Response.json({ error: "no_link" }, { status: 404 });
						case "token_expired":
							return Response.json({ error: "token_expired" }, { status: 401 });
						case "provider_error":
							console.error("provider_error", result.error.cause);
							return Response.json(
								{ error: "provider_error" },
								{ status: 502 },
							);
					}
				}
				return Response.json({ ok: true });
			},
		},
	};
}
