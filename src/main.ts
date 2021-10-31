import { Application, log } from "./deps.ts";
import { loadDataFromFile, saveDataToFile } from "./fsUtils.ts";
import { DataSchema } from "./types.ts";

const PORT = 8000;

const app = new Application();
const controller = new AbortController();

let statefulData: DataSchema;

const buildExitData = (): DataSchema => ({
  ...statefulData,
  lastExit: Date.now(),
});

app.addEventListener("listen", async ({ hostname, port, secure }) => {
  const { error, result } = await loadDataFromFile<DataSchema>();

  if (error) return controller.abort();
  console.debug(result);
  statefulData = result!;

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

app.use((ctx) => {
  ctx.response.body = "Hello World!";
});

const serverPromise = app.listen({ port: PORT, signal: controller.signal });

await Promise.any([
  Deno.signal("SIGTERM"),
  Deno.signal("SIGINT"),
  Deno.signal("SIGABRT"),
]);

log.info("Process terminated. Closing Oak server...");
controller.abort();
await serverPromise;

saveDataToFile(buildExitData());
