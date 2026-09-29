export type PackageTier = "TRIAL" | "BASIC" | "PLUS" | "VIP";

export type TrainingMode = "CUSTOM" | "GROUP_CLASS" | "HYBRID" | "PERSONAL_TRAINING";

export interface Discipline {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface CurriculumRequirement {
  id?: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface MembershipPlan {
  id: string;
  disciplineId: string;
  name: string;
  description: string | null;
  price: string | number;
  durationDays: number;
  sessionQuota: number | null;
  planType: string;
  isActive: boolean;
  createdAt: string;
  packageTier: PackageTier;
  trainingMode: TrainingMode;
  groupSessionQuota: number;
  ptSessionQuota: number;
  unlimitedGymEntry: boolean;
  discipline?: Discipline;
  curriculumRequirements?: CurriculumRequirement[];
}

export interface PlanFilterParams {
  disciplineId?: string;
  packageTier?: PackageTier;
  searchQuery?: string;
}
