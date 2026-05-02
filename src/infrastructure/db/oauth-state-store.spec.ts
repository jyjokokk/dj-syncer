import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it } from "bun:test";
import type { PendingOAuth } from "../../domain/oauth-state";
import { SqliteOAuthStateStore } from "./oauth-state-store";
import { runMigrations } from "./sqlite";

const pending: PendingOAuth = { userId: "user-1", provider: "spotify" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let db: Database = null!;
let store: SqliteOAuthStateStore = null!;

beforeEach(() => {
	db = new Database(":memory:");
	runMigrations(db);
	store = new SqliteOAuthStateStore(db, 5);
});

describe("SqliteOAuthStateStore", () => {
	it("returns the pending data on fresh consume", async () => {
		await store.create("state-a", pending);
		expect(await store.consume("state-a")).toEqual(pending);
	});

	it("returns null on second consume of the same state", async () => {
		await store.create("state-a", pending);
		await store.consume("state-a");
		expect(await store.consume("state-a")).toBeNull();
	});

	it("deletes the row after a successful consume", async () => {
		await store.create("state-a", pending);
		await store.consume("state-a");
		const row = db
			.query("SELECT state FROM oauth_state WHERE state = ?")
			.get("state-a");
		expect(row).toBeNull();
	});

	it("returns null when consuming an unknown state", async () => {
		expect(await store.consume("missing")).toBeNull();
	});

	it("only one of two concurrent consumes wins", async () => {
		await store.create("state-a", pending);
		const [a, b] = await Promise.all([
			store.consume("state-a"),
			store.consume("state-a"),
		]);
		const winners = [a, b].filter((r) => r !== null);
		expect(winners).toHaveLength(1);
		expect(winners[0]).toEqual(pending);
	});

	it("throws when create is called with a duplicate state", async () => {
		await store.create("state-a", pending);
		expect(store.create("state-a", pending)).rejects.toThrow();
	});

	it("returns null and removes the row when entry is expired", async () => {
		await store.create("state-a", pending);
		await sleep(10);
		expect(await store.consume("state-a")).toBeNull();
		const row = db
			.query("SELECT state FROM oauth_state WHERE state = ?")
			.get("state-a");
		expect(row).toBeNull();
	});

	it("sweeps expired entries opportunistically on create", async () => {
		await store.create("state-a", pending);
		await sleep(10);
		await store.create("state-b", { userId: "user-2", provider: "spotify" });
		const row = db
			.query("SELECT state FROM oauth_state WHERE state = ?")
			.get("state-a");
		expect(row).toBeNull();
	});
});
