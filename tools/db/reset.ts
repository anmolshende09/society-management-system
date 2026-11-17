async function reset() {
  const env = process.env.APP_ENV || "local";
  console.log(`--- Database Reset Initiated (Environment: ${env}) ---`);

  if (env !== "local" && env !== "test") {
    throw new Error(
      `SAFETY BLOCK: Database reset is strictly prohibited in "${env}" environment.`,
    );
  }

  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl && !dbUrl.includes("127.0.0.1") && !dbUrl.includes("localhost")) {
    throw new Error(
      "SAFETY BLOCK: Database reset target is not a local loopback address!",
    );
  }

  console.log(
    "Reset safety checks passed. Database reset is authorized for local/test only.",
  );
}

reset().catch((err) => {
  console.error("Reset aborted:", err);
  process.exit(1);
});
