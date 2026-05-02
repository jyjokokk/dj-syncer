import m001Init from "./001_init.sql" with { type: "text" };
import m002OauthState from "./002_oauth_state.sql" with { type: "text" };

export type Migration = {
	id: string;
	sql: string;
};

export const migrations: readonly Migration[] = [
	{ id: "001_init", sql: m001Init },
	{ id: "002_oauth_state", sql: m002OauthState },
] as const;
