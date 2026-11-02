import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/auth/session-context'
import {
  X,
  CheckCircle2,
  Sparkles,
  Clock,
  Users,
  UserCheck,
  CalendarDays,
  DoorOpen,
  Dumbbell,
  XCircle,
  CircleHelp,
  RefreshCw,
  CalendarRange,
  Plus,
  Minus,
  Activity,
  Award,
} from 'lucide-react'
import { get, money, errorText } from '@/lib/api'
import { vietnamDate, vietnamDateTime } from '@/lib/date'
import { memberKeys } from '@/lib/keys'
import type { Booking, Discipline, Subscription } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  getSubscriptionBenefits,
  getSubscriptionExpiration,
  isActiveDropIn,
} from '../utils/subscription.utils'
import { Button } from '@/components/ui/button'

export interface SubscriptionDetailModalProps {
  item: Subscription | null
  discipline?: Discipline
  isOpen: boolean
  onClose: () => void
  onNavigateToBooking: () => void
  onRenew: () => void
  isRenewing?: boolean
  ptSessions: number
  onPtSessionsChange: (val: number) => void
  onBuyPtAddon: () => void
  isBuyingPtAddon?: boolean
  previewData?: { ratePerSession: string; amount: string } | null
  previewError?: unknown
}

const bookingStatusStyles: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    icon: XCircle,
  },
  EXPIRED: {
    label: 'Đã hết hạn',
    className: 'border-slate-200 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    icon: Clock,
  },
  PENDING: {
    label: 'Chờ xác nhận',
    className: 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    icon: Clock,
  },
  ATTENDED: {
    label: 'Đã tham gia',
    className: 'border-sky-200 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    icon: CheckCircle2,
  },
  ABSENT: {
    label: 'Vắng mặt',
    className: 'border-slate-200 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    icon: XCircle,
  },
}

function displayDate(value: string | null, includeTime = false): string {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'Chưa có thông tin'
  return includeTime ? vietnamDateTime(value) : vietnamDate(value)
}

function calculateDaysRemaining(endDateStr: string | null): { text: string; isExpired: boolean } {
  if (!endDateStr) return { text: '—', isExpired: false }
  const end = new Date(endDateStr).getTime()
  const now = new Date().getTime()
  if (!Number.isFinite(end)) return { text: '—', isExpired: false }
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return { text: 'Đã hết hạn', isExpired: true }
  return { text: `Còn ${diffDays} ngày`, isExpired: false }
}

