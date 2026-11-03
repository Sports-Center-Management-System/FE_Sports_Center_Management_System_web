import { get, post, put, query, request } from '@/lib/api'
import type {
  CancellationRequest,
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

export const managerApi = {
  disciplines: () => get<Discipline[]>('/disciplines', true),

  summary: () => get<ManagerSummary>('/analytics/manager-summary'),
  revenue: () => get<RevenueReport>('/analytics/revenue'),
  kpi: () => get<KpiReport>('/analytics/kpi'),

  staff: () => get<UserRow[]>('/users/staff'),
  createStaff: (body: CreateStaffPayload) => post<UserRow>('/users', body),
  updateStaff: (id: string, body: UpdateStaffPayload) => put<UserRow>(`/users/staff/${id}`, body),
  disableStaff: (id: string) => del<UserRow>(`/users/staff/${id}`),

  shifts: () => get<StaffShift[]>('/staff-shifts'),
  createShift: (body: ShiftPayload) => post<StaffShift>('/staff-shifts', body),
  updateShift: (id: string, body: ShiftPayload) => put<StaffShift>(`/staff-shifts/${id}`, body),
  deleteShift: (id: string) => del<{ id: string }>(`/staff-shifts/${id}`),

  coaches: () => get<CoachRow[]>('/coaches'),
  specialties: () => get<Specialty[]>('/specialties', true),
  createSpecialty: (body: SpecialtyPayload) => post<Specialty>('/specialties', body),
  deleteSpecialty: (id: string) => del<{ id: string }>(`/specialties/${id}`),
  assignSpecialties: (coachId: string, specialtyIds: string[]) =>
    post<unknown>(`/coaches/${coachId}/specialties`, { specialtyIds }),
  rates: (coachId: string) => get<CoachRate[]>(`/coaches/${coachId}/rates`),
  createRate: (coachId: string, body: RatePayload) =>
    post<CoachRate>(`/coaches/${coachId}/rates`, body),
  updateRate: (coachId: string, rateId: string, body: RatePayload) =>
    put<CoachRate>(`/coaches/${coachId}/rates/${rateId}`, body),
  deleteRate: (coachId: string, rateId: string) =>
    del<{ id: string }>(`/coaches/${coachId}/rates/${rateId}`),

  cancellations: () => get<CancellationRequest[]>('/cancellation-requests'),
  reviewCancellation: (id: string, body: { action: 'APPROVE' } | { action: 'REJECT'; rejectionReason: string }) =>
    put<CancellationRequest>(`/cancellation-requests/${id}/review`, body),
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
  createLocker: (body: { lockerNumber: string; zone: LockerZone }) => post<Locker>('/lockers', body),
  setLockerStatus: (id: string, status: LockerStatus) => put<Locker>(`/lockers/${id}/status`, { status }),

  members: (q: string) => get<UserRow[]>(`/users/members${query({ q })}`),
  member: (id: string) => get<MemberDetail>(`/users/${id}`),
  memberSubscriptions: (memberId: string) =>
    get<MemberSubscription[]>(`/memberships/subscriptions${query({ memberId })}`),
  setSubscriptionStatus: (id: string, status: 'ACTIVE' | 'FROZEN') =>
    put<MemberSubscription>(`/memberships/subscriptions/${id}/status`, { status }),
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
}
