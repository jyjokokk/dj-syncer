import { beforeEach, describe, expect, it } from "bun:test";
import type { PendingOAuth } from "../domain/oauth-state";
import { InMemoryOAuthStateStore } from "./oauth-state-store";

const pending: PendingOAuth = { userId: "user-1", provider: "spotify" };

let store: InMemoryOAuthStateStore = null!;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
	store = new InMemoryOAuthStateStore(5);
});

describe("InMemoryOAuthStateStore", () => {
	it("evicts expired entries opportunistically on create", async () => {
		await store.create("state-a", pending);
		await sleep(10);
		await store.create("state-b", { userId: "user-2", provider: "spotify" });
		expect(await store.consume("state-a")).toBeNull();
	});

	it("returns null when consuming an expired entry", async () => {
		await store.create("state-a", pending);
		await sleep(10);
		expect(await store.consume("state-a")).toBeNull();
	});

	it("returns the pending data on fresh consume and removes it", async () => {
		await store.create("state-a", pending);
		expect(await store.consume("state-a")).toEqual(pending);
		expect(await store.consume("state-a")).toBeNull();
	});
});
