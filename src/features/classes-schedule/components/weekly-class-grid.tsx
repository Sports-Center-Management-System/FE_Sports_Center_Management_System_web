import React from "react";
import {
  Clock,
  DoorOpen,
  User,
  Users,
  Plus,
  Edit2,
  Trash2,
  Flame,
  Music,
  Activity,
} from "lucide-react";
import { ClassSchedule, DayColumn, ScheduleSlot, GroupDiscipline } from "../types";

interface WeeklyClassGridProps {
  days: DayColumn[];
  slots: ScheduleSlot[];
  schedules: ClassSchedule[];
  onOpenCreateModal: (date?: string, slotId?: string) => void;
  onOpenEditModal: (schedule: ClassSchedule) => void;
  onOpenCancelDialog: (schedule: ClassSchedule) => void;
}

export const WeeklyClassGrid: React.FC<WeeklyClassGridProps> = ({
  days,
  slots,
  schedules,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenCancelDialog,
}) => {
  // Discipline styling configuration
  const getDisciplineTheme = (discipline: GroupDiscipline) => {
    switch (discipline) {
      case "YOGA":
        return {
          bg: "bg-teal-50/70 border-teal-200/90 hover:border-teal-400",
          tagBg: "bg-teal-100 text-teal-800",
          tagLabel: "Yoga",
          icon: Activity,
          iconColor: "text-teal-600",
        };
      case "BOXING":
        return {
          bg: "bg-orange-50/70 border-orange-200/90 hover:border-orange-400",
          tagBg: "bg-orange-100 text-orange-800",
          tagLabel: "Boxing",
          icon: Flame,
          iconColor: "text-orange-600",
        };
      case "DANCING":
        return {
          bg: "bg-rose-50/70 border-rose-200/90 hover:border-rose-400",
          tagBg: "bg-rose-100 text-rose-800",
          tagLabel: "Dancing",
          icon: Music,
          iconColor: "text-rose-600",
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-200 hover:border-slate-300",
          tagBg: "bg-slate-100 text-slate-700",
          tagLabel: "Lớp nhóm",
          icon: Activity,
          iconColor: "text-slate-600",
        };
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="min-w-[1200px]">
        {/* Unified Single Grid Container */}
        <div className="grid grid-cols-[105px_repeat(7,minmax(155px,1fr))] divide-x divide-y divide-slate-200 text-left">
          
          {/* Header Row: Corner Cell */}
          <div className="sticky left-0 z-20 flex flex-col items-center justify-center bg-slate-100/90 p-3 font-semibold text-slate-700 backdrop-blur-sm">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Khung giờ</span>
            <span className="text-[11px] text-slate-400">7 ngày tuần</span>
          </div>

          {/* Header Row: 7 Day Columns */}
          {days.map((day) => (
            <div
              key={day.date}
              className={`p-3 text-center transition-colors ${
                day.isToday ? "bg-[#e6f7f2]/70 font-semibold" : "bg-slate-50/90 font-medium"
              }`}
            >
              <div className="text-xs uppercase tracking-wider text-slate-600 font-bold">
                {day.dayOfWeek}
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-1.5">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    day.isToday
                      ? "bg-[#008b74] text-white"
                      : "text-slate-700"
                  }`}
                >
                  {day.dateNumber}
                </span>
                <span className="text-[11px] text-slate-400">/09</span>
              </div>
            </div>
          ))}

          {/* Matrix Body: Loop through standard time slots */}
          {slots.map((slot) => (
            <React.Fragment key={slot.id}>
              {/* Row Header: Time Slot Info */}
              <div className="sticky left-0 z-10 flex flex-col justify-center bg-slate-50/95 p-2.5 backdrop-blur-sm">
                <span className="text-xs font-bold text-slate-800">{slot.name}</span>
                <span className="mt-0.5 text-[10px] font-medium text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0 text-slate-400" />
                  {slot.label}
                </span>
                <span className="mt-1 inline-block text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                  {slot.period === "MORNING"
                    ? "Sáng"
                    : slot.period === "AFTERNOON"
                    ? "Chiều"
                    : "Tối"}
                </span>
              </div>

              {/* 7 Day Cells for this Slot */}
              {days.map((day) => {
                const daySlotSchedules = schedules.filter(
                  (s) =>
                    s.date === day.date &&
                    s.slotId === slot.id &&
                    s.status !== "CANCELLED"
                );

                return (
                  <div
                    key={`${day.date}-${slot.id}`}
                    className={`group relative min-h-[145px] p-2 transition-colors min-w-0 ${
                      day.isToday ? "bg-[#f8fcfa]/40 hover:bg-[#f0f9f6]/60" : "bg-white hover:bg-slate-50/80"
                    }`}
                  >
                    {daySlotSchedules.length > 0 ? (
                      <div className="space-y-2">
                        {daySlotSchedules.map((schedule) => {
                          const theme = getDisciplineTheme(schedule.discipline);
                          const IconComp = theme.icon;
                          const isFull = schedule.enrolledCount >= schedule.capacity;

                          return (
                            <div
                              key={schedule.id}
                              className={`relative rounded-lg border p-2 shadow-sm transition-all duration-150 overflow-hidden min-w-0 ${theme.bg}`}
                            >
                              {/* Top Bar: Discipline Tag & Enrollment Badge */}
                              <div className="flex items-center justify-between gap-1 min-w-0">
                                <span
                                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap ${theme.tagBg}`}
                                >
                                  <IconComp className="h-2.5 w-2.5 shrink-0" />
                                  {theme.tagLabel}
                                </span>
                                
                                <span
                                  className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold font-mono shrink-0 whitespace-nowrap ${
                                    isFull
                                      ? "bg-rose-100 text-rose-700"
                                      : schedule.enrolledCount > 0
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                  title={`Đã ghi danh: ${schedule.enrolledCount} / Tối đa: ${schedule.capacity} học viên`}
                                >
                                  <Users className="h-2.5 w-2.5 shrink-0 mr-0.5" />
                                  <span>{schedule.enrolledCount}/{schedule.capacity}</span>
                                </span>
                              </div>

                              {/* Class Name */}
                              <div className="mt-1.5 font-bold text-xs leading-snug text-slate-900 line-clamp-1">
                                {schedule.className}
                              </div>

                              {/* Room & Time */}
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-600">
                                <DoorOpen className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="truncate font-medium">{schedule.roomName}</span>
                              </div>

                              {/* Coach & Badge */}
                              <div className="mt-1 flex items-center justify-between gap-1 text-[11px] text-slate-700">
                                <div className="flex items-center gap-1 truncate">
                                  <User className="h-3 w-3 shrink-0 text-slate-400" />
                                  <span className="truncate font-semibold">{schedule.coachName}</span>
                                </div>
                                <span className="shrink-0 rounded bg-white/80 px-1 py-0.2 text-[9px] font-mono font-semibold text-slate-500 whitespace-nowrap border border-slate-200">
                                  {schedule.coachCode}
                                </span>
                              </div>

                              {/* Action Buttons (Đổi lịch, Hủy lớp) */}
                              <div className="mt-2 flex items-center justify-end gap-1.5 border-t border-slate-200/60 pt-1.5">
                                <button
                                  type="button"
                                  onClick={() => onOpenEditModal(schedule)}
                                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-white hover:text-[#008b74] transition-colors"
                                  title="Đổi lịch / Phòng / HLV"
                                >
                                  <Edit2 className="h-2.5 w-2.5 shrink-0" />
                                  Đổi lịch
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOpenCancelDialog(schedule)}
                                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                    schedule.enrolledCount > 0
                                      ? "text-slate-400 hover:text-rose-600 hover:bg-white"
                                      : "text-rose-600 hover:bg-rose-100/70"
                                  }`}
                                  title={
                                    schedule.enrolledCount > 0
                                      ? "Lớp đã có học viên đăng ký - Cần thông báo trước khi hủy"
                                      : "Hủy ca lớp"
                                  }
                                >
                                  <Trash2 className="h-2.5 w-2.5 shrink-0" />
                                  Hủy
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Empty Slot State
                      <div className="flex h-full min-h-[125px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/30 p-2 text-center transition-all group-hover:border-[#008b74]/40 group-hover:bg-[#008b74]/5">
                        <span className="text-[11px] font-medium text-slate-400">
                          Chưa xếp lớp
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenCreateModal(day.date, slot.id)}
                          className="mt-2 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm border border-slate-200 hover:border-[#008b74] hover:text-[#008b74] transition-all"
                        >
                          <Plus className="h-3 w-3 shrink-0" />
                          Mở lớp
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
