import React, { useState } from "react";
import {
  StaffShift,
  DayColumn,
  ShiftType,
  CreateShiftPayload,
  UpdateShiftPayload,
} from "../types";
import { MOCK_RECEPTIONISTS, INITIAL_SHIFTS } from "../mock-data";
import { ShiftStatsSummary } from "../components/shift-stats-summary";
import { WeeklyCalendarGrid } from "../components/weekly-calendar-grid";
import { CreateShiftModal } from "../components/create-shift-modal";
import { EditShiftModal } from "../components/edit-shift-modal";
import { DeleteShiftDialog } from "../components/delete-shift-dialog";
import { CheckCircle2, ShieldCheck, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_DAYS: DayColumn[] = [
  { date: "2026-09-21", dayOfWeek: "Thứ 2", dateNumber: 21, isToday: false },
  { date: "2026-09-22", dayOfWeek: "Thứ 3", dateNumber: 22, isToday: false },
  { date: "2026-09-23", dayOfWeek: "Thứ 4", dateNumber: 23, isToday: false },
  { date: "2026-09-24", dayOfWeek: "Thứ 5", dateNumber: 24, isToday: false },
  { date: "2026-09-25", dayOfWeek: "Thứ 6", dateNumber: 25, isToday: false },
  { date: "2026-09-26", dayOfWeek: "Thứ 7", dateNumber: 26, isToday: false },
  { date: "2026-09-27", dayOfWeek: "Chủ Nhật", dateNumber: 27, isToday: true },
];

export const ReceptionShiftSchedulingPage: React.FC = () => {
  const [shifts, setShifts] = useState<StaffShift[]>(INITIAL_SHIFTS);
  const [days, setDays] = useState<DayColumn[]>(DEFAULT_DAYS);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [prefillStartTime, setPrefillStartTime] = useState<string | undefined>();
  const [prefillEndTime, setPrefillEndTime] = useState<string | undefined>();

  const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
  const [deletingShift, setDeletingShift] = useState<StaffShift | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // POST: Create new shift
  const handleCreateShift = (payload: CreateShiftPayload) => {
    const user = MOCK_RECEPTIONISTS.find((u) => u.id === payload.userId) || MOCK_RECEPTIONISTS[0];
    const dayCol = days.find((d) => d.date === payload.date);
    const dayLabel = dayCol ? `${dayCol.dayOfWeek}, ${dayCol.dateNumber}/09` : payload.date;

    const newShift: StaffShift = {
      id: `sh-${Date.now()}`,
      shiftCode: `SH-${payload.date.slice(8, 10)}${payload.date.slice(5, 7)}-${String(
        shifts.length + 1
      ).padStart(2, "0")}`,
      userId: payload.userId,
      user,
      date: payload.date,
      dayLabel,
      startTime: payload.startTime,
      endTime: payload.endTime,
      shiftType: payload.shiftType,
      shiftTypeLabel:
        payload.shiftType === "SLOT_2H30"
          ? `${payload.startTime} - ${payload.endTime}`
          : payload.shiftType === "MORNING"
          ? "Ca Sáng"
          : payload.shiftType === "AFTERNOON"
          ? "Ca Chiều"
          : "Ca Linh Hoạt",
      status: "ASSIGNED",
      notes: payload.notes,
    };

    setShifts((prev) => [...prev, newShift]);
    showToast(`Đã phân ca trực thành công cho ${user.fullName} (${newShift.shiftTypeLabel})!`);
  };

  // PUT: Update shift
  const handleUpdateShift = (payload: UpdateShiftPayload) => {
    const user = MOCK_RECEPTIONISTS.find((u) => u.id === payload.userId) || MOCK_RECEPTIONISTS[0];
    const dayCol = days.find((d) => d.date === payload.date);
    const dayLabel = dayCol ? `${dayCol.dayOfWeek}, ${dayCol.dateNumber}/09` : payload.date;

    setShifts((prev) =>
      prev.map((s) =>
        s.id === payload.id
          ? {
              ...s,
              userId: payload.userId,
              user,
              date: payload.date,
              dayLabel,
              startTime: payload.startTime,
              endTime: payload.endTime,
              shiftType: payload.shiftType,
              shiftTypeLabel:
                payload.shiftType === "SLOT_2H30"
                  ? `${payload.startTime} - ${payload.endTime}`
                  : payload.shiftType === "MORNING"
                  ? "Ca Sáng"
                  : payload.shiftType === "AFTERNOON"
                  ? "Ca Chiều"
                  : "Ca Linh Hoạt",
              notes: payload.notes,
            }
          : s
      )
    );
    showToast(`Đã cập nhật ca trực ${payload.id} thành công!`);
  };

  // DELETE: Delete / Cancel shift
  const handleDeleteShift = (shiftId: string, reason: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    showToast("Đã xóa ca trực khỏi lịch tuần thành công!");
  };

  // Week Navigator Handlers
  const handlePreviousWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };
  const handleNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };
  const handleCurrentWeek = () => {
    setWeekOffset(0);
  };

  const weekRangeLabel =
    weekOffset === 0
      ? "Tuần 39 (21/09/2026 - 27/09/2026)"
      : weekOffset === -1
      ? "Tuần 38 (14/09/2026 - 20/09/2026)"
      : "Tuần 40 (28/09/2026 - 04/10/2026)";

  const activeShiftsCount = shifts.filter((s) => s.status !== "CANCELLED").length;
  const todayShifts = shifts.filter((s) => s.date === "2026-09-27" && s.status !== "CANCELLED").length;

  return (
    <div className="space-y-7 pb-12 w-full max-w-7xl mx-auto">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-8 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#e6f7f2] px-2 py-0.5 text-[10px] font-bold text-[#008b74] tracking-wide uppercase">
              CENTER_MANAGER
            </span>
            <span className="text-xs text-slate-400">
              Quản lý định biên &amp; Phân ca tiếp đón
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Phân Ca Trực Lễ Tân
          </h2>
          <p className="text-xs text-slate-500">
            Điều phối lịch làm việc, kiểm tra trùng giờ tự động và giám sát nhân sự quầy lễ tân
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Hệ thống đang xuất bảng phân ca Excel...")}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Xuất lịch trực
          </Button>

          <Button
            variant="mint"
            size="sm"
            onClick={() => {
              setPrefillDate(undefined);
              setPrefillStartTime(undefined);
              setPrefillEndTime(undefined);
              setIsCreateOpen(true);
            }}
            className="rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Tạo ca trực mới
          </Button>
        </div>
      </div>

      {/* 1. Summary Metrics */}
      <ShiftStatsSummary
        totalShiftsInWeek={activeShiftsCount}
        totalActiveStaff={MOCK_RECEPTIONISTS.length}
        todayShiftsCount={todayShifts}
      />

      {/* 2. Main Weekly Calendar Grid */}
      <WeeklyCalendarGrid
        shifts={shifts}
        days={days}
        weekRangeLabel={weekRangeLabel}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onCurrentWeek={handleCurrentWeek}
        onCreateShift={(date, startTime, endTime) => {
          setPrefillDate(date);
          setPrefillStartTime(startTime);
          setPrefillEndTime(endTime);
          setIsCreateOpen(true);
        }}
        onEditShift={(shift) => setEditingShift(shift)}
        onDeleteShift={(shift) => setDeletingShift(shift)}
      />

      {/* Modal 1: Tạo ca trực mới (POST) */}
      <CreateShiftModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        staffList={MOCK_RECEPTIONISTS}
        shifts={shifts}
        prefillDate={prefillDate}
        prefillStartTime={prefillStartTime}
        prefillEndTime={prefillEndTime}
        onSubmit={handleCreateShift}
      />

      {/* Modal 2: Đổi ca / Chỉnh sửa (PUT) with GiST Exclude Check */}
      <EditShiftModal
        shift={editingShift}
        open={!!editingShift}
        onClose={() => setEditingShift(null)}
        staffList={MOCK_RECEPTIONISTS}
        shifts={shifts}
        onSubmit={handleUpdateShift}
      />

      {/* Modal 3: Hủy ca trực (DELETE) with reason */}
      <DeleteShiftDialog
        shift={deletingShift}
        open={!!deletingShift}
        onClose={() => setDeletingShift(null)}
        onConfirmDelete={handleDeleteShift}
      />
    </div>
  );
};
