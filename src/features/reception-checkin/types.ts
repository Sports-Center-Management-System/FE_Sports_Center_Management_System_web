// Types for Receptionist Shift Scheduling (Phân ca trực Lễ tân)

export type StaffRole = "RECEPTIONIST" | "HEAD_RECEPTIONIST" | "TRAINEE";

export interface StaffUser {
  id: string;
  fullName: string;
  employeeCode: string;
  role: StaffRole;
  roleLabel: string;
  avatarUrl: string;
  phone: string;
  email: string;
}

export interface ShiftSlot {
  id: string;
  name: string; // "Ca 1", "Ca 2", ...
  startTime: string; // "06:00"
  endTime: string; // "08:30"
  period: "MORNING" | "AFTERNOON" | "EVENING";
  label: string; // "06:00 - 08:30 (2h30p)"
}

export type ShiftType = "MORNING" | "AFTERNOON" | "CUSTOM" | "SLOT_2H30";

export interface StaffShift {
  id: string;
  shiftCode: string; // e.g. "SH-2109-01"
  userId: string;
  user: StaffUser;
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Thứ 2, 21/09"
  startTime: string; // HH:mm e.g. "06:00"
  endTime: string; // HH:mm e.g. "14:00"
  shiftType: ShiftType;
  shiftTypeLabel: string;
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface DayColumn {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Thứ 2", "Thứ 3", ...
  dateNumber: number; // 21, 22, ...
  isToday: boolean;
}

export interface CreateShiftPayload {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  notes?: string;
}

export interface UpdateShiftPayload {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  notes?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingShift?: StaffShift;
  message?: string;
}
