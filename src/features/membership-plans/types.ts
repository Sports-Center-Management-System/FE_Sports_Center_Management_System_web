export type DisciplineType = "GYM" | "BOXING" | "YOGA" | "DANCING";

export interface Discipline {
  id: string;
  code: DisciplineType;
  name: string;
  description: string;
  allowGroupClass: boolean; // Gym is false, others are true
}

export type PlanTier = "TRIAL" | "DROP_IN" | "PLUS" | "VIP";

export interface PlanTierConfig {
  code: PlanTier;
  label: string;
  badgeClass: string;
  description: string;
}

export interface MembershipPlan {
  id: string;
  code: string; // e.g. PLAN-GYM-01
  name: string;
  discipline: DisciplineType;
  disciplineName: string;
  tier: PlanTier;
  tierLabel: string;
  price: number; // in VND
  durationDays: number;
  groupClassQuota: number; // For GYM must be 0 (DB Trigger requirement)
  ptSessionQuota: number; // PT 1:1 sessions
  isActive: boolean; // Soft-delete flag
  description?: string;
  createdAt: string;
}

export interface CreatePlanPayload {
  code: string;
  name: string;
  discipline: DisciplineType;
  tier: PlanTier;
  price: number;
  durationDays: number;
  groupClassQuota: number;
  ptSessionQuota: number;
  description?: string;
}

export interface UpdatePlanPayload {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  groupClassQuota: number;
  ptSessionQuota: number;
  description?: string;
}

export interface TriggerValidationResult {
  isBlocked: boolean;
  triggerName?: string;
  message?: string;
}
