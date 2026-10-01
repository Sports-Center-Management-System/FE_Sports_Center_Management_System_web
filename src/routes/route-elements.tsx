import { Navigate, useSearchParams, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { useSession } from '../auth/session-context'
import { isMonday, mondayInVietnam } from '../lib/date'
import { CalendarPage } from '../pages/CalendarPage'
export function MemberGuard({ children }: { children: ReactNode }) {
  const { state, user, verify } = useSession()
  const location = useLocation()
  if (state === 'loading') return <div className="notice">Đang kiểm tra phiên đăng nhập…</div>
  if (state === 'unavailable')
    return (
      <div className="notice error">
        Không thể kiểm tra phiên.{' '}
        <button type="button" onClick={() => void verify()}>
          Thử lại
        </button>
      </div>
    )
  if (state === 'anonymous')
    return (
      <Navigate to="/auth/login" replace state={{ from: location.pathname + location.search }} />
    )
  if (user?.role !== 'MEMBER') return <Navigate to="/forbidden" replace />
  return <>{children}</>
}
export function CalendarRoute() {
  const [params] = useSearchParams()
  const week = params.get('week')
  if (!isMonday(week)) {
    const next = new URLSearchParams(params)
    next.set('week', mondayInVietnam())
    return <Navigate to={`/portal/member/bookings?${next}`} replace />
  }
  return <CalendarPage week={week} />
}
export function CalendarAlias({ view }: { view: 'group' | 'pt' }) {
  const [params] = useSearchParams()
  const next = new URLSearchParams(params)
  if (!isMonday(next.get('week'))) next.set('week', mondayInVietnam())
  next.set('view', view)
  return <Navigate to={`/portal/member/bookings?${next}`} replace />
}
