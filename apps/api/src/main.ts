import { ErrorCode } from "@society/shared-kernel";

async function bootstrap() {
  const port = process.env.API_PORT || 3001;
  console.log(
    `Society ERP API Composition Root initializing on port ${port}...`,
  );
  console.log(
    `Error Taxonomy loaded with ${Object.keys(ErrorCode).length} standard codes.`,
  );
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap API:", err);
  process.exit(1);
});
