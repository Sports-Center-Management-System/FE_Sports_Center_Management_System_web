import React, { useState, useMemo } from "react";
import { Plus, Search, Calendar as CalendarIcon, Filter, CheckCircle2 } from "lucide-react";
import { BookingSession, ScheduleFilterTab } from "../types";
import { ScheduleStats } from "../components/schedule-stats";
import { SessionCard } from "../components/session-card";
import { SessionDetailModal } from "../components/session-detail-modal";
import { RescheduleModal } from "../components/reschedule-modal";
import { CancelBookingModal } from "../components/cancel-booking-modal";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const MOCK_SESSIONS: BookingSession[] = [
  {
    id: "sess-1",
    bookingCode: "#BK-8849-01",
    sessionTitle: "PT 1-kèm-1: Phát triển cơ lưng xô & Ngực",
    category: "PT_1ON1",
    coach: {
      id: "coach-1",
      name: "Trần Văn Hoàng",
      specialty: "PT Chuyên sâu Hypertrophy",
      avatarUrl:
        "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80",
      rating: 5.0,
      phone: "0901 234 567",
    },
    date: "2026-09-24",
    dateLabel: "Thứ 5, 24/09/2026",
    timeSlot: "18:00 - 19:30",
    location: "Phòng PT VIP 02 - Tầng 3",
    status: "UPCOMING",
    statusLabel: "Sắp diễn ra",
    workoutGoal: "Tăng thể tích nhóm cơ Upper Body, sửa form bài Barbell Row",
    packageName: "Elite Wellness PT",
    remainingHoursBeforeSession: 28, // > 2 hours
    notes: "Học viên mang giày đế phẳng và khởi động khớp vai trước 10 phút.",
  },
  {
    id: "sess-2",
    bookingCode: "#BK-8849-02",
    sessionTitle: "Pilates Reformer: Cân chỉnh vóc dáng & Cột sống",
    category: "PILATES",
    coach: {
      id: "coach-2",
      name: "Nguyễn Quỳnh Anh",
      specialty: "Chuyên gia Pilates Quốc tế",
      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      rating: 4.9,
      phone: "0908 765 432",
    },
    date: "2026-09-26",
    dateLabel: "Thứ 7, 26/09/2026",
    timeSlot: "08:30 - 10:00",
    location: "Studio Pilates Reformer 01 - Tầng 2",
    status: "UPCOMING",
    statusLabel: "Sắp diễn ra",
    workoutGoal: "Kích hoạt nhóm cơ Core và giãn cơ hông",
    packageName: "Elite Wellness PT",
    remainingHoursBeforeSession: 72,
    notes: "Chuẩn bị tất chống trượt chuyên dụng cho máy Reformer.",
  },
  {
    id: "sess-3",
    bookingCode: "#BK-8849-03",
    sessionTitle: "Kickboxing Cardio & Xả Stress cường độ cao",
    category: "BOXING",
    coach: {
      id: "coach-3",
      name: "Lê Hoàng Nam",
      specialty: "HLV Kickboxing & Thể lực",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      rating: 4.8,
      phone: "0912 345 678",
    },
    date: "2026-09-18",
    dateLabel: "Thứ 6, 18/09/2026",
    timeSlot: "16:00 - 17:30",
    location: "Zone Boxing & Combat - Tầng 1",
    status: "COMPLETED",
    statusLabel: "Đã hoàn thành",
    workoutGoal: "Đốt cháy 650 kcal, rèn luyện phản xạ combo đấm đá",
    packageName: "Elite Wellness PT",
    remainingHoursBeforeSession: 0,
    notes: "Đã hoàn thành tốt bài tập thể lực và đối kháng.",
  },
  {
    id: "sess-4",
    bookingCode: "#BK-8849-04",
    sessionTitle: "PT 1-kèm-1: Chân đùi & Mông (Leg Day)",
    category: "PT_1ON1",
    coach: {
      id: "coach-1",
      name: "Trần Văn Hoàng",
      specialty: "PT Chuyên sâu Hypertrophy",
      avatarUrl:
        "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80",
      rating: 5.0,
      phone: "0901 234 567",
    },
    date: "2026-09-15",
    dateLabel: "Thứ 3, 15/09/2026",
    timeSlot: "18:00 - 19:30",
    location: "Phòng PT VIP 01 - Tầng 3",
    status: "COMPLETED",
    statusLabel: "Đã hoàn thành",
    workoutGoal: "Squat 80kg x 8 reps, Bulgarian Split Squat",
    packageName: "Elite Wellness PT",
    remainingHoursBeforeSession: 0,
    notes: "Form chuẩn, cần bổ sung protein sau buổi tập.",
  },
  {
    id: "sess-5",
    bookingCode: "#BK-8849-05",
    sessionTitle: "Stretching & Phục hồi chức năng cơ xương khớp",
    category: "YOGA",
    coach: {
      id: "coach-4",
      name: "Đặng Bảo Ngọc",
      specialty: "Chuyên gia Phục hồi chức năng",
      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
      rating: 4.9,
      phone: "0934 567 890",
    },
    date: "2026-09-10",
    dateLabel: "Thứ 5, 10/09/2026",
    timeSlot: "14:00 - 15:30",
    location: "Phòng Trị liệu & Giãn cơ - Tầng 2",
    status: "CANCELLED",
    statusLabel: "Đã hủy buổi",
    workoutGoal: "Giải tỏa căng cứng cơ cổ vai gáy",
    packageName: "Elite Wellness PT",
    remainingHoursBeforeSession: 5,
    notes: "Học viên hủy trước 5 tiếng - Đã hoàn 1 buổi tập vào tài khoản.",
  },
];

export const SchedulePage: React.FC = () => {
  const [sessions, setSessions] = useState<BookingSession[]>(MOCK_SESSIONS);
  const [activeTab, setActiveTab] = useState<"ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [detailModalSession, setDetailModalSession] = useState<BookingSession | null>(null);
  const [rescheduleSession, setRescheduleSession] = useState<BookingSession | null>(null);
  const [cancelSession, setCancelSession] = useState<BookingSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  // Counts for tabs
  const upcomingCount = sessions.filter((s) => s.status === "UPCOMING").length;
  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;
  const cancelledCount = sessions.filter((s) => s.status === "CANCELLED").length;

  const filterTabs: ScheduleFilterTab[] = [
    { id: "ALL", label: "Tất cả buổi tập", count: sessions.length },
    { id: "UPCOMING", label: "Sắp diễn ra", count: upcomingCount },
    { id: "COMPLETED", label: "Đã hoàn thành", count: completedCount },
    { id: "CANCELLED", label: "Đã hủy", count: cancelledCount },
  ];

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Tab filter
      if (activeTab !== "ALL" && s.status !== activeTab) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = s.sessionTitle.toLowerCase().includes(query);
        const matchesCoach = s.coach.name.toLowerCase().includes(query);
        const matchesCode = s.bookingCode.toLowerCase().includes(query);
        const matchesGoal = s.workoutGoal?.toLowerCase().includes(query);
        return matchesName || matchesCoach || matchesCode || matchesGoal;
      }
      return true;
    });
  }, [sessions, activeTab, searchQuery]);

  // Handle Reschedule
  const handleConfirmReschedule = (sessionId: string, newDate: string, newTime: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              dateLabel: newDate,
              timeSlot: newTime,
              notes: `Đã đổi lịch sang ${newTime} (${newDate})`,
            }
          : s
      )
    );
    showToast(`Đã đổi lịch tập thành công sang ${newTime} (${newDate})!`);
  };

  // Handle Cancel
  const handleConfirmCancel = (sessionId: string, reason: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: "CANCELLED",
              statusLabel: "Đã hủy buổi",
              notes: `Lý do hủy: ${reason}`,
            }
          : s
      )
    );
    showToast("Đã hủy buổi tập thành công theo quy định chính sách!");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null), 3500;
    }, 3500);
  };

  return (
    <div className="space-y-7 pb-10">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-8 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Quản lý lịch tập & Buổi hẹn
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi, cập nhật và quản lý tất cả các buổi tập cá nhân và lớp học của bạn
          </p>
        </div>

        {/* Quick button to Book new session */}
        <Button
          onClick={() => navigate("/booking")}
          className="rounded-xl bg-[#008b74] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#007461] transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Đặt buổi tập mới
        </Button>
      </div>

      {/* Overview Stats */}
      <ScheduleStats
        upcomingCount={upcomingCount}
        completedCount={completedCount}
        totalPackageSessions={24}
        remainingSessions={12}
        nextSessionText="18:00 - Thứ 5 (24/09)"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-4">
        {/* Tab Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all select-none",
                  isActive
                    ? "bg-[#008b74] text-white shadow-sm shadow-[#008b74]/20"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm buổi tập, HLV, mã đặt chỗ..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:outline-none focus:ring-2 focus:ring-[#008b74]/15 transition-all"
          />
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onViewDetail={(s) => setDetailModalSession(s)}
              onReschedule={(s) => setRescheduleSession(s)}
              onCancel={(s) => setCancelSession(s)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Không tìm thấy buổi tập nào"
          description={
            searchQuery
              ? `Không có kết quả nào khớp với "${searchQuery}". Vui lòng thử tìm từ khóa khác.`
              : "Hiện tại chưa có buổi tập nào trong danh mục này."
          }
          actionText="Đặt lịch tập ngay"
          onAction={() => navigate("/booking")}
          className="bg-white"
        />
      )}

      {/* 1. Modal Chi tiết Session */}
      <SessionDetailModal
        session={detailModalSession}
        open={!!detailModalSession}
        onClose={() => setDetailModalSession(null)}
        onReschedule={(s) => setRescheduleSession(s)}
        onCancel={(s) => setCancelSession(s)}
      />

      {/* 2. Modal Đổi lịch */}
      <RescheduleModal
        session={rescheduleSession}
        open={!!rescheduleSession}
        onClose={() => setRescheduleSession(null)}
        onConfirmReschedule={handleConfirmReschedule}
      />

      {/* 3. Modal Hủy lịch */}
      <CancelBookingModal
        session={cancelSession}
        open={!!cancelSession}
        onClose={() => setCancelSession(null)}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
};
