import { ensureFile, log, resolve } from "./deps.ts";
import { DataSchema } from "./types.ts";

const RELATIVE_DATA_FILE_PATH = "./artifacts/data.json";
const DATA_FILE_PATH = resolve(RELATIVE_DATA_FILE_PATH);
const DEFAULT_EMPTY_DATA: DataSchema = {
  data: {},
  lastExit: 0,
};

const writeJsonToFile = async (path: string, data: unknown) => {
  const dataString = JSON.stringify(data);
  await Deno.writeTextFile(path, dataString, { create: true });
};

const readJsonFromFile = async <T>(
  path: string,
): Promise<{ error: boolean; result?: T }> => {
  try {
    const dataString = await Deno.readTextFile(path);
    return {
      error: false,
      result: JSON.parse(dataString) as T,
    };
  } catch (err) {
    console.error(err);
    return {
      error: true,
    };
  }
};

const createFileWithEmptyDataIfNotExists = async (path: string) => {
  await ensureFile(path);
  const stats = await Deno.lstat(path);
  const fileIsEmpty = stats.size === 0;

  if (fileIsEmpty) {
    log.info(
      `${RELATIVE_DATA_FILE_PATH} did not exist. Initializing data...`,
    );
    await writeJsonToFile(path, DEFAULT_EMPTY_DATA);
  }
};

export const loadDataFromFile = async <T>() => {
  log.info("Loading data...");
  await createFileWithEmptyDataIfNotExists(DATA_FILE_PATH);
  return await readJsonFromFile<T>(DATA_FILE_PATH);
};

export const saveDataToFile = async (data: unknown) => {
  log.info(`Saving data to ${DATA_FILE_PATH}`);
  await writeJsonToFile(DATA_FILE_PATH, data);
};
