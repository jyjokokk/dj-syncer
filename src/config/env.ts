import { z } from "zod";

const EnvSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3000),
	DB_PATH: z.string().default("database.sqlite3"),
	SPOTIFY_CLIENT_ID: z.string().min(1),
	SPOTIFY_CLIENT_SECRET: z.string().min(1),
	SPOTIFY_REDIRECT_URI: z.url().min(1),
	TIDAL_CLIENT_ID: z.string().min(1).optional(),
	TIDAL_CLIENT_SECRET: z.string().min(1).optional(),
	TIDAL_REDIRECT_URI: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
	return EnvSchema.parse(source);
}
