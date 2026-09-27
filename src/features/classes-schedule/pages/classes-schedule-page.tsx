import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  RefreshCw,
  DoorOpen,
  Users,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ClassSchedule,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  GroupDiscipline,
} from "../types";
import {
  CLASSES_CATALOG,
  TRAINING_ROOMS,
  GROUP_COACHES,
  STANDARD_CLASS_SLOTS,
  WEEK_DAYS_CURRENT,
  INITIAL_SCHEDULES,
} from "../mock-data";
import { ScheduleStatsSummary } from "../components/schedule-stats-summary";
import { WeeklyClassGrid } from "../components/weekly-class-grid";
import { CreateScheduleModal } from "../components/create-schedule-modal";
import { EditScheduleModal } from "../components/edit-schedule-modal";
import { CancelScheduleDialog } from "../components/cancel-schedule-dialog";

export const ClassesSchedulePage: React.FC = () => {
  // State
  const [schedules, setSchedules] = useState<ClassSchedule[]>(INITIAL_SCHEDULES);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<string | undefined>();
  const [createInitialSlotId, setCreateInitialSlotId] = useState<string | undefined>();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] =
    useState<ClassSchedule | null>(null);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedScheduleForCancel, setSelectedScheduleForCancel] =
    useState<ClassSchedule | null>(null);

  // Auto clear toast
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (selectedDiscipline !== "ALL" && s.discipline !== selectedDiscipline) {
        return false;
      }
      if (selectedRoomId !== "ALL" && s.roomId !== selectedRoomId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchClass = s.className.toLowerCase().includes(q);
        const matchCoach = s.coachName.toLowerCase().includes(q);
        const matchRoom = s.roomName.toLowerCase().includes(q);
        const matchCode = s.scheduleCode.toLowerCase().includes(q);
        if (!matchClass && !matchCoach && !matchRoom && !matchCode) {
          return false;
        }
      }
      return true;
    });
  }, [schedules, selectedDiscipline, selectedRoomId, searchQuery]);

  // Handle open create modal
  const handleOpenCreateModal = (date?: string, slotId?: string) => {
    setCreateInitialDate(date);
    setCreateInitialSlotId(slotId);
    setIsCreateOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (schedule: ClassSchedule) => {
    setSelectedScheduleForEdit(schedule);
    setIsEditOpen(true);
  };

  // Handle open cancel dialog
  const handleOpenCancelDialog = (schedule: ClassSchedule) => {
    setSelectedScheduleForCancel(schedule);
    setIsCancelOpen(true);
  };

  // POST: Create Schedule
  const handleCreateSchedule = (payload: CreateSchedulePayload) => {
    const classDef = CLASSES_CATALOG.find((c) => c.id === payload.classId)!;
    const room = TRAINING_ROOMS.find((r) => r.id === payload.roomId)!;
    const coach = GROUP_COACHES.find((c) => c.id === payload.coachId)!;
    const slot = STANDARD_CLASS_SLOTS.find(
      (s) => s.startTime === payload.startTime && s.endTime === payload.endTime
    ) || STANDARD_CLASS_SLOTS[0];
    const day = WEEK_DAYS_CURRENT.find((d) => d.date === payload.date);

    const newSchedule: ClassSchedule = {
      id: `sch-${Date.now()}`,
      scheduleCode: `SCH-${payload.classId.substring(4, 7).toUpperCase()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`,
      classId: payload.classId,
      className: classDef.name,
      discipline: classDef.discipline,
      disciplineLabel:
        classDef.discipline === "YOGA"
          ? "Yoga"
          : classDef.discipline === "BOXING"
          ? "Boxing"
          : "Dancing",
      roomId: payload.roomId,
      roomCode: room.code,
      roomName: room.name,
      coachId: payload.coachId,
      coachCode: coach.coachCode,
      coachName: coach.fullName,
      date: payload.date,
      dayLabel: `${day?.dayOfWeek || "Ngày"}, ${day?.dateNumber || "21"}/09`,
      startTime: payload.startTime,
      endTime: payload.endTime,
      slotId: slot.id,
      capacity: payload.capacity,
      enrolledCount: 0,
      status: "SCHEDULED",
      notes: payload.notes,
    };

    setSchedules((prev) => [newSchedule, ...prev]);
    setToastMessage({
      type: "success",
      text: `Mở ca lớp "${newSchedule.className}" thành công (${newSchedule.scheduleCode})!`,
    });
  };

  // PUT: Update Schedule
  const handleUpdateSchedule = (payload: UpdateSchedulePayload) => {
    const room = TRAINING_ROOMS.find((r) => r.id === payload.roomId)!;
    const coach = GROUP_COACHES.find((c) => c.id === payload.coachId)!;
    const slot = STANDARD_CLASS_SLOTS.find(
      (s) => s.startTime === payload.startTime && s.endTime === payload.endTime
    ) || STANDARD_CLASS_SLOTS[0];
    const day = WEEK_DAYS_CURRENT.find((d) => d.date === payload.date);

    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === payload.id) {
          return {
            ...s,
            roomId: payload.roomId,
            roomCode: room.code,
            roomName: room.name,
            coachId: payload.coachId,
            coachCode: coach.coachCode,
            coachName: coach.fullName,
            date: payload.date,
            dayLabel: `${day?.dayOfWeek || "Ngày"}, ${day?.dateNumber || "21"}/09`,
            startTime: payload.startTime,
            endTime: payload.endTime,
            slotId: slot.id,
            capacity: payload.capacity,
            notes: payload.notes,
          };
        }
        return s;
      })
    );

    setToastMessage({
      type: "success",
      text: `Đổi lịch lớp thành công! Hệ thống đã xác thực ràng buộc GiST chống trùng phòng & HLV.`,
    });
  };

  // DELETE: Cancel Schedule (only if enrolledCount === 0)
  const handleCancelSchedule = (scheduleId: string, reason: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, status: "CANCELLED" } : s))
    );
    setToastMessage({
      type: "success",
      text: `Đã hủy ca lớp thành công. Lý do: "${reason}".`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 shadow-sm animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#008b74] text-white shadow-sm">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
                Xếp Thời Khóa Biểu Lớp Nhóm
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Quản lý lịch học định kỳ 3 bộ môn (Yoga, Boxing, Dancing), chống xung đột phòng & HLV với GiST Exclude.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Mở lớp mới */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#008b74] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#007461] transition-all"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Mở Ca Lớp Mới (POST)
          </button>
        </div>
      </div>

      {/* KPI Stats Summary */}
      <ScheduleStatsSummary
        schedules={schedules}
        rooms={TRAINING_ROOMS}
        coaches={GROUP_COACHES}
      />

      {/* Week Navigator & Filters Card */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Week Selector */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                className="rounded p-1.5 text-slate-600 hover:bg-white hover:shadow-xs transition-colors"
                title="Tuần trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-3 text-xs font-bold text-slate-800">
                Tuần 39 (21/09/2026 - 27/09/2026)
              </div>
              <button
                type="button"
                className="rounded p-1.5 text-slate-600 hover:bg-white hover:shadow-xs transition-colors"
                title="Tuần tiếp theo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shrink-0">
              Đang áp dụng
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm lớp, HLV, phòng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
            </div>

            {/* Discipline Filter */}
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-[#008b74] focus:bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả môn (3 bộ môn)</option>
              <option value="YOGA">Yoga Studio</option>
              <option value="BOXING">Boxing Ring</option>
              <option value="DANCING">Dance Studio</option>
            </select>

            {/* Room Filter */}
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-[#008b74] focus:bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả phòng tập</option>
              {TRAINING_ROOMS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Timetable Matrix View */}
      <WeeklyClassGrid
        days={WEEK_DAYS_CURRENT}
        slots={STANDARD_CLASS_SLOTS}
        schedules={filteredSchedules}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenEditModal={handleOpenEditModal}
        onOpenCancelDialog={handleOpenCancelDialog}
      />

      {/* Modals & Dialogs */}
      <CreateScheduleModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSchedule}
        classes={CLASSES_CATALOG}
        rooms={TRAINING_ROOMS}
        coaches={GROUP_COACHES}
        slots={STANDARD_CLASS_SLOTS}
        days={WEEK_DAYS_CURRENT}
        existingSchedules={schedules}
        initialDate={createInitialDate}
        initialSlotId={createInitialSlotId}
      />

      <EditScheduleModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedScheduleForEdit(null);
        }}
        onSubmit={handleUpdateSchedule}
        schedule={selectedScheduleForEdit}
        rooms={TRAINING_ROOMS}
        coaches={GROUP_COACHES}
        slots={STANDARD_CLASS_SLOTS}
        days={WEEK_DAYS_CURRENT}
        existingSchedules={schedules}
      />

      <CancelScheduleDialog
        isOpen={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
          setSelectedScheduleForCancel(null);
        }}
        onConfirm={handleCancelSchedule}
        schedule={selectedScheduleForCancel}
      />
    </div>
  );
};
