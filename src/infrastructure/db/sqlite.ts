import { Database } from "bun:sqlite";
import { type Migration, migrations } from "./migrations";

export function openDatabase(path: string): Database {
	const db = new Database(path);
	db.run("PRAGMA journal_mode = WAL;");
	db.run("PRAGMA foreign_keys = ON;");
	return db;
}

export async function closeDatabase(db: Database): Promise<void> {
	const filename = db.filename;
	try {
		db.run("PRAGMA wal_checkpoint(TRUNCATE);");
		db.run("PRAGMA journal_mode = DELETE;");
	} catch {}
	db.close(true);
	if (filename && filename !== ":memory:" && filename !== "") {
		for (const suffix of ["-wal", "-shm"]) {
			const sidecar = Bun.file(`${filename}${suffix}`);
			if (await sidecar.exists()) {
				try {
					await sidecar.delete();
				} catch {}
			}
		}
	}
}

export function runMigrations(db: Database): void {
	db.run(
		"CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);",
	);
	const applied = new Set(
		db
			.query<{ id: string }, []>("SELECT id FROM schema_migrations")
			.all()
			.map((r) => r.id),
	);
	const insert = db.prepare(
		"INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
	);
	try {
		const apply = db.transaction((m: Migration) => {
			db.run(m.sql);
			insert.run(m.id, new Date().toISOString());
		});
		for (const m of migrations) {
			if (applied.has(m.id)) continue;
			apply(m);
		}
	} finally {
		insert.finalize();
	}
}
