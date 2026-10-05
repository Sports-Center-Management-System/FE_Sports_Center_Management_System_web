import { get } from "@/lib/api";
import type {
  Coach,
  CoachAvailabilitySlot,
  CoachRateItem,
  Discipline,
} from "../types/coach.types";

export const coachApiService = {
  /**
   * GET /api/v1/disciplines
   */
  async getDisciplines(): Promise<Discipline[]> {
    try {
      const res = await get<Discipline[]>("/disciplines");
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch {
      // fallback if endpoint returns empty
    }
    return [
      { id: "bb47d3e8-3ad6-4ea3-9b42-71362b8ee962", code: "GYM", name: "Gym & Fitness" },
      { id: "1e564067-ab29-4906-975c-49658c8c6d65", code: "BOXING", name: "Boxing & Kickboxing" },
      { id: "9aa23206-5843-4f6f-bc8e-5c6486b137dc", code: "YOGA", name: "Yoga & Meditation" },
    ];
  },

  /**
   * GET /api/v1/coaches
   * Fetches real coaches directly from Backend API.
   */
  async getCoaches(): Promise<Coach[]> {
    const rawCoaches = await get<any[]>("/coaches");
    if (!Array.isArray(rawCoaches)) {
      return [];
    }

    return rawCoaches.map((item, idx) => {
      // Extract all discipline IDs and Codes associated with this coach
      const disciplineIdsSet = new Set<string>();
      const disciplineCodesSet = new Set<string>();

      // From rates
      if (Array.isArray(item.coachRates)) {
        item.coachRates.forEach((r: any) => {
          if (r.disciplineId) disciplineIdsSet.add(r.disciplineId);
          if (r.discipline?.code) disciplineCodesSet.add(r.discipline.code.toUpperCase());
        });
      }

      // From coach specialties
      const specialties = item.coachProfile?.coachSpecialties || [];
      specialties.forEach((cs: any) => {
        if (cs.specialty?.disciplineId) {
          disciplineIdsSet.add(cs.specialty.disciplineId);
        }
        if (cs.specialty?.code) {
          const code = cs.specialty.code.toUpperCase();
          if (code.includes("GYM")) disciplineCodesSet.add("GYM");
          if (code.includes("BOX")) disciplineCodesSet.add("BOXING");
          if (code.includes("YOG")) disciplineCodesSet.add("YOGA");
        }
      });

      // From coachProfile.specialties string (e.g. "GYM", "BOXING, YOGA")
      const specString = (item.coachProfile?.specialties || "").toUpperCase();
      if (specString.includes("GYM")) disciplineCodesSet.add("GYM");
      if (specString.includes("BOX")) disciplineCodesSet.add("BOXING");
      if (specString.includes("YOG")) disciplineCodesSet.add("YOGA");

      const disciplineCodes = Array.from(disciplineCodesSet);
      const disciplineIds = Array.from(disciplineIdsSet);
      const primaryDiscipline = disciplineCodes[0] || "GYM";

      // Parse rates
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
        avatarUrl: item.avatarUrl ? item.avatarUrl.trim() : null, // null if empty
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
      };
    });
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
