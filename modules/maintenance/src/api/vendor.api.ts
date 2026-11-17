import { VendorId } from "@society/shared-kernel";

export interface VendorSummary {
  id: VendorId;
  name: string;
  category: string;
  contactPerson: string;
  mobile: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  rating?: number;
}

export const VENDOR_API_TOKEN = Symbol("VendorApi");

export interface VendorApi {
  getVendor(vendorId: VendorId): Promise<VendorSummary | null>;
}
