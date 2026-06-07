import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb } from "./server/_core/db";

async function runMigrations() {
  try {
    console.log("[Migrations] Starting database migrations...");
    const db = await getDb();
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[Migrations] Database migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("[Migrations] Error running migrations:", error);
    process.exit(1);
  }
}

runMigrations();
