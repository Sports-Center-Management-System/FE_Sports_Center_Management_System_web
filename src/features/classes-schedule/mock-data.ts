import {
  ClassDefinition,
  TrainingRoom,
  CoachUser,
  ScheduleSlot,
  ClassSchedule,
  GiSTConflictResult,
  DayColumn,
} from "./types";

export const CLASSES_CATALOG: ClassDefinition[] = [
  // Yoga
  {
    id: "cls-yog-01",
    name: "Hatha Yoga Cơ Bản",
    discipline: "YOGA",
    defaultDurationMinutes: 75,
    description: "Tập trung hơi thở, căn chỉnh tư thế cơ bản và thư giãn sâu.",
  },
  {
    id: "cls-yog-02",
    name: "Vinyasa Flow Năng Lượng",
    discipline: "YOGA",
    defaultDurationMinutes: 75,
    description: "Chuỗi chuyển động liên hoàn kết hợp nhịp thở đốt calo hiệu quả.",
  },
  {
    id: "cls-yog-03",
    name: "Yin Yoga Phục Hồi Trị Liệu",
    discipline: "YOGA",
    defaultDurationMinutes: 90,
    description: "Kéo giãn mạc cơ sâu, giải phóng căng thẳng vùng hông và lưng dưới.",
  },

  // Boxing
  {
    id: "cls-box-01",
    name: "Kickboxing Kỹ Thuật Cơ Bản",
    discipline: "BOXING",
    defaultDurationMinutes: 60,
    description: "Luyện tập các đòn đấm Jab, Cross, Hook kết hợp bộ pháp di chuyển.",
  },
  {
    id: "cls-box-02",
    name: "Muay Thai Thể Lực & Đòn Chỏ",
    discipline: "BOXING",
    defaultDurationMinutes: 75,
    description: "Chiến thuật đối kháng cự ly gần, đòn gối và chỏ tăng cường thể lực tối đa.",
  },

  // Dancing
  {
    id: "cls-dan-01",
    name: "Zumba Fitness Sôi Động",
    discipline: "DANCING",
    defaultDurationMinutes: 60,
    description: "Vũ điệu Latin bùng nổ năng lượng, giải tỏa căng thẳng công sở.",
  },
  {
    id: "cls-dan-02",
    name: "K-Pop Choreography",
    discipline: "DANCING",
    defaultDurationMinutes: 60,
    description: "Học các bài vũ đạo K-Pop thịnh hành theo nhịp điệu trẻ trung.",
  },
];

export const TRAINING_ROOMS: TrainingRoom[] = [
  {
    id: "room-yog-01",
    code: "ROOM-YOG-01",
    name: "Studio Yoga Thiền Định",
    discipline: "YOGA",
    maxCapacity: 20,
    status: "AVAILABLE",
  },
  {
    id: "room-box-01",
    code: "ROOM-BOX-01",
    name: "Sàn Đấu Boxing & Đệm Võ",
    discipline: "BOXING",
    maxCapacity: 16,
    status: "AVAILABLE",
  },
  {
    id: "room-dan-01",
    code: "ROOM-DAN-01",
    name: "Phòng Gương Vũ Đạo Dance",
    discipline: "DANCING",
    maxCapacity: 25,
    status: "AVAILABLE",
  },
  {
    id: "room-multi-02",
    code: "ROOM-MULTI-02",
    name: "Phòng Đa Năng Studio B",
    discipline: "MULTI",
    maxCapacity: 18,
    status: "AVAILABLE",
  },
];

export const GROUP_COACHES: CoachUser[] = [
  {
    id: "cch-02",
    coachCode: "COACH-02",
    fullName: "Trần Minh Thư",
    phone: "0988 776 655",
    specialties: ["YOGA"],
  },
  {
    id: "cch-03",
    coachCode: "COACH-03",
    fullName: "Lê Hoàng Long",
    phone: "0903 221 144",
    specialties: ["BOXING"],
  },
  {
    id: "cch-06",
    coachCode: "COACH-06",
    fullName: "Nguyễn Thảo My",
    phone: "0966 889 911",
    specialties: ["YOGA", "DANCING"],
  },
  {
    id: "cch-07",
    coachCode: "COACH-07",
    fullName: "Hoàng Gia Huy",
    phone: "0915 334 477",
    specialties: ["BOXING"],
  },
  {
    id: "cch-08",
    coachCode: "COACH-08",
    fullName: "Đặng Bích Ngọc",
    phone: "0938 556 699",
    specialties: ["DANCING"],
  },
];

