import type { AuthUser, UserRole } from '@/types/auth.types'

export type Role = UserRole
export type User = AuthUser
export type Tier = 'TRIAL' | 'DROP_IN' | 'PLUS' | 'VIP'
export type CheckoutStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'EXPIRED'
  | 'FULFILLED'
  | 'PAYMENT_REVIEW'
  | 'REFUND_PENDING'
  | 'REFUNDED'
export type CheckoutKind = 'NEW_SUBSCRIPTION' | 'RENEWAL' | 'PT_ADDON'
export type CalendarView = 'all' | 'group' | 'pt' | 'mine'
export interface Discipline {
  id: string
  code: string
  name: string
}
export interface Tokens {
  accessToken: string
  refreshToken: string
  expiresIn?: string
}
export interface Plan {
  id: string
  name: string
  description?: string | null
  disciplineId: string
  discipline?: Discipline
  packageTier: Tier
  price: string | number
  durationDays: number
  groupSessionQuota: number | null
  ptSessionQuota: number | null
  unlimitedGymEntry?: boolean | null
  isActive: boolean
}
export interface Coach {
  id: string
  fullName: string
  coachProfile?: { coachSpecialties?: { specialty: { disciplineId: string; name: string } }[] }
}
export interface Quote {
  planId: string
  coachId: string
  disciplineId: string
  baseAmount: string
  ratePerSession: string
  ptSessions: number
  ptAmount: string
  totalAmount: string
  currency: string
  calculatedAt: string
  eligible: boolean
}
export interface Checkout {
  checkoutId: string
  kind: CheckoutKind
  status: CheckoutStatus
  amount: string
  baseAmount: string
  ptAmount: string
  currency: string
  priceSnapshot: Record<string, unknown>
  paymentId: string | null
  paymentUrl: string | null
  expiresAt: string
  subscriptionId: string | null
  invoiceId: string | null
  failureReason: string | null
  createdAt: string
}
export interface Subscription {
  id: string
  planId: string
  disciplineId: string
  packageTier: Tier
  status: string
  startDate: string
  endDate: string
  createdAt: string
  remainingGroupSessions: number | null
  remainingPtSessions: number | null
  remainingSessions: number | null
  hasUnlimitedGymAccess?: boolean | null
  assignedCoach?: { id: string; fullName: string } | null
  plan: Plan
}
export interface Invoice {
  id: string
  invoiceCode: string
  subscriptionId: string
  amount: string
  baseAmount: string | null
  ptAmount: string | null
  status: string
  type: string
  paymentMethod: string
  createdAt: string
}
export interface Schedule {
  id: string
  disciplineId: string
  startAt: string
  endAt: string
  capacity: number
  currentEnrolled: number
  status: string
  class: { name: string }
  coach: { id: string; fullName: string }
  room: { name: string }
}
export interface PtSlot {
  id: string
  coachId: string
  coach: { id: string; fullName: string }
  startAt: string
  endAt: string
  eligibleDisciplines: string[]
}
export interface Booking {
  id: string
  subscriptionId: string
  disciplineId: string
  bookingType: 'GROUP_CLASS' | 'PERSONAL_TRAINING'
  status: string
  startAt?: string
  endAt?: string
  bookedAt: string
  schedule?: { startTime: string; class?: { name: string } } | null
  coachAvailability?: { startTime: string; coach?: { fullName: string } } | null
}
export interface Eligibility {
  subscriptionId: string
  disciplineId: string
  group: { allowed: boolean; reason: string | null }
  pt: { allowed: boolean; reason: string | null }
}
export interface CalendarDay {
  date: string
  eligibility: Eligibility[]
}
export interface CalendarData {
  weekStart: string
  weekEndExclusive: string
  timezone: string
  schedules: Schedule[]
  ptSlots: PtSlot[]
  bookings: Booking[]
  subscriptions: {
    id: string
    disciplineId: string
    planName: string
    assignedCoach: { id: string; fullName: string } | null
    startDate: string
    endDate: string
    status: string
    remainingGroupSessions: number | null
    remainingPtSessions: number | null
  }[]
  days: CalendarDay[]
}
export interface WorkoutPlan {
  id: string
  title?: string
  name?: string
  status?: string
  createdAt: string
  exercises?: { id: string; exercise?: { name: string }; sets?: number; reps?: number }[]
}
export interface Attendance {
  id: string
  bookingId?: string | null
  status?: string
  checkInTime?: string
  checkOutTime?: string | null
}
export interface InbodyLog {
  id: string
  measuredAt: string
  weightKg?: string | number | null
  bodyFatPct?: string | number | null
  muscleMassKg?: string | number | null
  bmi?: string | number | null
}
export interface LockerAssignment {
  id: string
  assignedAt: string
  returnedAt: string | null
  locker: { lockerNumber: string; zone: string }
}
