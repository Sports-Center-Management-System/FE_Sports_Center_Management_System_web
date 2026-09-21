export interface DateOption {
  dayOfWeek: string;
  dateNumber: number;
  fullDate: string; // YYYY-MM-DD
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
  rating: number; // Star rating e.g. 5.0, 4.9, 4.8
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
