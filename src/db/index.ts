import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

let db: any;

const isEdge = process.env.NEXT_RUNTIME === "edge";

if (process.env.NODE_ENV === "production" || isEdge) {
    // Edge / Production (Cloudflare D1)
    // The binding 'run_for_db' is available in the request context or globally patched
    // During 'next dev', if runtime='edge', we might still be here.
    if (process.env.run_for_db) {
        db = drizzleD1(process.env.run_for_db as any, { schema });
    } else {
        // Fallback for Build Time (Bindings are not available during build)
        // We provide a mock D1 database to allow static analysis/initialization to proceed without crashing.
        console.warn("⚠️ D1 Binding 'run_for_db' not found. Using Mock DB for build/edge-initialization.");

        const mockD1 = {
            prepare: () => ({
                bind: () => ({
                    all: async () => [],
                    first: async () => null,
                    run: async () => ({ meta: {}, results: [], success: true }),
                }),
            }),
            batch: async () => [],
            dump: async () => new ArrayBuffer(0),
            exec: async () => { },
        };

        db = drizzleD1(mockD1 as any, { schema });
    }
} else {
    // Local Development (Node.js)
    // Use better-sqlite3 with a local file
    try {
        const { drizzle: drizzleSqlite } = require("drizzle-orm/better-sqlite3");
        const Database = require("better-sqlite3");
        // Ensure the valid path or just root
        const sqlite = new Database("local.db");
        db = drizzleSqlite(sqlite, { schema });
    } catch (e) {
        console.error("❌ FAILED TO LOAD BETTER-SQLITE3:", e);
    }
}

if (!db) {
    console.error("❌ CRITICAL: global 'db' object is undefined! NextAuth will fail.");
} else {
    console.log("✅ Database initialized successfully for environment:", process.env.NODE_ENV || "development");
}

export { db };
export * from "./schema";

