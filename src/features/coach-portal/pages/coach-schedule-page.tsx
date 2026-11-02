import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  CalendarRange,
  Filter,
  Phone,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';
import { AttendanceModal } from '../components/attendance-modal';
import { SessionWorkoutPlanModal } from '../components/session-workout-plan-modal';
import { EmergencyCancelModal } from '../components/emergency-cancel-modal';
import { ScheduleDatePickerModal } from '../components/schedule-date-picker-modal';
import { CreateSlotModal } from '../components/create-slot-modal';
import { CoachCalendarGrid } from '../components/coach-calendar-grid';
import { CoachAgendaView } from '../components/coach-agenda-view';
import { CoachSessionDrawer } from '../components/coach-session-drawer';
import {
  getMondayOfWeek,
  shiftWeek,
  formatRangeLabel,
  parseYMDToDate,
} from '@/features/calendar/utils/calendar-date.utils';
import { useAuth } from '@/context/auth-context';
import type { StudentBookingItem } from '../types/coach-portal.types';
import type {
  CoachScheduleSession,
  ScheduleFilterType,
} from '../types/coach-schedule.types';
type ViewMode = 'WEEK_GRID' | 'AGENDA';

export const CoachSchedulePage: React.FC = () => {
  const { user } = useAuth();

  // Dynamic current week (Monday)
  const [currentWeek, setCurrentWeek] = useState<string>(() => getMondayOfWeek());
  const [viewMode, setViewMode] = useState<ViewMode>('WEEK_GRID');
  const [filterType, setFilterType] = useState<ScheduleFilterType>('ALL');

  // Selected session for slide-out drawer
  const [selectedSession, setSelectedSession] = useState<CoachScheduleSession | null>(null);

  // Modals state
  const [isCreateSlotOpen, setIsCreateSlotOpen] = useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

  // Selected booking and session start/end time for attendance modal
  const [selectedBookingData, setSelectedBookingData] = useState<{
    booking: StudentBookingItem;
    sessionStartTime: string;
    sessionEndTime: string;
  } | null>(null);

  // Selected booking for workout plan modal
  const [selectedWorkoutBookingData, setSelectedWorkoutBookingData] = useState<{
    booking: StudentBookingItem;
    sessionTitle: string;
  } | null>(null);

  // Time rule feedback alert for coach
  const [timeAlertMessage, setTimeAlertMessage] = useState<string | null>(null);

  // Selected session for emergency cancellation modal
  const [cancelModalData, setCancelModalData] = useState<{
    scheduleId?: string;
    bookingId?: string;
    sessionTitle: string;
    sessionTime: string;
  } | null>(null);

  // Real backend queries
  const { data: apiSessions = [] } = useQuery({
    queryKey: ['coach', 'multi-day-schedule', user?.id],
    queryFn: () => coachPortalApi.getMultiDaySchedule(user?.id),
    staleTime: 30000,
  });

  // Local notes map for user note additions
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  // Map real API sessions to CoachScheduleSession
  const sessionList: CoachScheduleSession[] = useMemo(() => {
    return apiSessions.map((apiS) => {
      const isPt = apiS.type === 'PERSONAL_TRAINING';
      const firstStudent = apiS.bookings?.[0]?.member;
      const isEnded = new Date() > new Date(apiS.endTime);
      const isLive = new Date() >= new Date(apiS.startTime) && new Date() <= new Date(apiS.endTime);

      return {
        id: apiS.id,
        type: isPt ? (apiS.isBooked === false ? 'EMPTY_SLOT' : 'PT') : 'GROUP_CLASS',
        status: apiS.isEmergencyCancelled
          ? 'CANCELLED'
          : isLive
          ? 'LIVE'
          : isEnded
          ? 'COMPLETED'
          : 'UPCOMING',
        title: apiS.title,
        studentName: firstStudent?.fullName || (isPt && apiS.isBooked ? 'Học viên PT' : undefined),
        studentPhone: firstStudent?.phone,
        studentAvatar: firstStudent?.avatarUrl,
        roomName: apiS.roomName || 'Khu vực tập luyện',
        startTime: apiS.startTime,
        endTime: apiS.endTime,
        capacity: apiS.capacity,
        enrolledCount: apiS.currentEnrolled,
        checkedInCount:
          apiS.bookings?.filter(
            (b) =>
              b.status === 'ATTENDED' ||
              b.attendance?.status === 'PRESENT' ||
              b.attendance?.status === 'ATTENDED' ||
              b.attendance?.status === 'LATE'
          ).length || 0,
        isSlotEmpty: isPt && !apiS.isBooked,
        bookings: apiS.bookings,
        scheduleId: apiS.scheduleId || undefined,
        coachAvailabilityId: apiS.coachAvailabilityId || undefined,
        isEmergencyCancelled: apiS.isEmergencyCancelled,
        notes: notesMap[apiS.id] || '',
      };
    });
  }, [apiSessions, notesMap]);

  // Handle saving notes on session
  const handleSaveNotes = (sessionId: string, newNotes: string) => {
    setNotesMap((prev) => ({ ...prev, [sessionId]: newNotes }));
    if (selectedSession && selectedSession.id === sessionId) {
      setSelectedSession((prev) => (prev ? { ...prev, notes: newNotes } : null));
    }
  };

  // Week navigation
  const handleWeekChange = (direction: 'prev' | 'next') => {
    const offset = direction === 'next' ? 1 : -1;
    setCurrentWeek((prev) => shiftWeek(prev, offset));
  };

  const handleGoToCurrentWeek = () => {
    setCurrentWeek(getMondayOfWeek());
  };

  // Compute 7 days for current week
  const weekRangeLabel = useMemo(() => {
    return formatRangeLabel(currentWeek);
  }, [currentWeek]);

  // Active sessions within the current week
  const currentWeekSessions = useMemo(() => {
    const monday = parseYMDToDate(currentWeek);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const monTime = monday.getTime();
    const sunTime = sunday.getTime();

    return sessionList.filter((s) => {
      const sTime = new Date(s.startTime).getTime();
      return sTime >= monTime && sTime <= sunTime;
    });
  }, [sessionList, currentWeek]);

  // Stats ribbon metrics (Strictly exclude empty slots and empty slot duration)
  const stats = useMemo(() => {
    const bookedSessions = currentWeekSessions.filter(
      (s) => s.type !== 'EMPTY_SLOT' && !s.isSlotEmpty
    );
    const totalSessions = bookedSessions.length;
    const ptSessions = bookedSessions.filter((s) => s.type === 'PT');
    const groupSessions = bookedSessions.filter((s) => s.type === 'GROUP_CLASS');

    // Total teaching hours (only booked sessions)
    let totalMinutes = 0;
    bookedSessions.forEach((s) => {
      const start = new Date(s.startTime).getTime();
      const end = new Date(s.endTime).getTime();
      totalMinutes += Math.max(0, (end - start) / 60000);
    });
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Unique PT students
    const ptStudentNames = new Set(
      ptSessions.map((s) => s.studentName).filter(Boolean)
    );

    // Next upcoming session (earliest upcoming or live session)
    const upcomingSessions = bookedSessions
      .filter((s) => s.status === 'UPCOMING' || s.status === 'LIVE')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const nextSession = upcomingSessions[0] || null;

    return {
      totalSessions,
      totalPt: ptSessions.length,
      totalGroup: groupSessions.length,
      totalHours,
      ptStudentsCount: ptStudentNames.size,
      nextSession,
    };
  }, [currentWeekSessions]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    sessionList.forEach((s) => {
      const dateKey = s.startTime.split('T')[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(s);
    });
    return map;
  }, [sessionList]);

  const coachDisplayName = user?.fullName || 'HLV Alex';

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. TOP BAR: Title, Coach Info, Week Nav, Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/90 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              Lịch Dạy Theo Tuần
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
              {coachDisplayName} · HLV Trưởng
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý ca dạy cá nhân PT 1:1, lớp nhóm và khung giờ nhận học viên trung tâm
          </p>
        </div>

        {/* Navigation & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Jump to This Week */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToCurrentWeek}
            className="text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs"
          >
            Tuần này
          </Button>

          {/* Week Range Nav: ‹ 19/10 – 25/10/2026 › */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131b26] p-0.5 shadow-2xs">
            <button
              onClick={() => handleWeekChange('prev')}
              aria-label="Tuần trước"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {weekRangeLabel}
            </span>
            <button
              onClick={() => handleWeekChange('next')}
              aria-label="Tuần kế tiếp"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsEquipmentDrawerOpen(true)}
            className="text-xs font-bold border-slate-200 bg-white shadow-xs hover:bg-slate-50 gap-1.5"
          >
            <Dumbbell className="h-3.5 w-3.5 text-slate-500" />
            <span>Thiết bị ({equipmentList.length})</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isLoading || isRefetching}
            className="gap-2 text-xs font-bold border-slate-200 bg-white shadow-xs hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Alert Banner for time rule feedback */}
      {timeAlertMessage && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 p-4 text-xs font-semibold text-amber-200 shadow-md backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="h-5 w-5 shrink-0 text-amber-400" />
            <span className="whitespace-pre-line text-white">{timeAlertMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setTimeAlertMessage(null)}
            className="rounded-lg p-1 text-amber-300 hover:bg-amber-400/20 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Week Selector Bar (Active for both views) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:bg-slate-100"
            title="Tuần trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent hover:border-emerald-300 hover:bg-emerald-50/80 text-xs font-black text-slate-900 hover:text-emerald-950 transition-all cursor-pointer min-w-[210px] justify-center shadow-2xs"
            title="Nhấp để mở lịch chọn ngày / tuần nhanh"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>
              {currentWeekDays[0].dayName} ({currentWeekDays[0].formatted}) — {currentWeekDays[6].dayName} ({currentWeekDays[6].formatted})
            </span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:bg-slate-100"
            title="Tuần kế tiếp"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDatePickerOpen(true)}
            className="text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <CalendarDays className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span className="hidden sm:inline">Chọn ngày</span>
          </Button>

          {/* Primary Action Button: Mở khung giờ */}
          <Button
            onClick={() => setIsCreateSlotOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm shadow-teal-600/30 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Mở khung giờ</span>
          </Button>
        </div>
      </div>

      {/* 2. STATS RIBBON (Dải thống kê theo chuẩn thiết kế) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Hero Card: Ca kế tiếp */}
        <div className="rounded-xl border border-teal-200/90 dark:border-teal-800/80 bg-gradient-to-br from-teal-50/80 via-white to-white dark:from-teal-950/30 dark:via-[#131b26] dark:to-[#131b26] p-4 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Ca kế tiếp
            </span>
            {stats.nextSession && (
              <button
                onClick={() => setSelectedSession(stats.nextSession)}
                className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-0.5"
              >
                Chi tiết
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {stats.nextSession ? (
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {stats.nextSession.type === 'PT'
                  ? `${stats.nextSession.studentName} (PT 1:1)`
                  : `${stats.nextSession.title} (Lớp nhóm)`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                {new Date(stats.nextSession.startTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                –{' '}
                {new Date(stats.nextSession.endTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · {new Date(stats.nextSession.startTime).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateSessions.map((session) => {
                const timeStatus = getSessionTimeStatus(session.startTime, session.endTime);
                const isPt = session.type === 'PERSONAL_TRAINING';
                const started = isSessionStarted(session.startTime);
                const isEditWindowClosed = Boolean(
                  session.endTime && Date.now() - new Date(session.endTime).getTime() > 24 * 60 * 60 * 1000
                );

                return (
                  <div
                    key={session.id}
                    className={`rounded-2xl border bg-white p-5 md:p-6 shadow-xs transition-all space-y-4 ${
                      timeStatus.status === 'LIVE'
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    {/* Session Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              isPt ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
                            }`}
                          >
                            {isPt ? 'Huấn Luyện 1-1 (PT)' : 'Lớp Tập Nhóm'}
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-black ${timeStatus.badgeClass}`}>
                            {timeStatus.label}
                          </span>
                          {session.isEmergencyCancelled && (
                            <span className="rounded-md bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-black">
                              ĐÃ HỦY KHẨN CẤP
                            </span>
                          )}
                        </div>

                        <h3 className="text-base md:text-lg font-black text-slate-900">
                          {session.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </span>
                          {session.roomName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {session.roomName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {isPt
                              ? session.bookings.length > 0
                                ? 'Đã có học viên đặt'
                                : 'Khung giờ mở chưa đặt'
                              : `${session.bookings.length} / ${session.capacity} học viên`}
                          </span>
                        </div>
                      </div>

                      {/* Action trigger: Workout Plan & Emergency cancellation */}
                      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        {isPt && session.bookings.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedWorkoutBookingData({
                                booking: session.bookings[0],
                                sessionTitle: session.title,
                              })
                            }
                            className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 shadow-2xs"
                          >
                            <Dumbbell className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                            Giáo án PT
                          </Button>
                        )}
                        {!session.isEmergencyCancelled &&
                          timeStatus.status === 'UPCOMING' &&
                          (!isPt || session.bookings.length > 0) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setCancelModalData({
                                scheduleId: session.scheduleId || undefined,
                                bookingId: isPt ? session.bookings[0]?.id : undefined,
                                sessionTitle: session.title,
                                sessionTime: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
                              })
                            }
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            Hủy khẩn cấp ca
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Temporal integrity hint if session not started */}
                    {!started && (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-50/70 border border-amber-200/80 p-2.5 text-xs text-amber-900">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Quy tắc điểm danh (Rule 6.3):</strong> Điểm danh sẽ tự động mở khi ca học bắt đầu ({formatTime(session.startTime)}).
                        </span>
                      </div>
                    )}

                    {/* Notice if session ended > 24 hours */}
                    {isEditWindowClosed && (
                      <div className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200/80 p-2.5 text-xs text-slate-700">
                        <Lock className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>
                          <strong>Đã hết hạn điểm danh:</strong> Ca dạy đã kết thúc quá 24 giờ. Hệ thống đã khóa điểm danh và chuyển sang chế độ chỉ xem.
                        </span>
                      </div>
                    )}

                    {/* Student Roster Section */}
                    {session.bookings.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">
                        {isPt ? 'Chưa có học viên nào đăng ký khung giờ này.' : 'Chưa có học viên nào đặt chỗ cho lớp này.'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Danh Sách Học Viên ({session.bookings.length}):
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {session.bookings.map((booking) => {
                            const memberName = getMemberName(booking);
                            const attStatus = booking.attendance?.status;
                            const isAttended = attStatus === 'ATTENDED';
                            const isAbsent = attStatus === 'ABSENT';
                            // Backend domain rule: referenceTime = existing?.checkInTime ?? session.endTime, window = 86400000 ms (24h)
                            const referenceTime = booking.attendance?.checkInTime ?? session.endTime;
                            const isBookingEditWindowClosed = Boolean(
                              referenceTime && Date.now() - new Date(referenceTime).getTime() > 86400000
                            );

                            return (
                              <div
                                key={booking.id}
                                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                  isAttended
                                    ? 'bg-emerald-50/60 border-emerald-200'
                                    : isAbsent
                                    ? 'bg-rose-50/60 border-rose-200'
                                    : 'bg-slate-50 border-slate-200/80 hover:bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 uppercase overflow-hidden shadow-xs">
                                    {booking.member?.avatarUrl ? (
                                      <img
                                        src={booking.member.avatarUrl}
                                        alt={memberName}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      memberName.charAt(0)
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-900 truncate">
                                      {memberName}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                      {booking.member?.phone && (
                                        <span className="flex items-center gap-0.5 font-mono">
                                          <Phone className="h-3 w-3 text-slate-400" />
                                          {booking.member.phone}
                                        </span>
                                      )}
                                      <span
                                        className={`font-bold px-1.5 py-0.2 rounded ${
                                          isAttended
                                            ? 'text-emerald-700 bg-emerald-100'
                                            : isAbsent
                                            ? 'text-rose-700 bg-rose-100'
                                            : 'text-amber-800 bg-amber-100'
                                        }`}
                                      >
                                        {isAttended
                                          ? 'Có mặt'
                                          : isAbsent
                                          ? 'Vắng mặt'
                                          : 'Chưa điểm danh'}
                                      </span>
                                    </div>
                                    {booking.attendance?.notes && (
                                      <p className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[200px]">
                                        Ghi chú: {booking.attendance.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Check-in & Workout Plan Actions */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isPt && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      type="button"
                                      onClick={() =>
                                        setSelectedWorkoutBookingData({
                                          booking,
                                          sessionTitle: session.title,
                                        })
                                      }
                                      className="text-xs font-bold gap-1 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                                      title="Xem giáo án 12 buổi, chỉnh sửa tạ/hiệp và ghi nhận xét buổi tập (M14.1)"
                                    >
                                      <Dumbbell className="h-3.5 w-3.5 text-emerald-600" />
                                      <span className="hidden sm:inline">Giáo án</span>
                                    </Button>
                                  )}

                                  {!started ? (
                                    <Button
                                      size="sm"
                                      type="button"
                                      onClick={() => {
                                        const msg = `Ca dạy chưa đến giờ bắt đầu!\n\nKhung giờ: ${formatTime(session.startTime)} - ${formatTime(session.endTime)}.\nHệ thống chỉ cho phép điểm danh khi ca học đã chính thức bắt đầu.`;
                                        setTimeAlertMessage(msg);
                                        if (typeof window !== 'undefined') {
                                          window.alert(msg);
                                        }
                                      }}
                                      className="text-xs font-bold gap-1 shadow-none bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border border-slate-200 transition-all cursor-pointer"
                                    >
                                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                                      <span>Điểm danh</span>
                                    </Button>
                                  ) : isBookingEditWindowClosed ? (
                                    <Button
                                      size="sm"
                                      type="button"
                                      onClick={() => {
                                        const msg = `Đã hết thời hạn chỉnh sửa điểm danh (quá 24 giờ kể từ ${
                                          booking.attendance?.checkInTime ? 'lúc điểm danh' : 'khi kết thúc ca'
                                        } theo quy định của hệ thống).`;
                                        setTimeAlertMessage(msg);
                                        if (typeof window !== 'undefined') {
                                          window.alert(msg);
                                        }
                                      }}
                                      className="text-xs font-bold gap-1 shadow-none bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border border-slate-200 transition-all cursor-pointer"
                                    >
                                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                                      <span>Đã khóa (&gt;24h)</span>
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      disabled={session.isEmergencyCancelled}
                                      onClick={() =>
                                        setSelectedBookingData({
                                          booking,
                                          sessionStartTime: session.startTime,
                                          sessionEndTime: session.endTime,
                                        })
                                      }
                                      className={`text-xs font-bold gap-1 shadow-xs transition-all ${
                                        isAttended
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                          : isAbsent
                                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                                      }`}
                                    >
                                      {isAttended ? (
                                        <>
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          <span>Sửa điểm danh</span>
                                        </>
                                      ) : isAbsent ? (
                                        <>
                                          <X className="h-3.5 w-3.5" />
                                          <span>Vắng mặt (Sửa)</span>
                                        </>
                                      ) : (
                                        <>
                                          <FileEdit className="h-3.5 w-3.5" />
                                          <span>Điểm danh</span>
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Metric 2: Tổng số ca tuần */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b26] p-4 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tổng số ca dạy
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.totalSessions} <span className="text-sm font-semibold text-slate-500">ca</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {stats.totalPt} ca PT 1:1 · {stats.totalGroup} lớp nhóm
          </div>
        </div>

        {/* Metric 3: Tổng giờ dạy */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b26] p-4 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tổng thời lượng dạy
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.totalHours} <span className="text-sm font-semibold text-slate-500">giờ</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Tính theo các buổi tập thực tế
          </div>
        </div>

        {/* Metric 4: Số học viên PT */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b26] p-4 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Học viên PT cá nhân
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-50 tabular-nums">
            {stats.ptStudentsCount} <span className="text-sm font-semibold text-slate-500">học viên</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Theo dõi giáo án và thể lực riêng
          </div>
        </div>
      </div>

      {/* 3. FILTER CHIPS & VIEW MODE SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Tất cả */}
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                : 'bg-white dark:bg-[#131b26] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Tất cả ({stats.totalSessions})
          </button>

          {/* PT 1:1 */}
          <button
            onClick={() => setFilterType('PT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              filterType === 'PT'
                ? 'bg-purple-600 text-white shadow-2xs shadow-purple-600/30'
                : 'bg-white dark:bg-[#131b26] text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-50/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            PT 1:1 ({stats.totalPt})
          </button>

          {/* Lớp nhóm */}
          <button
            onClick={() => setFilterType('CLASS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              filterType === 'CLASS'
                ? 'bg-emerald-600 text-white shadow-2xs shadow-emerald-600/30'
                : 'bg-white dark:bg-[#131b26] text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Lớp nhóm ({stats.totalGroup})
          </button>
        </div>

        {/* View Switcher: Lưới tuần / Lịch trình */}
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b26] p-0.5 shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode('WEEK_GRID')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              viewMode === 'WEEK_GRID'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Lưới tuần</span>
          </button>
          <button
            onClick={() => setViewMode('AGENDA')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              viewMode === 'AGENDA'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Lịch trình</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN SCHEDULE VIEW: Grid or Agenda */}
      {viewMode === 'WEEK_GRID' ? (
        <CoachCalendarGrid
          currentWeek={currentWeek}
          sessions={sessionList}
          filterType={filterType}
          onSelectSession={(session) => setSelectedSession(session)}
          onOpenCreateSlot={() => setIsCreateSlotOpen(true)}
        />
      ) : (
        <CoachAgendaView
          currentWeek={currentWeek}
          sessions={sessionList}
          filterType={filterType}
          onSelectSession={(session) => setSelectedSession(session)}
          onOpenCreateSlot={() => setIsCreateSlotOpen(true)}
        />
      )}

      {/* 5. SLIDE-OUT SESSION DETAIL DRAWER */}
      <CoachSessionDrawer
        session={selectedSession}
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        onCheckInStudent={(booking, sessionStartTime) => {
          setSelectedBookingData({ booking, sessionStartTime });
        }}
        onEmergencyCancel={(data) => {
          setCancelModalData(data);
        }}
        onSaveNotes={handleSaveNotes}
      />

      {/* 6. CREATE AVAILABILITY SLOT MODAL */}
      <CreateSlotModal
        isOpen={isCreateSlotOpen}
        onClose={() => setIsCreateSlotOpen(false)}
      />

      {/* 7. ATTENDANCE CHECK-IN MODAL */}
      {selectedBookingData && (
        <AttendanceModal
          booking={selectedBookingData.booking}
          sessionStartTime={selectedBookingData.sessionStartTime}
          sessionEndTime={selectedBookingData.sessionEndTime}
          isOpen={Boolean(selectedBookingData)}
          onClose={() => setSelectedBookingData(null)}
        />
      )}

      {/* Session Workout Plan Modal (M14.1) */}
      {selectedWorkoutBookingData && (
        <SessionWorkoutPlanModal
          booking={selectedWorkoutBookingData.booking}
          sessionTitle={selectedWorkoutBookingData.sessionTitle}
          isOpen={Boolean(selectedWorkoutBookingData)}
          onClose={() => setSelectedWorkoutBookingData(null)}
        />
      )}

      {/* Emergency Cancellation Modal */}
      {cancelModalData && (
        <EmergencyCancelModal
          scheduleId={cancelModalData.scheduleId}
          bookingId={cancelModalData.bookingId}
          sessionTitle={cancelModalData.sessionTitle}
          sessionTime={cancelModalData.sessionTime}
          isOpen={Boolean(cancelModalData)}
          onClose={() => setCancelModalData(null)}
        />
      )}

      {/* 9. DATE PICKER MODAL */}
      <ScheduleDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={currentWeek}
        weekOffset={0}
        onSelectDateAndWeek={(dateStr) => {
          setCurrentWeek(getMondayOfWeek(dateStr));
          setIsDatePickerOpen(false);
        }}
        sessionsByDate={sessionsByDate}
      />
    </div>
  );
};
