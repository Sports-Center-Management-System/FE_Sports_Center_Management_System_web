import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { io } from 'socket.io-client'
import { useSession } from '../auth/session-context'
import { PageTitle, StateMessage } from '../components/Layout'
import { apiOrigin, errorText, get, money, post, query, readTokens } from '../lib/api'
import { clearRetryKey, createCheckout, retryKey } from '../lib/checkout'
import { vietnamDate } from '../lib/date'
import { memberKeys } from '../lib/keys'
import type {
  Checkout,
  CheckoutStatus,
  Coach,
  Discipline,
  Invoice,
  Plan,
  Quote,
  Subscription,
} from '../lib/types'
import { PlanCatalog } from './PublicPages'

export function PlansPage() {
  return <PlanCatalog member />
}
export function QuotePage() {
  const [params] = useSearchParams(),
    planId = params.get('planId') ?? ''
  const { user } = useSession(),
    navigate = useNavigate()
  const [coachId, setCoachId] = useState('')
  const plans = useQuery({
    queryKey: ['catalog', 'all'],
    queryFn: () => get<Plan[]>('/memberships/plans', true),
  })
  const plan = plans.data?.find((item) => item.id === planId)
  const coaches = useQuery({ queryKey: ['coaches'], queryFn: () => get<Coach[]>('/coaches') })
  const compatible =
    coaches.data?.filter((coach) =>
      coach.coachProfile?.coachSpecialties?.some(
        (entry) => entry.specialty.disciplineId === plan?.disciplineId,
      ),
    ) ?? []
  const quote = useQuery({
    queryKey: ['quote', planId, coachId],
    queryFn: () => get<Quote>(`/billing/quotations/vip${query({ planId, coachId })}`),
    enabled: Boolean(plan?.packageTier === 'VIP' && coachId),
  })
  const checkout = useMutation({
    mutationFn: () => createCheckout(user!.id, { kind: 'NEW_SUBSCRIPTION', planId, coachId }),
    onSuccess: (order) => {
      sessionStorage.setItem(
        `sportscenter.quote:${order.checkoutId}`,
        String(quote.data?.totalAmount ?? ''),
      )
      navigate(`/portal/member/checkouts/${order.checkoutId}`)
    },
  })
  return (
    <>
      <PageTitle eyebrow="MEM-03 · BÁO GIÁ" title="Báo giá VIP theo huấn luyện viên" />
      <StateMessage
        loading={plans.isPending || coaches.isPending}
        error={plans.error ?? coaches.error}
      />
      {plans.data && !plan && (
        <div className="notice error">
          Không tìm thấy gói đang bán. <Link to="/portal/member/plans">Xem catalog</Link>
        </div>
      )}
      {plan && plan.packageTier !== 'VIP' && (
        <div className="notice">
          Gói này dùng giá catalog. <Link to="/portal/member/plans">Quay lại</Link>
        </div>
      )}
      {plan?.packageTier === 'VIP' && (
        <div className="two-column">
          <article className="card">
            <span className="pill">{plan.discipline?.name} · VIP</span>
            <h2>{plan.name}</h2>
            <p>
              Giá gốc: <strong>{money(plan.price)}</strong>
            </p>
            <p>
              {plan.groupSessionQuota ?? 0} buổi nhóm + {plan.ptSessionQuota ?? 0} buổi PT ·{' '}
              {plan.durationDays} ngày
            </p>
            <label>
              Chọn HLV
              <select value={coachId} onChange={(event) => setCoachId(event.target.value)}>
                <option value="">Chọn HLV phù hợp</option>
                {compatible.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.fullName}
                  </option>
                ))}
              </select>
            </label>
            {compatible.length === 0 && <p className="muted">Chưa có HLV phù hợp với môn này.</p>}
          </article>
          <article className="card">
            <h2>Bảng giá dự kiến</h2>
            {!coachId ? (
              <p className="muted">Chọn HLV để máy chủ tính giá.</p>
            ) : (
              <>
                <StateMessage
                  loading={quote.isPending}
                  error={quote.error}
                  onRetry={() => void quote.refetch()}
                />
                {quote.data && (
                  <>
                    <p>Giá gốc: {money(quote.data.baseAmount)}</p>
                    <p>
                      {quote.data.ptSessions} PT × {money(quote.data.ratePerSession)}:{' '}
                      {money(quote.data.ptAmount)}
                    </p>
                    <p className="price">{money(quote.data.totalAmount)}</p>
                    <p className="muted">
                      Giá chỉ để tham khảo; checkout sẽ tính lại và khóa snapshot.
                    </p>
                    <button
                      type="button"
                      disabled={checkout.isPending || !quote.data.eligible}
                      onClick={() => checkout.mutate()}
                    >
                      Tạo checkout
                    </button>
                  </>
                )}
              </>
            )}
            {checkout.error && (
              <p role="alert" className="text-error">
                {errorText(checkout.error)}
              </p>
            )}
          </article>
        </div>
      )}
    </>
  )
}
function isPending(status: CheckoutStatus) {
  return status === 'PENDING_PAYMENT'
}
function needsPolling(status?: CheckoutStatus) {
  return status === 'PENDING_PAYMENT' || status === 'PAYMENT_REVIEW' || status === 'REFUND_PENDING'
}
export function CheckoutPage() {
  const { checkoutId = '' } = useParams(),
    { user } = useSession(),
    cache = useQueryClient()
  const lastStatus = useRef<CheckoutStatus | null>(null)
  const order = useQuery({
    queryKey: memberKeys.checkout(user!.id, checkoutId),
    queryFn: () => get<Checkout>(`/billing/checkouts/${checkoutId}`),
    refetchInterval: (queryState) => (needsPolling(queryState.state.data?.status) ? 5000 : false),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
  useEffect(() => {
    const token = readTokens()?.accessToken
    if (!token) return
    const socket = io(`${apiOrigin()}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    const invalidate = (event: { checkoutId?: string }) => {
      if (event.checkoutId === checkoutId)
        void cache.invalidateQueries({ queryKey: memberKeys.checkout(user!.id, checkoutId) })
    }
    socket.on('checkout.updated', invalidate)
    socket.on('connect', () => {
      void cache.invalidateQueries({ queryKey: memberKeys.checkout(user!.id, checkoutId) })
    })
    return () => {
      socket.off('checkout.updated', invalidate)
      socket.disconnect()
    }
  }, [checkoutId, user, cache])
  useEffect(() => {
    if (!order.data || lastStatus.current === order.data.status) return
    lastStatus.current = order.data.status
    if (order.data.status === 'FULFILLED') {
      void Promise.all([
        cache.invalidateQueries({ queryKey: memberKeys.subscriptions(user!.id) }),
        cache.invalidateQueries({ queryKey: memberKeys.invoices(user!.id) }),
        cache.invalidateQueries({ queryKey: memberKeys.transactions(user!.id) }),
        cache.invalidateQueries({ queryKey: ['member', user!.id, 'calendar'] }),
      ])
    }
  }, [order.data, cache, user])
  const retry = useMutation({
    mutationFn: () =>
      post<Checkout>(
        `/billing/checkouts/${checkoutId}/retry`,
        {},
        { 'Idempotency-Key': retryKey(checkoutId) },
      ),
    onSuccess: () => {
      clearRetryKey(checkoutId)
      void order.refetch()
    },
  })
  const reconcile = useMutation({
    mutationFn: () => post<Checkout>(`/billing/checkouts/${checkoutId}/reconcile`, {}),
    onSuccess: () => void order.refetch(),
  })
  const snapshot = order.data?.priceSnapshot
  const preview = sessionStorage.getItem(`sportscenter.quote:${checkoutId}`)
  const changed = Boolean(preview && order.data && Number(preview) !== Number(order.data.amount))
  const demoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_PAYMENT === 'true'
  const mockUrl =
    (import.meta.env.VITE_PUBLIC_WEB_URL || window.location.origin).replace(/\/$/, '') +
    '/mock-payment'
  return (
    <>
      <PageTitle eyebrow="MEM-04 · CHECKOUT" title="Trạng thái thanh toán" />
      <StateMessage
        loading={order.isPending}
        error={order.error}
        onRetry={() => void order.refetch()}
      />
      {order.data && (
        <div className="two-column">
          <article className="card">
            <p className="eyebrow">ĐƠN {order.data.checkoutId}</p>
            <h2>{String(snapshot?.planName ?? order.data.kind)}</h2>
            <p>
              <span className={`status status-${order.data.status.toLowerCase()}`}>
                {order.data.status}
              </span>
            </p>
            <p>
              Giá gốc: {money(order.data.baseAmount)} · PT: {money(order.data.ptAmount)}
            </p>
            <p className="price">{money(order.data.amount)}</p>
            {changed && (
              <p className="notice warning">
                Giá tại checkout khác báo giá xem trước. Hãy kiểm tra số tiền trước khi thanh toán.
              </p>
            )}
            <p className="muted">
              Snapshot từ máy chủ · hết hạn {vietnamDate(order.data.expiresAt)}
            </p>
            {order.data.failureReason && <p className="text-error">{order.data.failureReason}</p>}
            {order.data.status === 'FULFILLED' && (
              <p role="status" className="notice success">
                Thanh toán đã được máy chủ xác nhận. Gói tập và hóa đơn đã được cập nhật.
              </p>
            )}
            <div className="button-row">
              {order.data.status === 'PAYMENT_FAILED' && (
                <button type="button" disabled={retry.isPending} onClick={() => retry.mutate()}>
                  Thử thanh toán lại
                </button>
              )}
              {isPending(order.data.status) && (
                <button
                  type="button"
                  className="secondary"
                  disabled={reconcile.isPending}
                  onClick={() => reconcile.mutate()}
                >
                  Kiểm tra lại thanh toán
                </button>
              )}
            </div>
            {(retry.error || reconcile.error) && (
              <p role="alert" className="text-error">
                {errorText(retry.error ?? reconcile.error)}
              </p>
            )}
            {order.data.status === 'FULFILLED' && (
              <div className="button-row">
                <Link className="button" to="/portal/member/subscriptions">
                  Xem gói tập
                </Link>
                <Link className="button secondary" to="/portal/member/invoices">
                  Xem hóa đơn
                </Link>
              </div>
            )}
          </article>
          {isPending(order.data.status) && !demoEnabled && (
            <p className="notice warning">
              Kênh thanh toán demo chưa được bật trong môi trường này.
            </p>
          )}
          {isPending(order.data.status) && order.data.paymentId && demoEnabled && (
            <article className="card payment-card">
              <h2>Thanh toán demo</h2>
              <p>Quét mã QR để mở trang Mock Payment trên điện thoại, rồi nhập payment ID.</p>
              <div className="qr">
                <QRCodeSVG value={mockUrl} size={180} />
              </div>
              <p className="payment-id">{order.data.paymentId}</p>
              <p className="muted">QR chỉ chứa đường dẫn trang. Trình duyệt không gọi webhook.</p>
              <Link to="/mock-payment" target="_blank">
                Mở Mock Payment
              </Link>
            </article>
          )}
        </div>
      )}
    </>
  )
}
export function TransactionsPage() {
  const { user } = useSession()
  const [status, setStatus] = useState(''),
    [cursor, setCursor] = useState('')
  const transactions = useQuery({
    queryKey: [...memberKeys.transactions(user!.id), status, cursor],
    queryFn: () =>
      get<{ items: Checkout[]; nextCursor: string | null }>(
        `/billing/checkouts${query({ status, cursor, limit: 20 })}`,
      ),
  })
  return (
    <>
      <PageTitle eyebrow="MEM-05 · GIAO DỊCH" title="Lịch sử checkout" />
      <div className="toolbar">
        <label>
          Trạng thái
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
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
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
              <strong>{String(item.priceSnapshot.planName ?? item.kind)}</strong>
              <small>
                {vietnamDate(item.createdAt)} · {item.checkoutId}
              </small>
            </span>
            <span>
              {money(item.amount)}
              <small>{item.status}</small>
            </span>
          </Link>
        ))}
      </div>
      {cursor && (
        <button className="secondary" type="button" onClick={() => setCursor('')}>
          Trang đầu
        </button>
      )}
      {transactions.data?.nextCursor && (
        <button
          className="secondary"
          type="button"
          onClick={() => setCursor(transactions.data!.nextCursor!)}
        >
          Trang tiếp
        </button>
      )}
    </>
  )
}
function SubscriptionCard({ item, discipline }: { item: Subscription; discipline?: Discipline }) {
  const { user } = useSession(),
    navigate = useNavigate(),
    cache = useQueryClient()
  const [sessions, setSessions] = useState(1)
  const [actionError, setActionError] = useState('')
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
    <article className="card">
      <span className="pill">
        {discipline?.name ?? item.plan?.discipline?.name ?? 'Bộ môn'} · {item.packageTier}
      </span>
      <h2>{item.plan?.name}</h2>
      <p>
        <span className={`status status-${item.status.toLowerCase()}`}>{item.status}</span> ·{' '}
        {vietnamDate(item.startDate)} – {vietnamDate(item.endDate)}
      </p>
      <p>
        Nhóm: <strong>{item.remainingGroupSessions ?? 0}</strong> · PT:{' '}
        <strong>{item.remainingPtSessions ?? 0}</strong>
      </p>
      {item.assignedCoach && <p>HLV: {item.assignedCoach.fullName}</p>}
      <p className="mono muted">subscriptionId: {item.id}</p>
      <div className="button-row">
        {!['TRIAL', 'DROP_IN'].includes(item.packageTier) && (
          <button
            type="button"
            className="secondary"
            disabled={checkout.isPending}
            onClick={() => checkout.mutate('RENEWAL')}
          >
            Gia hạn
          </button>
        )}
      </div>
      {item.packageTier === 'VIP' && item.status === 'ACTIVE' && (
        <div className="addon">
          <label>
            Mua thêm PT
            <input
              type="number"
              min="1"
              max="100"
              value={sessions}
              onChange={(event) =>
                setSessions(Math.max(1, Math.min(100, Number(event.target.value) || 1)))
              }
            />
          </label>
          {preview.data && (
            <p>
              Dự kiến: {money(preview.data.amount)} ({money(preview.data.ratePerSession)}/buổi)
            </p>
          )}
          {preview.error && <p className="text-error">{errorText(preview.error)}</p>}
          <button
            type="button"
            disabled={checkout.isPending || !preview.data}
            onClick={() => checkout.mutate('PT_ADDON')}
          >
            Tạo checkout add-on
          </button>
        </div>
      )}
      {actionError && (
        <p role="alert" className="text-error">
          {actionError}
        </p>
      )}
    </article>
  )
}
export function SubscriptionsPage() {
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
      <PageTitle eyebrow="MEM-06 · QUYỀN LỢI" title="Gói tập của tôi" />
      <p className="muted intro">
        Mỗi gói có quota riêng theo subscriptionId. Không cộng lượt giữa các môn.
      </p>
      <StateMessage
        loading={subscriptions.isPending}
        error={subscriptions.error}
        onRetry={() => void subscriptions.refetch()}
        empty={subscriptions.data?.length === 0}
      />
      <div className="card-grid">
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
export function InvoicesPage() {
  const { user } = useSession()
  const invoices = useQuery({
    queryKey: memberKeys.invoices(user!.id),
    queryFn: () => get<Invoice[]>('/billing/invoices'),
  })
  return (
    <>
      <PageTitle eyebrow="MEM-07 · HÓA ĐƠN" title="Hóa đơn của tôi" />
      <p className="muted intro">Danh sách hiện giới hạn 200 hóa đơn gần nhất theo API.</p>
      <StateMessage
        loading={invoices.isPending}
        error={invoices.error}
        onRetry={() => void invoices.refetch()}
        empty={invoices.data?.length === 0}
      />
      <div className="list">
        {invoices.data?.map((item) => (
          <article className="list-row" key={item.id}>
            <span>
              <strong>{item.invoiceCode}</strong>
              <small>
                {vietnamDate(item.createdAt)} · subscriptionId: {item.subscriptionId}
              </small>
            </span>
            <span>
              <strong>{money(item.amount)}</strong>
              <small>
                {item.status} · {item.type} · {item.paymentMethod}
              </small>
            </span>
          </article>
        ))}
      </div>
    </>
  )
}
