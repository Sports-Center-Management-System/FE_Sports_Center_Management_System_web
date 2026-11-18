export type LockerZone = "MALE_LOCKER" | "FEMALE_LOCKER" | "VIP_AREA";
export type MemberGender = "MALE" | "FEMALE" | "OTHER";

export interface SearchMember {
  id: string;
  fullName: string;
  phone: string | null;
  email: string;
  avatarUrl: string | null;
  gender?: MemberGender | null;
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
  /** The open locker of this visit; its id is what returning the locker needs. */
  lockerAssignment?: {
    id: string;
    locker: { lockerNumber: string; zone: LockerZone };
  } | null;
}
