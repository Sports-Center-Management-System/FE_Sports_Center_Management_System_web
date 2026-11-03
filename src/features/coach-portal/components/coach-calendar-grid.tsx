import React, { useRef, useEffect } from 'react';
import type { CoachScheduleSession, ScheduleFilterType } from '../types/coach-schedule.types';
import {
  getWeekDays,
  formatDateToYMD,
} from '@/features/calendar/utils/calendar-date.utils';
import { Clock, CheckCircle2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachCalendarGridProps {
  currentWeek: string; // YYYY-MM-DD (Monday)
  sessions: CoachScheduleSession[];
  filterType: ScheduleFilterType;
  onSelectSession: (session: CoachScheduleSession) => void;
  onOpenCreateSlot?: (dateString?: string) => void;
}

// Design Constants (Synchronized with Member Calendar: starts from 05:00 to 23:00)
const GRID_START_HOUR = 5; // 05:00
const GRID_END_HOUR = 23; // 23:00
const HOUR_HEIGHT_PX = 68; // Height in px for 1 hour

export const CoachCalendarGrid: React.FC<CoachCalendarGridProps> = ({
  currentWeek,
  sessions,
  filterType,
  onSelectSession,
  onOpenCreateSlot,
}) => {
  const weekDays = getWeekDays(currentWeek);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Clean initial scroll to top (never stuck or jumping)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentWeek]);

  // Hours array from 06:00 to 22:00 (total 17 intervals to 23:00)
  const totalHours = GRID_END_HOUR - GRID_START_HOUR;
  const hours = Array.from({ length: totalHours }, (_, i) => GRID_START_HOUR + i);
  const totalGridHeight = totalHours * HOUR_HEIGHT_PX;

  // Calculate event positioning within 05:00 - 23:00
  const calculatePosition = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    let end = new Date(endIso);

    // Guard against invalid or non-positive duration; preserve multi-hour shifts (e.g. 06:00 - 10:00)
    const durationMs = end.getTime() - start.getTime();
    if (isNaN(durationMs) || durationMs <= 0) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const clampedStart = Math.max(startHour, GRID_START_HOUR);
    const clampedEnd = Math.min(Math.max(endHour, clampedStart + 0.5), GRID_END_HOUR);

    const top = (clampedStart - GRID_START_HOUR) * HOUR_HEIGHT_PX;
    const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT_PX, 34);

    return { top, height, durationMin: Math.round((end.getTime() - start.getTime()) / 60000) };
  };

  // Real-time indicator position (for today)
  const getCurrentTimeTop = (): number | null => {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    if (currentHour < GRID_START_HOUR || currentHour > GRID_END_HOUR) return null;
    return (currentHour - GRID_START_HOUR) * HOUR_HEIGHT_PX;
  };

  const currentTimeTop = getCurrentTimeTop();

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (filterType === 'PT') return s.type === 'PT' || s.type === 'EMPTY_SLOT';
    if (filterType === 'CLASS') return s.type === 'GROUP_CLASS';
    return true;
  });

  const formatTimeRangeLabel = (startIso: string, endIso: string) => {
    try {
      const s = new Date(startIso);
      const e = new Date(endIso);
      const sH = String(s.getHours()).padStart(2, '0');
      const sM = String(s.getMinutes()).padStart(2, '0');
      const eH = String(e.getHours()).padStart(2, '0');
      const eM = String(e.getMinutes()).padStart(2, '0');
      return `${sH}:${sM} – ${eH}:${eM}`;
    } catch {
      return '';
    }
  };

  // Render availability background blocks for a day
  // Render training session cards for a day
  const renderEventsForDay = (dateString: string) => {
    const daySessions = filteredSessions.filter((s) => {
      const sDate = formatDateToYMD(new Date(s.startTime));
      return sDate === dateString;
    });

    if (daySessions.length === 0) {
      // Subtle empty state
      return (
        <div className="absolute inset-x-2 top-24 bottom-12 flex flex-col items-center justify-center text-center p-3 pointer-events-none select-none opacity-40 hover:opacity-100 group transition-opacity">
          <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
            Trống lịch dạy
          </p>
          {onOpenCreateSlot && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCreateSlot(dateString);
              }}
              className="mt-2 pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 transition-colors shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              Mở khung giờ
            </button>
          )}
        </div>
      );
    }

    return daySessions.map((session) => {
      const { top, height, durationMin } = calculatePosition(session.startTime, session.endTime);
      const isShort = durationMin <= 45;
      const isPt = session.type === 'PT';
      const isGroup = session.type === 'GROUP_CLASS';
      const isEmpty = session.type === 'EMPTY_SLOT' || session.isSlotEmpty;
      const isCompleted = session.status === 'COMPLETED';
      const isLive = session.status === 'LIVE';

      // Primary Title: Student name for PT, Class name for Group, "Slot trống" for empty slot
      const primaryTitle = isEmpty
        ? 'Slot trống'
        : isPt
        ? session.studentName || 'Học viên PT'
        : session.title || 'Lớp tập nhóm';

      // Status Sub-label
      let statusSubLabel = '';
      if (isCompleted) {
        statusSubLabel = isPt ? 'Đã điểm danh 1/1 ✓' : 'Đã hoàn thành ✓';
      } else if (isEmpty) {
        statusSubLabel = '+ Nhận học viên';
      } else if (isPt) {
        if (session.checkedInCount && session.checkedInCount > 0) {
          statusSubLabel = 'Đã điểm danh 1/1';
        } else {
          statusSubLabel = 'Đã đặt 1/1';
        }
      } else if (isGroup) {
        statusSubLabel = `${session.enrolledCount || 0}/${session.capacity || 12} học viên`;
      }

      const timeRangeStr = formatTimeRangeLabel(session.startTime, session.endTime);

      // Split overlapping sessions (any sessions intersecting in time) into side-by-side lanes
      const curStart = new Date(session.startTime).getTime();
      const curEnd = new Date(session.endTime).getTime();
      const matchingSessions = daySessions.filter((s) => {
        const sStart = new Date(s.startTime).getTime();
        const sEnd = new Date(s.endTime).getTime();
        return sStart < curEnd && sEnd > curStart;
      });
      const laneIndex = matchingSessions.findIndex((s) => s.id === session.id);
      const totalLanes = Math.max(matchingSessions.length, 1);
      const laneWidthPercent = 100 / totalLanes;

      return (
        <div
          key={`session-${session.id}`}
          onClick={() => onSelectSession(session)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectSession(session);
            }
          }}
          style={{
            top: `${top}px`,
            height: `${height}px`,
            left: totalLanes > 1 ? `calc(${laneIndex * laneWidthPercent}% + 3px)` : '6px',
            width: totalLanes > 1 ? `calc(${laneWidthPercent}% - 6px)` : 'calc(100% - 12px)',
          }}
          className={cn(
            'absolute rounded-[10px] p-2 text-xs transition-all duration-150 cursor-pointer overflow-hidden shadow-2xs select-none group hover:shadow-md hover:scale-[1.01] hover:z-20 focus:outline-hidden focus:ring-2 z-10',
            // Completed Style (Màu xanh lá)
            isCompleted &&
              'bg-emerald-50/95 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border border-emerald-300/90 dark:border-emerald-800 hover:bg-emerald-100/95 dark:hover:bg-emerald-950/60 focus:ring-emerald-400',
            // Empty Slot Style
            isEmpty &&
              'bg-slate-50/80 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-100/90 dark:hover:bg-slate-900/70',
            // PT 1:1 Style
            !isCompleted &&
              !isEmpty &&
              isPt &&
              'bg-purple-50/95 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 border border-purple-200/90 dark:border-purple-800/60 hover:bg-purple-100/95 dark:hover:bg-purple-950/60 focus:ring-purple-400',
            // Group Class Style
            !isCompleted &&
              !isEmpty &&
              isGroup &&
              'bg-teal-50/95 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 border border-teal-200/90 dark:border-teal-800/60 hover:bg-teal-100/95 dark:hover:bg-teal-950/60 focus:ring-teal-400',
            // Live Session Ring
            isLive && 'ring-2 ring-emerald-500 shadow-md animate-pulse'
          )}
        >
          {/* Compact 1-line layout for short sessions (<= 45 mins) */}
          {isShort ? (
            <div className="flex items-center justify-between h-full gap-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold tabular-nums text-[11px] shrink-0">
                  {timeRangeStr}
                </span>
                <span className="font-semibold truncate text-[11.5px]">{primaryTitle}</span>
              </div>
              <span className="text-[10px] font-medium shrink-0 opacity-80">
                {statusSubLabel}
              </span>
            </div>
          ) : (
            /* Multi-line layout for standard sessions (60m+) */
            <div className="flex flex-col justify-between h-full space-y-1">
              <div>
                {/* 1. Time (Bold, Tabular Nums) */}
                <div className="flex items-center justify-between">
                  <span className="font-bold tabular-nums text-[11.5px] tracking-tight">
                    {timeRangeStr}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 text-emerald-600 dark:text-emerald-400" />
                      Xong
                    </span>
                  ) : isLive ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-emerald-600 text-white animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      Đang dạy
                    </span>
                  ) : null}
                </div>

                {/* 2. Primary Title: Student Name (PT) or Class Title (Group) */}
                <div className="font-semibold text-[13px] leading-snug tracking-tight truncate mt-0.5">
                  {primaryTitle}
                </div>
              </div>

              {/* 3. Sub-label: Type + Status */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/5 dark:border-white/5">
                <span className="truncate opacity-85 font-medium">{statusSubLabel}</span>

                {session.roomName && (
                  <span className="text-[10px] opacity-75 truncate max-w-[85px] ml-1">
                    {session.roomName.split('·')[0].trim()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-[580px] bg-white dark:bg-[#131b26] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Scrollable Container with Sticky Day Headers */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="min-w-[760px] relative">
          {/* Sticky Header: GMT+7 Corner & 7 Day Columns */}
          <div className="sticky top-0 z-30 flex border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#131b26]/95 backdrop-blur-md">
            {/* GMT+7 corner */}
            <div className="w-16 shrink-0 p-2.5 flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                GMT+7
              </span>
              <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
            </div>

            {/* 7 Days Columns Headers */}
            <div className="grid grid-cols-7 flex-1 divide-x divide-slate-200 dark:divide-slate-800">
              {weekDays.map((day) => {
                // Count booked sessions for this day (exclude empty slots)
                const daySessionsCount = sessions.filter((s) => {
                  if (s.type === 'EMPTY_SLOT' || s.isSlotEmpty) return false;
                  const sDate = formatDateToYMD(new Date(s.startTime));
                  return sDate === day.dateString;
                }).length;

                return (
                  <div
                    key={day.dateString}
                    className={cn(
                      'py-2.5 px-2 text-center transition-colors flex flex-col items-center justify-center',
                      day.isToday
                        ? 'bg-teal-500/[0.06] dark:bg-teal-400/[0.08]'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/30'
                    )}
                  >
                    {/* Day label: Thứ 2, Thứ 3, etc. */}
                    <span
                      className={cn(
                        'text-[11.5px] font-semibold tracking-tight',
                        day.isToday
                          ? 'text-teal-700 dark:text-teal-300 font-bold'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {day.dayLabel}
                    </span>

                    {/* Date Number Badge */}
                    <div
                      className={cn(
                        'mt-1 w-7 h-7 flex items-center justify-center rounded-full text-xs transition-all tabular-nums',
                        day.isToday
                          ? 'bg-teal-600 dark:bg-teal-500 text-white font-bold shadow-xs'
                          : 'text-slate-900 dark:text-slate-100 font-semibold'
                      )}
                    >
                      {day.dayNumber}
                    </div>

                    {/* Redesigned Session Count Text ("2 ca", "1 ca", "Nghỉ") */}
                    <span
                      className={cn(
                        'mt-1 text-[11px] font-medium tracking-tight',
                        daySessionsCount > 0
                          ? 'text-slate-600 dark:text-slate-300'
                          : 'text-slate-400/80 dark:text-slate-500 italic'
                      )}
                    >
                      {daySessionsCount > 0 ? `${daySessionsCount} ca` : 'Trống'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Body */}
          <div className="flex relative" style={{ height: `${totalGridHeight}px` }}>
            {/* Time labels column (06:00 -> 22:00) */}
            <div className="w-16 shrink-0 relative border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 select-none">
              {hours.map((hour, idx) => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                return (
                  <div
                    key={`time-${hour}`}
                    style={{
                      top: `${idx * HOUR_HEIGHT_PX}px`,
                    }}
                    className={cn(
                      'absolute w-full flex justify-center pr-1 pointer-events-none',
                      idx === 0 ? 'translate-y-1' : '-translate-y-1/2'
                    )}
                  >
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                      {hourFormatted}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 7 Columns for Days */}
            <div className="grid grid-cols-7 flex-1 divide-x divide-slate-200 dark:divide-slate-800 relative">
              {weekDays.map((day) => {
                return (
                  <div
                    key={`col-${day.dateString}`}
                    className={cn(
                      'relative h-full transition-colors',
                      day.isToday && 'bg-teal-500/[0.03] dark:bg-teal-400/[0.04]'
                    )}
                  >
                    {/* Hourly Horizontal Grid Lines & 30-min auxiliary lines */}
                    {hours.map((_, idx) => (
                      <React.Fragment key={`gridlines-${idx}`}>
                        {/* Main hourly line */}
                        <div
                          style={{ top: `${idx * HOUR_HEIGHT_PX}px` }}
                          className="absolute inset-x-0 border-t border-slate-200/70 dark:border-slate-800/80 pointer-events-none"
                        />
                        {/* 30-minute faint dashed line */}
                        <div
                          style={{ top: `${idx * HOUR_HEIGHT_PX + HOUR_HEIGHT_PX / 2}px` }}
                          className="absolute inset-x-0 border-t border-dashed border-slate-200/40 dark:border-slate-800/40 pointer-events-none"
                        />
                      </React.Fragment>
                    ))}

                    {/* Red line for current time (only on today's column) */}
                    {day.isToday && currentTimeTop !== null && (
                      <div
                        style={{ top: `${currentTimeTop}px` }}
                        className="absolute inset-x-0 border-t-2 border-rose-500 z-20 pointer-events-none flex items-center shadow-xs"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow-sm shadow-rose-500/50" />
                      </div>
                    )}

                    {/* Actual Training Sessions */}
                    {renderEventsForDay(day.dateString)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
