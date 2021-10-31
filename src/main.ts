import { Application, log } from "./deps.ts";
import { loadDataFromFile, saveDataToFile } from "./fsUtils.ts";
import { buildRouter } from "./router.ts";
import { DataSchema } from "./types.ts";

const PORT = 8000;

const app = new Application();
const controller = new AbortController();

let statefulData: DataSchema;

const buildExitData = (): DataSchema => ({
  ...statefulData,
  lastExit: Date.now(),
});

app.addEventListener("listen", ({ hostname, port, secure }) => {
  log.info(
    `Listening on: ${secure ? "https://" : "http://"}${
      hostname ??
        "localhost"
    }:${port}`,
  );
});

app.addEventListener("error", async ({ message }) => {
  log.error(message);
  await saveDataToFile(buildExitData());
});

const { error, result } = await loadDataFromFile<DataSchema>();

if (error) controller.abort();
else statefulData = result!;

const router = buildRouter(statefulData!);

app
  .use(router.routes())
  .use(router.allowedMethods());

const serverPromise = app.listen({ port: PORT, signal: controller.signal });

await Promise.any([
  Deno.signal("SIGTERM"),
  Deno.signal("SIGINT"),
  Deno.signal("SIGABRT"),
  serverPromise,
]);

log.info("Process terminated. Closing Oak server...");

if (!controller.signal.aborted) {
  controller.abort();
  await serverPromise;
}

saveDataToFile(buildExitData());
