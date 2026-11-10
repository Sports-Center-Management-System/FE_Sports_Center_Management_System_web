import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import type { CalendarResponseData, Discipline } from '../types/calendar.types'
import {
  getCalendarApi,
  bookGroupClassApi,
  bookPtSessionApi,
  cancelBookingApi,
  getDisciplinesApi,
} from '../services/calendar-api.service'
import { getMondayOfWeek, shiftWeek } from '../utils/calendar-date.utils'
import { CalendarHeader } from '../components/calendar-header'
import { CalendarGrid } from '../components/calendar-grid'
import type { CalendarEventItem } from '../components/calendar-grid'
import { BookingModal } from '../components/booking-modal'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data
      if (typeof data === 'object' && data !== null && 'message' in data) {
        const message = data.message
        return Array.isArray(message) ? message.join(', ') : String(message)
      }
    }
  }
  return error instanceof Error ? error.message : fallback
}

export const CalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // URL Query Parameters
  const weekParam = searchParams.get('week')
  const disciplineParam = searchParams.get('disciplineId') || 'all'

  // State
  const [currentWeek, setCurrentWeek] = useState<string>(() => {
    return weekParam ? getMondayOfWeek(weekParam) : getMondayOfWeek()
  })
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>(disciplineParam)

  const [calendarData, setCalendarData] = useState<CalendarResponseData | null>(null)
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Selected event for booking/cancel modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null)

  // Toast feedback
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(null)
    }, 4500)
  }

  // Sync state with URL params
  const updateUrlParams = useCallback(
    (week: string, disciplineId: string) => {
      const params = new URLSearchParams()
      params.set('week', week)
      if (disciplineId !== 'all') {
        params.set('disciplineId', disciplineId)
      }
      setSearchParams(params)
    },
    [setSearchParams],
  )

  // Load disciplines once
  useEffect(() => {
    let isMounted = true
    getDisciplinesApi()
      .then((data) => {
        if (isMounted) setDisciplines(data || [])
      })
      .catch((err) => {
        console.warn('Could not load disciplines list', err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Fetch calendar whenever currentWeek, viewMode, or selectedDisciplineId changes
  const loadCalendar = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const data = await getCalendarApi({
        week: currentWeek,
        view: 'all',
        disciplineId: selectedDisciplineId,
      })
      setCalendarData(data)
    } catch (err: unknown) {
      console.error('Calendar fetch error:', err)
      setFetchError(getErrorMessage(err, 'Không thể tải lịch tuần. Vui lòng thử lại sau.'))
    } finally {
      setIsLoading(false)
    }
  }, [currentWeek, selectedDisciplineId])

  useEffect(() => {
    const requestId = window.setTimeout(() => {
      void loadCalendar()
    }, 0)
    return () => window.clearTimeout(requestId)
  }, [loadCalendar])

  // Handlers for Header Navigation & Filters
  const handleWeekChange = (direction: 'prev' | 'next') => {
    const offset = direction === 'next' ? 1 : -1
    const newWeek = shiftWeek(currentWeek, offset)
    setCurrentWeek(newWeek)
    updateUrlParams(newWeek, selectedDisciplineId)
  }

  const handleGoToCurrentWeek = () => {
    const thisMonday = getMondayOfWeek()
    setCurrentWeek(thisMonday)
    updateUrlParams(thisMonday, selectedDisciplineId)
  }

  const handleSelectWeek = (newWeekMonday: string) => {
    setCurrentWeek(newWeekMonday)
    updateUrlParams(newWeekMonday, selectedDisciplineId)
  }

  const handleDisciplineChange = (discId: string) => {
    setSelectedDisciplineId(discId)
    updateUrlParams(currentWeek, discId)
  }

  // Booking actions
  const handleBookGroupClass = async (scheduleId: string) => {
    await bookGroupClassApi({ scheduleId })
    showToast('success', 'Đặt lịch lớp học nhóm thành công!')
    await loadCalendar()
  }

  const handleBookPtSession = async (coachAvailabilityId: string, disciplineId: string) => {
    await bookPtSessionApi({ coachAvailabilityId, disciplineId })
    showToast('success', 'Đặt lịch tập kèm HLV 1-1 thành công!')
    await loadCalendar()
  }

  const handleCancelBooking = async (bookingId: string, reason?: string) => {
    const res = await cancelBookingApi(bookingId, { reason })
    if (res.refunded) {
      showToast(
        'success',
        'Hủy lịch thành công! Buổi tập đã được hoàn lại 01 lượt vào gói tập của bạn.',
      )
    } else {
      showToast(
        'info',
        'Hủy lịch thành công! (Hủy muộn dưới 2 tiếng: lượt tập không được hoàn theo quy định trung tâm).',
      )
    }
    await loadCalendar()
  }

  return (
    <div className="min-h-screen rounded-3xl bg-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toast.type === 'error'
                  ? 'bg-rose-900 text-rose-100 border-rose-700'
                  : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <CalendarHeader
        currentWeek={currentWeek}
        onWeekChange={handleWeekChange}
        onGoToCurrentWeek={handleGoToCurrentWeek}
        onSelectWeek={handleSelectWeek}
        selectedDisciplineId={selectedDisciplineId}
        onDisciplineChange={handleDisciplineChange}
        disciplines={disciplines}
        subscriptions={calendarData?.subscriptions || []}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-2 sm:p-4">
        {fetchError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Không thể tải dữ liệu thời khóa biểu
            </h3>
            <p className="text-xs text-slate-500 max-w-md text-center mb-4">{fetchError}</p>
            <button
              type="button"
              onClick={() => loadCalendar()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#008b74] text-white text-xs font-bold hover:bg-[#007461] transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử lại
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-[600px]">
            <CalendarGrid
              currentWeek={currentWeek}
              schedules={calendarData?.schedules || []}
              ptSlots={calendarData?.ptSlots || []}
              bookings={calendarData?.bookings || []}
              onSelectEvent={(event) => setSelectedEvent(event)}
            />
          </div>
        )}
      </main>

      {/* Booking & Cancellation Modal */}
      {selectedEvent && (
        <BookingModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onBookGroup={handleBookGroupClass}
          onBookPt={handleBookPtSession}
          onCancelBooking={handleCancelBooking}
          subscriptions={calendarData?.subscriptions || []}
          disciplines={disciplines}
        />
      )}
    </div>
  )
}
