// Schedule Types
export type BookingSessionStatus = "UPCOMING" | "COMPLETED" | "CANCELLED";

export interface CoachInfo {
  id: string;
  name: string;
  specialty: string;
  avatarUrl: string;
  rating: number;
  phone?: string;
}

export interface BookingSession {
  id: string;
  bookingCode: string;
  sessionTitle: string;
  category: "PT_1ON1" | "PILATES" | "YOGA" | "GROUPX" | "BOXING";
  coach: CoachInfo;
  date: string; // e.g. "2026-09-24"
  dateLabel: string; // e.g. "Thứ 5, 24/09/2026"
  timeSlot: string; // e.g. "18:00 - 19:30"
  location: string; // e.g. "Phòng PT VIP 02 - Tầng 3"
  status: BookingSessionStatus;
  statusLabel: string;
  workoutGoal?: string;
  packageName: string;
  remainingHoursBeforeSession: number; // For cancellation policy check
  notes?: string;
}

export interface ScheduleFilterTab {
  id: "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED";
  label: string;
  count: number;
}

// Booking Step Types
export interface DateOption {
  dayOfWeek: string;
  dateNumber: number;
  fullDate: string;
  isAvailable?: boolean;
}

export interface TimeSlotOption {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  isAvailable?: boolean;
}

export interface Coach {
  id: string;
  name: string;
  specialty: string;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  isAssigned?: boolean;
  assignedLabel?: string;
  experienceYears?: number;
}

export interface BookingState {
  selectedDate: DateOption;
  selectedTimeSlot: TimeSlotOption;
  selectedCoach: Coach;
  servicePackageName: string;
}
