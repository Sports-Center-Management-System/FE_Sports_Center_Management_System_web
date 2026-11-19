import { get, post, put, query, request } from '@/lib/api'
import type {
  Attendance,
  Booking,
  CancellationRequest,
  CoachSlot,
  CreateMemberPayload,
  DisciplinePayload,
  ExerciseKnowledge,
  GateCheckinResult,
  InbodyLog,
  InbodyPayload,
  Invoice,
  MemberProfilePayload,
  PaymentMethod,
  SalePayload,
  WorkoutPlan,
  WorkoutTemplate,
  ClassPayload,
  CoachPenalty,
  CoachRate,
  CoachRow,
  CreateStaffPayload,
  Discipline,
  Equipment,
  EquipmentPayload,
  GymClass,
  KpiReport,
  Locker,
  LockerStatus,
  LockerZone,
  ManagerSummary,
  MemberDetail,
  MemberSubscription,
  MembershipPlan,
  PlanPayload,
  RatePayload,
  RevenueReport,
  Room,
  RoomPayload,
  Schedule,
  SchedulePayload,
  ShiftPayload,
  Specialty,
  SpecialtyPayload,
  StaffShift,
  UpdateStaffPayload,
  UserRow,
} from '../types/manager.types'

const del = <T>(path: string) => request<T>(path, { method: 'DELETE' })
const upload = <T>(path: string, file: File) => {
  const body = new FormData()
  body.append('file', file)
  return request<T>(path, { method: 'POST', body })
}

