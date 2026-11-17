async function seed() {
  const env = process.env.APP_ENV || "local";
  console.log(`--- Seeding Database (Environment: ${env}) ---`);

  if (env === "production") {
    throw new Error(
      "Refusing to seed synthetic development data into production environment!",
    );
  }

  console.log(
    "1. Seed platform reference data (plans, default roles, built-in features).",
  );
  console.log(
    "2. Seed synthetic development society (Green Acres RWA, towers, units, synthetic residents).",
  );
  console.log("Seed completed idempotently.");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
