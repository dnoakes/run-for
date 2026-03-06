import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzleD1>;

let _localDb: DbInstance | null = null;

function getDb(): DbInstance {
    const isEdge = process.env.NEXT_RUNTIME === "edge";
    const isProd = process.env.NODE_ENV === "production";

    if (isProd || isEdge) {
        // Access the D1 binding from the Cloudflare request context.
        // Must be called per-request — not at module init time.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getRequestContext } = require("@cloudflare/next-on-pages");
        const { env } = getRequestContext();
        if (!env.run_for_db) {
            throw new Error("D1 binding 'run_for_db' not found in Cloudflare env. Check wrangler.toml.");
        }
        return drizzleD1(env.run_for_db as D1Database, { schema });
    }

    // Local development — reuse the same better-sqlite3 instance
    if (!_localDb) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { drizzle: drizzleSqlite } = require("drizzle-orm/better-sqlite3");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Database = require("better-sqlite3");
        const sqlite = new Database("local.db");
        _localDb = drizzleSqlite(sqlite, { schema });
        console.log("✅ Local SQLite database initialised.");
    }

    return _localDb!;
}

// Proxy so callers can use `db` as before — the real instance is resolved
// per property access (i.e. inside the request handler, not at module init).
export const db = new Proxy({} as DbInstance, {
    get(_, prop) {
        return (getDb() as any)[prop];
    },
}) as DbInstance;

export * from "./schema";
