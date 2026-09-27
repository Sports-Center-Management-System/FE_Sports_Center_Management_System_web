export type GroupDiscipline = "YOGA" | "BOXING" | "DANCING";

// Legacy Member Booking Types
export interface ScheduleFilterTab {
  id: string;
  label: string;
  count: number;
}

export interface BookingCoach {
  id?: string;
  name: string;
  phone?: string;
  avatarUrl: string;
  specialty: string;
  rating: number;
}

export interface BookingSession {
  id: string;
  bookingCode: string;
  sessionTitle: string;
  category?: string;
  servicePackageName?: string;
  packageName?: string;
  workoutGoal?: string;
  discipline?: string;
  coach: BookingCoach;
  coachName?: string;
  coachCode?: string;
  coachTitle?: string;
  coachAvatar?: string;
  rating?: number;
  sessionDate?: string;
  date?: string;
  dateLabel: string;
  timeSlot: string;
  startTime?: string;
  location: string;
  status: "UPCOMING" | "COMPLETED" | "CANCELLED";
  statusLabel: string;
  remainingHoursBeforeSession: number;
  notes?: string;
}

export interface Coach {
  id: string;
  name: string;
  fullName?: string;
  avatarUrl: string;
  specialty: string;
  rating: number;
  ratingCount?: number;
  reviewCount?: number;
  completedSessions: number;
  experienceYears: number;
  isAssigned?: boolean;
  isAvailableToday?: boolean;
}

export interface DateOption {
  fullDate: string;
  date?: string;
  dayOfWeek: string;
  dateNumber: number | string;
  formattedDate?: string;
  isAvailable?: boolean;
  isToday?: boolean;
}

export interface TimeSlotOption {
  id: string;
  label: string;
  time?: string;
  isAvailable?: boolean;
  remainingSlots?: number;
}

export interface BookingState {
  selectedDiscipline?: string;
  selectedCoach?: Coach | null;
  selectedDate?: DateOption | null;
  selectedTimeSlot?: TimeSlotOption | null;
  servicePackageName?: string;
  notes?: string;
}

export interface ClassDefinition {
  id: string;
  name: string;
  discipline: GroupDiscipline;
  defaultDurationMinutes: number;
  description: string;
}

export interface TrainingRoom {
  id: string;
  code: string; // e.g. ROOM-YOGA-01
  name: string;
  discipline: GroupDiscipline | "MULTI";
  maxCapacity: number;
  status: "AVAILABLE" | "MAINTENANCE";
}

export interface CoachUser {
  id: string;
  coachCode: string; // e.g. COACH-01
  fullName: string;
  phone: string;
  specialties: GroupDiscipline[];
}

export interface ClassSchedule {
  id: string;
  scheduleCode: string; // e.g. SCH-YOG-2101
  classId: string;
  className: string;
  discipline: GroupDiscipline;
  disciplineLabel: string;
  roomId: string;
  roomCode: string;
  roomName: string;
  coachId: string;
  coachCode: string;
  coachName: string;
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. Thứ 2, 21/09
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  slotId: string; // e.g. slot-morning-1
  capacity: number;
  enrolledCount: number; // For cancel restriction check
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface DayColumn {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Thứ 2, Thứ 3...
  dateNumber: number; // 21, 22...
  isToday: boolean;
}

export interface ScheduleSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  period: "MORNING" | "AFTERNOON" | "EVENING";
  label: string;
}

export interface CreateSchedulePayload {
  classId: string;
  roomId: string;
  coachId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  notes?: string;
}

export interface UpdateSchedulePayload {
  id: string;
  roomId: string;
  coachId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  notes?: string;
}

export interface GiSTConflictResult {
  hasConflict: boolean;
  conflictType?: "ROOM_CONFLICT" | "COACH_CONFLICT" | "INVALID_TIME";
  conflictingSchedule?: ClassSchedule;
  message?: string;
}
