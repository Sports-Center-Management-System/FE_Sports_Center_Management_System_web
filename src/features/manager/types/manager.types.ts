// Shapes follow the NestJS responses on BE origin/main (Prisma rows, Decimal serialised as string).

export type StaffRole = 'COACH' | 'RECEPTIONIST'
export type PackageTier = 'TRIAL' | 'DROP_IN' | 'PLUS' | 'VIP'
export type TrainingMode = 'GROUP_CLASS' | 'PERSONAL_TRAINING' | 'HYBRID' | 'CUSTOM'
export type PlanType = 'GENERAL' | 'PERSONAL_TRAINING'
export type LockerZone = 'MALE_LOCKER' | 'FEMALE_LOCKER' | 'VIP_AREA'
export type LockerStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN'
export type CancellationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface Discipline {
  id: string
  code: string
  name: string
  description?: string | null
}

export interface ManagerSummary {
  date: string
  dailyRevenue: number
  newMembers: number
  gateEntries: number
  pendingCancellations: number
  occupancyRate: number
}

export interface RevenueReport {
  totalRevenue: number
  baseRevenue: number
  ptRevenue: number
  byDiscipline: Record<string, number>
}

export interface KpiReport {
  coaches: Array<{
    id: string
    fullName: string
    _count: { coachedSchedules: number; coachAvailabilities: number }
    coachProfile: {
      monthlyEmergencyCancellations: number
      emergencyCancellationCount: number
    } | null
  }>
  rooms: Array<{ id: string; name: string; totalScheduledHours: number }>
}

export interface UserRow {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: 'MEMBER' | 'COACH' | 'RECEPTIONIST' | 'CENTER_MANAGER' | 'ADMIN'
  isActive: boolean
  avatarUrl: string | null
  createdAt: string
}

export interface CreateStaffPayload {
  email: string
  password: string
  fullName: string
  phone: string
  role: StaffRole
}

export interface UpdateStaffPayload {
  fullName?: string
  phone?: string
  isActive?: boolean
  password?: string
}

export interface StaffShift {
  id: string
  staffId: string
  shiftDate: string
  startTime: string
  endTime: string
  notes: string | null
}

export interface ShiftPayload {
  staffId: string
  shiftDate: string
  startTime: string
  endTime: string
  notes?: string
}

export interface Specialty {
  id: string
  disciplineId: string
  code: string
  name: string
  description: string | null
  discipline?: Discipline
}

export interface SpecialtyPayload {
  disciplineId: string
  code: string
  name: string
  description?: string
}

export interface CoachRate {
  id: string
  coachId: string
  disciplineId: string | null
  ratePerSession: string | number
  effectiveFrom: string
  effectiveTo: string | null
  discipline?: Discipline | null
}

export interface RatePayload {
  disciplineId: string
  ratePerSession: number
  effectiveFrom: string
  effectiveTo?: string
}

export interface CoachRow {
  id: string
  fullName: string
  avatarUrl: string | null
  coachProfile: {
    id: string
    yearsExperience: number | null
    coachSpecialties: Array<{ specialtyId: string; specialty: Specialty }>
  } | null
  coachRates: CoachRate[]
}

export interface CancellationRequest {
  id: string
  coachId: string
  targetType: 'PERSONAL_TRAINING' | 'GROUP_CLASS'
  bookingId: string | null
  scheduleId: string | null
  reasonMessage: string
  status: CancellationStatus
  rejectionReason: string | null
  reviewedAt: string | null
  isFrontdeskOverride: boolean
  createdAt: string
}

export interface CoachPenalty {
  id: string
  coachId: string
  cancellationRequestId: string | null
  penaltyType: string
  appliedMonth: string
  suggestedAction: string
  suggestedRateReductionPct: string | number | null
  isReviewedByManager: boolean
  managerFinalDecision: string | null
  reviewedAt: string | null
  notes: string | null
  createdAt: string
}

export interface MembershipPlan {
  id: string
  disciplineId: string | null
  name: string
  description: string | null
  price: string | number
  durationDays: number
  packageTier: PackageTier
  trainingMode: TrainingMode
  planType: PlanType
  groupSessionQuota: number | null
  ptSessionQuota: number | null
  unlimitedGymEntry: boolean | null
  discipline?: Discipline | null
}

export interface PlanPayload {
  disciplineId: string
  name: string
  description?: string
  price: number
  durationDays: number
  packageTier: PackageTier
  trainingMode: TrainingMode
  planType: PlanType
  groupSessionQuota: number
  ptSessionQuota: number
  unlimitedGymEntry: boolean
}

export interface GymClass {
  id: string
  disciplineId: string
  name: string
  description: string | null
  discipline?: Discipline
}

export interface ClassPayload {
  disciplineId: string
  name: string
  description?: string
}

export interface Schedule {
  id: string
  classId: string
  roomId: string
  coachId: string
  startTime: string
  endTime: string
  capacity: number
  currentEnrolled: number
  status: string
  class?: GymClass
  room?: Room
  coach?: { id: string; fullName: string }
}

export interface SchedulePayload {
  classId: string
  roomId: string
  coachId: string
  startTime: string
  endTime: string
  capacity: number
}

export interface Room {
  id: string
  name: string
  capacity: number
  locationNote: string | null
  isActive: boolean
}

export interface RoomPayload {
  name: string
  capacity: number
  locationNote?: string
}

export interface Equipment {
  id: string
  roomId: string
  name: string
  equipmentType: string
  isActive: boolean
}

export interface EquipmentPayload {
  roomId: string
  name: string
  equipmentType: string
}

export interface Locker {
  id: string
  lockerNumber: string
  zone: string
  status: LockerStatus
  isActive: boolean
}

export interface MemberDetail extends UserRow {
  memberProfile?: {
    fitnessGoals?: string | null
    medicalHistory?: string | null
    heightCm?: string | number | null
  } | null
}

export interface MemberSubscription {
  id: string
  packageTier: PackageTier
  startDate: string
  endDate: string
  status: SubscriptionStatus
  remainingGroupSessions: number | null
  remainingPtSessions: number | null
  frozenAt: string | null
  plan?: { id: string; name: string } | null
  assignedCoach?: { id: string; fullName: string } | null
}
