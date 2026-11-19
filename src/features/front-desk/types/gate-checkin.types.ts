export type LockerZone = "MALE_LOCKER" | "FEMALE_LOCKER" | "VIP_AREA";

export interface SearchMember {
  id: string;
  fullName: string;
  phone: string | null;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
}

export interface GateCheckinRequest {
  userId: string;
  preferredZone?: LockerZone;
  towelIssued: boolean;
}

export interface GateCheckinResponse {
  attendanceId: string;
  checkinType: "GATE_ENTRY";
  assignedLocker: string | null;
  towelIssued: boolean;
  checkinTime: string;
  repeated: boolean;
}
