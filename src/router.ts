import { helpers, Router, Status } from "./deps.ts";
import {
  createCollectionIfNotExists,
  deleteDocument,
  getDocument,
  listDocuments,
  upsertDocument,
} from "./memoryStoreUtils.ts";
import { DataSchema, Document } from "./types.ts";

export const buildRouter = (schema: DataSchema) => {
  const router = new Router();

  return router
    .post("/", (context) => {
      const { collectionName } = helpers.getQuery(context);
      const success = createCollectionIfNotExists(schema, collectionName);
      context.response.status = success
        ? Status.Created
        : Status.InternalServerError;
    })
    .get<{ collectionName: string }>("/:collectionName", (context) => {
      const { params: { collectionName } } = context;
      const { error, documents } = listDocuments(schema, collectionName!);
      context.response.status = error ? Status.InternalServerError : Status.OK;
      context.response.body = error ? undefined : documents;
    })
    .get<{ collectionName: string; documentId: string }>(
      "/:collectionName/:documentId",
      (context) => {
        const { params: { collectionName, documentId } } = context;
        const { error, document } = getDocument<Document>(
          schema,
          collectionName,
          documentId,
        );
        context.response.status = error
          ? Status.InternalServerError
          : Status.OK;
        context.response.body = error ? undefined : document;
      },
    )
    .post<{ collectionName: string }>("/:collectionName", async (context) => {
      const { params: { collectionName } } = context;
      const document = await context.request.body({ type: "json" }).value;
      const { error, documentId: returnedDocumentId } = upsertDocument(
        schema,
        collectionName,
        document,
      );
      context.response.status = error ? Status.InternalServerError : Status.OK;
      context.response.body = document;
      context.response.headers.append(
        "Location",
        `/${collectionName}/${returnedDocumentId}`,
      );
    })
    .patch<{ collectionName: string; documentId: string }>(
      "/:collectionName/:documentId",
      async (context) => {
        const { params: { collectionName, documentId } } = context;
        const document = await context.request.body({ type: "json" }).value;
        const {
          error,
          documentId: returnedDocumentId,
          document: returnedDocument,
        } = upsertDocument(
          schema,
          collectionName!,
          document,
          documentId,
        );
        context.response.status = error
          ? Status.InternalServerError
          : Status.OK;
        context.response.body = returnedDocument;
        context.response.headers.append(
          "Location",
          `/${collectionName}/${returnedDocumentId}`,
        );
      },
    )
    .delete<{ collectionName: string; documentId: string }>(
      "/:collectionName/:documentId",
      (context) => {
        const { params: { collectionName, documentId } } = context;
        const success = deleteDocument(schema, collectionName!, documentId!);
        context.response.status = success
          ? Status.NoContent
          : Status.InternalServerError;
      },
    );
};
