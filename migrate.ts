import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb } from "./server/_core/db";

export async function runMigrations() {
  try {
    console.log("[Migrations] Starting database migrations...");
    const db = await getDb();
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[Migrations] Database migrations completed successfully");
  } catch (error) {
    console.error("[Migrations] Error running migrations:", error);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
}
