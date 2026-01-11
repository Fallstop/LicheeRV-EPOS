import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.SQLITE_DB_PATH || "./data/sqlite.db";

// Ensure directory exists
const dir = dirname(dbPath);
if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
}

console.log(`Running migrations on database: ${dbPath}`);

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "./drizzle" });

console.log("Migrations complete!");
sqlite.close();
