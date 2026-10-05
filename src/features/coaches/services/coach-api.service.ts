import { get } from "@/lib/api";
import type {
  Coach,
  CoachAvailabilitySlot,
  CoachRateItem,
  Discipline,
} from "../types/coach.types";

function mapRawCoach(item: any, idx = 0): Coach {
  const disciplineIdsSet = new Set<string>();
  const disciplineCodesSet = new Set<string>();

  if (Array.isArray(item.coachRates)) {
    item.coachRates.forEach((r: any) => {
      if (r.disciplineId) disciplineIdsSet.add(r.disciplineId);
      if (r.discipline?.code) disciplineCodesSet.add(r.discipline.code.toUpperCase());
    });
  }

  const specialties = item.coachProfile?.coachSpecialties || [];
  specialties.forEach((cs: any) => {
    if (cs.specialty?.disciplineId) {
      disciplineIdsSet.add(cs.specialty.disciplineId);
    }
    if (cs.specialty?.discipline?.code) {
      disciplineCodesSet.add(cs.specialty.discipline.code.toUpperCase());
    }
    if (cs.specialty?.code) {
      const code = cs.specialty.code.toUpperCase();
      if (code.includes("GYM")) disciplineCodesSet.add("GYM");
      if (code.includes("BOX")) disciplineCodesSet.add("BOXING");
      if (code.includes("YOG")) disciplineCodesSet.add("YOGA");
    }
  });

  const specString = (item.coachProfile?.specialties || "").toUpperCase();
  if (specString.includes("GYM")) disciplineCodesSet.add("GYM");
  if (specString.includes("BOX")) disciplineCodesSet.add("BOXING");
  if (specString.includes("YOG")) disciplineCodesSet.add("YOGA");

  const disciplineCodes = Array.from(disciplineCodesSet);
  const disciplineIds = Array.from(disciplineIdsSet);
  const primaryDiscipline = disciplineCodes[0] || "GYM";

  const rates: CoachRateItem[] = Array.isArray(item.coachRates)
    ? item.coachRates.map((r: any) => ({
        id: r.id,
        coachId: r.coachId,
        disciplineId: r.disciplineId,
        ratePerSession: Number(r.ratePerSession) || 500000,
        effectiveFrom: r.effectiveFrom || "2026-01-01T00:00:00.000Z",
        effectiveTo: r.effectiveTo || null,
        rateRange: r.rateRange,
        discipline: r.discipline,
      }))
    : [];

  return {
    id: item.id,
    fullName: item.fullName || "Huấn Luyện Viên",
    avatarUrl: item.avatarUrl ? item.avatarUrl.trim() : null,
    phone: item.phone || null,
    email: item.email || null,
    disciplineIds,
    disciplineCodes,
    primaryDiscipline,
    experienceYears: item.coachProfile?.yearsExperience || 5,
    rating: 4.9,
    reviewCount: 120 + idx * 15,
    title: `HLV Chuyên Sâu ${disciplineCodes.join(" & ") || "Thể Hình"}`,
    bio: item.coachProfile?.bio || null,
    coachProfile: item.coachProfile,
    coachRates: rates,
    coachAvailabilities: item.coachAvailabilities || [],
  };
}

export const coachApiService = {
  /**
   * GET /api/v1/disciplines
   */
  async getDisciplines(): Promise<Discipline[]> {
    try {
      const res = await get<Discipline[]>("/disciplines");
      if (Array.isArray(res)) {
        return res;
      }
    } catch {
      // return empty on error
    }
    return [];
  },

  /**
   * GET /api/v1/coaches
   * Fetches real coaches directly from Backend API.
   */
  async getCoaches(): Promise<Coach[]> {
    try {
      const rawCoaches = await get<any[]>("/coaches");
      if (Array.isArray(rawCoaches)) {
        return rawCoaches.map((item, idx) => mapRawCoach(item, idx));
      }
    } catch {
      // If unauthenticated or network error, return empty array
    }
    return [];
  },

  /**
   * GET /api/v1/coaches/:id
   * Compatible with original BE: tries :id first, or falls back to /coaches + /rates + /availability.
   */
  async getCoachDetail(coachId: string): Promise<Coach> {
    try {
      const item = await get<any>(`/coaches/${coachId}`);
      if (item && item.id) {
        return mapRawCoach(item);
      }
    } catch {
      // Original BE doesn't have /coaches/:id, so load from /coaches
    }

    const allCoaches = await this.getCoaches();
    const found = allCoaches.find((c) => c.id === coachId);
    if (!found) {
      throw new Error("COACH_NOT_FOUND");
    }

    try {
      const rates = await this.getRates(coachId);
      if (rates && rates.length > 0) {
        found.coachRates = rates;
      }
    } catch {}

    try {
      const slots = await this.getAvailability(coachId);
      if (slots && slots.length > 0) {
        found.coachAvailabilities = slots;
      }
    } catch {}

    return found;
  },

  /**
   * GET /api/v1/coaches/availability?coachId=...
   */
  async getAvailability(coachId?: string): Promise<CoachAvailabilitySlot[]> {
    try {
      const data = await get<CoachAvailabilitySlot[]>(
        coachId ? `/coaches/availability?coachId=${coachId}` : "/coaches/availability"
      );
      if (Array.isArray(data)) return data;
    } catch {
      // fallback
    }
    return [];
  },

  /**
   * GET /api/v1/coaches/:id/rates
   */
  async getRates(coachId: string): Promise<CoachRateItem[]> {
    try {
      const data = await get<any[]>(`/coaches/${coachId}/rates`);
      if (Array.isArray(data)) {
        return data.map((r) => ({
          ...r,
          ratePerSession: Number(r.ratePerSession) || 500000,
        }));
      }
    } catch {
      // fallback
    }
    return [];
  },
};
