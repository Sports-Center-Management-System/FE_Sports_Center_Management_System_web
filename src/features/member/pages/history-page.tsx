import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CircleHelp,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react'
import { useSession } from '@/auth/session-context'
import { StateMessage } from '@/components/feedback/state-message'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { get } from '@/lib/api'
import { vietnamDateTime } from '@/lib/date'
import { memberKeys } from '@/lib/keys'
import type { Booking } from '@/lib/types'

const bookingStatusStyles: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: XCircle,
  },
  EXPIRED: {
    label: 'Đã hết hạn',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: Clock,
  },
  PENDING: {
    label: 'Chờ xác nhận',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: Clock,
  },
  ATTENDED: {
    label: 'Đã tham gia',
    className: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: CheckCircle2,
  },
  ABSENT: {
    label: 'Vắng mặt',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: XCircle,
  },
}

export const HistoryPage: React.FC = () => {
  const { user } = useSession()
  const bookings = useQuery({
    queryKey: memberKeys.history(user!.id),
    queryFn: () => get<Booking[]>('/bookings'),
  })

  return (
    <>
      <section aria-labelledby="booking-history-title">
        <Card className="rounded-3xl p-5 shadow-none sm:p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#008b74]">
              <CalendarDays aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 id="booking-history-title" className="text-lg font-bold text-slate-900">
              Đặt lịch
            </h2>
          </div>
          <StateMessage
            loading={bookings.isPending}
            error={bookings.error}
            empty={bookings.data?.length === 0}
            emptyText="Chưa có hoạt động tập luyện. Các buổi tập và lịch đặt của bạn sẽ xuất hiện ở đây."
          />
          {bookings.data && bookings.data.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {bookings.data.map((item) => {
                const isGroupClass = item.bookingType === 'GROUP_CLASS'
                const ActivityIcon = isGroupClass ? Users : UserRound
                const status = bookingStatusStyles[item.status] ?? {
                  label: item.status,
                  className: 'border-slate-200 bg-slate-50 text-slate-700',
                  icon: CircleHelp,
                }
                const StatusIcon = status.icon
                const startTime =
                  item.schedule?.startTime || item.coachAvailability?.startTime
                    ? (item.schedule?.startTime ?? item.coachAvailability!.startTime)
                    : item.bookedAt

                return (
                  <li key={item.id} className="flex min-w-0 gap-3 py-5 sm:gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                      <ActivityIcon aria-hidden="true" className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-4">
                        <h3 className="min-w-0 break-words text-base font-bold leading-relaxed text-slate-900">
                          {isGroupClass ? (item.schedule?.class?.name ?? 'Lớp nhóm') : 'Buổi PT'}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`max-w-full shrink-0 gap-1.5 border px-2.5 py-1 text-xs font-semibold tracking-normal ${status.className}`}
                        >
                          <StatusIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 break-words">{status.label}</span>
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
                        <Clock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <time dateTime={startTime}>
                          {vietnamDateTime(startTime).replace(' ', ' · ')}
                        </time>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </section>
    </>
  )
}

export default HistoryPage
