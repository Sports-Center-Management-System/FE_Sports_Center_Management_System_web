import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Dumbbell,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileEdit,
  X,
  ShieldCheck,
  Radio,
  ChevronLeft,
  ChevronRight,
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
import { useAuth } from '@/context/auth-context';
import type { StudentBookingItem, UnifiedCoachSession } from '../types/coach-portal.types';

type ViewMode = 'WEEK_CALENDAR' | 'DAY_AGENDA';

export const CoachSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('DAY_AGENDA');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [filterType, setFilterType] = useState<'ALL' | 'CLASS' | 'PT' | 'UNCHECKED'>('ALL');
  const [isEquipmentDrawerOpen, setIsEquipmentDrawerOpen] = useState<boolean>(false);
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

  // Load comprehensive multi-day schedule
  const {
    data: allSessions = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['coach', 'multi-day-schedule', user?.id],
    queryFn: () => coachPortalApi.getMultiDaySchedule(user?.id),
    staleTime: 30000,
  });

  const { data: equipmentList = [] } = useQuery({
    queryKey: ['coach', 'equipment'],
    queryFn: () => coachPortalApi.getEquipment(),
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute 7-day range for current week view based on weekOffset
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    // Monday as start of week
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      days.push({
        date: d,
        isoDate,
        dayName: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][d.getDay()],
        shortDay: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
        formatted: `${d.getDate()}/${d.getMonth() + 1}`,
        isToday: isoDate === todayStr,
        isSelected: isoDate === selectedDate,
      });
    }
    return days;
  }, [weekOffset, todayStr, selectedDate]);

  // Group all sessions by date string (YYYY-MM-DD)
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, UnifiedCoachSession[]>();
    allSessions.forEach((s) => {
      const dateKey = s.startTime.split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(s);
    });
    return map;
  }, [allSessions]);

  // Sessions for currently selected date
  const selectedDateSessions = useMemo(() => {
    const list = sessionsByDate.get(selectedDate) || [];
    return list.filter((s) => {
      if (filterType === 'CLASS') return s.type === 'GROUP_CLASS';
      if (filterType === 'PT') return s.type === 'PERSONAL_TRAINING';
      if (filterType === 'UNCHECKED') {
        const hasUnchecked = s.bookings.some((b) => !b.attendance || b.attendance.status === 'ABSENT');
        return hasUnchecked;
      }
      return true;
    });
  }, [sessionsByDate, selectedDate, filterType]);

  // Metrics for the currently selected date
  const dayStats = useMemo(() => {
    const list = sessionsByDate.get(selectedDate) || [];
    const totalClasses = list.filter((s) => s.type === 'GROUP_CLASS').length;
    const totalPt = list.filter((s) => s.type === 'PERSONAL_TRAINING').length;
    let totalStudents = 0;
    let checkedInStudents = 0;
    list.forEach((s) => {
      totalStudents += s.bookings.length;
      checkedInStudents += s.bookings.filter((b) => b.attendance?.status === 'ATTENDED').length;
    });
    return { totalClasses, totalPt, totalStudents, checkedInStudents, totalSessions: list.length };
  }, [sessionsByDate, selectedDate]);

  // Metrics for all sessions in the currently active 7-day week window
  const weekStats = useMemo(() => {
    const weekIsoDates = new Set(currentWeekDays.map((d) => d.isoDate));
    const weekSessions = allSessions.filter((s) => {
      const dateKey = s.startTime.split('T')[0];
      return weekIsoDates.has(dateKey);
    });

    const totalClasses = weekSessions.filter((s) => s.type === 'GROUP_CLASS').length;
    const totalPt = weekSessions.filter((s) => s.type === 'PERSONAL_TRAINING').length;
    let totalStudents = 0;
    let checkedInStudents = 0;
    weekSessions.forEach((s) => {
      totalStudents += s.bookings.length;
      checkedInStudents += s.bookings.filter((b) => b.attendance?.status === 'ATTENDED').length;
    });

    return {
      totalClasses,
      totalPt,
      totalStudents,
      checkedInStudents,
      totalSessions: weekSessions.length,
    };
  }, [currentWeekDays, allSessions]);

  const activeStats = viewMode === 'WEEK_CALENDAR' ? weekStats : dayStats;

  // Live session check
  const liveSession = useMemo(() => {
    const now = new Date().getTime();
    return allSessions.find((s) => {
      const st = new Date(s.startTime).getTime();
      const et = new Date(s.endTime).getTime();
      return now >= st && now <= et;
    });
  }, [allSessions]);

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const getMemberName = (booking?: StudentBookingItem | null) => {
    if (booking?.member?.fullName) return booking.member.fullName;
    if (booking?.memberId) return `Học viên (#${booking.memberId.slice(0, 8)})`;
    return 'Học viên';
  };

  const getSessionTimeStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (now >= start && now <= end) {
      return {
        status: 'LIVE',
        label: 'Đang diễn ra',
        badgeClass: 'bg-emerald-500 text-white font-extrabold animate-pulse shadow-sm shadow-emerald-500/30',
      };
    }
    if (now < start) {
      return {
        status: 'UPCOMING',
        label: 'Sắp diễn ra',
        badgeClass: 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80',
      };
    }
    return {
      status: 'ENDED',
      label: 'Đã hoàn thành',
      badgeClass: 'bg-slate-100 text-slate-600 font-semibold border border-slate-200/60',
    };
  };

  const isSessionStarted = (startTime: string) => {
    return new Date() >= new Date(startTime);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Lịch Giảng Dạy & Huấn Luyện
            </h1>
            {liveSession ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-black px-2.5 py-0.5 shadow-sm shadow-emerald-500/20 animate-pulse">
                <Radio className="h-3 w-3" />
                LIVE CA DẠY
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-2.5 py-0.5">
                Thời gian thực
              </span>
            )}
          </div>
          <p className="text-xs text-white mt-1">
            Quản lý lịch dạy theo tuần/ngày, điểm danh học viên và kiểm soát thiết bị phòng tập
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented View Mode Toggle */}
          <div className="inline-flex rounded-xl bg-slate-200/70 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('DAY_AGENDA')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'DAY_AGENDA'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Chi Tiết Ngày</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('WEEK_CALENDAR')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'WEEK_CALENDAR'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              <span>Lịch Tuần (7 Ngày)</span>
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
            className="h-8 px-2.5 border-slate-200 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 gap-1.5"
            title="Mở lịch toàn diện theo tháng"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Chọn lịch</span>
          </Button>

          {weekOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setWeekOffset(0);
                setSelectedDate(todayStr);
              }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 h-8"
            >
              Về Tuần Hiện Tại
            </Button>
          )}
        </div>

        {/* 7-Day Quick Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {currentWeekDays.map((d) => {
            const count = sessionsByDate.get(d.isoDate)?.length || 0;
            const isSelected = d.isoDate === selectedDate;
            return (
              <button
                key={d.isoDate}
                type="button"
                onClick={() => setSelectedDate(d.isoDate)}
                className={`flex flex-col items-center justify-center min-w-[52px] px-2 py-1 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm scale-105'
                    : d.isToday
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-80">
                  {d.shortDay}
                </span>
                <span className="font-mono text-xs">{d.formatted}</span>
                {count > 0 && (
                  <span
                    className={`mt-0.5 inline-block h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-emerald-400' : 'bg-emerald-600'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Strip for Selected Range / Date */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            {viewMode === 'WEEK_CALENDAR' ? 'Tổng Ca Cả Tuần' : `Ca Dạy (${selectedDate === todayStr ? 'Hôm nay' : selectedDate})`}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-2xl font-black text-slate-900">
              {activeStats.totalSessions}
            </span>
            <span className="text-xs text-slate-600 font-semibold">
              {activeStats.totalClasses} Lớp · {activeStats.totalPt} PT
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Học Viên Đăng Ký
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-2xl font-black text-blue-700">
              {activeStats.totalStudents}
            </span>
            <span className="text-xs text-slate-600 font-semibold">
              {viewMode === 'WEEK_CALENDAR' ? 'Cả tuần' : 'Theo ngày'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Điểm Danh Hoàn Thành
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-2xl font-black text-emerald-700">
              {activeStats.checkedInStudents} / {activeStats.totalStudents}
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              {activeStats.totalStudents > 0
                ? `${Math.round((activeStats.checkedInStudents / activeStats.totalStudents) * 100)}%`
                : '100%'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Trạng Thái Ca Dạy
          </p>
          <div className="flex items-center gap-2 mt-1">
            {liveSession ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Đang có ca LIVE
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-600">
                Sẵn sàng ca tiếp theo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: WEEK CALENDAR MATRIX */}
      {viewMode === 'WEEK_CALENDAR' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-emerald-600" />
              Lịch Biểu 7 Ngày Trong Tuần
            </h2>
            <span className="text-xs text-slate-600">
              Bấm vào ca dạy hoặc ngày bất kỳ để mở danh sách học viên và điểm danh
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {currentWeekDays.map((d) => {
              const daySessions = sessionsByDate.get(d.isoDate) || [];
              const isSelected = d.isoDate === selectedDate;

              return (
                <div
                  key={d.isoDate}
                  onClick={() => {
                    setSelectedDate(d.isoDate);
                  }}
                  className={`flex flex-col rounded-2xl border transition-all cursor-pointer min-h-[380px] p-2.5 ${
                    isSelected
                      ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-md'
                      : d.isToday
                      ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Day Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div>
                      <p className={`text-xs font-black ${d.isToday ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {d.dayName}
                      </p>
                      <p className="font-mono text-[11px] text-slate-600">{d.formatted}</p>
                    </div>
                    {daySessions.length > 0 && (
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {daySessions.length} ca
                      </span>
                    )}
                  </div>

                  {/* Sessions List */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {daySessions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400">
                        <p className="text-[11px] italic">Không có ca</p>
                      </div>
                    ) : (
                      daySessions.map((session) => {
                        const timeStatus = getSessionTimeStatus(session.startTime, session.endTime);
                        const isPt = session.type === 'PERSONAL_TRAINING';
                        const firstStudent = session.bookings[0]?.member;

                        return (
                          <div
                            key={session.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(d.isoDate);
                              setViewMode('DAY_AGENDA');
                            }}
                            className={`group rounded-xl p-2.5 text-xs transition-all border ${
                              timeStatus.status === 'LIVE'
                                ? 'bg-emerald-50 border-emerald-400 shadow-xs ring-1 ring-emerald-400'
                                : isPt
                                ? 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50'
                                : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono font-bold text-[11px] text-slate-900">
                                {formatTime(session.startTime)} - {formatTime(session.endTime)}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                  isPt ? 'bg-amber-200 text-amber-900' : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {isPt ? 'PT 1-1' : 'LỚP'}
                              </span>
                            </div>

                            <p className="font-bold text-slate-900 truncate" title={session.title}>
                              {session.title}
                            </p>

                            {isPt ? (
                              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                                {firstStudent ? `HV: ${firstStudent.fullName}` : session.isBooked ? 'HV đã đặt' : 'Khung giờ mở'}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                                {session.roomName || 'Phòng tập'} · {session.currentEnrolled}/{session.capacity} HV
                              </p>
                            )}

                            <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-200/50">
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${timeStatus.badgeClass}`}>
                                {timeStatus.label}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                Xem &rarr;
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DAY AGENDA VIEW */}
      {viewMode === 'DAY_AGENDA' && (
        <div className="space-y-4">
          {/* Day View Subheader & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-transparent hover:border-emerald-200 hover:bg-emerald-50 text-left transition-colors cursor-pointer group"
                title="Bấm để chọn ngày khác"
              >
                <CalendarIcon className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="font-black text-sm text-slate-900 group-hover:text-emerald-950">
                  Chi tiết ngày:{' '}
                  <span className="text-emerald-700">
                    {selectedDate === todayStr ? `Hôm Nay (${selectedDate})` : selectedDate}
                  </span>
                </span>
              </button>
              <span className="font-mono text-xs font-bold text-slate-600">
                ({selectedDateSessions.length} ca dạy)
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Lọc:
              </span>
              {(
                [
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'CLASS', label: 'Lớp Nhóm' },
                  { key: 'PT', label: 'PT 1-1' },
                  { key: 'UNCHECKED', label: 'Chưa điểm danh' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterType(tab.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    filterType === tab.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse space-y-4">
                  <div className="h-5 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-20 bg-slate-50 rounded" />
                </div>
              ))}
            </div>
          ) : selectedDateSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-black text-slate-800">
                Không có ca dạy nào vào ngày {selectedDate}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Bạn không có lịch phụ trách lớp nhóm hoặc ca PT nào được đặt trong ngày này. Bạn có thể mở thêm khung giờ rảnh tại tab Khung Giờ Rảnh PT.
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-xs font-bold border-slate-300"
                >
                  Xem Lịch Hôm Nay
                </Button>
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
      )}

      {/* Equipment Drawer Modal */}
      {isEquipmentDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Trang Thiết Bị Trung Tâm
                  </h3>
                  <p className="text-xs text-slate-500">
                    Danh mục máy móc và trang thiết bị hỗ trợ ca dạy (Mục 3.4 & 5)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEquipmentDrawerOpen(false)}
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-950">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Quy chế sử dụng & Giữ chỗ thiết bị (Mục 3.4 & 6.2):</p>
                  <p className="text-[11px] leading-relaxed text-blue-900">
                    Thiết bị được hệ thống tự động khóa giữ trước cho các buổi tập/lớp học tương ứng và lập tức giải phóng khi buổi tập kết thúc hoặc khi đơn hủy được phê duyệt.
                  </p>
                </div>
              </div>

              {equipmentList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  Chưa có dữ liệu thiết bị nào trong hệ thống.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {equipmentList.map((eq) => (
                    <div
                      key={eq.id}
                      className="rounded-xl border border-slate-200 p-3 bg-white space-y-1 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{eq.name}</span>
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                            eq.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {eq.isActive ? 'Sẵn sàng' : 'Bảo trì'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Phân loại: {eq.equipmentType}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEquipmentDrawerOpen(false)}
                className="text-xs font-semibold"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
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

      {/* Date & Week Picker Modal */}
      <ScheduleDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={selectedDate}
        weekOffset={weekOffset}
        onSelectDateAndWeek={(dateStr, newWeekOffset) => {
          setSelectedDate(dateStr);
          setWeekOffset(newWeekOffset);
        }}
        sessionsByDate={sessionsByDate}
      />
    </div>
  );
};
