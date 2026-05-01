import m001Init from "./001_init.sql" with { type: "text" };

export type Migration = {
	id: string;
	sql: string;
};

export const migrations: readonly Migration[] = [
	{ id: "001_init", sql: m001Init },
] as const;
