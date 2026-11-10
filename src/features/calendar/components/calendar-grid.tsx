import React, { useRef, useEffect } from 'react'
import type {
  CalendarSchedule,
  CalendarPtSlot,
  CalendarBooking,
} from '../types/calendar.types'
import {
  getWeekDays,
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  HOUR_HEIGHT_PX,
  calculateEventPosition,
  getCurrentTimeTop,
  formatBookingSlotRange,
  formatDateToYMD,
} from '../utils/calendar-date.utils'
import { Users, UserCheck, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CalendarEventItem =
  | { type: 'SCHEDULE'; data: CalendarSchedule; booking?: CalendarBooking }
  | { type: 'PT_SLOT'; data: CalendarPtSlot; booking?: CalendarBooking }
  | { type: 'BOOKING_STANDALONE'; data: CalendarBooking }

const ACTIVE_BOOKING_STATUSES = new Set(['CONFIRMED', 'PENDING'])

// Modern curated discipline color styling (clean borders, no thick stripes)
const getDisciplineCardClasses = (code?: string, name?: string) => {
  const value = `${code ?? ''} ${name ?? ''}`.toLowerCase()
  if (value.includes('gym') || value.includes('fitness')) {
    return 'bg-sky-50/95 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 border border-sky-200/90 dark:border-sky-800/60 hover:bg-sky-100/95 dark:hover:bg-sky-950/60 focus:ring-sky-400'
  }
  if (value.includes('box') || value.includes('combat')) {
    return 'bg-rose-50/95 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 border border-rose-200/90 dark:border-rose-800/60 hover:bg-rose-100/95 dark:hover:bg-rose-950/60 focus:ring-rose-400'
  }
  if (value.includes('yoga')) {
    return 'bg-violet-50/95 dark:bg-violet-950/40 text-violet-950 dark:text-violet-100 border border-violet-200/90 dark:border-violet-800/60 hover:bg-violet-100/95 dark:hover:bg-violet-950/60 focus:ring-violet-400'
  }
  if (value.includes('dance') || value.includes('zumba')) {
    return 'bg-amber-50/95 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 border border-amber-200/90 dark:border-amber-800/60 hover:bg-amber-100/95 dark:hover:bg-amber-950/60 focus:ring-amber-400'
  }
  return 'bg-teal-50/95 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 border border-teal-200/90 dark:border-teal-800/60 hover:bg-teal-100/95 dark:hover:bg-teal-950/60 focus:ring-teal-400'
}

interface CalendarGridProps {
  currentWeek: string // YYYY-MM-DD (Monday)
  schedules: CalendarSchedule[]
  ptSlots: CalendarPtSlot[]
  bookings: CalendarBooking[]
  onSelectEvent: (event: CalendarEventItem) => void
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentWeek,
  schedules,
  ptSlots,
  bookings,
  onSelectEvent,
}) => {
  const weekDays = getWeekDays(currentWeek)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to top on week switch (never stuck or jumping)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [currentWeek])

  const totalHours = CALENDAR_END_HOUR - CALENDAR_START_HOUR
  const hours = Array.from({ length: totalHours }, (_, i) => CALENDAR_START_HOUR + i)
  const totalGridHeight = totalHours * HOUR_HEIGHT_PX
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

  // Helper to format time range
  const formatTimeRange = (startIso: string, endIso: string) => {
    return `${formatTimeHHmm(startIso)} - ${formatTimeHHmm(endIso)}`
  }

  // Render events for a specific day column
  const renderEventsForDay = (dateString: string) => {
    const events: React.ReactNode[] = []

    // 1. Group classes
    schedules
      .filter((s) => formatDateToYMD(new Date(s.startAt)) === dateString)
      .forEach((schedule) => {
        const { top, height } = calculateEventPosition(schedule.startAt, schedule.endAt)
        const booking = getBookingForSchedule(schedule.id)
        const isBooked = !!booking
        const isFull = schedule.currentEnrolled >= schedule.capacity && !isBooked

        const durationMin = Math.round(
          (new Date(schedule.endAt).getTime() - new Date(schedule.startAt).getTime()) / 60000,
        )
        const isShort = durationMin <= 45 || height <= 52

        const timeRangeStr = formatTimeRange(schedule.startAt, schedule.endAt)
        const primaryTitle = schedule.class?.name || schedule.discipline?.name || 'Lớp tập nhóm'
        const coachName = schedule.coach?.fullName ? `HLV: ${schedule.coach.fullName}` : 'HLV Trung tâm'
        const roomName = schedule.room?.name ? schedule.room.name.split('·')[0].trim() : ''

        events.push(
          <div
            key={`sched-${schedule.id}`}
            onClick={() => onSelectEvent({ type: 'SCHEDULE', data: schedule, booking })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectEvent({ type: 'SCHEDULE', data: schedule, booking })
              }
            }}
            style={{
              top: `${top}px`,
              height: `${height}px`,
              left: '6px',
              right: '6px',
            }}
            className={cn(
              'absolute rounded-[10px] p-2 text-xs transition-all duration-150 cursor-pointer overflow-hidden shadow-2xs select-none group hover:shadow-md hover:scale-[1.01] hover:z-20 focus:outline-hidden focus:ring-2 z-10',
              // Booked State (Green emerald theme)
              isBooked &&
                'bg-emerald-50/95 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border border-emerald-300/90 dark:border-emerald-800 hover:bg-emerald-100/95 dark:hover:bg-emerald-950/60 focus:ring-emerald-400',
              // Full State
              !isBooked &&
                isFull &&
                'bg-slate-50/80 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100/90 focus:ring-slate-400',
              // Available State (Themed by discipline)
              !isBooked &&
                !isFull &&
                getDisciplineCardClasses(
                  schedule.discipline?.code,
                  schedule.discipline?.name || schedule.class?.name,
                ),
            )}
          >
            {isShort ? (
              <div className="flex items-center justify-between h-full gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold tabular-nums text-[11px] shrink-0">
                    {timeRangeStr}
                  </span>
                  <span className="font-semibold truncate text-[11.5px]">{primaryTitle}</span>
                </div>
                {isBooked ? (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" />
                    Đã đặt
                  </span>
                ) : isFull ? (
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    Hết chỗ
                  </span>
                ) : (
                  <span className="text-[10px] font-medium shrink-0 opacity-80">
                    {schedule.currentEnrolled}/{schedule.capacity}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-between h-full space-y-1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold tabular-nums text-[11.5px] tracking-tight">
                      {timeRangeStr}
                    </span>
                    {isBooked ? (
                      <span className="inline-flex items-center text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 text-emerald-600 dark:text-emerald-400" />
                        Đã đặt
                      </span>
                    ) : isFull ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Hết chỗ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white/70 dark:bg-black/20 shadow-2xs text-slate-700 dark:text-slate-200">
                        <Users className="w-3 h-3 text-slate-500" />
                        {schedule.currentEnrolled}/{schedule.capacity}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-[13px] leading-snug tracking-tight truncate mt-0.5">
                    {primaryTitle}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/5 dark:border-white/5">
                  <span className="truncate opacity-85 font-medium">{coachName}</span>
                  {roomName && (
                    <span className="text-[10px] opacity-75 truncate max-w-[85px] ml-1">
                      {roomName}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>,
        )
      })

    // 2. PT 1-1 Slots
    ptSlots
      .filter((pt) => formatDateToYMD(new Date(pt.startAt)) === dateString)
      .forEach((ptSlot) => {
        const { top, height } = calculateEventPosition(ptSlot.startAt, ptSlot.endAt)
        const booking = getBookingForPtSlot(ptSlot.id)
        const isBookedByMe = !!booking

        // Hide slots booked by other members
        if (ptSlot.isBooked && !isBookedByMe) {
          return
        }

        const durationMin = Math.round(
          (new Date(ptSlot.endAt).getTime() - new Date(ptSlot.startAt).getTime()) / 60000,
        )
        const isShort = durationMin <= 45 || height <= 52

        const timeRangeStr = formatTimeRange(ptSlot.startAt, ptSlot.endAt)
        const coachName = ptSlot.coach?.fullName || 'HLV'
        const primaryTitle = `PT với HLV ${coachName}`
        const roomName = 'Khu vực PT'

        events.push(
          <div
            key={`pt-${ptSlot.id}`}
            onClick={() => onSelectEvent({ type: 'PT_SLOT', data: ptSlot, booking })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectEvent({ type: 'PT_SLOT', data: ptSlot, booking })
              }
            }}
            style={{
              top: `${top}px`,
              height: `${height}px`,
              left: '6px',
              right: '6px',
            }}
            className={cn(
              'absolute rounded-[10px] p-2 text-xs transition-all duration-150 cursor-pointer overflow-hidden shadow-2xs select-none group hover:shadow-md hover:scale-[1.01] hover:z-20 focus:outline-hidden focus:ring-2 z-10',
              // Booked State (Green emerald theme)
              isBookedByMe &&
                'bg-emerald-50/95 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border border-emerald-300/90 dark:border-emerald-800 hover:bg-emerald-100/95 dark:hover:bg-emerald-950/60 focus:ring-emerald-400',
              // Available PT State (Purple theme)
              !isBookedByMe &&
                'bg-purple-50/95 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 border border-purple-200/90 dark:border-purple-800/60 hover:bg-purple-100/95 dark:hover:bg-purple-950/60 focus:ring-purple-400',
            )}
          >
            {isShort ? (
              <div className="flex items-center justify-between h-full gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold tabular-nums text-[11px] shrink-0">
                    {timeRangeStr}
                  </span>
                  <span className="font-semibold truncate text-[11.5px]">{primaryTitle}</span>
                </div>
                {isBookedByMe ? (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" />
                    Đã đặt
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 shrink-0">
                    PT 1-1
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-between h-full space-y-1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold tabular-nums text-[11.5px] tracking-tight">
                      {timeRangeStr}
                    </span>
                    {isBookedByMe ? (
                      <span className="inline-flex items-center text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 text-emerald-600 dark:text-emerald-400" />
                        Đã đặt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                        <UserCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        PT 1-1
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-[13px] leading-snug tracking-tight truncate mt-0.5">
                    {primaryTitle}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/5 dark:border-white/5">
                  <span className="truncate opacity-85 font-medium">Kèm riêng 1-1</span>
                  {roomName && (
                    <span className="text-[10px] opacity-75 truncate max-w-[85px] ml-1">
                      {roomName}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>,
        )
      })

    // 3. Standalone Bookings (retained even if matching slot is not found)
    const dayBookings = bookings.filter((b) => {
      const bDate = formatDateToYMD(new Date(b.startAt))
      return bDate === dateString && ACTIVE_BOOKING_STATUSES.has(b.status)
    })

    dayBookings
      .filter(
        (booking) =>
          !schedules.some((schedule) => schedule.id === booking.scheduleId) &&
          !ptSlots.some((slot) => slot.id === booking.coachAvailabilityId),
      )
      .forEach((b) => {
        const { top, height } = calculateEventPosition(b.startAt, b.endAt)
        const durationMin = Math.round(
          (new Date(b.endAt).getTime() - new Date(b.startAt).getTime()) / 60000,
        )
        const isShort = durationMin <= 45 || height <= 52

        const timeRangeStr = formatTimeRange(b.startAt, b.endAt)
        const primaryTitle =
          b.schedule?.class?.name ||
          b.discipline?.name ||
          (b.type === 'PERSONAL_TRAINING' ? 'Buổi tập PT 1-1' : 'Lớp tập nhóm')
        const coachName = b.coach?.fullName ? `HLV: ${b.coach.fullName}` : 'Đã xác nhận'

        events.push(
          <div
            key={`mine-${b.id}`}
            onClick={() => onSelectEvent({ type: 'BOOKING_STANDALONE', data: b })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectEvent({ type: 'BOOKING_STANDALONE', data: b })
              }
            }}
            style={{
              top: `${top}px`,
              height: `${height}px`,
              left: '6px',
              right: '6px',
            }}
            className="absolute rounded-[10px] p-2 text-xs transition-all duration-150 cursor-pointer overflow-hidden shadow-2xs select-none group hover:shadow-md hover:scale-[1.01] hover:z-20 focus:outline-hidden focus:ring-2 z-10 bg-emerald-50/95 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border border-emerald-300/90 dark:border-emerald-800 hover:bg-emerald-100/95 dark:hover:bg-emerald-950/60 focus:ring-emerald-400"
          >
            {isShort ? (
              <div className="flex items-center justify-between h-full gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold tabular-nums text-[11px] shrink-0">
                    {timeRangeStr}
                  </span>
                  <span className="font-semibold truncate text-[11.5px]">{primaryTitle}</span>
                </div>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" />
                  Đã đặt
                </span>
              </div>
            ) : (
              <div className="flex flex-col justify-between h-full space-y-1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold tabular-nums text-[11.5px] tracking-tight">
                      {timeRangeStr}
                    </span>
                    <span className="inline-flex items-center text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 text-emerald-600 dark:text-emerald-400" />
                      Đã đặt
                    </span>
                  </div>
                  <div className="font-semibold text-[13px] leading-snug tracking-tight truncate mt-0.5">
                    {primaryTitle}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/5 dark:border-white/5">
                  <span className="truncate opacity-85 font-medium">{coachName}</span>
                </div>
              </div>
            )}
          </div>,
        )
      })

    return events
  }

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
                // Count available classes + PT slots for this day
                const daySchedules = schedules.filter(
                  (s) => formatDateToYMD(new Date(s.startAt)) === day.dateString,
                ).length
                const dayPtSlots = ptSlots.filter((pt) => {
                  if (formatDateToYMD(new Date(pt.startAt)) !== day.dateString) return false
                  const booking = getBookingForPtSlot(pt.id)
                  return !pt.isBooked || !!booking
                }).length
                const dayEventsCount = daySchedules + dayPtSlots

                return (
                  <div
                    key={day.dateString}
                    className={cn(
                      'py-2.5 px-2 text-center transition-colors flex flex-col items-center justify-center',
                      day.isToday
                        ? 'bg-teal-500/[0.06] dark:bg-teal-400/[0.08]'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/30',
                    )}
                  >
                    {/* Day label: Thứ 2, Thứ 3, etc. */}
                    <span
                      className={cn(
                        'text-[11.5px] font-semibold tracking-tight',
                        day.isToday
                          ? 'text-teal-700 dark:text-teal-300 font-bold'
                          : 'text-slate-500 dark:text-slate-400',
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
                          : 'text-slate-900 dark:text-slate-100 font-semibold',
                      )}
                    >
                      {day.dayNumber}
                    </div>

                    {/* Daily Session Count Text ("X buổi", "Trống") */}
                    <span
                      className={cn(
                        'mt-1 text-[11px] font-medium tracking-tight',
                        dayEventsCount > 0
                          ? 'text-slate-600 dark:text-slate-300'
                          : 'text-slate-400/80 dark:text-slate-500 italic',
                      )}
                    >
                      {dayEventsCount > 0 ? `${dayEventsCount} buổi` : 'Trống'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Grid Body */}
          <div className="flex relative" style={{ height: `${totalGridHeight}px` }}>
            {/* Time labels column (05:00 -> 23:00) */}
            <div className="w-16 shrink-0 relative border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 select-none">
              {hours.map((hour, idx) => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`
                return (
                  <div
                    key={`time-${hour}`}
                    style={{
                      top: `${idx * HOUR_HEIGHT_PX}px`,
                    }}
                    className={cn(
                      'absolute w-full flex justify-center pr-1 pointer-events-none',
                      idx === 0 ? 'translate-y-1' : '-translate-y-1/2',
                    )}
                  >
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                      {hourFormatted}
                    </span>
                  </div>
                )
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
                      day.isToday && 'bg-teal-500/[0.03] dark:bg-teal-400/[0.04]',
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

                    {/* Events for this day */}
                    {renderEventsForDay(day.dateString)}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
