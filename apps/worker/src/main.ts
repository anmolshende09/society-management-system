async function bootstrapWorker() {
  console.log("Society ERP Standalone Worker initializing...");
  console.log(
    "Queues: notifications, billing-run, payroll, tally-sync, outbox-relay.",
  );
}

bootstrapWorker().catch((err) => {
  console.error("Failed to bootstrap Worker:", err);
  process.exit(1);
});
