import fs from "node:fs";
import path from "node:path";

async function bootstrap() {
  console.log("--- Database Bootstrap ---");
  const initSqlPath = path.resolve("tools/db/init-roles.sql");
  const bootstrapMigrationPath = path.resolve(
    "db/migrations/000_platform_bootstrap.sql",
  );

  if (!fs.existsSync(initSqlPath)) {
    throw new Error(`Init roles SQL not found at: ${initSqlPath}`);
  }
  if (!fs.existsSync(bootstrapMigrationPath)) {
    throw new Error(
      `Bootstrap migration SQL not found at: ${bootstrapMigrationPath}`,
    );
  }

  console.log("1. Verified init-roles.sql exists.");
  console.log("2. Verified 000_platform_bootstrap.sql exists.");
  console.log(
    "Database bootstrap assets verified. Ready for Docker / Postgres execution.",
  );
}

bootstrap().catch((err) => {
  console.error("Bootstrap error:", err);
  process.exit(1);
});