export const managerApi = {
  disciplines: () => get<Discipline[]>('/disciplines', true),
  createDiscipline: (body: DisciplinePayload) => post<Discipline>('/disciplines', body),

  summary: () => get<ManagerSummary>('/analytics/manager-summary'),
  revenue: () => get<RevenueReport>('/analytics/revenue'),
  kpi: () => get<KpiReport>('/analytics/kpi'),
  topPlans: () => get<any[]>('/analytics/top-plans'),
  topCoaches: () => get<any[]>('/analytics/top-coaches'),
  dssSummary: () => get<any>('/analytics/dss-summary'),
  systemMetrics: () => get<any>('/analytics/system-metrics'),

  staff: () => get<UserRow[]>('/users/staff'),
  createStaff: (body: CreateStaffPayload) => post<UserRow>('/users', body),
  updateStaff: (id: string, body: UpdateStaffPayload) => put<UserRow>(`/users/staff/${id}`, body),
  disableStaff: (id: string) => del<UserRow>(`/users/staff/${id}`),

  shifts: () => get<StaffShift[]>('/staff-shifts'),
  createShift: (body: ShiftPayload) => post<StaffShift>('/staff-shifts', body),
  createShiftsBulk: (body: { shifts: ShiftPayload[] }) =>
    post<{ count: number; shifts: StaffShift[] }>('/staff-shifts/bulk', body),
  cloneWeeklyShifts: (body: { sourceWeekStart: string; targetWeekStart: string }) =>
    post<{ clonedCount: number; shifts: StaffShift[] }>('/staff-shifts/clone-weekly', body),
  updateShift: (id: string, body: ShiftPayload) => put<StaffShift>(`/staff-shifts/${id}`, body),
  deleteShift: (id: string) => del<{ id: string }>(`/staff-shifts/${id}`),

  coaches: () => get<CoachRow[]>('/coaches'),
  specialties: () => get<Specialty[]>('/specialties', true),
  createSpecialty: (body: SpecialtyPayload) => post<Specialty>('/specialties', body),
  updateSpecialty: (id: string, body: Partial<SpecialtyPayload>) =>
    put<Specialty>(`/specialties/${id}`, body),
  deleteSpecialty: (id: string) => del<{ id: string }>(`/specialties/${id}`),
  assignSpecialties: (coachId: string, specialtyIds: string[]) =>
    post<unknown>(`/coaches/${coachId}/specialties`, { specialtyIds }),
  coachSlots: (coachId: string) => get<CoachSlot[]>(`/coaches/availability${query({ coachId })}`),
  rates: (coachId: string) => get<CoachRate[]>(`/coaches/${coachId}/rates`),
  createRate: (coachId: string, body: RatePayload) =>
    post<CoachRate>(`/coaches/${coachId}/rates`, body),
  updateRate: (coachId: string, rateId: string, body: RatePayload) =>
    put<CoachRate>(`/coaches/${coachId}/rates/${rateId}`, body),
  deleteRate: (coachId: string, rateId: string) =>
    del<{ id: string }>(`/coaches/${coachId}/rates/${rateId}`),

  cancellations: () => get<CancellationRequest[]>('/cancellation-requests'),
  reviewCancellation: (
    id: string,
    body: { action: 'APPROVE' } | { action: 'REJECT'; rejectionReason: string },
  ) => put<CancellationRequest>(`/cancellation-requests/${id}/review`, body),
  withdrawCancellation: (id: string) => del<CancellationRequest>(`/cancellation-requests/${id}`),
  penalties: () => get<CoachPenalty[]>('/coach-penalties'),
  reviewPenalty: (id: string, decision: string) =>
    put<CoachPenalty>(`/coach-penalties/${id}/review`, { decision }),

  plans: () => get<MembershipPlan[]>('/memberships/plans', true),
  createPlan: (body: PlanPayload) => post<MembershipPlan>('/memberships/plans', body),
  updatePlan: (id: string, body: Partial<PlanPayload>) =>
    put<MembershipPlan>(`/memberships/plans/${id}`, body),
  disablePlan: (id: string) => del<MembershipPlan>(`/memberships/plans/${id}`),

  classes: () => get<GymClass[]>('/classes'),
  createClass: (body: ClassPayload) => post<GymClass>('/classes', body),
  updateClass: (id: string, body: Partial<ClassPayload>) => put<GymClass>(`/classes/${id}`, body),
  deleteClass: (id: string) => del<{ id: string }>(`/classes/${id}`),
  schedules: () => get<Schedule[]>('/schedules'),
  createSchedule: (body: SchedulePayload) => post<Schedule>('/schedules', body),
  updateSchedule: (id: string, body: SchedulePayload) => put<Schedule>(`/schedules/${id}`, body),
  deleteSchedule: (id: string) => del<{ id: string }>(`/schedules/${id}`),

  rooms: () => get<Room[]>('/rooms'),
  createRoom: (body: RoomPayload) => post<Room>('/rooms', body),
  updateRoom: (id: string, body: RoomPayload) => put<Room>(`/rooms/${id}`, body),
  disableRoom: (id: string) => del<Room>(`/rooms/${id}`),
  equipment: () => get<Equipment[]>('/equipment'),
  createEquipment: (body: EquipmentPayload) => post<Equipment>('/equipment', body),
  updateEquipment: (id: string, body: EquipmentPayload) => put<Equipment>(`/equipment/${id}`, body),
  disableEquipment: (id: string) => del<Equipment>(`/equipment/${id}`),
  lockers: () => get<Locker[]>('/lockers'),
  createLocker: (body: { lockerNumber: string; zone: LockerZone }) =>
    post<Locker>('/lockers', body),
  setLockerStatus: (id: string, status: LockerStatus) =>
    put<Locker>(`/lockers/${id}/status`, { status }),
  releaseLocker: (lockerId: string) =>
    put<{ id: string; status: LockerStatus; releasedAssignmentId: string | null; returnedAt: string }>(
      `/lockers/${lockerId}/release`,
      {},
    ),
  returnLocker: (assignmentId: string) =>
    put<{ id: string; returnedAt: string }>(`/lockers/assignments/${assignmentId}/return`, {}),

  members: (q: string) => get<UserRow[]>(`/users/members${query({ q })}`),
  member: (id: string) => get<MemberDetail>(`/users/${id}`),
  createMember: (body: CreateMemberPayload) =>
    post<UserRow>('/users/members', { ...body, role: 'MEMBER' }),
  updateMember: (id: string, body: MemberProfilePayload) =>
    put<MemberDetail>(`/users/members/${id}`, body),
  uploadMemberAvatar: (id: string, file: File) =>
    upload<UserRow>(`/users/members/${id}/avatar`, file),
  inbody: (memberId: string) =>
    get<{ logs: InbodyLog[] }>(`/inbody/my-progress${query({ memberId })}`).then((res) => res.logs),
  createInbody: (body: InbodyPayload) => post<InbodyLog>('/inbody/logs', body),
  updateInbody: (id: string, body: Partial<InbodyPayload>) =>
    put<InbodyLog>(`/inbody/logs/${id}`, body),
  memberSubscriptions: (memberId: string) =>
    get<MemberSubscription[]>(`/memberships/subscriptions${query({ memberId })}`),
  setSubscriptionStatus: (id: string, status: 'ACTIVE' | 'FROZEN') =>
    put<MemberSubscription>(`/memberships/subscriptions/${id}/status`, { status }),

  exercises: () => get<ExerciseKnowledge[]>('/exercise-knowledge'),
  createExercise: (body: { title: string; category: string; instructions: string }) =>
    post<ExerciseKnowledge>('/exercise-knowledge', body),
  templates: (discipline?: string) =>
    get<WorkoutTemplate[]>(`/workout-templates${query({ discipline })}`),
  workoutPlans: () => get<WorkoutPlan[]>('/workout-plans'),
  bookingPlan: (bookingId: string) =>
    get<WorkoutPlan | null>(`/bookings/${bookingId}/workout-plan`),
  assignTemplate: (body: { bookingId: string; templateCode?: string; sessionOrder?: number }) =>
    post<WorkoutPlan>('/workout-plans/assign-template', body),

  sell: (body: SalePayload) => post<unknown>('/billing/purchase', body),
  sellVip: ({ memberId, ...body }: SalePayload) =>
    post<unknown>('/billing/subscriptions/vip', { ...body, userId: memberId }),
  renew: (
    subscriptionId: string,
    body: { paymentMethod: PaymentMethod; transactionRef?: string },
  ) => post<unknown>(`/billing/subscriptions/${subscriptionId}/renew`, body),
  sellPtAddon: (
    subscriptionId: string,
    body: { addonSessions: number; paymentMethod: PaymentMethod; transactionRef?: string },
  ) => post<unknown>(`/billing/subscriptions/${subscriptionId}/pt-addon`, body),
  invoices: () => get<Invoice[]>('/billing/invoices'),

  bookings: () => get<Booking[]>('/bookings'),
  bookGroup: (body: { scheduleId: string; memberId: string }) =>
    post<Booking>('/bookings/group-class', body),
  bookPt: (body: { coachAvailabilityId: string; disciplineId: string; memberId: string }) =>
    post<Booking>('/bookings/pt', body),
  cancelBooking: (id: string, reason?: string) =>
    put<Booking>(`/bookings/${id}/cancel`, reason ? { reason } : {}),

  gateCheckin: (body: {
    userId: string
    preferredZone?: string
    towelIssued?: boolean
    notes?: string
  }) => post<GateCheckinResult>('/attendances/gate-checkin', body),
  attendances: (memberId: string) => get<Attendance[]>(`/attendances${query({ memberId })}`),
}

