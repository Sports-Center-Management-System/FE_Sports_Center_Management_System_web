import React, { useRef, useEffect } from 'react'
import type {
  CalendarSchedule,
  CalendarPtSlot,
  CalendarBooking,
  CalendarViewMode,
} from '../types/calendar.types'
import {
  getWeekDays,
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  HOUR_HEIGHT_PX,
  calculateEventPosition,
  getCurrentTimeTop,
  formatTimeHHmm,
  formatDateToYMD,
} from '../utils/calendar-date.utils'
import { Users, UserCheck, CheckCircle2, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CalendarEventItem =
  | { type: 'SCHEDULE'; data: CalendarSchedule; booking?: CalendarBooking }
  | { type: 'PT_SLOT'; data: CalendarPtSlot; booking?: CalendarBooking }
  | { type: 'BOOKING_STANDALONE'; data: CalendarBooking }

const ACTIVE_BOOKING_STATUSES = new Set(['CONFIRMED', 'PENDING'])

interface CalendarGridProps {
  currentWeek: string // YYYY-MM-DD (Monday)
  schedules: CalendarSchedule[]
  ptSlots: CalendarPtSlot[]
  bookings: CalendarBooking[]
  viewMode: CalendarViewMode
  onSelectEvent: (event: CalendarEventItem) => void
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentWeek,
  schedules,
  ptSlots,
  bookings,
  viewMode,
  onSelectEvent,
}) => {
  const weekDays = getWeekDays(currentWeek)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to 07:00 on initial mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollPosition = (7 - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX
      scrollContainerRef.current.scrollTop = scrollPosition
    }
  }, [currentWeek])

  // Hours array from CALENDAR_START_HOUR to CALENDAR_END_HOUR
  const hours = Array.from(
    { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 },
    (_, i) => CALENDAR_START_HOUR + i,
  )

  const totalGridHeight = (CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1) * HOUR_HEIGHT_PX
  const currentTimeTop = getCurrentTimeTop()

  // Helper to check if a booking matches a schedule
  const getBookingForSchedule = (scheduleId: string) => {
    return bookings.find(
      (b) => b.scheduleId === scheduleId && ACTIVE_BOOKING_STATUSES.has(b.status),
    )
  }

  // Helper to check if a booking matches a PT slot
  const getBookingForPtSlot = (slotId: string) => {
    return bookings.find(
      (b) => b.coachAvailabilityId === slotId && ACTIVE_BOOKING_STATUSES.has(b.status),
    )
  }

  // Render events for a specific day column
  const renderEventsForDay = (dateString: string) => {
    const events: React.ReactNode[] = []

    // Retain active bookings even when the API omits the linked schedule or slot.
    const dayBookings = bookings.filter((b) => {
      const bDate = formatDateToYMD(new Date(b.startAt))
      return bDate === dateString && ACTIVE_BOOKING_STATUSES.has(b.status)
    })

    // 1. Group classes (schedules)
    if (viewMode === 'all' || viewMode === 'group') {
      schedules
        .filter((s) => formatDateToYMD(new Date(s.startAt)) === dateString)
        .forEach((schedule) => {
          const { top, height } = calculateEventPosition(schedule.startAt, schedule.endAt)
          const booking = getBookingForSchedule(schedule.id)
          const isBooked = !!booking
          const isFull = schedule.currentEnrolled >= schedule.capacity && !isBooked

          events.push(
            <div
              key={`sched-${schedule.id}`}
              onClick={() => onSelectEvent({ type: 'SCHEDULE', data: schedule, booking })}
              style={{
                top: `${top}px`,
                height: `${height}px`,
              }}
              className={cn(
                'absolute inset-x-1 rounded-lg p-2 text-xs transition-all duration-150 cursor-pointer overflow-hidden border shadow-2xs select-none',
                isBooked
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25'
                  : isFull
                    ? 'bg-slate-100 border-slate-300 text-slate-500 opacity-75 hover:bg-slate-200'
                    : 'bg-sky-50 border-sky-300 text-sky-950 hover:bg-sky-100/90 hover:border-sky-400 hover:shadow-xs',
              )}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="font-bold text-[11px] leading-tight line-clamp-1">
                  {schedule.class?.name || schedule.discipline?.name || 'Lớp nhóm'}
                </span>
                {isBooked ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    ĐÃ ĐẶT
                  </span>
                ) : isFull ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-300 text-slate-700 shrink-0">
                    Hết chỗ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] font-semibold bg-sky-200/80 text-sky-900 shrink-0">
                    <Users className="h-3 w-3" />
                    {schedule.currentEnrolled}/{schedule.capacity}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] opacity-85 mb-0.5 font-medium">
                <Clock className="h-3 w-3 shrink-0" />
                <span>
                  {formatTimeHHmm(schedule.startAt)} - {formatTimeHHmm(schedule.endAt)}
                </span>
              </div>

              {schedule.room && (
                <div className="flex items-center gap-1 text-[10px] opacity-75 truncate">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{schedule.room.name}</span>
                </div>
              )}

              {schedule.coach && (
                <div className="text-[10px] opacity-75 truncate">
                  HLV: {schedule.coach.fullName}
                </div>
              )}
            </div>,
          )
        })
    }

    // 2. Personal Training slots (PT)
    if (viewMode === 'all' || viewMode === 'pt') {
      ptSlots
        .filter((pt) => formatDateToYMD(new Date(pt.startAt)) === dateString)
        .forEach((ptSlot) => {
          const { top, height } = calculateEventPosition(ptSlot.startAt, ptSlot.endAt)
          const booking = getBookingForPtSlot(ptSlot.id)
          const isBookedByMe = !!booking

          // If booked by another member and not me, hide or show occupied
          if (ptSlot.isBooked && !isBookedByMe) {
            return
          }

          events.push(
            <div
              key={`pt-${ptSlot.id}`}
              onClick={() => onSelectEvent({ type: 'PT_SLOT', data: ptSlot, booking })}
              style={{
                top: `${top}px`,
                height: `${height}px`,
              }}
              className={cn(
                'absolute inset-x-1 rounded-lg p-2 text-xs transition-all duration-150 cursor-pointer overflow-hidden border shadow-2xs select-none',
                isBookedByMe
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-purple-50 border-purple-300 text-purple-950 hover:bg-purple-100/90 hover:border-purple-400 hover:shadow-xs',
              )}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="font-bold text-[11px] leading-tight line-clamp-1 flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-purple-600 shrink-0" />
                  PT 1-1 Kèm riêng
                </span>
                {isBookedByMe && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    ĐÃ ĐẶT
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] opacity-85 mb-0.5 font-medium">
                <Clock className="h-3 w-3 shrink-0" />
                <span>
                  {formatTimeHHmm(ptSlot.startAt)} - {formatTimeHHmm(ptSlot.endAt)}
                </span>
              </div>

              {ptSlot.coach && (
                <div className="text-[10px] opacity-85 font-medium truncate">
                  HLV: {ptSlot.coach.fullName}
                </div>
              )}
            </div>,
          )
        })
    }

    // 3. Standalone confirmed bookings if in "mine" view mode
    if (viewMode === 'mine') {
      dayBookings.forEach((b) => {
        const { top, height } = calculateEventPosition(b.startAt, b.endAt)
        events.push(
          <div
            key={`mine-${b.id}`}
            onClick={() => onSelectEvent({ type: 'BOOKING_STANDALONE', data: b })}
            style={{
              top: `${top}px`,
              height: `${height}px`,
            }}
            className="absolute inset-x-1 rounded-lg p-2 text-xs bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-sm cursor-pointer hover:bg-emerald-100/80 transition select-none"
          >
            <div className="flex items-start justify-between gap-1 mb-1">
              <span className="font-bold text-[11px] leading-tight line-clamp-1">
                {b.schedule?.class?.name ||
                  b.discipline?.name ||
                  (b.type === 'PERSONAL_TRAINING' ? 'Buổi tập PT 1-1' : 'Lớp học nhóm')}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                ĐÃ ĐẶT
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] opacity-90 mb-0.5 font-semibold">
              <Clock className="h-3 w-3 shrink-0" />
              <span>
                {formatTimeHHmm(b.startAt)} - {formatTimeHHmm(b.endAt)}
              </span>
            </div>

            {b.coach && (
              <div className="text-[10px] opacity-80 truncate">HLV: {b.coach.fullName}</div>
            )}
          </div>,
        )
      })
    }

    return events
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden select-none">
      {/* 7-Day Header Row (Sticky) */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[72px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50/80 sticky top-0 z-20 shadow-2xs">
        {/* Time label corner */}
        <div className="p-3 border-r border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-400">
          GMT+7
        </div>

        {/* Days of week */}
        {weekDays.map((day) => (
          <div
            key={day.dateString}
            className={cn(
              'py-2.5 px-1 sm:px-2 text-center border-r border-slate-200 last:border-r-0 transition-colors',
              day.isToday ? 'bg-emerald-50/60' : '',
            )}
          >
            <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              {day.dayLabel}
            </div>
            <div className="mt-1 flex items-center justify-center">
              <span
                className={cn(
                  'inline-flex items-center justify-center text-sm sm:text-base font-bold transition-all',
                  day.isToday
                    ? 'h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#008b74] text-white shadow-sm'
                    : 'text-slate-800',
                )}
              >
                {day.dayNumber}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto relative scroll-smooth bg-slate-50/30"
        style={{ height: 'calc(100vh - 165px)' }}
      >
        <div
          className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[72px_repeat(7,1fr)] relative min-w-[700px]"
          style={{ height: `${totalGridHeight}px` }}
        >
          {/* Time scale column */}
          <div className="border-r border-slate-200 bg-slate-50/50 select-none">
            {hours.map((hour) => (
              <div
                key={`hour-${hour}`}
                style={{ height: `${HOUR_HEIGHT_PX}px` }}
                className="relative border-b border-slate-200/60 text-right pr-2 sm:pr-3"
              >
                <span className="text-[11px] font-medium text-slate-400 -translate-y-2 block">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* 7 Day Event Columns */}
          {weekDays.map((day) => (
            <div
              key={`col-${day.dateString}`}
              className={cn(
                'relative border-r border-slate-200 last:border-r-0',
                day.isToday ? 'bg-emerald-50/20' : '',
              )}
            >
              {/* Horizontal grid lines for each hour */}
              {hours.map((hour) => (
                <div
                  key={`grid-${day.dateString}-${hour}`}
                  style={{ height: `${HOUR_HEIGHT_PX}px` }}
                  className="border-b border-slate-200/60"
                />
              ))}

              {/* Current time line if today */}
              {day.isToday && currentTimeTop !== null && (
                <div
                  className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                  style={{ top: `${currentTimeTop}px` }}
                >
                  <span className="h-2 w-2 rounded-full bg-rose-500 -ml-1 ring-2 ring-white shadow-xs" />
                  <div className="flex-1 h-0.5 bg-rose-500/80 shadow-xs" />
                </div>
              )}

              {/* Event Cards for this day */}
              <div className="absolute inset-0 pointer-events-auto">
                {renderEventsForDay(day.dateString)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
