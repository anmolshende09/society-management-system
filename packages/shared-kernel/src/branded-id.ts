/**
 * Branded Types for strongly-typed UUIDv7 identifiers across domain boundaries.
 */

declare const __brand: unique symbol;

export type Branded<T, B> = T & { readonly [__brand]: B };

export type TenantId = Branded<string, "TenantId">;
export type OrganizationId = Branded<string, "OrganizationId">;
export type UserId = Branded<string, "UserId">;
export type MembershipId = Branded<string, "MembershipId">;
export type RoleId = Branded<string, "RoleId">;

export type PropertyNodeId = Branded<string, "PropertyNodeId">;
export type UnitId = Branded<string, "UnitId">;
export type ResidentId = Branded<string, "ResidentId">;
export type VehicleId = Branded<string, "VehicleId">;

export type TaskId = Branded<string, "TaskId">;
export type ComplaintId = Branded<string, "ComplaintId">;
export type AssetId = Branded<string, "AssetId">;
export type VendorId = Branded<string, "VendorId">;
export type WorkOrderId = Branded<string, "WorkOrderId">;
export type InventoryItemId = Branded<string, "InventoryItemId">;

export type InvoiceId = Branded<string, "InvoiceId">;
export type PaymentId = Branded<string, "PaymentId">;
export type ChargeId = Branded<string, "ChargeId">;
export type ExpenseId = Branded<string, "ExpenseId">;
export type PostingId = Branded<string, "PostingId">;

export type EmployeeId = Branded<string, "EmployeeId">;
export type GateId = Branded<string, "GateId">;
export type VisitorId = Branded<string, "VisitorId">;
export type AmenityId = Branded<string, "AmenityId">;
export type BookingId = Branded<string, "BookingId">;
export type DocumentId = Branded<string, "DocumentId">;
export type NotificationId = Branded<string, "NotificationId">;
export type ApprovalRequestId = Branded<string, "ApprovalRequestId">;

export function brandId<T extends string, B>(id: string): Branded<T, B> {
  return id as Branded<T, B>;
}
