import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type {
  CalendarSchedule,
  CalendarPtSlot,
  CalendarBooking,
  CalendarSubscription,
  CalendarDay,
  Discipline,
} from '../types/calendar.types'
import { formatBookingSlotRange, formatDateToYMD } from '../utils/calendar-date.utils'
import type { CalendarEventItem } from './calendar-grid'
import { getWorkoutPlanByBookingApi } from '../services/calendar-api.service'
import { WorkoutPlanDetailModal } from '@/components/common/workout-plan-detail-modal'
import {
  X,
  Clock,
  MapPin,
  User,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  Info,
  Dumbbell,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const BACKEND_ERROR_MESSAGES: Record<string, string> = {
  PT_REBOOK_SAME_CANCELLED_DAY:
    'Hôm nay bạn đã hủy muộn 1 ca PT cho bộ môn này. Theo quy định của trung tâm, bạn không thể đặt lại ca tập khác trong cùng ngày.',
  PT_ALREADY_BOOKED_FOR_DISCIPLINE_DAY:
    'Bạn đã có 1 ca tập PT trong ngày cho bộ môn này. Mỗi ngày chỉ được đặt tối đa 1 buổi PT cho cùng một môn.',
  NO_VALID_SUBSCRIPTION_OR_QUOTA:
    'Bạn không có gói tập hợp lệ hoặc đã hết lượt tập cho bộ môn/HLV này. Vui lòng kiểm tra lại thời hạn và số buổi còn lại.',
  QUOTA_EXHAUSTED: 'Gói tập của bạn đã hết số lượt tập. Vui lòng gia hạn hoặc đăng ký gói mới.',
  COACH_DISCIPLINE_MISMATCH:
    'Huấn luyện viên không đảm nhiệm bộ môn này. Vui lòng chọn bộ môn khác phù hợp với chuyên môn của HLV.',
  CLASS_FULL_OR_CLOSED: 'Lớp học đã đủ số lượng học viên hoặc đã đóng đăng ký.',
  SESSION_UNAVAILABLE: 'Lớp học hoặc ca tập hiện không khả dụng. Vui lòng liên hệ trung tâm.',
  SESSION_ALREADY_STARTED: 'Buổi tập hoặc ca dạy đã bắt đầu hoặc đã qua thời gian đăng ký.',
  PT_SLOT_UNAVAILABLE: 'Ca rảnh của HLV đã được người khác đặt trước hoặc không còn khả dụng.',
  MEMBER_SCHEDULE_OVERLAP: 'Bạn đã có một lịch tập khác trùng vào khung giờ này.',
  OVERLAPPING_BOOKING: 'Khung giờ này bị trùng với lịch tập khác của bạn.',
  SAME_DAY_ACTIVE_PT_BOOKING_EXISTS:
    'Mỗi ngày bạn chỉ được đặt tối đa 1 ca tập PT còn hiệu lực cho bộ môn này.',
  SAME_DAY_PT_LATE_CANCELLATION_LIMIT:
    'Hôm nay bạn đã hủy muộn 1 ca PT cho bộ môn này, hệ thống không cho phép đặt thêm ca mới trong cùng ngày.',
  SAME_DAY_PT_LIMIT: 'Hạn mức đặt lịch PT trong ngày của bạn đã đạt tối đa.',
  SUBSCRIPTION_NOT_ACTIVE_ON_DAY: 'Gói tập chưa có hiệu lực hoặc đã hết hạn vào ngày diễn ra buổi tập.',
  GROUP_QUOTA_EXHAUSTED: 'Gói tập của bạn đã hết số lượt tham gia lớp học nhóm.',
  PT_QUOTA_EXHAUSTED: 'Gói tập của bạn đã hết số lượt tập kèm HLV 1-1.',
  INVALID_EQUIPMENT: 'Thiết bị tập không khả dụng hoặc phòng tập tạm ngưng phục vụ.',
  CANCELLATION_WINDOW_EXPIRED: 'Đã quá thời hạn cho phép hủy lịch tập.',
  SCHEDULE_OR_DATA_CONFLICT:
    'Khung giờ này bị xung đột hoặc trùng lặp với lịch tập/ca dạy khác. Hệ thống không cho phép xếp trùng giờ.',
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  let rawMsg = ''
  let errorCode = ''

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as any).response
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data
      if (typeof data === 'object' && data !== null) {
        if ('errorCode' in data && data.errorCode) {
          errorCode = String(data.errorCode)
        } else if ('code' in data && data.code) {
          errorCode = String(data.code)
        }
        if ('message' in data && data.message) {
          const message = data.message
          rawMsg = Array.isArray(message) ? message.join(', ') : String(message)
        } else if ('error' in data && data.error) {
          rawMsg = String(data.error)
        }
      }
    }
  } else if (error instanceof Error) {
    rawMsg = error.message
  }

  const code = errorCode || rawMsg
  if (code) {
    for (const [key, translated] of Object.entries(BACKEND_ERROR_MESSAGES)) {
      if (code.includes(key)) {
        return `[Mã lỗi: ${key}] ${translated}`
      }
    }
    return `[Mã lỗi: ${code}]`
  }

  return fallback
}

