import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSession } from '../auth/session-context'
import { PageTitle, StateMessage } from '../components/Layout'
import { errorText, get, internalReturnTo, money, post, query } from '../lib/api'
import { createCheckout } from '../lib/checkout'
import { memberKeys } from '../lib/keys'
import type { Discipline, Plan, Tokens, User } from '../lib/types'

function AuthPage({ register }: { register: boolean }) {
  const { accept } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState('')
  const [fullName, setFullName] = useState(''),
    [phone, setPhone] = useState('')
  const mutation = useMutation({
    mutationFn: () =>
      post<{ user: User } & Tokens>(
        register ? '/auth/register' : '/auth/login',
        register ? { email, password, fullName, phone } : { email, password },
        undefined,
        true,
      ),
    onSuccess: (value) => {
      accept(value)
      navigate(internalReturnTo((location.state as { from?: string } | null)?.from), {
        replace: true,
      })
    },
  })
  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }
  return (
    <section className="auth-card">
      <p className="eyebrow">ACTIVEHUB MEMBER</p>
      <h1>{register ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h1>
      <p className="muted">
        {register
          ? 'Bắt đầu hành trình tập luyện của bạn.'
          : 'Đăng nhập để quản lý gói tập và lịch hẹn.'}
      </p>
      <form onSubmit={submit} className="form-stack">
        {register && (
          <>
            <label>
              Họ tên
              <input
                required
                maxLength={150}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
            <label>
              Số điện thoại
              <input
                required
                maxLength={20}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
          </>
        )}
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {mutation.error && (
          <p role="alert" className="text-error">
            {errorText(mutation.error)}
          </p>
        )}
        <button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? 'Đang xử lý…' : register ? 'Đăng ký' : 'Đăng nhập'}
        </button>
      </form>
      <p className="muted">
        {register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
        <Link to={register ? '/auth/login' : '/auth/register'} state={location.state}>
          {register ? 'Đăng nhập' : 'Đăng ký'}
        </Link>
      </p>
    </section>
  )
}
export function LoginPage() {
  return <AuthPage register={false} />
}
export function RegisterPage() {
  return <AuthPage register />
}
export function PlanCatalog({ member }: { member: boolean }) {
  const { user } = useSession()
  const navigate = useNavigate()
  const [disciplineId, setDisciplineId] = useState(''),
    [tier, setTier] = useState('')
  const [actionError, setActionError] = useState('')
  const disciplines = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => get<Discipline[]>('/disciplines', true),
  })
  const plans = useQuery({
    queryKey: memberKeys.catalog(disciplineId, tier),
    queryFn: () =>
      get<Plan[]>(`/memberships/plans${query({ disciplineId, packageTier: tier })}`, true),
  })
  const order = useMutation({
    mutationFn: (plan: Plan) =>
      createCheckout(user!.id, { kind: 'NEW_SUBSCRIPTION', planId: plan.id }),
    onSuccess: (value) => navigate(`/portal/member/checkouts/${value.checkoutId}`),
    onError: (error) => setActionError(errorText(error)),
  })
  function choose(plan: Plan) {
    if (!user || user.role !== 'MEMBER') {
      navigate('/auth/login', { state: { from: '/portal/member/plans' } })
      return
    }
    if (plan.packageTier === 'VIP') {
      navigate(`/portal/member/quotations?planId=${plan.id}`)
      return
    }
    setActionError('')
    order.mutate(plan)
  }
  return (
    <>
      <PageTitle eyebrow={member ? 'MEM-02 · DANH MỤC' : 'KHÁM PHÁ'} title="Chọn gói tập phù hợp" />
      <div className="toolbar">
        <label>
          Môn tập
          <select value={disciplineId} onChange={(event) => setDisciplineId(event.target.value)}>
            <option value="">Tất cả môn</option>
            {disciplines.data?.map((discipline) => (
              <option key={discipline.id} value={discipline.id}>
                {discipline.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Loại gói
          <select value={tier} onChange={(event) => setTier(event.target.value)}>
            <option value="">Tất cả gói</option>
            {['TRIAL', 'DROP_IN', 'PLUS', 'VIP'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <StateMessage
        loading={plans.isPending}
        error={plans.error}
        onRetry={() => void plans.refetch()}
        empty={plans.data?.length === 0}
      />
      {actionError && (
        <p role="alert" className="notice error">
          {actionError}
        </p>
      )}
      <div className="card-grid">
        {plans.data?.map((plan) => (
          <article className="card plan-card" key={plan.id}>
            <span className="pill">
              {plan.discipline?.name ?? 'Bộ môn'} · {plan.packageTier}
            </span>
            <h2>{plan.name}</h2>
            <p className="price">
              {money(plan.price)}
              {plan.packageTier === 'VIP' && <small> + phí PT theo HLV</small>}
            </p>
            <p className="muted">
              {plan.durationDays} ngày · {plan.groupSessionQuota ?? 0} buổi nhóm ·{' '}
              {plan.ptSessionQuota ?? 0} buổi PT
            </p>
            {plan.description && <p>{plan.description}</p>}
            <button type="button" disabled={order.isPending} onClick={() => choose(plan)}>
              {plan.packageTier === 'VIP' ? 'Chọn HLV & báo giá' : 'Tiếp tục mua gói'}
            </button>
          </article>
        ))}
      </div>
    </>
  )
}
export function PublicPlansPage() {
  return <PlanCatalog member={false} />
}
export function MockPaymentPage() {
  const [params] = useSearchParams()
  const [paymentId, setPaymentId] = useState((params.get('paymentId') ?? '').toUpperCase())
  const [details, setDetails] = useState<{
    planName: string
    amount: string
    status: string
    expiresAt: string
  } | null>(null)
  const [result, setResult] = useState('')
  const lookup = useMutation({
    mutationFn: () =>
      post<{ planName: string; amount: string; status: string; expiresAt: string }>(
        '/dev/mock-payments/lookup',
        { paymentId },
        undefined,
        true,
      ),
    onSuccess: setDetails,
  })
  const simulate = useMutation({
    mutationFn: (outcome: 'SUCCESS' | 'FAILURE') =>
      post<{ status: string }>(
        '/dev/mock-payments/simulate',
        { paymentId, outcome },
        undefined,
        true,
      ),
    onSuccess: (value) => {
      setResult(`Máy chủ ghi nhận: ${value.status}`)
      setDetails(null)
    },
  })
  if (!import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_PAYMENT !== 'true')
    return <div className="notice">Mock Payment chỉ có trong môi trường demo.</div>
  return (
    <section className="auth-card">
      <p className="eyebrow">DEMO PAYMENT</p>
      <h1>Thanh toán giả lập</h1>
      <p className="muted">Nhập mã payment ID trên trang checkout. Đây là giao dịch mô phỏng.</p>
      <label>
        Payment ID
        <input
          maxLength={16}
          value={paymentId}
          onChange={(event) => {
            setPaymentId(event.target.value.toUpperCase())
            setDetails(null)
          }}
        />
      </label>
      <button
        type="button"
        disabled={!/^[A-Z0-9]{16}$/.test(paymentId) || lookup.isPending}
        onClick={() => lookup.mutate()}
      >
        Tra cứu thanh toán
      </button>
      {lookup.error && (
        <p role="alert" className="text-error">
          {errorText(lookup.error)}
        </p>
      )}
      {details && (
        <div className="card">
          <h2>{details.planName}</h2>
          <p>
            {money(details.amount)} · {details.status}
          </p>
          <p>Hết hạn: {new Date(details.expiresAt).toLocaleString('vi-VN')}</p>
          <div className="button-row">
            <button
              type="button"
              disabled={simulate.isPending || details.status !== 'PENDING_PAYMENT'}
              onClick={() => simulate.mutate('SUCCESS')}
            >
              Thanh toán thành công
            </button>
            <button
              type="button"
              className="secondary"
              disabled={simulate.isPending || details.status !== 'PENDING_PAYMENT'}
              onClick={() => simulate.mutate('FAILURE')}
            >
              Thanh toán thất bại
            </button>
          </div>
        </div>
      )}
      {simulate.error && (
        <p role="alert" className="text-error">
          {errorText(simulate.error)}
        </p>
      )}
      {result && (
        <p role="status" className="notice success">
          {result}. Quay lại checkout để xem trạng thái từ máy chủ.
        </p>
      )}
    </section>
  )
}
