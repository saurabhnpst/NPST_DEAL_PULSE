export interface DocumentReference {
  documentId: string;
}

export interface DocumentClient {
  resolveReference(documentId: string): Promise<DocumentReference | undefined>;
}

export class NoopDocumentClient implements DocumentClient {
  async resolveReference(_documentId: string): Promise<DocumentReference | undefined> {
    return undefined;
  }
}