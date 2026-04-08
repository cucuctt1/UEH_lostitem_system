import { app } from "./app";
import { env } from "./config/env";
import { healthCheckDb, setupDatabaseIfEnabled } from "./config/db";
import { startTagMaintenanceJob, syncTagMetadata } from "./services/tagService";

async function bootstrap(): Promise<void> {
  await setupDatabaseIfEnabled();
  await healthCheckDb();

  try {
    await syncTagMetadata();
  } catch (error) {
    console.error("Initial tag sync failed", error);
  }

  startTagMaintenanceJob();

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
