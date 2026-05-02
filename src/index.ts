import { buildApp } from "./app";
import { loadEnv } from "./config/env";

const app = buildApp(loadEnv());
console.log(`dj-syncer listening on :${app.server.port}`);

async function shutdown(code: number, reason: string): Promise<void> {
	console.log(`shutting down (${reason})`);
	try {
		await app.close();
	} catch (err) {
		console.error("error during shutdown", err);
	}
	process.exit(code);
}

process.on("SIGINT", () => {
	void shutdown(0, "SIGINT");
});
process.on("SIGTERM", () => {
	void shutdown(0, "SIGTERM");
});
process.on("uncaughtException", (err) => {
	console.error("uncaughtException", err);
	void shutdown(1, "uncaughtException");
});
process.on("unhandledRejection", (reason) => {
	console.error("unhandledRejection", reason);
	void shutdown(1, "unhandledRejection");
});
