import { z } from "zod";
import type { UserService } from "../../../application/user-service";

const CreateBody = z.object({ email: z.email() });

export function userRoutes(users: UserService) {
	return {
		"/users": {
			POST: async (req: Request) => {
				const parsed = CreateBody.safeParse(await req.json().catch(() => ({})));
				if (!parsed.success) {
					return Response.json({ error: "invalid_body" }, { status: 400 });
				}
				const result = await users.createUser(parsed.data);
				if (!result.ok) {
					return Response.json({ error: result.error }, { status: 409 });
				}
				return Response.json(result.value, { status: 201 });
			},
		},
		"/users/:id": {
			GET: async (req: Bun.BunRequest<"/users/:id">) => {
				const user = await users.getUser(req.params.id);
				if (!user)
					return Response.json({ error: "not_found" }, { status: 404 });
				return Response.json(user);
			},
		},
	};
}
