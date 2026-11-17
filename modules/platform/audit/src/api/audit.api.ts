export interface EntityRef {
  type: string;
  id: string;
}

export interface RecordAuditEntryCommand {
  action: string;
  entity: EntityRef;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

export const AUDIT_API_TOKEN = Symbol("AuditApi");

export interface AuditApi {
  record(entry: RecordAuditEntryCommand): Promise<void>;
}
