export interface AmenityBookingCommand {
  amenityId: string;
  unitId: string;
  slotStartTime: Date;
  slotEndTime: Date;
  guestCount?: number;
}

export const COMMUNITY_API_TOKEN = Symbol("CommunityApi");
