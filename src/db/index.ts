import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

let db: any;

if (process.env.NODE_ENV === "production") {
    // Edge / Production (Cloudflare D1)
    // The binding 'run_for_db' is available in the request context or globally patched
    db = drizzleD1(process.env.run_for_db as any, { schema });
} else {
    // Local Development (Node.js)
    // Use better-sqlite3 with a local file
    // Using require to prevent static analysis from including better-sqlite3 in Edge bundle
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

