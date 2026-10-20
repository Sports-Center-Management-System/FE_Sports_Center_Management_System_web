import React, { useState, useMemo } from 'react'
import {
  ArrowRight,
  Dumbbell,
  Sparkles,
  Users,
  UserCheck,
  Plus,
} from 'lucide-react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/auth/session-context'
import { StateMessage } from '@/components/feedback/state-message'
import { Card } from '@/components/ui/card'
import { get } from '@/lib/api'
import { memberKeys } from '@/lib/keys'
import type { Discipline, Subscription } from '@/lib/types'
import { SubscriptionCard } from '../components/subscription-card'
import { cn } from '@/lib/utils'

type FilterStatus = 'ALL' | 'ACTIVE' | 'EXPIRED'

export const SubscriptionsPage: React.FC = () => {
  const { user } = useSession()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')

  const subscriptions = useQuery({
    queryKey: memberKeys.subscriptions(user!.id),
    queryFn: () => get<Subscription[]>('/memberships/subscriptions'),
  })

  const disciplines = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => get<Discipline[]>('/disciplines', true),
  })

  const subsList = subscriptions.data || []

  // Metrics
  const activeSubs = useMemo(() => {
    return subsList.filter((s) => s.status === 'ACTIVE')
  }, [subsList])

  const expiredSubs = useMemo(() => {
    return subsList.filter((s) => s.status !== 'ACTIVE')
  }, [subsList])

  const totalRemainingGroup = useMemo(() => {
    return activeSubs.reduce((acc, s) => acc + (s.remainingGroupSessions || 0), 0)
  }, [activeSubs])

  const totalRemainingPt = useMemo(() => {
    return activeSubs.reduce((acc, s) => acc + (s.remainingPtSessions || 0), 0)
  }, [activeSubs])

  // Filtered subscriptions
  const filteredSubs = useMemo(() => {
    if (filterStatus === 'ACTIVE') return activeSubs
    if (filterStatus === 'EXPIRED') return expiredSubs
    return subsList
  }, [filterStatus, subsList, activeSubs, expiredSubs])

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#131b26] p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thẻ Hội Viên 3TC Fitness</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Gói tập của tôi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Theo dõi quyền lợi, số buổi tập khả dụng và hạn sử dụng các gói thẻ đã đăng ký tại trung tâm.
          </p>
        </div>

        {/* CTA to explore more packages */}
        <Link
          to="/portal/member/plans"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#008b74] hover:bg-[#007461] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Khám phá gói mới</span>
        </Link>
      </div>

      {/* 2. STATS RIBBON (KPIs) */}
      {subsList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Active Packages */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#131b26] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Gói đang sử dụng
              </span>
              <strong className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {activeSubs.length}{' '}
                <span className="text-xs font-normal text-slate-500">gói thẻ</span>
              </strong>
            </div>
          </div>

          {/* Remaining Group Sessions */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#131b26] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Số buổi lớp nhóm còn
              </span>
              <strong className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {totalRemainingGroup}{' '}
                <span className="text-xs font-normal text-slate-500">buổi tập</span>
              </strong>
            </div>
          </div>

          {/* Remaining PT Sessions */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#131b26] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Số buổi kèm PT 1:1 còn
              </span>
              <strong className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {totalRemainingPt}{' '}
                <span className="text-xs font-normal text-slate-500">buổi PT</span>
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. FILTER TABS */}
      {subsList.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-[#131b26] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50',
            )}
          >
            Tất cả ({subsList.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('ACTIVE')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              filterStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#131b26] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50',
            )}
          >
            Đang sử dụng ({activeSubs.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('EXPIRED')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              filterStatus === 'EXPIRED'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white dark:bg-[#131b26] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50',
            )}
          >
            Đã hết hạn ({expiredSubs.length})
          </button>
        </div>
      )}

      {/* 4. LOADING & ERROR STATES */}
      <StateMessage
        loading={subscriptions.isPending}
        error={subscriptions.error}
        onRetry={() => void subscriptions.refetch()}
      />

      {/* 5. EMPTY STATE: NO SUBSCRIPTIONS AT ALL */}
      {subscriptions.isSuccess && subsList.length === 0 && (
        <Card className="flex flex-col items-center rounded-3xl p-8 sm:p-14 text-center bg-white dark:bg-[#131b26] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#008b74]">
            <Dumbbell aria-hidden="true" className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Bạn chưa đăng ký gói tập nào
          </h2>
          <p className="mb-6 mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Khám phá ngay danh mục các gói tập Gym, Yoga, Boxing & Zumba tiêu chuẩn cao cấp để bắt đầu hành trình thể chất.
          </p>
          <Link
            to="/portal/member/plans"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008b74] hover:bg-[#007461] text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>Khám phá các gói tập</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>
      )}

      {/* 6. EMPTY FILTER STATE */}
      {subscriptions.isSuccess && subsList.length > 0 && filteredSubs.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-[#131b26] rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Không có gói tập nào trong mục này.
          </p>
        </div>
      )}

      {/* 7. SUBSCRIPTIONS GRID */}
      {filteredSubs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubs.map((item) => (
            <SubscriptionCard
              key={item.id}
              item={item}
              discipline={disciplines.data?.find((d) => d.id === item.disciplineId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SubscriptionsPage
