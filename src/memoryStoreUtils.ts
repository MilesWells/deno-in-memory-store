import { log } from "./deps.ts";
import { DataSchema, Document } from "./types.ts";

function collectionExists(schema: DataSchema, collectionName: string) {
  return schema.data[collectionName] !== undefined;
}

function documentExists(
  schema: DataSchema,
  collectionName: string,
  documentId?: string,
) {
  return documentId !== undefined && collectionExists(schema, collectionName) &&
    schema.data[collectionName][documentId] !== undefined;
}

export function createCollectionIfNotExists(
  schema: DataSchema,
  collectionName: string,
) {
  try {
    if (!collectionExists(schema, collectionName)) {
      schema.data[collectionName] = {};
    }
    return true;
  } catch (err) {
    log.error(err);
    return false;
  }
}

export function upsertDocument(
  schema: DataSchema,
  collectionName: string,
  document: Document,
  documentId?: string,
): { error: boolean; documentId?: string } {
  try {
    if (!collectionExists(schema, collectionName)) {
      createCollectionIfNotExists(schema, collectionName);
    }

    const docExists = documentExists(schema, collectionName, documentId);
    const indexableId = docExists ? documentId! : crypto.randomUUID();

    schema.data[collectionName][indexableId] = docExists
      ? {
        ...schema.data[collectionName][indexableId],
        ...document,
      }
      : document;
    return {
      error: false,
      documentId,
    };
  } catch (err) {
    log.error(err);
    return { error: true };
  }
}

export function getDocument<T>(
  schema: DataSchema,
  collectionName: string,
  documentId: string,
): { error: boolean; document?: T } {
  try {
    if (!collectionExists(schema, collectionName)) {
      log.error(
        `Cannot retrieve document ${documentId} from non-existent collection ${collectionName}`,
      );
      return { error: true };
    }

    return {
      error: false,
      document: schema.data[collectionName][documentId] as T,
    };
  } catch (err) {
    log.error(err);
    return { error: true };
  }
}

export function listDocuments<T>(schema: DataSchema, collectionName: string): {
  error: boolean;
  documents?: {
    [documentId: string]: T;
  };
} {
  try {
    if (!collectionExists(schema, collectionName)) {
      log.error(
        `Cannot list documents from non-existent collection ${collectionName}`,
      );
      return { error: true };
    }

    return {
      error: false,
      documents: schema.data[collectionName] as {
        [documentId: string]: T;
      },
    };
  } catch (err) {
    log.error(err);
    return { error: true };
  }
}

export function deleteDocument(
  schema: DataSchema,
  collectionName: string,
  documentId: string,
) {
  try {
    if (!collectionExists(schema, collectionName)) {
      log.error(
        `Cannot delete document ${documentId} from non-existent collection ${collectionName}`,
      );
      return false;
    }

    delete schema.data[collectionName][documentId];

    return true;
  } catch (err) {
    log.error(err);
    return false;
  }
}
