import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/auth/session-context'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  DoorOpen,
  Dumbbell,
  Flame,
  Music,
  Sparkles,
  Activity,
  Snowflake,
  UserCheck,
  Users,
  RefreshCw,
  Plus,
  Minus,
  CalendarRange,
  Maximize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { errorText, get, money, query } from '@/lib/api'
import { createCheckout } from '@/lib/checkout'
import { vietnamDate, vietnamDateTime } from '@/lib/date'
import { memberKeys } from '@/lib/keys'
import type { Discipline, Subscription } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getPlanImage } from '@/features/plans/components/plan-images'
import { SubscriptionDetailModal } from './subscription-detail-modal'
import {
  getSubscriptionBenefits,
  getSubscriptionExpiration,
  isActiveDropIn,
} from '../utils/subscription.utils'

export interface SubscriptionCardProps {
  item: Subscription
  discipline?: Discipline
}

function normalizeDiscipline(str?: string): 'gym' | 'boxing' | 'zumba' | 'yoga' | 'other' {
  if (!str) return 'other'
  const s = str.toLowerCase()
  if (s.includes('gym') || s.includes('fitness') || s.includes('thể hình')) return 'gym'
  if (s.includes('box') || s.includes('combat') || s.includes('kick') || s.includes('võ')) return 'boxing'
  if (s.includes('zumba') || s.includes('dance') || s.includes('nhảy') || s.includes('dancing')) return 'zumba'
  if (s.includes('yoga') || s.includes('thiền') || s.includes('meditation')) return 'yoga'
  return 'other'
}

