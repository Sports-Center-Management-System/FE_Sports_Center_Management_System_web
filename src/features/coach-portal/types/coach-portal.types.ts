export type AttendanceStatus = 'ATTENDED' | 'ABSENT' | 'CANCELLED';

export interface StudentBookingItem {
  id: string;
  bookingType: 'GROUP_CLASS' | 'PERSONAL_TRAINING';
  status: 'CONFIRMED' | 'PENDING' | 'ATTENDED' | 'CANCELLED';
  bookedAt: string;
  memberId?: string;
  member?: {
    id: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string | null;
    memberProfile?: {
      fitnessGoals?: string | null;
      medicalHistory?: string | null;
      heightCm?: number | null;
    } | null;
  } | null;
  attendance?: {
    id: string;
    status: AttendanceStatus;
    checkInTime?: string;
    notes?: string | null;
  } | null;
}

export interface ScheduleClassItem {
  id: string;
  disciplineId?: string;
  class?: {
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    capacity: number;
  };
  room?: {
    id: string;
    name: string;
    roomNumber: string;
    capacity: number;
  };
  startTime: string;
  endTime: string;
  status?: 'OPEN' | 'FULL' | 'CANCELLED' | 'COMPLETED';
  currentEnrolled?: number;
  bookings?: StudentBookingItem[];
}

export interface PtSessionItem {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isEmergencyCancelled?: boolean;
  bookings?: StudentBookingItem[];
}

export interface UnifiedCoachSession {
  id: string;
  type: 'GROUP_CLASS' | 'PERSONAL_TRAINING';
  scheduleId?: string | null;
  coachAvailabilityId?: string | null;
  title: string;
  disciplineId?: string | null;
  disciplineName?: string | null;
  roomName?: string | null;
  startTime: string;
  endTime: string;
  status: 'OPEN' | 'FULL' | 'CONFIRMED' | 'PENDING' | 'ATTENDED' | 'CANCELLED' | 'COMPLETED';
  currentEnrolled?: number;
  capacity?: number;
  bookings: StudentBookingItem[];
  isEmergencyCancelled?: boolean;
  isBooked?: boolean;
}

export interface TodayScheduleData {
  classes: ScheduleClassItem[];
  pt: PtSessionItem[];
}

export interface CoachAvailabilitySlot {
  id: string;
  coachId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isEmergencyCancelled: boolean;
}

export interface CreateSlotPayload {
  startTime: string;
  endTime: string;
}

export interface ClassAttendancePayload {
  bookingId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface UpdateAttendancePayload {
  status: AttendanceStatus;
  notes?: string;
}

export interface CancellationRequestPayload {
  scheduleId?: string;
  bookingId?: string;
  reasonMessage: string;
  internalNote?: string;
}

export interface CancellationRequestItem {
  id: string;
  coachId: string;
  scheduleId?: string | null;
  bookingId?: string | null;
  targetType: 'PERSONAL_TRAINING' | 'GROUP_CLASS';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reasonMessage: string;
  internalNote?: string | null;
  isFrontdeskOverride?: boolean;
  reviewedByUserId?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoachPenaltyItem {
  id: string;
  coachId: string;
  month: string;
  cancellationCount: number;
  suggestedAction: 'NONE' | 'WARNING' | 'SUGGEST_RATE_REDUCTION_15PCT' | 'TEMP_SUSPEND';
  appliedAction?: string | null;
  isReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InbodyLogItem {
  id: string;
  memberId: string;
  measuredAt: string;
  weightKg: number;
  muscleMassKg?: number | null;
  bodyFatKg?: number | null;
  score?: number | null;
  notes?: string | null;
}

export interface AssignedMemberItem {
  id: string;
  disciplineId: string;
  endDate: string;
  remainingGroupSessions: number;
  remainingPtSessions: number;
  user: {
    id: string;
    fullName: string;
    phone?: string;
    email: string;
    avatarUrl?: string | null;
    memberProfile?: {
      fitnessGoals?: string | null;
      medicalHistory?: string | null;
      heightCm?: number | null;
    } | null;
    memberInbodyLogs: InbodyLogItem[];
  };
}

export interface InbodyLogPayload {
  memberId: string;
  weightKg: number;
  muscleMassKg?: number;
  bodyFatKg?: number;
  score?: number;
  notes?: string;
}

export interface ExerciseKnowledgeItem {
  id: string;
  title: string;
  category: string;
  instructions: string;
}

export interface WorkoutExerciseDto {
  exerciseId: string;
  sets?: number;
  reps?: number;
  weightKg?: number;
  restSeconds?: number;
  coachFeedback?: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  exerciseId: string;
  sets?: number;
  reps?: number;
  unit?: string;
  weightKg?: number | null;
  restSeconds?: number;
  orderIndex: number;
  exercise: {
    title: string;
    category: string;
    instructions?: string;
  };
}

export interface WorkoutTemplateItem {
  id: string;
  templateCode: string;
  disciplineCode: string;
  title: string;
  weekNumber: number;
  sessionOrder: number;
  description?: string;
  exercises: WorkoutTemplateExercise[];
}

export interface BookingWorkoutExercise {
  id: string;
  exerciseId: string;
  sets?: number;
  reps?: number;
  weightKg?: number | null;
  restSeconds?: number;
  coachFeedback?: string | null;
  orderIndex: number;
  exercise?: {
    id?: string;
    title: string;
    category: string;
    instructions?: string;
  };
}

export interface BookingWorkoutPlan {
  id: string;
  bookingId: string;
  sessionOrder?: number;
  title: string;
  notes?: string | null;
  exercises: BookingWorkoutExercise[];
}

export interface UpdateSessionWorkoutPlanPayload {
  notes?: string;
  exercises: Array<{
    exerciseId: string;
    sets?: number;
    reps?: number;
    weightKg?: number | null;
    restSeconds?: number;
    coachFeedback?: string;
  }>;
}

export interface WorkoutExerciseItem extends WorkoutExerciseDto {
  id: string;
  orderIndex: number;
  exercise?: {
    id: string;
    title: string;
    category: string;
  };
}

export interface WorkoutPlanItem {
  id: string;
  memberId: string;
  coachId: string;
  title: string;
  notes?: string | null;
  createdAt: string;
  exercises: WorkoutExerciseItem[];
}

export interface CreateWorkoutPlanPayload {
  memberId: string;
  title: string;
  notes?: string;
  exercises: WorkoutExerciseDto[];
}

export interface EquipmentItem {
  id: string;
  name: string;
  equipmentType: string;
  isActive: boolean;
  createdAt: string;
}

export interface CoachRateItem {
  id: string;
  disciplineId: string;
  ratePerSession: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  discipline?: {
    id: string;
    name: string;
    code: string;
  };
}
