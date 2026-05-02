import { beforeEach, describe, expect, it } from "bun:test";
import type { NewUser, User, UserRepository } from "../domain/user";
import { err, ok } from "../utils/result";
import { UserService } from "./user-service";

const calls: any = {};
const repo = {
	create: async (u: NewUser) => {
		calls.user.created = u;
		if (stored?.email === u.email) return err("email_conflict");
		stored = {
			id: "u_1",
			email: u.email,
			createdAt: new Date("2026-01-01T00:00:00Z"),
		};
		return ok(stored);
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
		const result = await service.createUser({ email: "a@b.test" });
		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("unreachable");
		expect(result.value.email).toBe("a@b.test");
		expect(calls.user.created).toEqual({ email: "a@b.test" });
	});

	it("returns email_conflict when precheck finds existing user", async () => {
		await service.createUser({ email: "a@b.test" });
		calls.user.created = undefined;
		const again = await service.createUser({ email: "a@b.test" });
		expect(again.ok).toBe(false);
		if (again.ok) throw new Error("unreachable");
		expect(again.error).toBe("email_conflict");
		expect(calls.user.created).toBeUndefined();
	});

	it("propagates email_conflict from the repository (race-safe)", async () => {
		// Simulate the precheck missing a concurrently-created row by
		// pre-populating stored without going through findByEmail's view.
		const racingRepo = {
			...repo,
			findByEmail: async () => null,
		} as UserRepository;
		const racingService = new UserService(racingRepo);
		stored = {
			id: "u_existing",
			email: "race@b.test",
			createdAt: new Date("2026-01-01T00:00:00Z"),
		};
		const result = await racingService.createUser({ email: "race@b.test" });
		expect(result.ok).toBe(false);
		if (result.ok) throw new Error("unreachable");
		expect(result.error).toBe("email_conflict");
	});

	it("looks users up by id", async () => {
		await service.createUser({ email: "a@b.test" });
		const u = await service.getUser("u_1");
		expect(u?.email).toBe("a@b.test");
		expect(calls.user.findById).toBe("u_1");
	});
});
