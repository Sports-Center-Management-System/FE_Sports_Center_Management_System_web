import React from 'react'
import { ArrowRight, Dumbbell } from 'lucide-react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/auth/session-context'
import { StateMessage } from '@/components/feedback/state-message'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { get } from '@/lib/api'
import { memberKeys } from '@/lib/keys'
import type { Discipline, Subscription } from '@/lib/types'
import { SubscriptionCard } from '../components/subscription-card'

export const SubscriptionsPage: React.FC = () => {
  const { user } = useSession()
  const subscriptions = useQuery({
    queryKey: memberKeys.subscriptions(user!.id),
    queryFn: () => get<Subscription[]>('/memberships/subscriptions'),
  })
  const disciplines = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => get<Discipline[]>('/disciplines', true),
  })

  return (
    <>
      <StateMessage
        loading={subscriptions.isPending}
        error={subscriptions.error}
        onRetry={() => void subscriptions.refetch()}
      />
      {subscriptions.isSuccess && subscriptions.data.length === 0 && (
        <Card className="flex flex-col items-center rounded-3xl px-5 py-12 text-center sm:py-16">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#008b74]">
            <Dumbbell aria-hidden="true" className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Bạn chưa có gói tập</h2>
          <p className="mb-6 mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            Khám phá các gói phù hợp với mục tiêu luyện tập của bạn.
          </p>
          <Link to="/portal/member/plans" className={buttonVariants({ variant: 'mint' })}>
            Khám phá gói tập <ArrowRight aria-hidden="true" />
          </Link>
        </Card>
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {subscriptions.data?.map((item) => (
          <SubscriptionCard
            key={item.id}
            item={item}
            discipline={disciplines.data?.find((d) => d.id === item.disciplineId)}
          />
        ))}
      </div>
    </>
  )
}

export default SubscriptionsPage
