import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  CalendarRange,
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
  const [createSlotDate, setCreateSlotDate] = useState<string | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

  // Attendance check-in modal
  const [selectedBookingData, setSelectedBookingData] = useState<{
    booking: StudentBookingItem;
    sessionStartTime: string;
    sessionEndTime: string;
  } | null>(null);

  // Selected booking for workout plan modal (M14.1)
  const [selectedWorkoutBookingData, setSelectedWorkoutBookingData] = useState<{
    booking: StudentBookingItem;
    sessionTitle: string;
  } | null>(null);

  // Emergency cancellation modal
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
    return apiSessions
      .filter((apiS) => {
        const isPt = apiS.type === 'PERSONAL_TRAINING';
        const isSlotEmpty = isPt && !apiS.isBooked;
        const isTimeArrived = new Date() >= new Date(apiS.startTime);
        // Khi slot trống không có học viên mà đã đến giờ diễn ra (hoặc quá giờ) thì ẩn đi
        if (isSlotEmpty && isTimeArrived) {
          return false;
        }
        return true;
      })
      .map((apiS) => {
        const isPt = apiS.type === 'PERSONAL_TRAINING';
        const firstStudent = apiS.bookings?.[0]?.member;
        const isEnded = new Date() > new Date(apiS.endTime);
        const isSlotEmpty = isPt && !apiS.isBooked;
        // Tuyệt đối không đánh dấu slot trống là LIVE ("Đang dạy")
        const isLive = !isSlotEmpty && new Date() >= new Date(apiS.startTime) && new Date() <= new Date(apiS.endTime);

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
          isSlotEmpty,
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

  const weekRangeLabel = useMemo(() => {
    return formatRangeLabel(currentWeek);
  }, [currentWeek]);

  // Filter sessions that belong to the selected week (Monday to Sunday)
  const currentWeekSessions = useMemo(() => {
    const startOfWeek = parseYMDToDate(currentWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return sessionList.filter((s) => {
      const sDate = new Date(s.startTime);
      return sDate >= startOfWeek && sDate < endOfWeek;
    });
  }, [sessionList, currentWeek]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalSessions = currentWeekSessions.length;
    const ptSessions = currentWeekSessions.filter((s) => s.type === 'PT');
    const groupSessions = currentWeekSessions.filter((s) => s.type === 'GROUP_CLASS');

    // Total actual teaching hours
    const totalMinutes = currentWeekSessions.reduce((acc, s) => {
      const start = new Date(s.startTime).getTime();
      const end = new Date(s.endTime).getTime();
      return acc + (end - start) / (1000 * 60);
    }, 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Count distinct PT students
    const ptStudentNames = new Set<string>();
    ptSessions.forEach((s) => {
      if (s.studentName) ptStudentNames.add(s.studentName);
    });

    // Next upcoming session
    const now = new Date();
    const upcomingSessions = currentWeekSessions
      .filter((s) => new Date(s.startTime) > now && s.status !== 'CANCELLED')
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

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. TOP BAR: Title, Coach Info, Week Nav, Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/90 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              Lịch Dạy Theo Tuần
            </h1>

          </div>

        </div>

        {/* Navigation & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Jump to This Week */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToCurrentWeek}
            className="text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs cursor-pointer"
          >
            Tuần này
          </Button>

          {/* Week Range Nav: ‹ 19/10 – 25/10/2026 › */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131b26] p-0.5 shadow-2xs">
            <button
              onClick={() => handleWeekChange('prev')}
              aria-label="Tuần trước"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {weekRangeLabel}
            </span>
            <button
              onClick={() => handleWeekChange('next')}
              aria-label="Tuần kế tiếp"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Open Date Picker Modal */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDatePickerOpen(true)}
            className="text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs gap-1.5 cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
            <span>Chọn ngày</span>
          </Button>

          {/* Mở slot nhận học viên PT */}
          <Button
            size="sm"
            onClick={() => setIsCreateSlotOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-1.5 shadow-xs shadow-teal-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Mở slot PT</span>
          </Button>
        </div>
      </div>




      {/* 3. FILTER CHIPS & VIEW MODE SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Tất cả */}
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterType === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                : 'bg-white dark:bg-[#131b26] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
          >
            Tất cả ({stats.totalSessions})
          </button>

          {/* PT 1:1 */}
          <button
            onClick={() => setFilterType('PT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${filterType === 'PT'
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${filterType === 'CLASS'
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
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${viewMode === 'WEEK_GRID'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Lưới tuần</span>
          </button>
          <button
            onClick={() => setViewMode('AGENDA')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${viewMode === 'AGENDA'
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
          onOpenCreateSlot={(dateStr) => {
            setCreateSlotDate(dateStr);
            setIsCreateSlotOpen(true);
          }}
        />
      ) : (
        <CoachAgendaView
          currentWeek={currentWeek}
          sessions={sessionList}
          filterType={filterType}
          onSelectSession={(session) => setSelectedSession(session)}
          onOpenCreateSlot={(dateStr) => {
            setCreateSlotDate(dateStr);
            setIsCreateSlotOpen(true);
          }}
        />
      )}

      {/* 5. SLIDE-OUT SESSION DETAIL DRAWER */}
      <CoachSessionDrawer
        session={selectedSession}
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        onCheckInStudent={(booking, sessionStartTime, sessionEndTime) => {
          setSelectedBookingData({
            booking,
            sessionStartTime,
            sessionEndTime: sessionEndTime || selectedSession?.endTime || '',
          });
        }}
        onOpenWorkoutPlan={(booking, sessionTitle) => {
          setSelectedWorkoutBookingData({
            booking,
            sessionTitle,
          });
        }}
        onEmergencyCancel={(data) => {
          setCancelModalData(data);
        }}
        onSaveNotes={handleSaveNotes}
      />

      {/* 6. CREATE AVAILABILITY SLOT MODAL */}
      <CreateSlotModal
        isOpen={isCreateSlotOpen}
        initialDate={createSlotDate}
        onClose={() => {
          setIsCreateSlotOpen(false);
          setCreateSlotDate(undefined);
        }}
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

      {/* 8. SESSION WORKOUT PLAN MODAL (M14.1) */}
      {selectedWorkoutBookingData && (
        <SessionWorkoutPlanModal
          booking={selectedWorkoutBookingData.booking}
          sessionTitle={selectedWorkoutBookingData.sessionTitle}
          isOpen={Boolean(selectedWorkoutBookingData)}
          onClose={() => setSelectedWorkoutBookingData(null)}
        />
      )}

      {/* 9. EMERGENCY CANCELLATION MODAL */}
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

      {/* 10. DATE PICKER MODAL */}
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
