import React, { useState, useMemo } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  DoorOpen,
  User,
  Users,
  ShieldAlert,
} from "lucide-react";
import {
  ClassDefinition,
  TrainingRoom,
  CoachUser,
  ScheduleSlot,
  CreateSchedulePayload,
  ClassSchedule,
  DayColumn,
} from "../types";
import { checkScheduleConflict } from "../mock-data";

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSchedulePayload) => void;
  classes: ClassDefinition[];
  rooms: TrainingRoom[];
  coaches: CoachUser[];
  slots: ScheduleSlot[];
  days: DayColumn[];
  existingSchedules: ClassSchedule[];
  initialDate?: string;
  initialSlotId?: string;
}

export const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  classes,
  rooms,
  coaches,
  slots,
  days,
  existingSchedules,
  initialDate,
  initialSlotId,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || days[0]?.date || "2026-09-21");
  const [selectedSlotId, setSelectedSlotId] = useState<string>(initialSlotId || slots[0]?.id || "slot-m1");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || "");
  const [selectedCoachId, setSelectedCoachId] = useState<string>(coaches[0]?.id || "");
  const [capacity, setCapacity] = useState<number>(20);
  const [notes, setNotes] = useState<string>("");

  // Update selection if modal re-opens with new initial props
  React.useEffect(() => {
    if (initialDate) setSelectedDate(initialDate);
    if (initialSlotId) setSelectedSlotId(initialSlotId);
  }, [initialDate, initialSlotId, isOpen]);

  // Selected class definition
  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || classes[0],
    [classes, selectedClassId]
  );

  // Selected slot definition
  const currentSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) || slots[0],
    [slots, selectedSlotId]
  );

  // Filter coaches matching current class discipline
  const eligibleCoaches = useMemo(() => {
    if (!currentClass) return coaches;
    return coaches.filter((c) => c.specialties.includes(currentClass.discipline));
  }, [coaches, currentClass]);

  // Auto pick eligible coach if current selected coach not eligible
  React.useEffect(() => {
    if (eligibleCoaches.length > 0) {
      const isStillEligible = eligibleCoaches.some((c) => c.id === selectedCoachId);
      if (!isStillEligible) {
        setSelectedCoachId(eligibleCoaches[0].id);
      }
    }
  }, [eligibleCoaches, selectedCoachId]);

  // Filter compatible rooms
  const eligibleRooms = useMemo(() => {
    if (!currentClass) return rooms;
    return rooms.filter(
      (r) => r.discipline === currentClass.discipline || r.discipline === "MULTI"
    );
  }, [rooms, currentClass]);

  // Auto pick eligible room if current not compatible
  React.useEffect(() => {
    if (eligibleRooms.length > 0) {
      const isStillEligible = eligibleRooms.some((r) => r.id === selectedRoomId);
      if (!isStillEligible) {
        setSelectedRoomId(eligibleRooms[0].id);
      }
    }
  }, [eligibleRooms, selectedRoomId]);

  // Adjust capacity default when room changes
  React.useEffect(() => {
    const r = rooms.find((rm) => rm.id === selectedRoomId);
    if (r) {
      setCapacity(r.maxCapacity);
    }
  }, [selectedRoomId, rooms]);

  // Real-time GiST Conflict Validation
  const conflictResult = useMemo(() => {
    if (!selectedRoomId || !selectedCoachId || !selectedDate || !currentSlot) {
      return { hasConflict: false };
    }
    return checkScheduleConflict(
      existingSchedules,
      null, // new schedule
      selectedRoomId,
      selectedCoachId,
      selectedDate,
      currentSlot.startTime,
      currentSlot.endTime
    );
  }, [existingSchedules, selectedRoomId, selectedCoachId, selectedDate, currentSlot]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictResult.hasConflict) return;

    onSubmit({
      classId: selectedClassId,
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
            <h3 className="text-lg font-bold">Mở Ca Lớp Nhóm Mới (POST)</h3>
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
          {/* Class Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Lớp Học & Môn Bộ Môn <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  [{cls.discipline}] {cls.name} ({cls.defaultDurationMinutes} phút)
                </option>
              ))}
            </select>
            {currentClass && (
              <p className="mt-1 text-xs text-slate-500">{currentClass.description}</p>
            )}
          </div>

          {/* Date & Slot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Ngày Học (Tuần hiện tại) <span className="text-rose-500">*</span>
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
                Khung Giờ Ca Học <span className="text-rose-500">*</span>
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
                    {room.name} ({room.code} - Tối đa {room.maxCapacity} HV)
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

          {/* Sĩ số tối đa (Capacity) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Sĩ Số Tối Đa (Học viên) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={5}
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
              Ghi Chú Vận Hành (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Chuẩn bị thảm tập, găng boxing trước 15 phút..."
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
                    Vui lòng chọn phòng khác, HLV khác hoặc đổi khung giờ để tránh chồng chéo.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                GiST Check Hợp Lệ: Phòng tập và HLV đều sẵn sàng trong khung giờ {currentSlot.label}.
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
              Xác Nhận Mở Lớp (POST)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
