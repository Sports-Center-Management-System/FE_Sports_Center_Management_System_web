import React, { useState, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  DoorOpen,
  User,
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  TrainingRoom,
  CoachUser,
  ScheduleSlot,
  UpdateSchedulePayload,
  ClassSchedule,
  DayColumn,
} from "../types";
import { checkScheduleConflict } from "../mock-data";

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateSchedulePayload) => void;
  schedule: ClassSchedule | null;
  rooms: TrainingRoom[];
  coaches: CoachUser[];
  slots: ScheduleSlot[];
  days: DayColumn[];
  existingSchedules: ClassSchedule[];
}

export const EditScheduleModal: React.FC<EditScheduleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  schedule,
  rooms,
  coaches,
  slots,
  days,
  existingSchedules,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [capacity, setCapacity] = useState<number>(20);
  const [notes, setNotes] = useState<string>("");

  // Sync state whenever schedule prop changes
  React.useEffect(() => {
    if (schedule) {
      setSelectedDate(schedule.date);
      setSelectedSlotId(schedule.slotId);
      setSelectedRoomId(schedule.roomId);
      setSelectedCoachId(schedule.coachId);
      setCapacity(schedule.capacity);
      setNotes(schedule.notes || "");
    }
  }, [schedule]);

  const currentSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) || slots[0],
    [slots, selectedSlotId]
  );

  // Eligible coaches for this discipline
  const eligibleCoaches = useMemo(() => {
    if (!schedule) return coaches;
    return coaches.filter((c) => c.specialties.includes(schedule.discipline));
  }, [coaches, schedule]);

  // Eligible rooms for this discipline
  const eligibleRooms = useMemo(() => {
    if (!schedule) return rooms;
    return rooms.filter(
      (r) => r.discipline === schedule.discipline || r.discipline === "MULTI"
    );
  }, [rooms, schedule]);

  // Real-time GiST Conflict Validation
  const conflictResult = useMemo(() => {
    if (!schedule || !selectedRoomId || !selectedCoachId || !selectedDate || !currentSlot) {
      return { hasConflict: false };
    }
    return checkScheduleConflict(
      existingSchedules,
      schedule.id, // Exclude self
      selectedRoomId,
      selectedCoachId,
      selectedDate,
      currentSlot.startTime,
      currentSlot.endTime
    );
  }, [existingSchedules, schedule, selectedRoomId, selectedCoachId, selectedDate, currentSlot]);

  if (!isOpen || !schedule) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictResult.hasConflict) return;

    // Check capacity cannot be smaller than current enrolled count
    if (capacity < schedule.enrolledCount) {
      alert(`Sĩ số tối đa không thể nhỏ hơn số học viên hiện tại (${schedule.enrolledCount} học viên)!`);
      return;
    }

    onSubmit({
      id: schedule.id,
      roomId: selectedRoomId,
      coachId: selectedCoachId,
      date: selectedDate,
      startTime: currentSlot.startTime,
      endTime: currentSlot.endTime,
      capacity: Number(capacity),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#008b74] px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <div>
              <h3 className="text-lg font-bold">Đổi Lịch Lớp Nhóm (PUT)</h3>
              <p className="text-xs text-white/80 font-mono">
                {schedule.scheduleCode} - {schedule.className}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Class details banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lớp học & Bộ môn
              </div>
              <div className="text-sm font-bold text-slate-800">
                {schedule.className}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Học viên hiện tại
              </div>
              <div className="text-sm font-bold text-emerald-700">
                {schedule.enrolledCount}/{schedule.capacity} Học viên
              </div>
            </div>
          </div>

          {/* Date & Slot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Ngày Học Mới <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              >
                {days.map((day) => (
                  <option key={day.date} value={day.date}>
                    {day.dayOfWeek} ({day.dateNumber}/09/2026)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Khung Giờ Mới <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              >
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.name} ({slot.label})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room & Coach Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Room */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phòng Tập / Studio <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              >
                {eligibleRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Coach */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                HLV Đứng Lớp <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCoachId}
                onChange={(e) => setSelectedCoachId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              >
                {eligibleCoaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.coachCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sĩ số tối đa */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Sĩ Số Tối Đa (Học viên) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-semibold text-slate-500">
                Tối thiểu: {schedule.enrolledCount} học viên (đã ghi danh)
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={schedule.enrolledCount}
                max={50}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
              <Users className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Ghi Chú Điều Chỉnh
            </label>
            <input
              type="text"
              placeholder="Lý do đổi lịch hoặc lưu ý phụ trách..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            />
          </div>

          {/* GiST Anti-Collision Warning Banner */}
          {conflictResult.hasConflict ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-rose-800">
                    Khóa GiST DB: Phát hiện xung đột lịch biểu!
                  </h4>
                  <p className="mt-1 text-rose-700">{conflictResult.message}</p>
                  <p className="mt-1 font-semibold text-rose-600">
                    Hệ thống tự động kích hoạt GiST Exclude constraint để bảo toàn tính toàn vẹn.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                GiST Check Hợp Lệ: Không có xung đột giờ dạy của HLV và không bị trùng phòng.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={conflictResult.hasConflict}
              className={`rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm transition-all ${
                conflictResult.hasConflict
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-[#008b74] hover:bg-[#007461]"
              }`}
            >
              Lưu Thay Đổi (PUT)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
