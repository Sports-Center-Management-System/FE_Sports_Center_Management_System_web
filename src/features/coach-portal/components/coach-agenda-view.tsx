import React from 'react';
import type { CoachScheduleSession, ScheduleFilterType } from '../types/coach-schedule.types';
import {
  getWeekDays,
  formatDateToYMD,
} from '@/features/calendar/utils/calendar-date.utils';
import { MapPin, CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachAgendaViewProps {
  currentWeek: string;
  sessions: CoachScheduleSession[];
  filterType: ScheduleFilterType;
  onSelectSession: (session: CoachScheduleSession) => void;
  onOpenCreateSlot?: (dateString?: string) => void;
}

export const CoachAgendaView: React.FC<CoachAgendaViewProps> = ({
  currentWeek,
  sessions,
  filterType,
  onSelectSession,
  onOpenCreateSlot,
}) => {
  const weekDays = getWeekDays(currentWeek);

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (filterType === 'PT') return s.type === 'PT' || s.type === 'EMPTY_SLOT';
    if (filterType === 'CLASS') return s.type === 'GROUP_CLASS';
    return true;
  });

  const formatTimeRange = (startIso: string, endIso: string) => {
    try {
      const s = new Date(startIso);
      const e = new Date(endIso);
      const sStr = s.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const eStr = e.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${sStr} – ${eStr}`;
    } catch {
      return '';
    }
  };

  // Sort days with Today first if today is in this week, or chronological
  const todayYMD = formatDateToYMD(new Date());

  return (
    <div className="space-y-4">
      {weekDays.map((day) => {
        const daySessions = filteredSessions.filter((s) => {
          const sDate = formatDateToYMD(new Date(s.startTime));
          if (sDate !== day.dateString) return false;
          const isEmpty = s.type === 'EMPTY_SLOT' || s.isSlotEmpty;
          const isTimeArrived = new Date() >= new Date(s.startTime);
          if (isEmpty && isTimeArrived) return false;
          return true;
        });

        const isToday = day.dateString === todayYMD;

        return (
          <div
            key={day.dateString}
            className={cn(
              'rounded-xl border transition-all p-4',
              isToday
                ? 'border-teal-500/60 bg-teal-50/20 dark:bg-teal-950/20 shadow-xs'
                : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b26]'
            )}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums',
                    isToday
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                  )}
                >
                  {day.dayNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {day.dayLabel}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                        Hôm nay
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {day.dayNumber}/{day.monthNumber}/{day.date.getFullYear()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const bookedCount = daySessions.filter((s) => s.type !== 'EMPTY_SLOT' && !s.isSlotEmpty).length;
                  return (
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {bookedCount > 0 ? `${bookedCount} ca dạy` : 'Trống lịch'}
                    </span>
                  );
                })()}
                {onOpenCreateSlot && (
                  <button
                    type="button"
                    onClick={() => onOpenCreateSlot(day.dateString)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm slot</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sessions list */}
            {daySessions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <span>Không có ca dạy nào trong ngày này.</span>
                {onOpenCreateSlot && (
                  <button
                    type="button"
                    onClick={() => onOpenCreateSlot(day.dateString)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mở khung giờ rảnh</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {daySessions.map((session) => {
                  const isPt = session.type === 'PT';
                  const isEmpty = session.type === 'EMPTY_SLOT' || session.isSlotEmpty;
                  const isCompleted = session.status === 'COMPLETED';

                  const primaryTitle = isEmpty
                    ? 'Slot trống'
                    : isPt
                    ? session.studentName || 'Học viên PT'
                    : session.title || 'Lớp tập nhóm';

                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session)}
                      className={cn(
                        'flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all hover:shadow-xs select-none',
                        isCompleted
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                          : isEmpty
                          ? 'bg-slate-50/60 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-700'
                          : isPt
                          ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-800/60'
                          : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60'
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold tabular-nums text-xs text-slate-900 dark:text-slate-100">
                            {formatTimeRange(session.startTime, session.endTime)}
                          </span>

                          {isCompleted ? (
                            <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 text-emerald-600" />
                              Đã hoàn thành
                            </span>
                          ) : isEmpty ? (
                            <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                              Chưa có người đặt
                            </span>
                          ) : isPt ? (
                            <span className="text-[10.5px] font-semibold text-purple-700 dark:text-purple-300">
                              PT 1:1
                            </span>
                          ) : (
                            <span className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300">
                              Lớp nhóm ({session.enrolledCount || 0}/{session.capacity || 12})
                            </span>
                          )}
                        </div>

                        <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                          {primaryTitle}
                        </div>

                        {session.roomName && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {session.roomName}
                          </div>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
