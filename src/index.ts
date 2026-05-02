import { buildApp } from "./app";
import { loadEnv } from "./config/env";

const { server } = buildApp(loadEnv());
console.log(`dj-syncer listening on :${server.port}`);
