export interface Specialty {
  id: string;
  code: string;
  name: string;
  description: string;
  assignedCoachesCount: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface CoachRate {
  id: string;
  coachId: string;
  ratePerSession: number; // VND per session
  effectiveStartDate: string; // YYYY-MM-DD
  effectiveEndDate: string | null; // YYYY-MM-DD or null
  rateRange: string; // e.g. "[2026-09-01, 2026-12-31]"
  notes?: string;
  status: "ACTIVE" | "SCHEDULED" | "EXPIRED";
}

export interface CoachSpecialty {
  specialtyId: string;
  specialtyName: string;
  specialtyCode: string;
  assignedAt: string;
  isPrimary: boolean;
}

export interface CoachProfile {
  id: string;
  coachCode: string; // e.g. COACH-01
  fullName: string;
  phone: string;
  email: string;
  experienceYears: number;
  certificates: string[];
  bio: string;
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  specialties: CoachSpecialty[];
  currentRate: CoachRate | null;
  rateHistory: CoachRate[];
}

export interface CreateSpecialtyPayload {
  code: string;
  name: string;
  description: string;
}

export interface UpdateSpecialtyPayload {
  id: string;
  name: string;
  description: string;
}

export interface AssignSpecialtiesPayload {
  coachId: string;
  selectedSpecialtyIds: string[];
  primarySpecialtyId: string;
}

export interface ConfigureCoachRatePayload {
  coachId: string;
  ratePerSession: number;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  notes?: string;
}
