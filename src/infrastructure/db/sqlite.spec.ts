import { afterEach, describe, expect, it } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, openDatabase, runMigrations } from "./sqlite";

const created: string[] = [];

function tmpDbPath(): string {
	const path = join(tmpdir(), `dj-syncer-test-${crypto.randomUUID()}.sqlite3`);
	created.push(path);
	return path;
}

afterEach(async () => {
	while (created.length > 0) {
		const path = created.pop();
		if (!path) continue;
		for (const suffix of ["", "-wal", "-shm"]) {
			const file = Bun.file(`${path}${suffix}`);
			if (await file.exists()) {
				try {
					await file.delete();
				} catch {}
			}
		}
	}
});

describe("closeDatabase", () => {
	it("removes -wal and -shm sidecar files after a clean shutdown", async () => {
		const path = tmpDbPath();
		const db = openDatabase(path);
		runMigrations(db);
		db.run(
			"CREATE TABLE IF NOT EXISTS sidecar_probe (id INTEGER PRIMARY KEY, value TEXT NOT NULL);",
		);
		db.run("INSERT INTO sidecar_probe (value) VALUES (?);", ["hello"]);

		expect(await Bun.file(`${path}-wal`).exists()).toBe(true);

		await closeDatabase(db);

		expect(await Bun.file(path).exists()).toBe(true);
		expect(await Bun.file(`${path}-wal`).exists()).toBe(false);
		expect(await Bun.file(`${path}-shm`).exists()).toBe(false);
	});
});