interface BookingModalProps {
  event: CalendarEventItem | null
  onClose: () => void
  onBookGroup: (scheduleId: string) => Promise<void>
  onBookPt: (coachAvailabilityId: string, disciplineId: string) => Promise<void>
  onCancelBooking: (bookingId: string, reason?: string) => Promise<void>
  subscriptions: CalendarSubscription[]
  disciplines: Discipline[]
  days?: CalendarDay[]
  bookings?: CalendarBooking[]
  onSelectEvent?: (event: CalendarEventItem) => void
}

export const BookingModal: React.FC<BookingModalProps> = ({
  event,
  onClose,
  onBookGroup,
  onBookPt,
  onCancelBooking,
  subscriptions,
  disciplines,
  days,
  bookings,
  onSelectEvent,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedPtDisciplineId, setSelectedPtDisciplineId] = useState('')
  const [assignedPlan, setAssignedPlan] = useState<any>(null)
  const [isViewingAssignedPlan, setIsViewingAssignedPlan] = useState(false)

  if (!event) return null

  // Extract common details based on event type
  let title = ''
  let startAt = ''
  let coachName = ''
  let roomName = ''
  let disciplineName = ''
  let existingBooking: CalendarBooking | undefined

  let scheduleData: CalendarSchedule | undefined
  let ptData: CalendarPtSlot | undefined

  if (event.type === 'SCHEDULE') {
    scheduleData = event.data
    existingBooking = event.booking
    title = scheduleData.class?.name || scheduleData.discipline?.name || 'Lớp nhóm'
    startAt = scheduleData.startAt
    coachName = scheduleData.coach?.fullName || 'Chưa phân công'
    roomName = scheduleData.room?.name || 'Phòng tập'
    disciplineName = scheduleData.discipline?.name || ''
  } else if (event.type === 'PT_SLOT') {
    ptData = event.data
    existingBooking = event.booking
    title = 'Khung giờ HLV cá nhân 1-1 (PT)'
    startAt = ptData.startAt
    coachName = ptData.coach?.fullName || 'Huấn luyện viên'
    disciplineName = ptData.discipline?.name || ''
  } else if (event.type === 'BOOKING_STANDALONE') {
    existingBooking = event.data
    const isPt =
      existingBooking.bookingType === 'PERSONAL_TRAINING' ||
      existingBooking.type === 'PERSONAL_TRAINING' ||
      !!existingBooking.coachAvailabilityId
    title = isPt
      ? `Buổi tập PT 1-1 (${existingBooking.discipline?.name || 'Kèm riêng'})`
      : existingBooking.schedule?.class?.name ||
        existingBooking.discipline?.name ||
        'Lớp học nhóm'
    startAt = existingBooking.startAt
    coachName =
      (existingBooking as any).coachAvailability?.coach?.fullName ||
      existingBooking.schedule?.coach?.fullName ||
      (existingBooking as any).coach?.fullName ||
      (isPt ? 'Huấn luyện viên cá nhân' : 'Chưa phân công')
    roomName = existingBooking.room?.name || (isPt ? 'Khu vực PT kèm riêng' : 'Phòng tập')
    disciplineName =
      existingBooking.discipline?.name ||
      disciplines.find((d) => d.id === existingBooking?.disciplineId)?.name ||
      ''
  }

  // Calculate cancellation window (>= 2 hours before start)
  const now = new Date()
  const startTime = new Date(startAt)
  const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  const isStarted = diffHours <= 0
  const isRefundable = diffHours >= 2

  // Date strings for quota and subscription validity check
  const todayStr = formatDateToYMD(new Date())
  const sessionDateStr = startAt ? formatDateToYMD(new Date(startAt)) : todayStr

  // Check if coach has assigned a workout plan for this booking
  React.useEffect(() => {
    if (existingBooking?.id) {
      getWorkoutPlanByBookingApi(existingBooking.id).then((res: any) => {
        if (res && res.id) {
          setAssignedPlan(res)
        } else {
          setAssignedPlan(null)
        }
      })
    } else {
      setAssignedPlan(null)
    }
  }, [existingBooking?.id])

  // Pre-flight check for Group Class
  const matchingGroupSub = useMemo(() => {
    if (event.type !== 'SCHEDULE' || !scheduleData) return null
    return (
      subscriptions.find((sub) => {
        if (sub.status !== 'ACTIVE') return false
        if ((sub.remainingGroupSessions ?? 0) <= 0) return false
        if (scheduleData.disciplineId && sub.disciplineId !== scheduleData.disciplineId) {
          return false
        }
        const subStart = sub.startDate ? sub.startDate.slice(0, 10) : ''
        const subEnd = sub.endDate ? sub.endDate.slice(0, 10) : ''
        if (subStart && subStart > todayStr) return false
        const compareDate = sessionDateStr > todayStr ? sessionDateStr : todayStr
        if (subEnd && subEnd < compareDate) return false
        return true
      }) || null
    )
  }, [event.type, scheduleData, subscriptions, todayStr, sessionDateStr])

  // Pre-flight check for PT Slot
  const eligiblePtSubscriptions = useMemo(() => {
    if (event.type !== 'PT_SLOT' || !ptData) return []
    return subscriptions.filter((sub) => {
      if (sub.status !== 'ACTIVE') return false
      if ((sub.remainingPtSessions ?? 0) <= 0) return false
      const subStart = sub.startDate ? sub.startDate.slice(0, 10) : ''
      const subEnd = sub.endDate ? sub.endDate.slice(0, 10) : ''
      if (subStart && subStart > todayStr) return false
      const compareDate = sessionDateStr > todayStr ? sessionDateStr : todayStr
      if (subEnd && subEnd < compareDate) return false

      // Check assigned coach match if coach is explicitly assigned
      if (sub.assignedCoach?.id && ptData.coach?.id && sub.assignedCoach.id !== ptData.coach.id) {
        return false
      }

      // Check slot eligible disciplines if provided
      if (
        ptData.eligibleDisciplines &&
        ptData.eligibleDisciplines.length > 0 &&
        !ptData.eligibleDisciplines.includes(sub.disciplineId)
      ) {
        return false
      }

      return true
    })
  }, [event.type, ptData, subscriptions, todayStr, sessionDateStr])

  // Available PT disciplines mapped from eligible subscriptions
  const availablePtDisciplines = useMemo(() => {
    if (eligiblePtSubscriptions.length === 0) return []
    const discMap = new Map<string, { discipline: Discipline; sub: CalendarSubscription }>()
    for (const sub of eligiblePtSubscriptions) {
      const disc =
        disciplines.find((d) => d.id === sub.disciplineId) ||
        sub.discipline ||
        ({ id: sub.disciplineId, name: sub.planName, code: 'PT' } as Discipline)
      if (!discMap.has(disc.id)) {
        discMap.set(disc.id, { discipline: disc, sub })
      }
    }
    return Array.from(discMap.values())
  }, [eligiblePtSubscriptions, disciplines])

  const activePtDisciplineId =
    selectedPtDisciplineId && availablePtDisciplines.some((item) => item.discipline.id === selectedPtDisciplineId)
      ? selectedPtDisciplineId
      : availablePtDisciplines[0]?.discipline.id || ''

  const currentSelectedPtSub = eligiblePtSubscriptions.find(
    (s) => s.disciplineId === activePtDisciplineId,
  )

  // Check day eligibility for the selected slot day and discipline
  // Use Vietnam timezone / local date so UTC timestamps don't shift by -1 day for morning slots
  const slotDateStr = useMemo(() => {
    if (!startAt) return ''
    try {
      return formatDateToYMD(new Date(startAt))
    } catch {
      return ''
    }
  }, [startAt])

  const currentDayInfo = useMemo(() => {
    if (!days || !slotDateStr) return null
    return days.find((d) => d.date === slotDateStr) || null
  }, [days, slotDateStr])

  const ptDayEligibility = useMemo(() => {
    if (!currentDayInfo || !activePtDisciplineId) return null

    // 1. If we have an active matching subscription, match strictly by subscriptionId
    // to prevent falling back to an older expired subscription of the same discipline
    if (currentSelectedPtSub) {
      const matchBySub = currentDayInfo.eligibility?.find(
        (e) => e.subscriptionId === currentSelectedPtSub.id,
      )
      if (matchBySub) return matchBySub
    }

    // 2. Otherwise find all entries for this discipline and prefer an allowed one
    const matchingEntries =
      currentDayInfo.eligibility?.filter(
        (e) => e.disciplineId === activePtDisciplineId,
      ) || []

    const allowedEntry = matchingEntries.find((e) => e.pt.allowed)
    if (allowedEntry) return allowedEntry

    return matchingEntries[0] || null
  }, [currentDayInfo, activePtDisciplineId, currentSelectedPtSub])

  // Check if member already has an active PT booking for this day and discipline
  const existingDayBooking = useMemo(() => {
    if (!bookings || !slotDateStr || !activePtDisciplineId) return null
    return (
      bookings.find((b) => {
        if (b.status === 'CANCELLED') return false
        const bDate = formatDateToYMD(new Date(b.startAt))
        return (
          bDate === slotDateStr &&
          (b.type === 'PERSONAL_TRAINING' || b.bookingType === 'PERSONAL_TRAINING') &&
          (b.disciplineId === activePtDisciplineId || b.discipline?.id === activePtDisciplineId)
        )
      }) || null
    )
  }, [bookings, slotDateStr, activePtDisciplineId])

  // Handlers
  const handleConfirmBookGroup = async () => {
    if (!scheduleData) return
    if (isStarted) {
      setErrorMsg('Buổi tập này đã bắt đầu hoặc diễn ra trong quá khứ, không thể đặt chỗ.')
      return
    }
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await onBookGroup(scheduleData.id)
      onClose()
    } catch (err: unknown) {
      setErrorMsg(
        getErrorMessage(
          err,
          'Không thể đặt lớp. Vui lòng kiểm tra lại hạn mức và thời hạn gói tập.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmBookPt = async () => {
    if (!ptData) return
    if (isStarted) {
      setErrorMsg('Khung giờ tập này đã qua thời gian bắt đầu, không thể đăng ký ca tập trong quá khứ.')
      return
    }
    const disciplineId = activePtDisciplineId
    if (!disciplineId) {
      setErrorMsg('Vui lòng chọn bộ môn cho buổi tập PT')
      return
    }
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await onBookPt(ptData.id, disciplineId)
      onClose()
    } catch (err: unknown) {
      setErrorMsg(
        getErrorMessage(
          err,
          'Không thể đặt lịch PT. Bạn có thể đã có lịch PT bộ môn này trong ngày.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!existingBooking) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await onCancelBooking(existingBooking.id, cancelReason)
      onClose()
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'Lỗi khi hủy lịch đặt. Buổi tập có thể đã diễn ra.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date display
  const startDateObj = new Date(startAt)
  const formattedDate = startDateObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return typeof document !== 'undefined'
    ? createPortal(
        <>
          <aside
          aria-label="Chi tiết buổi tập"
          className="fixed right-5 top-24 z-[9999] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-none border-2 border-slate-900 bg-white shadow-2xl animate-in slide-in-from-right duration-200"
        >
      <div className="flex max-h-[calc(100vh-7rem)] min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                existingBooking
                  ? 'bg-emerald-500'
                  : event.type === 'PT_SLOT'
                    ? 'bg-purple-500'
                    : 'bg-sky-500',
              )}
            />
            <h2 className="text-base font-bold text-slate-900">Chi tiết buổi tập</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Đóng chi tiết buổi tập"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <span className="font-bold">Lỗi đặt/hủy lịch:</span> {errorMsg}
              </div>
            </div>
          )}

          {/* Title & Badge */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              {disciplineName && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {disciplineName}
                </span>
              )}
              {existingBooking && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ĐÃ ĐẶT CHỖ
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 capitalize">
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
              {formattedDate}
            </div>
          </div>

          {/* Detail Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#008b74]" />
                Thời gian
              </div>
              <div className="font-bold text-slate-800">
                {formatBookingSlotRange(startAt)}
              </div>
            </div>

            {roomName ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#008b74]" />
                  Phòng tập
                </div>
                <div className="font-bold text-slate-800 truncate">{roomName}</div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Hình thức
                </div>
                <div className="font-bold text-slate-800">Kèm 1-1 cùng HLV</div>
              </div>
            )}

            {coachName && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#008b74]" />
                  Huấn luyện viên
                </div>
                <div className="font-bold text-slate-800">{coachName}</div>
              </div>
            )}

            {scheduleData && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#008b74]" />
                  Sĩ số lớp
                </div>
                <div className="font-bold text-slate-800">
                  {scheduleData.currentEnrolled} / {scheduleData.capacity} chỗ
                  {scheduleData.currentEnrolled >= scheduleData.capacity && (
                    <span className="ml-1 text-rose-600 text-[11px] font-normal">(Hết chỗ)</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Past Event Warning if trying to book an event in the past */}
          {!existingBooking && isStarted && (
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">Buổi tập đã qua giờ diễn ra</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Khung giờ này đã kết thúc hoặc đang diễn ra trong quá khứ. Hệ thống không cho phép đăng ký mới.
                </p>
              </div>
            </div>
          )}

          {/* Group Class Quota Status or Alert */}
          {event.type === 'SCHEDULE' && !existingBooking && !isStarted && (
            <div>
              {matchingGroupSub ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Gói tập áp dụng:</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Còn {matchingGroupSub.remainingGroupSessions} buổi
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {matchingGroupSub.planName} • Hạn đến {new Date(matchingGroupSub.endDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Chưa có gói tập lớp nhóm</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Bạn chưa có gói tập đang hoạt động hoặc đã hết lượt tham gia lớp nhóm cho bộ môn <strong>{disciplineName || 'này'}</strong>. Vui lòng đăng ký hoặc gia hạn gói tập tại quầy tiếp tân.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PT Discipline Selector & Quota Status if booking PT */}
          {event.type === 'PT_SLOT' && !existingBooking && !isStarted && (
            <div className="space-y-3">
              {availablePtDisciplines.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Không có gói tập PT khả dụng</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Bạn cần có gói tập kèm HLV còn lượt (và được phân công cho HLV <strong>{coachName}</strong>) để đặt ca tập này. Vui lòng kiểm tra lại thời hạn gói tập hoặc liên hệ quầy tiếp tân để đăng ký.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-xs space-y-3">
                  <label className="block font-bold text-purple-900">
                    Chọn bộ môn đăng ký tập kèm PT:
                  </label>
                  <select
                    value={activePtDisciplineId}
                    onChange={(e) => setSelectedPtDisciplineId(e.target.value)}
                    className="w-full p-2 bg-white border border-purple-300 rounded-lg text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-400 text-xs"
                  >
                    {availablePtDisciplines.map(({ discipline: d, sub }) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code}) — {sub.planName}
                      </option>
                    ))}
                  </select>

                  {currentSelectedPtSub && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-purple-200 text-purple-950 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Gói tập áp dụng</span>
                        <span className="font-bold">{currentSelectedPtSub.planName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px]">Số buổi còn lại</span>
                        <span className="font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                          {currentSelectedPtSub.remainingPtSessions} buổi PT
                        </span>
                      </div>
                    </div>
                  )}

                  {ptDayEligibility && !ptDayEligibility.pt.allowed && !existingBooking && !isStarted && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Không thể đặt ca PT trong ngày này</span>
                      </div>
                      {existingDayBooking ? (
                        <div className="space-y-2">
                          <p className="text-[11.5px] text-amber-800 leading-relaxed">
                            Bạn hiện đã có 1 ca tập PT bộ môn này vào lúc{' '}
                            <span className="font-bold text-amber-950">
                              {formatBookingSlotRange(existingDayBooking.startAt)}
                            </span>
                            {existingDayBooking.coach?.fullName ? (
                              <>
                                {' '}với HLV{' '}
                                <span className="font-bold text-amber-950">
                                  {existingDayBooking.coach.fullName}
                                </span>
                              </>
                            ) : null}
                            . Theo quy định của trung tâm, mỗi ngày chỉ được đặt tối đa 1 buổi PT cho cùng một môn.
                          </p>
                          {onSelectEvent && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectEvent({ type: 'BOOKING_STANDALONE', data: existingDayBooking })
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                            >
                              <span>Xem / Hủy ca tập này để đổi sang giờ khác</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          {BACKEND_ERROR_MESSAGES[ptDayEligibility.pt.reason || ''] ||
                            'Bạn không đủ điều kiện đặt thêm ca PT cho bộ môn này trong ngày.'}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-purple-700 leading-relaxed flex items-start gap-1">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-600" />
                    Mỗi hội viên được đặt tối đa 1 ca PT còn hiệu lực cho mỗi bộ môn trong một ngày.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Workout plan banner ONLY WHEN COACH HAS ACTUALLY ASSIGNED A PLAN */}
          {existingBooking && assignedPlan && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-white border border-emerald-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">
                      {assignedPlan.title || 'Giáo án buổi tập của HLV'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      HLV đã soạn {assignedPlan.exercises?.length || 0} bài tập cho buổi học này
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsViewingAssignedPlan(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer"
                >
                  <span>Xem giáo án</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Cancellation section if already booked */}
          {existingBooking && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900">Chính sách hủy chỗ</h4>
              </div>

              {isStarted ? (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  Buổi tập đã bắt đầu. Hệ thống không cho phép hủy lịch.
                </div>
              ) : isRefundable ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <span className="font-bold">Hủy đúng hạn (trước 2 tiếng):</span> Bạn sẽ được hoàn
                  lại 01 lượt tập vào gói đăng ký.
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                  <div>
                    <span className="font-bold">Hủy muộn (dưới 2 tiếng):</span> Buổi tập vẫn được giải
                    phóng cho hội viên khác, nhưng{' '}
                    <span className="font-bold underline">không được hoàn lại lượt tập</span>.
                  </div>
                  {(event.type === 'PT_SLOT' ||
                    existingBooking?.type === 'PERSONAL_TRAINING' ||
                    existingBooking?.bookingType === 'PERSONAL_TRAINING') && (
                    <div className="text-[11px] text-amber-900 font-semibold pt-1 border-t border-amber-200/60">
                      ⚠️ Lưu ý: Theo quy định trung tâm, nếu hủy muộn, bạn sẽ không thể đặt lại ca PT khác của bộ môn này trong cùng ngày.
                    </div>
                  )}
                </div>
              )}

              {showCancelConfirm ? (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Lý do hủy lịch (tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nhập lý do bận, ốm,..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSubmitting || isStarted}
                      onClick={handleConfirmCancel}
                      className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy lịch'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                    >
                      Quay lại
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isStarted}
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full py-2 px-4 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                >
                  Yêu cầu hủy đặt chỗ
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions if NOT booked yet */}
        {!existingBooking && (
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Đóng
            </button>

            {event.type === 'SCHEDULE' && scheduleData && (
              <button
                type="button"
                disabled={
                  isSubmitting ||
                  isStarted ||
                  scheduleData.currentEnrolled >= scheduleData.capacity ||
                  !matchingGroupSub
                }
                onClick={handleConfirmBookGroup}
                className={cn(
                  'py-2 px-5 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer',
                  isStarted || scheduleData.currentEnrolled >= scheduleData.capacity || !matchingGroupSub
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-[#008b74] hover:bg-[#00735f] active:bg-[#005f4f]',
                )}
              >
                {isSubmitting
                  ? 'Đang đặt...'
                  : isStarted
                    ? 'Buổi tập đã qua giờ'
                    : scheduleData.currentEnrolled >= scheduleData.capacity
                    ? 'Lớp đã đủ người'
                    : !matchingGroupSub
                    ? 'Chưa có gói tập phù hợp'
                    : 'Xác nhận đặt lớp nhóm'}
              </button>
            )}

            {event.type === 'PT_SLOT' && ptData && (
              <button
                type="button"
                disabled={
                  isSubmitting ||
                  isStarted ||
                  availablePtDisciplines.length === 0 ||
                  Boolean(ptDayEligibility && !ptDayEligibility.pt.allowed)
                }
                onClick={handleConfirmBookPt}
                className={cn(
                  'py-2 px-5 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer',
                  isStarted ||
                    availablePtDisciplines.length === 0 ||
                    (ptDayEligibility && !ptDayEligibility.pt.allowed)
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800',
                )}
              >
                {isSubmitting
                  ? 'Đang đặt...'
                  : isStarted
                    ? 'Khung giờ đã qua'
                    : availablePtDisciplines.length === 0
                    ? 'Chưa có gói PT phù hợp'
                    : ptDayEligibility && !ptDayEligibility.pt.allowed
                    ? ptDayEligibility.pt.reason === 'PT_REBOOK_SAME_CANCELLED_DAY'
                      ? 'Đã hủy muộn trong ngày'
                      : ptDayEligibility.pt.reason === 'PT_ALREADY_BOOKED_FOR_DISCIPLINE_DAY'
                      ? 'Đã có ca PT trong ngày'
                      : 'Không đủ điều kiện đặt'
                    : 'Xác nhận đặt lịch PT'}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>

    {/* Assigned Workout Plan Viewer Modal (M14.1) */}
    <WorkoutPlanDetailModal
      isOpen={Boolean(isViewingAssignedPlan && assignedPlan)}
      onClose={() => setIsViewingAssignedPlan(false)}
      title={assignedPlan?.title || 'Giáo Án Buổi Tập PT 1-1'}
      coachName={coachName}
      notes={assignedPlan?.notes}
      exercises={assignedPlan?.exercises || []}
    />
  </>,
    document.body
  ) : null
}