export const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
  item,
  discipline,
  isOpen,
  onClose,
  onNavigateToBooking,
  onRenew,
  isRenewing = false,
  ptSessions,
  onPtSessionsChange,
  onBuyPtAddon,
  isBuyingPtAddon = false,
  previewData,
  previewError,
}) => {
  const { user } = useSession()

  // Fetch all bookings of the user to see what they have used with this subscription
  const bookingsQuery = useQuery({
    queryKey: memberKeys.history(user?.id || ''),
    queryFn: () => get<Booking[]>('/bookings'),
    enabled: isOpen && Boolean(user?.id),
  })

  // Lock body scroll and listen for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !item) return null

  const isVip = item.packageTier === 'VIP'
  const isPlus = item.packageTier === 'PLUS'
  const isActive = item.status === 'ACTIVE'
  const isFrozen = item.status === 'FROZEN'
  const isExpired = item.status === 'EXPIRED'

  const disciplineName = discipline?.name || item.plan?.discipline?.name || 'Bộ môn'
  const expiration = getSubscriptionExpiration(item)
  const benefits = getSubscriptionBenefits(item)
  const daysRemaining = calculateDaysRemaining(expiration)

  // Filter sessions that this member booked/used under this subscription
  const usedSessionsList = (bookingsQuery.data || []).filter(
    (b) => b.subscriptionId === item.id,
  )

  // Calculate used counts
  const totalGroup = item.plan?.groupSessionQuota ?? 0
  const remainingGroup = item.remainingGroupSessions ?? 0
  const usedGroup =
    totalGroup > 0
      ? Math.max(0, totalGroup - remainingGroup)
      : usedSessionsList.filter((b) => b.bookingType === 'GROUP_CLASS').length

  const totalPt = item.plan?.ptSessionQuota ?? 0
  const remainingPt = item.remainingPtSessions ?? 0
  const usedPt =
    totalPt > 0
      ? Math.max(0, totalPt - remainingPt)
      : usedSessionsList.filter((b) => b.bookingType === 'PERSONAL_TRAINING').length

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none font-sans"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-[#131b26] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>{disciplineName}</span>
              </span>

              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase border',
                  isVip
                    ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    : isPlus
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                )}
              >
                {isVip ? 'VIP ĐẶC QUYỀN' : isPlus ? 'PLUS TOÀN DIỆN' : item.packageTier}
              </span>

              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border',
                  isActive
                    ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : isFrozen
                    ? 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
                    : 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
                )}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Đang sử dụng
                  </>
                ) : isFrozen ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    Đang đóng băng
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Đã hết hạn
                  </>
                )}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {item.plan?.name ?? 'Gói tập'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Mã thẻ hội viên: <span className="font-mono font-semibold">{item.id}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. THỐNG KÊ CHI TIẾT SỐ BUỔI ĐÃ DÙNG VÀ CÒN LẠI */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#008b74]" />
              <span>Tiến độ sử dụng quyền lợi gói</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lớp nhóm */}
              {benefits.showGroup && (
                <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-cyan-950 dark:text-cyan-200">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      Lớp học nhóm
                    </span>
                    <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
                      Còn {remainingGroup} buổi
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Đã sử dụng
                      </span>
                      <strong className="text-2xl font-bold font-mono text-cyan-900 dark:text-cyan-100">
                        {usedGroup}
                        {totalGroup > 0 && (
                          <span className="text-sm font-medium text-slate-500"> / {totalGroup}</span>
                        )}
                        <span className="text-xs font-medium text-slate-500 ml-1">buổi</span>
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Còn lại
                      </span>
                      <strong className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                        {remainingGroup} buổi
                      </strong>
                    </div>
                  </div>

                  {totalGroup > 0 && (
                    <div className="h-2 rounded-full bg-cyan-100 dark:bg-cyan-900/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-600 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, (usedGroup / totalGroup) * 100))}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* PT 1:1 */}
              {benefits.showPt && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-950 dark:text-amber-200">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Kèm HLV PT 1:1
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      Còn {remainingPt} buổi
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Đã sử dụng
                      </span>
                      <strong className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-100">
                        {usedPt}
                        {totalPt > 0 && (
                          <span className="text-sm font-medium text-slate-500"> / {totalPt}</span>
                        )}
                        <span className="text-xs font-medium text-slate-500 ml-1">buổi</span>
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Còn lại
                      </span>
                      <strong className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                        {remainingPt} buổi
                      </strong>
                    </div>
                  </div>

                  {totalPt > 0 && (
                    <div className="h-2 rounded-full bg-amber-100 dark:bg-amber-900/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-600 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, (usedPt / totalPt) * 100))}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vào cửa tự do */}
            {benefits.unlimitedGym && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <DoorOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    Vào cửa phòng tập không giới hạn
                  </p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Hội viên được check-in tự do tất cả các khung giờ mở cửa trong suốt thời hạn gói.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* 2. LỊCH SỬ CÁC BUỔI TẬP ĐÃ DÙNG TỪ GÓI NÀY */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Các buổi tập đã dùng từ gói này ({usedSessionsList.length})</span>
              </h3>
            </div>

            {bookingsQuery.isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
                Đang tải danh sách các buổi tập đã dùng...
              </div>
            ) : usedSessionsList.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/40">
                {usedSessionsList.map((booking) => {
                  const status = bookingStatusStyles[booking.status] ?? {
                    label: booking.status,
                    className: 'border-slate-200 bg-slate-50 text-slate-700',
                    icon: CircleHelp,
                  }
                  const StatusIcon = status.icon
                  const sessionTime =
                    booking.schedule?.startTime || booking.coachAvailability?.startTime
                      ? booking.schedule?.startTime ?? booking.coachAvailability!.startTime
                      : booking.bookedAt

                  const title =
                    booking.schedule?.class?.name ||
                    (booking.bookingType === 'PERSONAL_TRAINING'
                      ? 'Buổi tập kèm PT 1:1'
                      : 'Lớp học nhóm')

                  const coachName = booking.coachAvailability?.coach?.fullName

                  return (
                    <div
                      key={booking.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                            booking.bookingType === 'PERSONAL_TRAINING'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
                          )}
                        >
                          {booking.bookingType === 'PERSONAL_TRAINING' ? (
                            <UserCheck className="w-4 h-4" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="tabular-nums">{vietnamDateTime(sessionTime)}</span>
                            {coachName && (
                              <>
                                <span>•</span>
                                <span className="truncate">HLV: {coachName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border shrink-0',
                          status.className,
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{status.label}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Chưa có buổi tập nào được dùng từ gói này. Số buổi của bạn vẫn còn nguyên vẹn.
              </div>
            )}
          </section>

          {/* 3. THÔNG TIN THỜI HẠN & HLV PHỤ TRÁCH */}
          <section className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-1">
              <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
              <span>Thời hạn sử dụng gói thẻ</span>
            </h4>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Ngày bắt đầu kích hoạt:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {displayDate(item.startDate)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Ngày hết hạn gói:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {displayDate(expiration, isActiveDropIn(item))}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span>Tình trạng thời gian:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {daysRemaining.text}
              </span>
            </div>

            {item.assignedCoach && (
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span>Huấn luyện viên phụ trách:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  {item.assignedCoach.fullName}
                </span>
              </div>
            )}
          </section>
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5 shrink-0">
          {/* Booking shortcut */}
          {isActive && (
            <Button
              type="button"
              variant="mint"
              onClick={onNavigateToBooking}
              className="w-full h-10 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 bg-[#008b74] hover:bg-[#007461] text-white shadow-xs cursor-pointer"
            >
              <CalendarRange className="w-4 h-4" />
              <span>Đặt lịch học bằng gói này ngay</span>
            </Button>
          )}

          {/* Renewal */}
          {!['TRIAL', 'DROP_IN'].includes(item.packageTier) && (
            <Button
              type="button"
              variant="secondary"
              disabled={isRenewing}
              onClick={onRenew}
              className={cn(
                'w-full h-9 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 border transition-all cursor-pointer',
                isActive
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
              )}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRenewing && 'animate-spin')} />
              <span>{isExpired ? 'Gia hạn gói tập ngay' : 'Gia hạn trước hạn'}</span>
            </Button>
          )}

          {/* VIP PT Addon Stepper */}
          {isVip && isActive && (
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Mua thêm buổi PT 1:1
                </span>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => onPtSessionsChange(Math.max(1, ptSessions - 1))}
                    disabled={ptSessions <= 1}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs tabular-nums text-slate-900 dark:text-slate-100">
                    {ptSessions}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPtSessionsChange(Math.min(100, ptSessions + 1))}
                    disabled={ptSessions >= 100}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {previewData && (
                <div className="text-[11px] text-amber-900 dark:text-amber-300 font-medium flex items-center justify-between">
                  <span>Dự kiến ({money(previewData.ratePerSession)}/buổi):</span>
                  <strong className="font-bold tabular-nums text-xs font-mono">
                    {money(previewData.amount)}
                  </strong>
                </div>
              )}

              {Boolean(previewError) && (
                <p className="text-[11px] text-rose-600 font-medium">{errorText(previewError)}</p>
              )}

              <Button
                type="button"
                variant="mint"
                size="sm"
                disabled={isBuyingPtAddon || !previewData}
                onClick={onBuyPtAddon}
                className="w-full h-8 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors"
              >
                Xác nhận mua {ptSessions} buổi PT
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
