import { beforeEach, describe, expect, it } from "bun:test";
import type { NewUser, User, UserRepository } from "../domain/user";
import { UserService } from "./user-service";

const calls: any = {};
const repo = {
	create: async (u: NewUser) => {
		calls.user.created = u;
		stored = {
			id: "u_1",
			email: u.email,
			createdAt: new Date("2026-01-01T00:00:00Z"),
		};
		return stored;
	},
	findById: async (id: string) => {
		calls.user.findById = id;
		return stored;
	},
	findByEmail: async (email: string) => {
		calls.user.findByEmail = email;
		return stored?.email === email ? stored : null;
	},
} as UserRepository;
let service: UserService;
let stored: User | null;

beforeEach(() => {
	calls.user = {};
	stored = null;
	service = new UserService(repo);
});

describe("UserService", () => {
	it("creates a new user when email is unknown", async () => {
		const u = await service.createUser({ email: "a@b.test" });
		expect(u.email).toBe("a@b.test");
		expect(calls.user.created).toEqual({ email: "a@b.test" });
	});

	it("returns existing user when email already registered", async () => {
		await service.createUser({ email: "a@b.test" });
		calls.user.created = undefined;
		const again = await service.createUser({ email: "a@b.test" });
		expect(again.id).toBe("u_1");
		expect(calls.user.created).toBeUndefined();
	});

	it("looks users up by id", async () => {
		await service.createUser({ email: "a@b.test" });
		const u = await service.getUser("u_1");
		expect(u?.email).toBe("a@b.test");
		expect(calls.user.findById).toBe("u_1");
	});
});
