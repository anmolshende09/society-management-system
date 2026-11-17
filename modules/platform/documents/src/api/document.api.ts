import { DocumentId } from "@society/shared-kernel";

export interface EntityRef {
  type: string;
  id: string;
}

export interface UploadIntentRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  domain: string;
}

export interface UploadIntent {
  docId: DocumentId;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface SignedUrl {
  downloadUrl: string;
  expiresAt: Date;
}

export const DOCUMENT_API_TOKEN = Symbol("DocumentApi");

export interface DocumentApi {
  createUploadIntent(req: UploadIntentRequest): Promise<UploadIntent>;
  attach(docId: DocumentId, owner: EntityRef): Promise<void>;
  getDownloadUrl(docId: DocumentId): Promise<SignedUrl>;
}
