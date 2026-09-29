export interface MemberProfileInfo {
  id: string;
  userId: string;
  heightCm: number | string | null;
  weightKg: number | string | null;
  bmi: number | string | null;
  bodyFatPct: number | string | null;
  fitnessGoals: string | null;
  medicalHistory: string | null;
  updatedAt: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  memberProfile: MemberProfileInfo | null;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  fitnessGoals?: string;
  medicalHistory?: string;
  heightCm?: number;
}

export interface InbodyLogItem {
  id: string;
  userId: string;
  heightCm: number | string;
  weightKg: number | string;
  muscleMassKg: number | string;
  bodyFatPct: number | string;
  bmi: number | string;
  visceralFatLevel: number;
  notes: string | null;
  measuredAt: string;
}

export interface InbodyProgressResponse {
  logs: InbodyLogItem[];
}
