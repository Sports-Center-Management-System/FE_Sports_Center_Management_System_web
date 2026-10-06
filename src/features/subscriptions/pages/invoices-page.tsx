import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  CalendarDays,
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  Clock,
  CreditCard,
  ReceiptText,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { useSession } from '@/auth/session-context'
import { PageTitle } from '@/components/common/page-title'
import { StateMessage } from '@/components/feedback/state-message'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { get, money } from '@/lib/api'
import { vietnamDate } from '@/lib/date'
import { memberKeys } from '@/lib/keys'
import type { Invoice } from '@/lib/types'

const invoiceStatusStyles: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  PAID: {
    label: 'Đã thanh toán',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Chờ thanh toán',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: Clock,
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    className: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: RotateCcw,
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: XCircle,
  },
}

const invoiceTypeLabels: Record<string, string> = {
  SUBSCRIPTION_NEW: 'Đăng ký gói mới',
  DROP_IN: 'Gói tập theo buổi',
  PT_ADDON: 'Mua thêm buổi PT',
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  CARD: 'Thẻ',
  MOCK: 'Thanh toán thử nghiệm',
  FREE: 'Miễn phí',
}

export const InvoicesPage: React.FC = () => {
  const { user } = useSession()
  const invoices = useQuery({
    queryKey: memberKeys.invoices(user!.id),
    queryFn: () => get<Invoice[]>('/billing/invoices'),
  })

  return (
    <>
      <PageTitle title="Hóa đơn của tôi" />
      <p className="mb-6 text-sm leading-relaxed text-slate-500">
        Theo dõi hóa đơn và các khoản thanh toán của bạn.
      </p>
      <section aria-labelledby="invoice-list-title">
        <Card className="rounded-3xl p-5 shadow-none sm:p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#008b74]">
              <ReceiptText aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 id="invoice-list-title" className="text-lg font-bold text-slate-900">
              Danh sách hóa đơn
            </h2>
          </div>
          <StateMessage
            loading={invoices.isPending}
            error={invoices.error}
            onRetry={() => void invoices.refetch()}
            empty={invoices.data?.length === 0}
            emptyText="Bạn chưa có hóa đơn. Các hóa đơn của bạn sẽ xuất hiện ở đây khi được tạo."
          />
          {invoices.data && invoices.data.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {invoices.data.map((item) => {
                const status = invoiceStatusStyles[item.status] ?? {
                  label: item.status,
                  className: 'border-slate-200 bg-slate-50 text-slate-700',
                  icon: CircleHelp,
                }
                const StatusIcon = status.icon
                const checkoutPath =
                  item.status === 'PAID' && item.checkoutId
                    ? `/portal/member/checkouts/${encodeURIComponent(item.checkoutId)}`
                    : null
                const rowClassName = 'flex min-w-0 gap-3 py-5 sm:gap-4'

                const content = (
                  <>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                      <ReceiptText aria-hidden="true" className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-4">
                        <h3 className="min-w-0 max-w-full break-words text-base font-bold leading-relaxed text-slate-900">
                          {invoiceTypeLabels[item.type] ?? item.type}
                        </h3>
                        <div className="flex max-w-full flex-wrap items-center gap-2 sm:shrink-0 sm:flex-col sm:items-end">
                          <p className="break-words text-base font-bold tabular-nums text-slate-900">
                            {money(item.amount)}
                          </p>
                          <Badge
                            variant="outline"
                            className={`max-w-full gap-1.5 border px-2.5 py-1 text-xs font-semibold tracking-normal ${status.className}`}
                          >
                            <StatusIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0 break-words">{status.label}</span>
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-start gap-x-4 gap-y-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
                        <span className="flex items-start gap-1.5">
                          <CalendarDays
                            aria-hidden="true"
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          />
                          <time dateTime={item.createdAt}>{vietnamDate(item.createdAt)}</time>
                        </span>
                        <span className="flex min-w-0 items-start gap-1.5">
                          <CreditCard aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 break-words">
                            {paymentMethodLabels[item.paymentMethod] ?? item.paymentMethod}
                          </span>
                        </span>
                      </div>
                      <p className="mt-2 break-all text-[11px] leading-relaxed text-slate-400 sm:text-xs">
                        Mã hóa đơn: {item.invoiceCode}
                      </p>
                      {checkoutPath && (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#008b74]">
                          Xem trạng thái thanh toán
                          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </>
                )

                return (
                  <li key={item.id}>
                    {checkoutPath ? (
                      <Link
                        to={checkoutPath}
                        aria-label={`Xem trạng thái thanh toán của hóa đơn ${item.invoiceCode}`}
                        className={`${rowClassName} rounded-xl transition-colors hover:bg-emerald-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008b74]`}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={rowClassName}>{content}</div>
                    )}
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

export default InvoicesPage