export const managerKeys = {
  disciplines: ['manager', 'disciplines'] as const,
  summary: ['manager', 'summary'] as const,
  revenue: ['manager', 'revenue'] as const,
  kpi: ['manager', 'kpi'] as const,
  staff: ['manager', 'staff'] as const,
  shifts: ['manager', 'shifts'] as const,
  coaches: ['manager', 'coaches'] as const,
  specialties: ['manager', 'specialties'] as const,
  rates: (coachId: string) => ['manager', 'rates', coachId] as const,
  cancellations: ['manager', 'cancellations'] as const,
  penalties: ['manager', 'penalties'] as const,
  plans: ['manager', 'plans'] as const,
  classes: ['manager', 'classes'] as const,
  schedules: ['manager', 'schedules'] as const,
  rooms: ['manager', 'rooms'] as const,
  equipment: ['manager', 'equipment'] as const,
  lockers: ['manager', 'lockers'] as const,
  members: (q: string) => ['manager', 'members', q] as const,
  member: (id: string) => ['manager', 'member', id] as const,
  memberSubscriptions: (id: string) => ['manager', 'member-subscriptions', id] as const,
  inbody: (id: string) => ['manager', 'inbody', id] as const,
  coachSlots: (coachId: string) => ['manager', 'coach-slots', coachId] as const,
  exercises: ['manager', 'exercises'] as const,
  templates: (discipline: string) => ['manager', 'templates', discipline] as const,
  workoutPlans: ['manager', 'workout-plans'] as const,
  bookingPlan: (id: string) => ['manager', 'booking-plan', id] as const,
  invoices: ['manager', 'invoices'] as const,
  bookings: ['manager', 'bookings'] as const,
  attendances: (id: string) => ['manager', 'attendances', id] as const,
}