// Standard weekly class slots (4 primary slots per day)
export const STANDARD_CLASS_SLOTS: ScheduleSlot[] = [
  {
    id: "slot-m1",
    name: "Ca Sáng 1",
    startTime: "07:00",
    endTime: "08:30",
    period: "MORNING",
    label: "07:00 - 08:30",
  },
  {
    id: "slot-m2",
    name: "Ca Sáng 2",
    startTime: "09:00",
    endTime: "10:30",
    period: "MORNING",
    label: "09:00 - 10:30",
  },
  {
    id: "slot-a1",
    name: "Ca Chiều",
    startTime: "15:30",
    endTime: "17:00",
    period: "AFTERNOON",
    label: "15:30 - 17:00",
  },
  {
    id: "slot-e1",
    name: "Ca Tối 1",
    startTime: "17:30",
    endTime: "19:00",
    period: "EVENING",
    label: "17:30 - 19:00",
  },
  {
    id: "slot-e2",
    name: "Ca Tối 2",
    startTime: "19:30",
    endTime: "21:00",
    period: "EVENING",
    label: "19:30 - 21:00",
  },
];

export const INITIAL_SCHEDULES: ClassSchedule[] = [
  // Thứ 2: 21/09
  {
    id: "sch-21-01",
    scheduleCode: "SCH-YOG-2101",
    classId: "cls-yog-01",
    className: "Hatha Yoga Cơ Bản",
    discipline: "YOGA",
    disciplineLabel: "Yoga",
    roomId: "room-yog-01",
    roomCode: "ROOM-YOG-01",
    roomName: "Studio Yoga Thiền Định",
    coachId: "cch-02",
    coachCode: "COACH-02",
    coachName: "Trần Minh Thư",
    date: "2026-09-21",
    dayLabel: "Thứ 2, 21/09",
    startTime: "07:00",
    endTime: "08:30",
    slotId: "slot-m1",
    capacity: 20,
    enrolledCount: 14, // Has students -> CANNOT cancel
    status: "SCHEDULED",
    notes: "Chuẩn bị thảm tập và gạch xốp cho học viên mới",
  },
  {
    id: "sch-21-02",
    scheduleCode: "SCH-BOX-2102",
    classId: "cls-box-01",
    className: "Kickboxing Cơ Bản",
    discipline: "BOXING",
    disciplineLabel: "Boxing",
    roomId: "room-box-01",
    roomCode: "ROOM-BOX-01",
    roomName: "Sàn Đấu Boxing",
    coachId: "cch-03",
    coachCode: "COACH-03",
    coachName: "Lê Hoàng Long",
    date: "2026-09-21",
    dayLabel: "Thứ 2, 21/09",
    startTime: "17:30",
    endTime: "19:00",
    slotId: "slot-e1",
    capacity: 16,
    enrolledCount: 12,
    status: "SCHEDULED",
  },
  {
    id: "sch-21-03",
    scheduleCode: "SCH-DAN-2103",
    classId: "cls-dan-01",
    className: "Zumba Sôi Động",
    discipline: "DANCING",
    disciplineLabel: "Dancing",
    roomId: "room-dan-01",
    roomCode: "ROOM-DAN-01",
    roomName: "Phòng Gương Dance",
    coachId: "cch-08",
    coachCode: "COACH-08",
    coachName: "Đặng Bích Ngọc",
    date: "2026-09-21",
    dayLabel: "Thứ 2, 21/09",
    startTime: "19:30",
    endTime: "21:00",
    slotId: "slot-e2",
    capacity: 25,
    enrolledCount: 0, // 0 enrolled -> CAN CANCEL!
    status: "SCHEDULED",
    notes: "Lớp học mới thử nghiệm tuần đầu",
  },

  // Thứ 3: 22/09
  {
    id: "sch-22-01",
    scheduleCode: "SCH-YOG-2201",
    classId: "cls-yog-02",
    className: "Vinyasa Flow",
    discipline: "YOGA",
    disciplineLabel: "Yoga",
    roomId: "room-yog-01",
    roomCode: "ROOM-YOG-01",
    roomName: "Studio Yoga Thiền Định",
    coachId: "cch-06",
    coachCode: "COACH-06",
    coachName: "Nguyễn Thảo My",
    date: "2026-09-22",
    dayLabel: "Thứ 3, 22/09",
    startTime: "09:00",
    endTime: "10:30",
    slotId: "slot-m2",
    capacity: 20,
    enrolledCount: 18,
    status: "SCHEDULED",
  },
  {
    id: "sch-22-02",
    scheduleCode: "SCH-BOX-2202",
    classId: "cls-box-02",
    className: "Muay Thai Thể Lực",
    discipline: "BOXING",
    disciplineLabel: "Boxing",
    roomId: "room-box-01",
    roomCode: "ROOM-BOX-01",
    roomName: "Sàn Đấu Boxing",
    coachId: "cch-07",
    coachCode: "COACH-07",
    coachName: "Hoàng Gia Huy",
    date: "2026-09-22",
    dayLabel: "Thứ 3, 22/09",
    startTime: "17:30",
    endTime: "19:00",
    slotId: "slot-e1",
    capacity: 16,
    enrolledCount: 10,
    status: "SCHEDULED",
  },

  // Thứ 4: 23/09
  {
    id: "sch-23-01",
    scheduleCode: "SCH-YOG-2301",
    classId: "cls-yog-01",
    className: "Hatha Yoga Cơ Bản",
    discipline: "YOGA",
    disciplineLabel: "Yoga",
    roomId: "room-yog-01",
    roomCode: "ROOM-YOG-01",
    roomName: "Studio Yoga Thiền Định",
    coachId: "cch-02",
    coachCode: "COACH-02",
    coachName: "Trần Minh Thư",
    date: "2026-09-23",
    dayLabel: "Thứ 4, 23/09",
    startTime: "07:00",
    endTime: "08:30",
    slotId: "slot-m1",
    capacity: 20,
    enrolledCount: 15,
    status: "SCHEDULED",
  },
  {
    id: "sch-23-02",
    scheduleCode: "SCH-DAN-2302",
    classId: "cls-dan-02",
    className: "K-Pop Choreography",
    discipline: "DANCING",
    disciplineLabel: "Dancing",
    roomId: "room-dan-01",
    roomCode: "ROOM-DAN-01",
    roomName: "Phòng Gương Dance",
    coachId: "cch-08",
    coachCode: "COACH-08",
    coachName: "Đặng Bích Ngọc",
    date: "2026-09-23",
    dayLabel: "Thứ 4, 23/09",
    startTime: "17:30",
    endTime: "19:00",
    slotId: "slot-e1",
    capacity: 25,
    enrolledCount: 22,
    status: "SCHEDULED",
  },

  // Thứ 5: 24/09
  {
    id: "sch-24-01",
    scheduleCode: "SCH-BOX-2401",
    classId: "cls-box-01",
    className: "Kickboxing Cơ Bản",
    discipline: "BOXING",
    disciplineLabel: "Boxing",
    roomId: "room-box-01",
    roomCode: "ROOM-BOX-01",
    roomName: "Sàn Đấu Boxing",
    coachId: "cch-03",
    coachCode: "COACH-03",
    coachName: "Lê Hoàng Long",
    date: "2026-09-24",
    dayLabel: "Thứ 5, 24/09",
    startTime: "09:00",
    endTime: "10:30",
    slotId: "slot-m2",
    capacity: 16,
    enrolledCount: 8,
    status: "SCHEDULED",
  },
  {
    id: "sch-24-02",
    scheduleCode: "SCH-YOG-2402",
    classId: "cls-yog-03",
    className: "Yin Yoga Trị Liệu",
    discipline: "YOGA",
    disciplineLabel: "Yoga",
    roomId: "room-yog-01",
    roomCode: "ROOM-YOG-01",
    roomName: "Studio Yoga Thiền Định",
    coachId: "cch-06",
    coachCode: "COACH-06",
    coachName: "Nguyễn Thảo My",
    date: "2026-09-24",
    dayLabel: "Thứ 5, 24/09",
    startTime: "19:30",
    endTime: "21:00",
    slotId: "slot-e2",
    capacity: 20,
    enrolledCount: 0, // 0 enrolled -> CAN CANCEL!
    status: "SCHEDULED",
  },

  // Thứ 6: 25/09
  {
    id: "sch-25-01",
    scheduleCode: "SCH-YOG-2501",
    classId: "cls-yog-01",
    className: "Hatha Yoga Cơ Bản",
    discipline: "YOGA",
    disciplineLabel: "Yoga",
    roomId: "room-yog-01",
    roomCode: "ROOM-YOG-01",
    roomName: "Studio Yoga Thiền Định",
    coachId: "cch-02",
    coachCode: "COACH-02",
    coachName: "Trần Minh Thư",
    date: "2026-09-25",
    dayLabel: "Thứ 6, 25/09",
    startTime: "07:00",
    endTime: "08:30",
    slotId: "slot-m1",
    capacity: 20,
    enrolledCount: 16,
    status: "SCHEDULED",
  },
  {
    id: "sch-25-02",
    scheduleCode: "SCH-DAN-2502",
    classId: "cls-dan-01",
    className: "Zumba Sôi Động",
    discipline: "DANCING",
    disciplineLabel: "Dancing",
    roomId: "room-dan-01",
    roomCode: "ROOM-DAN-01",
    roomName: "Phòng Gương Dance",
    coachId: "cch-08",
    coachCode: "COACH-08",
    coachName: "Đặng Bích Ngọc",
    date: "2026-09-25",
    dayLabel: "Thứ 6, 25/09",
    startTime: "17:30",
    endTime: "19:00",
    slotId: "slot-e1",
    capacity: 25,
    enrolledCount: 20,
    status: "SCHEDULED",
  },

  // Thứ 7: 26/09
  {
    id: "sch-26-01",
    scheduleCode: "SCH-BOX-2601",
    classId: "cls-box-02",
    className: "Muay Thai Thể Lực",
    discipline: "BOXING",
    disciplineLabel: "Boxing",
    roomId: "room-box-01",
    roomCode: "ROOM-BOX-01",
    roomName: "Sàn Đấu Boxing",
    coachId: "cch-03",
    coachCode: "COACH-03",
    coachName: "Lê Hoàng Long",
    date: "2026-09-26",
    dayLabel: "Thứ 7, 26/09",
    startTime: "09:00",
    endTime: "10:30",
    slotId: "slot-m2",
    capacity: 16,
    enrolledCount: 14,
    status: "SCHEDULED",
  },
  {
    id: "sch-26-02",
    scheduleCode: "SCH-YOG-2602",
    classId: "cls-yog-02",
    className: "Vinyasa Flow",
    discipline: "YOGA",
    disciplineLabel: "Yoga",
    roomId: "room-yog-01",
    roomCode: "ROOM-YOG-01",
    roomName: "Studio Yoga Thiền Định",
    coachId: "cch-02",
    coachCode: "COACH-02",
    coachName: "Trần Minh Thư",
    date: "2026-09-26",
    dayLabel: "Thứ 7, 26/09",
    startTime: "15:30",
    endTime: "17:00",
    slotId: "slot-a1",
    capacity: 20,
    enrolledCount: 17,
    status: "SCHEDULED",
  },

  // Chủ Nhật: 27/09
  {
    id: "sch-27-01",
    scheduleCode: "SCH-YOG-2701",
    classId: "cls-yog-03",
    className: "Yin Yoga Trị Liệu",
    discipline: "YOGA",
    disciplineLabel: "Yoga",
    roomId: "room-yog-01",
    roomCode: "ROOM-YOG-01",
    roomName: "Studio Yoga Thiền Định",
    coachId: "cch-06",
    coachCode: "COACH-06",
    coachName: "Nguyễn Thảo My",
    date: "2026-09-27",
    dayLabel: "Chủ Nhật, 27/09",
    startTime: "09:00",
    endTime: "10:30",
    slotId: "slot-m2",
    capacity: 20,
    enrolledCount: 19,
    status: "SCHEDULED",
  },
  {
    id: "sch-27-02",
    scheduleCode: "SCH-DAN-2702",
    classId: "cls-dan-02",
    className: "K-Pop Choreography",
    discipline: "DANCING",
    disciplineLabel: "Dancing",
    roomId: "room-dan-01",
    roomCode: "ROOM-DAN-01",
    roomName: "Phòng Gương Dance",
    coachId: "cch-08",
    coachCode: "COACH-08",
    coachName: "Đặng Bích Ngọc",
    date: "2026-09-27",
    dayLabel: "Chủ Nhật, 27/09",
    startTime: "15:30",
    endTime: "17:00",
    slotId: "slot-a1",
    capacity: 25,
    enrolledCount: 23,
    status: "SCHEDULED",
  },
];

