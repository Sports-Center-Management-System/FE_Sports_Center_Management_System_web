import React, { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/auth/session-context'
import { StateMessage } from '@/components/feedback/state-message'
import { Button } from '@/components/ui/button'
import { get, money, query } from '@/lib/api'
import { vietnamDate } from '@/lib/date'
import { memberKeys } from '@/lib/keys'
import type { Checkout } from '@/lib/types'

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  FULFILLED: 'Đã hoàn tất',
  EXPIRED: 'Đã hết hạn',
  PAYMENT_REVIEW: 'Đang kiểm tra thanh toán',
  REFUND_PENDING: 'Đang hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
}

const kindLabels: Record<string, string> = {
  NEW_SUBSCRIPTION: 'Đăng ký gói mới',
  RENEWAL: 'Gia hạn gói',
}

const formatCheckoutId = (id: string) => {
  return `#${id.slice(0, 8).toUpperCase()}`
}

export const TransactionsPage: React.FC = () => {
  const { user } = useSession()
  const [status, setStatus] = useState('')
  const [cursor, setCursor] = useState('')

  const transactions = useQuery({
    queryKey: [...memberKeys.transactions(user!.id), status, cursor],
    queryFn: () =>
      get<{ items: Checkout[]; nextCursor: string | null }>(
        `/billing/checkouts${query({
          status,
          cursor,
          limit: 20,
        })}`,
      ),
  })

  return (
    <>

      <div className="toolbar">

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value)
            setCursor('')
          }}
        >
          <option value="">Tất cả</option>

          {[
            'PENDING_PAYMENT',
            'PAYMENT_FAILED',
            'FULFILLED',
            'EXPIRED',
            'PAYMENT_REVIEW',
            'REFUND_PENDING',
            'REFUNDED',
          ].map((value) => (
            <option key={value} value={value}>
              {statusLabels[value] ?? value}
            </option>
          ))}
        </select>
      </div>

      <StateMessage
        loading={transactions.isPending}
        error={transactions.error}
        onRetry={() => void transactions.refetch()}
        empty={transactions.data?.items.length === 0}
      />

      <div className="list">
        {transactions.data?.items.map((item) => (
          <Link
            key={item.checkoutId}
            className="list-row"
            to={`/portal/member/checkouts/${item.checkoutId}`}
          >
            <span>
              <strong>
                {String(item.priceSnapshot.planName ?? kindLabels[item.kind] ?? item.kind)}
              </strong>

              <small>
                {vietnamDate(item.createdAt)} · Mã GD {formatCheckoutId(item.checkoutId)}
              </small>

              <small>{kindLabels[item.kind] ?? item.kind}</small>
            </span>

            <span>
              <strong>{money(item.amount)}</strong>

              <small>{statusLabels[item.status] ?? item.status}</small>
            </span>
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        {cursor && (
          <Button variant="secondary" type="button" onClick={() => setCursor('')}>
            Trang đầu
          </Button>
        )}

        {transactions.data?.nextCursor && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => setCursor(transactions.data!.nextCursor!)}
          >
            Trang tiếp
          </Button>
        )}
      </div>
    </>
  )
}

export default TransactionsPage
