import React, { useState } from 'react'
import type {
  CalendarSchedule,
  CalendarPtSlot,
  CalendarBooking,
  CalendarSubscription,
  Discipline,
} from '../types/calendar.types'
import { formatTimeHHmm } from '../utils/calendar-date.utils'
import type { CalendarEventItem } from './calendar-grid'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface BookingModalProps {
  event: CalendarEventItem | null
  onClose: () => void
  onBookGroup: (scheduleId: string) => Promise<void>
  onBookPt: (coachAvailabilityId: string, disciplineId: string) => Promise<void>
  onCancelBooking: (bookingId: string, reason?: string) => Promise<void>
  subscriptions: CalendarSubscription[]
  disciplines: Discipline[]
}

export const BookingModal: React.FC<BookingModalProps> = ({
  event,
  onClose,
  onBookGroup,
  onBookPt,
  onCancelBooking,
  subscriptions,
  disciplines,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedPtDisciplineId, setSelectedPtDisciplineId] = useState('')

  if (!event) return null

  // Extract common details based on event type
  let title = ''
  let startAt = ''
  let endAt = ''
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
    endAt = scheduleData.endAt
    coachName = scheduleData.coach?.fullName || 'Chưa phân công'
    roomName = scheduleData.room?.name || 'Phòng tập'
    disciplineName = scheduleData.discipline?.name || ''
  } else if (event.type === 'PT_SLOT') {
    ptData = event.data
    existingBooking = event.booking
    title = 'Khung giờ HLV cá nhân 1-1 (PT)'
    startAt = ptData.startAt
    endAt = ptData.endAt
    coachName = ptData.coach?.fullName || 'Huấn luyện viên'
    disciplineName = ptData.discipline?.name || ''
  } else if (event.type === 'BOOKING_STANDALONE') {
    existingBooking = event.data
    title =
      existingBooking.schedule?.class?.name ||
      existingBooking.discipline?.name ||
      (existingBooking.type === 'PERSONAL_TRAINING' ? 'Buổi tập PT 1-1' : 'Lớp học nhóm')
    startAt = existingBooking.startAt
    endAt = existingBooking.endAt
    coachName = existingBooking.coach?.fullName || ''
    roomName = existingBooking.room?.name || ''
    disciplineName = existingBooking.discipline?.name || ''
  }

  // Calculate cancellation window (>= 2 hours before start)
  const now = new Date()
  const startTime = new Date(startAt)
  const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  const isStarted = diffHours <= 0
  const isRefundable = diffHours >= 2

  // Selected discipline for PT booking (default to first matching active subscription or slot discipline)
  const defaultDisciplineId =
    ptData?.discipline?.id ||
    (ptData?.eligibleDisciplines && ptData.eligibleDisciplines.length > 0
      ? ptData.eligibleDisciplines[0]
      : subscriptions.find((s) => s.remainingPtSessions > 0)?.disciplineId ||
        disciplines[0]?.id ||
        '')

  // Handlers
  const handleConfirmBookGroup = async () => {
    if (!scheduleData) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await onBookGroup(scheduleData.id)
      onClose()
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'Không thể đặt lớp. Vui lòng kiểm tra lại hạn mức gói tập.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmBookPt = async () => {
    if (!ptData) return
    const disciplineId = selectedPtDisciplineId || defaultDisciplineId
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

  return (
    <aside
      aria-label="Chi tiết buổi tập"
      className="fixed right-5 top-24 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-200"
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
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
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
                {formatTimeHHmm(startAt)} - {formatTimeHHmm(endAt)}
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

          {/* PT Discipline Selector if booking PT */}
          {event.type === 'PT_SLOT' && !existingBooking && (
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-xs space-y-2">
              <label className="block font-bold text-purple-900">
                Chọn bộ môn đăng ký tập kèm PT:
              </label>
              <select
                value={selectedPtDisciplineId || defaultDisciplineId}
                onChange={(e) => setSelectedPtDisciplineId(e.target.value)}
                className="w-full p-2 bg-white border border-purple-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-purple-700 leading-relaxed flex items-start gap-1">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-600" />
                Mỗi hội viên được đặt tối đa 1 ca PT còn hiệu lực cho mỗi bộ môn trong một ngày.
              </p>
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
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <span className="font-bold">Hủy muộn (dưới 2 tiếng):</span> Buổi tập vẫn được giải
                  phóng cho hội viên khác, nhưng{' '}
                  <span className="font-bold underline">không được hoàn lại lượt tập</span>.
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
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSubmitting || isStarted}
                      onClick={handleConfirmCancel}
                      className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy lịch'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
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
                  className="w-full py-2 px-4 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
              className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
            >
              Đóng
            </button>

            {event.type === 'SCHEDULE' && scheduleData && (
              <button
                type="button"
                disabled={isSubmitting || scheduleData.currentEnrolled >= scheduleData.capacity}
                onClick={handleConfirmBookGroup}
                className={cn(
                  'py-2 px-5 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm',
                  scheduleData.currentEnrolled >= scheduleData.capacity
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-[#008b74] hover:bg-[#00735f] active:bg-[#005f4f]',
                )}
              >
                {isSubmitting
                  ? 'Đang đặt...'
                  : scheduleData.currentEnrolled >= scheduleData.capacity
                    ? 'Lớp đã đủ người'
                    : 'Xác nhận đặt lớp nhóm'}
              </button>
            )}

            {event.type === 'PT_SLOT' && ptData && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmBookPt}
                className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                {isSubmitting ? 'Đang đặt...' : 'Xác nhận đặt lịch PT'}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