// GiST Exclude Conflict Checker:
// Checks both ROOM CONFLICT and COACH CONFLICT on same date and overlapping time
export const checkScheduleConflict = (
  schedules: ClassSchedule[],
  currentScheduleId: string | null,
  roomId: string,
  coachId: string,
  date: string,
  startTime: string,
  endTime: string
): GiSTConflictResult => {
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  if (newStart >= newEnd) {
    return {
      hasConflict: true,
      conflictType: "INVALID_TIME",
      message: "Giờ bắt đầu ca học phải nhỏ hơn giờ kết thúc!",
    };
  }

  for (const s of schedules) {
    if (s.status === "CANCELLED") continue;
    if (currentScheduleId && s.id === currentScheduleId) continue;
    if (s.date !== date) continue;

    const existingStart = timeToMinutes(s.startTime);
    const existingEnd = timeToMinutes(s.endTime);

    // Overlapping condition: max(start1, start2) < min(end1, end2)
    const isOverlapping = Math.max(newStart, existingStart) < Math.min(newEnd, existingEnd);

    if (isOverlapping) {
      if (s.roomId === roomId) {
        return {
          hasConflict: true,
          conflictType: "ROOM_CONFLICT",
          conflictingSchedule: s,
          message: `Xung đột GiST Trùng Phòng: Phòng "${s.roomName}" (${s.roomCode}) đã được xếp cho lớp "${s.className}" từ ${s.startTime} đến ${s.endTime}.`,
        };
      }

      if (s.coachId === coachId) {
        return {
          hasConflict: true,
          conflictType: "COACH_CONFLICT",
          conflictingSchedule: s,
          message: `Xung đột GiST Trùng HLV: HLV "${s.coachName}" (${s.coachCode}) đang phụ trách lớp "${s.className}" từ ${s.startTime} đến ${s.endTime}.`,
        };
      }
    }
  }

  return { hasConflict: false };
};

export const WEEK_DAYS_CURRENT: DayColumn[] = [
  { date: "2026-09-21", dayOfWeek: "Thứ 2", dateNumber: 21, isToday: false },
  { date: "2026-09-22", dayOfWeek: "Thứ 3", dateNumber: 22, isToday: false },
  { date: "2026-09-23", dayOfWeek: "Thứ 4", dateNumber: 23, isToday: false },
  { date: "2026-09-24", dayOfWeek: "Thứ 5", dateNumber: 24, isToday: false },
  { date: "2026-09-25", dayOfWeek: "Thứ 6", dateNumber: 25, isToday: false },
  { date: "2026-09-26", dayOfWeek: "Thứ 7", dateNumber: 26, isToday: false },
  { date: "2026-09-27", dayOfWeek: "Chủ Nhật", dateNumber: 27, isToday: true },
];
