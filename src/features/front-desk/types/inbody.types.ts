export interface InbodyLog {
  id: string;
  userId: string;
  measuredById: string | null;
  measuredAt: string;
  heightCm: number | string;
  weightKg: number | string;
  muscleMassKg: number | string | null;
  bodyFatPct: number | string | null;
  bmi: number | string | null;
  visceralFatLevel: number | null;
  notes: string | null;
}

export interface CreateInbodyLog {
  userId: string;
  heightCm: number;
  weightKg: number;
  muscleMassKg?: number;
  bodyFatPct?: number;
  bmi?: number;
  visceralFatLevel?: number;
  notes?: string;
}

export interface UpdateInbodyLog {
  heightCm?: number;
  weightKg?: number;
  muscleMassKg?: number | null;
  bodyFatPct?: number | null;
  bmi?: number | null;
  visceralFatLevel?: number | null;
  notes?: string | null;
}

export interface CoachTodaySchedule {
  pt: Array<{
    id: string;
    startTime: string;
    bookings: Array<{ memberId: string }>;
  }>;
}
