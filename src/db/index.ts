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
        // Fallback or error if D1 binding missing in Edge
        // For local dev with Edge runtime, we might need a proxy or mock if bindings aren't set up via next-on-pages proxy
        // But usually locally we want better-sqlite3 unless specifically testing edge.
        // However, 'better-sqlite3' crashes Edge.
        console.warn("⚠️ D1 Binding 'run_for_db' not found in Edge environment. DB calls may fail.");
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

