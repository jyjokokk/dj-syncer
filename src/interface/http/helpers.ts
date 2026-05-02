import type { AuthUseCaseError } from "../../application/errors";
import { isProvider, type ProviderName } from "../../domain/service-link";

export function requireProvider(s: string): ProviderName | Response {
	if (!isProvider(s)) {
		return Response.json({ error: "unknown_provider" }, { status: 404 });
	}
	return s;
}

export function authErrorResponse(err: AuthUseCaseError): Response {
	switch (err.kind) {
		case "invalid_state":
			return Response.json({ error: "invalid_state" }, { status: 400 });
		case "no_link":
			return Response.json({ error: "no_link" }, { status: 404 });
		case "token_expired":
			return Response.json({ error: "token_expired" }, { status: 401 });
		case "provider_error":
			console.error("provider_error", err.cause);
			return Response.json({ error: "provider_error" }, { status: 502 });
	}
}
