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
  Snowflake,
  UserCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { errorText, get, money, query } from '@/lib/api'
import { createCheckout } from '@/lib/checkout'
import { vietnamDate, vietnamDateTime } from '@/lib/date'
import { memberKeys } from '@/lib/keys'
import type { Discipline, Subscription } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  getSubscriptionBenefits,
  getSubscriptionExpiration,
  isActiveDropIn,
} from '../utils/subscription.utils'

export interface SubscriptionCardProps {
  item: Subscription
  discipline?: Discipline
}

const statusStyles: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  ACTIVE: {
    label: 'Đang sử dụng',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: 'Hết hạn',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: Clock,
  },
  FROZEN: {
    label: 'Đang đóng băng',
    className: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: Snowflake,
  },
}

function SessionQuota({
  label,
  remaining,
  total,
  icon: Icon,
}: {
  label: string
  remaining: number | null
  total: number | null | undefined
  icon: typeof Users
}) {
  // Add-on sessions can exceed the plan quota; the API does not return a purchased total.
  const showTotal = total != null && total > 0 && remaining != null && remaining <= total
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
        <Icon aria-hidden="true" className="h-4 w-4 text-[#008b74]" />
        {label}
      </div>
      <p className="text-xl font-bold tabular-nums text-slate-900">
        {remaining ?? '—'}
        {showTotal && <span className="text-sm font-medium text-slate-500"> / {total}</span>}
        <span className="ml-1 text-xs font-medium text-slate-500">buổi</span>
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        {remaining == null ? 'Chưa có thông tin số buổi' : 'Số buổi còn lại'}
      </p>
      {showTotal && (
        <div
          role="progressbar"
          aria-label={`${label} còn lại`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={remaining}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"
        >
          <div
            className="h-full rounded-full bg-[#008b74]"
            style={{ width: `${Math.max(0, (remaining / total) * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function displayDate(value: string | null, includeTime = false): string {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'Chưa có thông tin'
  return includeTime ? vietnamDateTime(value) : vietnamDate(value)
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ item, discipline }) => {
  const { user } = useSession()
  const navigate = useNavigate()
  const cache = useQueryClient()
  const [sessions, setSessions] = useState(1)
  const [actionError, setActionError] = useState('')
  const benefits = getSubscriptionBenefits(item)
  const expiration = getSubscriptionExpiration(item)
  const status = statusStyles[item.status] ?? {
    label: item.status,
    className: 'border-slate-200 bg-slate-50 text-slate-600',
    icon: Clock,
  }
  const StatusIcon = status.icon

  const preview = useQuery({
    queryKey: ['member', user!.id, 'addon-preview', item.id, sessions],
    queryFn: () =>
      get<{ ratePerSession: string; amount: string }>(
        `/billing/subscriptions/${item.id}/pt-addon-preview${query({ sessions })}`,
      ),
    enabled: item.status === 'ACTIVE' && item.packageTier === 'VIP' && Boolean(item.assignedCoach),
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
    <article className="min-w-0" aria-label={item.plan?.name ?? 'Gói tập'}>
      <Card className="flex h-full flex-col overflow-hidden rounded-3xl p-5 sm:p-6">
        <div className="mb-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant={
                item.packageTier === 'VIP'
                  ? 'warning'
                  : item.packageTier === 'PLUS'
                    ? 'mint'
                    : 'outline'
              }
              className={cn(
                'border px-3 py-1 uppercase',
                ['TRIAL', 'DROP_IN'].includes(item.packageTier) &&
                  'border-slate-200 bg-slate-50 text-slate-600',
              )}
            >
              {item.packageTier === 'DROP_IN' ? 'DROP-IN' : item.packageTier}
            </Badge>
            <Badge
              variant="outline"
              className={cn('gap-1.5 border px-2.5 py-1', status.className)}
              title={item.status}
            >
              <StatusIcon aria-hidden="true" className="h-3.5 w-3.5" />
              {status.label}
            </Badge>
          </div>
          <h2 className="break-words text-xl font-bold leading-snug tracking-tight text-slate-900">
            {item.plan?.name ?? 'Gói tập'}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Dumbbell aria-hidden="true" className="h-4 w-4 shrink-0 text-[#008b74]" />
            {discipline?.name ?? item.plan?.discipline?.name ?? 'Bộ môn'}
          </p>
        </div>

        {(benefits.unlimitedGym || benefits.showGroup || benefits.showPt) && (
          <section
            aria-label="Quyền lợi và số buổi còn lại"
            className="space-y-3 border-t border-slate-100 py-5"
          >
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quyền lợi của bạn
            </h3>
            {benefits.unlimitedGym && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <DoorOpen aria-hidden="true" className="h-5 w-5 shrink-0 text-[#008b74]" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">Vào cửa miễn phí</p>
                  <p className="mt-0.5 text-xs text-emerald-800">
                    Ra vào phòng gym không giới hạn lượt
                  </p>
                </div>
              </div>
            )}
            <div
              className={cn(
                'grid gap-3',
                benefits.showGroup && benefits.showPt && 'sm:grid-cols-2',
              )}
            >
              {benefits.showGroup && (
                <SessionQuota
                  label="Lớp nhóm"
                  remaining={item.remainingGroupSessions}
                  total={item.plan?.groupSessionQuota}
                  icon={Users}
                />
              )}
              {benefits.showPt && (
                <SessionQuota
                  label="PT · Kèm 1:1"
                  remaining={item.remainingPtSessions}
                  total={item.plan?.ptSessionQuota}
                  icon={UserCheck}
                />
              )}
            </div>
          </section>
        )}

        <section aria-label="Thời hạn gói" className="border-t border-slate-100 py-5">
          <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            Thời hạn
          </h3>
          <dl className="space-y-2.5 text-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <dt className="text-slate-500">Bắt đầu</dt>
              <dd className="font-semibold tabular-nums text-slate-800">
                {displayDate(item.startDate)}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <dt className="text-slate-500">Hết hạn</dt>
              <dd className="font-semibold tabular-nums text-slate-800">
                {displayDate(expiration, isActiveDropIn(item))}
              </dd>
            </div>
          </dl>
        </section>

        {item.assignedCoach && (
          <div className="flex items-center gap-3 border-t border-slate-100 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <UserCheck aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">HLV phụ trách</p>
              <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">
                {item.assignedCoach.fullName}
              </p>
            </div>
          </div>
        )}
        <div className="mt-auto">
          {!['TRIAL', 'DROP_IN'].includes(item.packageTier) && (
            <Button
              type="button"
              variant="secondary"
              className="w-full border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              disabled={checkout.isPending}
              onClick={() => checkout.mutate('RENEWAL')}
            >
              Gia hạn
            </Button>
          )}
          {item.packageTier === 'VIP' && item.status === 'ACTIVE' && (
            <div className="addon mt-4 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold block mb-1">
                Mua thêm PT
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={sessions}
                  onChange={(event) =>
                    setSessions(Math.max(1, Math.min(100, Number(event.target.value) || 1)))
                  }
                  className="mt-1 block w-24 rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
                />
              </label>
              {preview.data && (
                <p className="text-xs text-slate-600 mt-1">
                  Dự kiến: {money(preview.data.amount)} ({money(preview.data.ratePerSession)}/buổi)
                </p>
              )}
              {preview.error && <p className="text-error text-xs">{errorText(preview.error)}</p>}
              <Button
                type="button"
                variant="mint"
                size="sm"
                className="mt-2"
                disabled={checkout.isPending || !preview.data}
                onClick={() => checkout.mutate('PT_ADDON')}
              >
                Mua thêm buổi PT
              </Button>
            </div>
          )}
          {actionError && (
            <p role="alert" className="text-error text-xs mt-2">
              {actionError}
            </p>
          )}
        </div>
      </Card>
    </article>
  )
}
