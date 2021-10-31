export type Document = Record<string, unknown>;
export type Collection = Record<string, Document>;

export interface DataSchema {
  data: Record<string, Collection>;
  lastExit: number;
}
