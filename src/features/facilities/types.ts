export type RoomDiscipline = "GYM" | "YOGA" | "BOXING" | "DANCING" | "MULTI";
export type RoomStatus = "AVAILABLE" | "MAINTENANCE" | "IN_USE";

export interface FacilityRoom {
  id: string;
  code: string; // ROOM-GYM-01
  name: string;
  discipline: RoomDiscipline;
  disciplineLabel: string;
  floor: string; // Tầng 1, Tầng 2, Tầng 3
  areaSqM: number;
  maxCapacity: number;
  status: RoomStatus;
  equipmentCount: number;
  description?: string;
  imageUrl?: string;
}

export type EquipmentCategory =
  | "CARDIO"
  | "STRENGTH"
  | "FREE_WEIGHTS"
  | "COMBAT"
  | "ACCESSORY";

export type EquipmentCondition = "OPERATIONAL" | "NEEDS_SERVICE" | "MAINTENANCE";

export interface FacilityEquipment {
  id: string;
  code: string; // EQ-TRD-01
  name: string;
  category: EquipmentCategory;
  categoryLabel: string;
  roomId: string;
  roomCode: string;
  roomName: string;
  brand: string;
  purchaseDate: string; // YYYY-MM-DD
  warrantyExpiry: string; // YYYY-MM-DD
  lastMaintenanceDate: string; // YYYY-MM-DD
  nextMaintenanceDate: string; // YYYY-MM-DD
  conditionStatus: EquipmentCondition;
  quantity: number;
  notes?: string;
}

export type LockerZone = "MALE" | "FEMALE" | "VIP";
export type LockerStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

export interface LockerItem {
  id: string;
  code: string; // M-01, F-01, VIP-01
  zone: LockerZone;
  zoneLabel: string;
  status: LockerStatus;
  currentMemberName?: string;
  currentMemberPhone?: string;
  checkInTime?: string;
  maintenanceReason?: string;
  lastUpdated: string;
}

export interface LockerZoneStats {
  zone: LockerZone;
  zoneLabel: string;
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
  utilizationRate: number;
}

export interface UpdateLockerStatusPayload {
  lockerId: string;
  status: LockerStatus;
  currentMemberName?: string;
  currentMemberPhone?: string;
  maintenanceReason?: string;
}

export interface CreateRoomPayload {
  code: string;
  name: string;
  discipline: RoomDiscipline;
  floor: string;
  areaSqM: number;
  maxCapacity: number;
  status: RoomStatus;
  description?: string;
}

export interface UpdateRoomPayload extends CreateRoomPayload {
  id: string;
}

export interface CreateEquipmentPayload {
  code: string;
  name: string;
  category: EquipmentCategory;
  roomId: string;
  brand: string;
  purchaseDate: string;
  warrantyExpiry: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  conditionStatus: EquipmentCondition;
  quantity: number;
  notes?: string;
}

export interface UpdateEquipmentPayload extends CreateEquipmentPayload {
  id: string;
}
