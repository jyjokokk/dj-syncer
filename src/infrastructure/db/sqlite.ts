import { Database } from "bun:sqlite";

export function openDatabase(path: string): Database {
	const db = new Database(path);
	db.exec("PRAGMA journal_mode = WAL;");
	db.exec("PRAGMA foreign_keys = ON;");
	return db;
}

export async function runMigrations(db: Database): Promise<void> {
	const sql = await Bun.file(
		new URL("./migrations/001_init.sql", import.meta.url).pathname,
	).text();
	db.run(sql);
}
