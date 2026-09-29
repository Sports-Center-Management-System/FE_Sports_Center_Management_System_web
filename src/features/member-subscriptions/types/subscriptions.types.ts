export type PackageTier = "TRIAL" | "BASIC" | "PLUS" | "VIP";

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED";

export type TrainingMode = "CUSTOM" | "GROUP_CLASS" | "HYBRID" | "PERSONAL_TRAINING";

export interface Discipline {
  id: string;
  code: string;
  name: string;
  description?: string;
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
}

export interface AssignedCoach {
  id: string;
  fullName: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  disciplineId: string | null;
  packageTier: PackageTier;
  assignedCoachId: string | null;
  startDate: string;
  endDate: string;
  remainingSessions: number | null;
  remainingGroupSessions: number;
  remainingPtSessions: number;
  hasUnlimitedGymAccess: boolean;
  status: SubscriptionStatus;
  frozenAt: string | null;
  createdAt: string;
  plan: MembershipPlan;
  assignedCoach: AssignedCoach | null;
}

export interface Invoice {
  id: string;
  invoiceCode: string;
  subscriptionId: string;
  amount: string | number;
  baseAmount: string | number;
  ptAmount: string | number;
  paymentMethod: string;
  status: string;
  type: string;
  transactionRef: string | null;
  createdAt: string;
}

export interface CheckoutResult {
  checkoutId: string;
  kind: "NEW_SUBSCRIPTION" | "RENEWAL" | "PT_ADDON";
  status: "PENDING_PAYMENT" | "FULFILLED" | "PAYMENT_FAILED" | "EXPIRED";
  amount: string;
  paymentId: string | null;
  paymentUrl: string | null;
  subscriptionId: string | null;
  invoiceId: string | null;
}