function DisciplineIcon({ nameOrCode, className }: { nameOrCode?: string; className?: string }) {
  const norm = normalizeDiscipline(nameOrCode)
  if (norm === 'gym') return <Dumbbell className={className} />
  if (norm === 'boxing') return <Flame className={className} />
  if (norm === 'zumba') return <Music className={className} />
  if (norm === 'yoga') return <Sparkles className={className} />
  return <Activity className={className} />
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

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ item, discipline }) => {
  const { user } = useSession()
  const navigate = useNavigate()
  const cache = useQueryClient()
  const [sessions, setSessions] = useState(1)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const benefits = getSubscriptionBenefits(item)
  const expiration = getSubscriptionExpiration(item)

  const isVip = item.packageTier === 'VIP'
  const isPlus = item.packageTier === 'PLUS'
  const isActive = item.status === 'ACTIVE'
  const isExpired = item.status === 'EXPIRED'
  const isFrozen = item.status === 'FROZEN'

  const disciplineName = discipline?.name || item.plan?.discipline?.name || 'Bộ môn'
  const planImg = getPlanImage(
    disciplineName,
    item.packageTier,
    item.plan?.name,
    item.planId,
  )

  const daysRemaining = calculateDaysRemaining(expiration)

  const preview = useQuery({
    queryKey: ['member', user!.id, 'addon-preview', item.id, sessions],
    queryFn: () =>
      get<{ ratePerSession: string; amount: string }>(
        `/billing/subscriptions/${item.id}/pt-addon-preview${query({ sessions })}`,
      ),
    enabled: isActive && isVip && Boolean(item.assignedCoach),
    retry: false,
  })

  const checkout = useMutation({
    mutationFn: (kind: 'RENEWAL' | 'PT_ADDON') =>
      createCheckout(
        user!.id,
        kind === 'RENEWAL'
          ? { kind, subscriptionId: item.id }
          : { kind, subscriptionId: item.id, addonSessions: sessions },
      ),
    onSuccess: (order) => {
      void cache.invalidateQueries({ queryKey: memberKeys.transactions(user!.id) })
      navigate(`/portal/member/checkouts/${order.checkoutId}`)
    },
    onError: (error) => setActionError(errorText(error)),
  })

  return (
    <article
      className="group relative flex flex-col justify-between bg-white dark:bg-[#131b26] rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 select-none"
      aria-label={item.plan?.name ?? 'Gói tập'}
    >
      {/* 1. VISUAL COVER IMAGE HEADER */}
      <div
        onClick={() => setIsDetailOpen(true)}
        className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950 cursor-pointer group/img"
      >
        <img
          src={planImg}
          alt={item.plan?.name ?? 'Gói tập'}
          className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-500 filter brightness-95"
        />
        {/* Subtle Dark Gradient Veil */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />

        {/* Top Badges (Discipline + Tier on left, Status on right) */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {/* Left: Discipline & Tier Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-wide uppercase bg-black/60 text-white backdrop-blur-md border border-white/20">
              <DisciplineIcon nameOrCode={disciplineName} className="w-3.5 h-3.5 text-emerald-400" />
              <span>{disciplineName}</span>
            </span>

            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border backdrop-blur-md',
                isVip
                  ? 'bg-amber-500/80 text-white border-amber-400'
                  : isPlus
                  ? 'bg-emerald-600/80 text-white border-emerald-400'
                  : 'bg-slate-700/80 text-white border-slate-500',
              )}
            >
              {isVip ? 'VIP ĐẶC QUYỀN' : isPlus ? 'PLUS TOÀN DIỆN' : item.packageTier}
            </span>
          </div>

          {/* Right: Status Badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border backdrop-blur-md shrink-0',
              isActive
                ? 'bg-emerald-500/90 text-white border-emerald-400'
                : isFrozen
                ? 'bg-sky-500/90 text-white border-sky-400'
                : 'bg-slate-600/90 text-white border-slate-500',
            )}
          >
            {isActive ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Đang dùng
              </>
            ) : isFrozen ? (
              <>
                <Snowflake className="w-3 h-3" />
                Đóng băng
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                Hết hạn
              </>
            )}
          </span>
        </div>

        {/* Plan Name & Expiry Overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-md truncate">
            {item.plan?.name ?? 'Gói tập'}
          </h2>
          <div className="flex items-center gap-2 text-xs text-white/80 font-medium mt-0.5">
            <span className="font-semibold">{daysRemaining.text}</span>
            <span>•</span>
            <span>Hết hạn: {displayDate(expiration, isActiveDropIn(item))}</span>
          </div>
        </div>
      </div>

      {/* 2. CARD BODY */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        {/* Bento Chips: Quota Grid with Used vs Remaining stats */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          {/* Lớp nhóm */}
          <div className="text-center">
            <Users className="w-3.5 h-3.5 mx-auto text-cyan-600 dark:text-cyan-400 mb-0.5" />
            <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-bold uppercase tracking-wider">
              Lớp nhóm
            </span>
            <strong className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-mono font-bold block">
              {item.remainingGroupSessions ?? '—'}
              <span className="text-[10px] font-normal text-slate-400 ml-0.5">còn</span>
            </strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
              {item.plan?.groupSessionQuota != null && item.remainingGroupSessions != null
                ? `Đã dùng: ${Math.max(0, item.plan.groupSessionQuota - item.remainingGroupSessions)}`
                : item.plan?.groupSessionQuota
                ? `/ ${item.plan.groupSessionQuota} buổi`
                : 'buổi'}
            </span>
            {item.plan?.groupSessionQuota != null &&
              item.plan.groupSessionQuota > 0 &&
              item.remainingGroupSessions != null && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, (item.remainingGroupSessions / item.plan.groupSessionQuota) * 100),
                      )}%`,
                    }}
                  />
                </div>
              )}
          </div>

          {/* Kèm 1:1 */}
          <div className="text-center border-x border-slate-200/70 dark:border-slate-800">
            <UserCheck className="w-3.5 h-3.5 mx-auto text-amber-600 dark:text-amber-400 mb-0.5" />
            <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-bold uppercase tracking-wider">
              Kèm 1:1
            </span>
            <strong className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-mono font-bold block">
              {item.remainingPtSessions ?? '—'}
              <span className="text-[10px] font-normal text-slate-400 ml-0.5">còn</span>
            </strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
              {item.plan?.ptSessionQuota != null && item.remainingPtSessions != null
                ? `Đã dùng: ${Math.max(0, item.plan.ptSessionQuota - item.remainingPtSessions)}`
                : item.plan?.ptSessionQuota
                ? `/ ${item.plan.ptSessionQuota} buổi`
                : 'buổi PT'}
            </span>
            {item.plan?.ptSessionQuota != null &&
              item.plan.ptSessionQuota > 0 &&
              item.remainingPtSessions != null && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, (item.remainingPtSessions / item.plan.ptSessionQuota) * 100),
                      )}%`,
                    }}
                  />
                </div>
              )}
          </div>

          {/* Hạn dùng */}
          <div className="text-center">
            <Clock className="w-3.5 h-3.5 mx-auto text-emerald-600 dark:text-emerald-400 mb-0.5" />
            <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-bold uppercase tracking-wider">
              Hạn dùng
            </span>
            <strong className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-mono font-bold block mt-0.5 truncate">
              {daysRemaining.isExpired ? 'Hết hạn' : daysRemaining.text}
            </strong>
            <span className="text-[9.5px] text-slate-400 block truncate">
              {displayDate(expiration, isActiveDropIn(item))}
            </span>
          </div>
        </div>

        {/* Perks & Entitlements */}
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
          {benefits.unlimitedGym ? (
            <p className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
              <DoorOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ra vào phòng tập tự do không giới hạn</span>
            </p>
          ) : (
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#008b74] shrink-0" />
              <span>Tập luyện theo ca lớp học đã đặt</span>
            </p>
          )}

          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#008b74] shrink-0" />
            <span>Tủ đồ thông minh Smart Locker & Phòng Sauna</span>
          </p>

          {isVip && (
            <p className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Đặc quyền đặt lịch riêng cùng Huấn luyện viên</span>
            </p>
          )}
        </div>

        {/* HLV Phụ trách */}
        {item.assignedCoach && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                HLV phụ trách chính
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {item.assignedCoach.fullName}
              </p>
            </div>
          </div>
        )}

        {/* Date Details Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span>Bắt đầu:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
              {displayDate(item.startDate)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Hết hạn:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
              {displayDate(expiration, isActiveDropIn(item))}
            </span>
          </div>
        </div>

        {/* 3. CARD ACTION BUTTONS */}
        <div className="pt-2 space-y-2 mt-auto">
          {/* Quick Schedule Booking Shortcut (for Active members) */}
          {isActive && (
            <Button
              type="button"
              variant="mint"
              onClick={() => navigate('/portal/member/bookings')}
              className="w-full h-10 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 bg-[#008b74] hover:bg-[#007461] text-white shadow-2xs transition-all cursor-pointer"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Đặt lịch học ngay</span>
            </Button>
          )}

          {/* View Details Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDetailOpen(true)}
            className="w-full h-9 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Xem chi tiết các buổi đã dùng</span>
          </Button>

          {/* Renewal Button */}
          {!['TRIAL', 'DROP_IN'].includes(item.packageTier) && (
            <Button
              type="button"
              variant="secondary"
              disabled={checkout.isPending}
              onClick={() => checkout.mutate('RENEWAL')}
              className={cn(
                'w-full h-9 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 border transition-all cursor-pointer',
                isActive
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs',
              )}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', checkout.isPending && 'animate-spin')} />
              <span>{isExpired ? 'Gia hạn gói tập ngay' : 'Gia hạn trước hạn'}</span>
            </Button>
          )}

          {/* VIP PT Addon Stepper Box */}
          {isVip && isActive && (
            <div className="mt-3 p-3.5 rounded-2xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Mua thêm buổi PT 1:1
                </span>

                {/* Counter Stepper */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => setSessions((prev) => Math.max(1, prev - 1))}
                    disabled={sessions <= 1}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs tabular-nums text-slate-900 dark:text-slate-100">
                    {sessions}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSessions((prev) => Math.min(100, prev + 1))}
                    disabled={sessions >= 100}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {preview.data && (
                <div className="text-[11px] text-amber-900 dark:text-amber-300 font-medium flex items-center justify-between">
                  <span>Dự kiến ({money(preview.data.ratePerSession)}/buổi):</span>
                  <strong className="font-bold tabular-nums text-xs font-mono">
                    {money(preview.data.amount)}
                  </strong>
                </div>
              )}

              {preview.error && (
                <p className="text-[11px] text-rose-600 font-medium">{errorText(preview.error)}</p>
              )}

              <Button
                type="button"
                variant="mint"
                size="sm"
                disabled={checkout.isPending || !preview.data}
                onClick={() => checkout.mutate('PT_ADDON')}
                className="w-full h-8 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
              >
                Xác nhận mua {sessions} buổi PT
              </Button>
            </div>
          )}

          {actionError && (
            <p role="alert" className="text-xs font-medium text-rose-600 pt-1">
              {actionError}
            </p>
          )}
        </div>
      </div>

      {/* 4. FULL CINEMATIC DETAIL MODAL */}
      <SubscriptionDetailModal
        item={item}
        discipline={discipline}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onNavigateToBooking={() => {
          setIsDetailOpen(false)
          navigate('/portal/member/bookings')
        }}
        onRenew={() => checkout.mutate('RENEWAL')}
        isRenewing={checkout.isPending}
        ptSessions={sessions}
        onPtSessionsChange={setSessions}
        onBuyPtAddon={() => checkout.mutate('PT_ADDON')}
        isBuyingPtAddon={checkout.isPending}
        previewData={preview.data}
        previewError={preview.error}
      />
    </article>
  )
}
