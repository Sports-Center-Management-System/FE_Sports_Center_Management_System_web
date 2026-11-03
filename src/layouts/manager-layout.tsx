import React, { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import {
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  UserCog,
  UsersRound,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { apiOrigin, readTokens } from '@/lib/api'
import { cn } from '@/lib/utils'
import { managerApi, managerKeys } from '@/features/manager/api/manager-api'

const navLinks = [
  { label: 'Tổng quan', path: '/portal/manager/dashboard', icon: LayoutDashboard },
  { label: 'Nhân sự', path: '/portal/manager/staff', icon: UserCog },
  { label: 'Ca trực lễ tân', path: '/portal/manager/staff-shifts', icon: CalendarClock },
  { label: 'HLV & biểu phí', path: '/portal/manager/coaches', icon: Dumbbell },
  { label: 'Duyệt hủy ca', path: '/portal/manager/penalties', icon: ClipboardCheck, badge: true },
  { label: 'Gói tập', path: '/portal/manager/plans', icon: Package },
  { label: 'Lớp & lịch', path: '/portal/manager/classes', icon: CalendarDays },
  { label: 'Cơ sở vật chất', path: '/portal/manager/facilities', icon: Building2 },
  { label: 'Hội viên', path: '/portal/manager/members', icon: UsersRound },
  { label: 'Báo cáo', path: '/portal/manager/reports', icon: BarChart3 },
]

function useCancellationRealtime() {
  const queryClient = useQueryClient()
  useEffect(() => {
    const token = readTokens()?.accessToken
    if (!token) return
    const socket = io(`${apiOrigin()}/realtime`, { path: '/socket.io', auth: { token } })
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: managerKeys.cancellations })
      void queryClient.invalidateQueries({ queryKey: managerKeys.summary })
    }
    socket.on('cancellation.requested', refresh)
    socket.on('cancellation.reviewed', refresh)
    socket.on('cancellation.cancelled', refresh)
    return () => {
      socket.disconnect()
    }
  }, [queryClient])
}

function NavItems({ pending, onNavigate }: { pending: number; onNavigate?: () => void }) {
  return (
    <>
      {navLinks.map(({ label, path, icon: Icon, badge }) => (
        <NavLink
          key={path}
          to={path}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm',
              isActive ? 'bg-emerald-50 font-medium text-[#007461]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )
          }
        >
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="flex-1">{label}</span>
          {badge && pending > 0 ? (
            <span className="rounded bg-rose-600 px-1.5 text-xs font-medium tabular-nums text-white">{pending}</span>
          ) : null}
        </NavLink>
      ))}
    </>
  )
}

export const ManagerLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  useCancellationRealtime()
  const summary = useQuery({ queryKey: managerKeys.summary, queryFn: managerApi.summary })
  const pending = summary.data?.pendingCancellations ?? 0

  const handleLogout = async () => {
    navigate('/auth/login', { replace: true })
    await logout()
  }

  const footer = (
    <div className="space-y-2 border-t border-slate-200 pt-3">
      <div className="px-1">
        <p className="truncate text-sm font-medium text-slate-900">{user?.fullName ?? 'Quản lý'}</p>
        <p className="truncate text-xs text-slate-500">{user?.email}</p>
      </div>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-700"
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
        Đăng xuất
      </button>
    </div>
  )

  return (
    <div className="grid h-screen w-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-slate-50 text-slate-800 md:grid-cols-[232px_minmax(0,1fr)] md:grid-rows-1">
      <details className="relative z-40 border-b border-slate-200 bg-white md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
          Quản lý trung tâm
          <Menu aria-label="Mở menu" className="h-5 w-5 text-slate-500" />
        </summary>
        <div className="absolute inset-x-0 top-full max-h-[75vh] overflow-y-auto border-b border-slate-200 bg-white p-3 shadow-lg">
          <nav aria-label="Điều hướng quản lý" className="grid gap-0.5">
            <NavItems
              pending={pending}
              onNavigate={() => document.querySelector('details[open]')?.removeAttribute('open')}
            />
          </nav>
          <div className="mt-3">{footer}</div>
        </div>
      </details>

      <aside className="hidden h-full flex-col border-r border-slate-200 bg-white p-3 md:flex">
        <NavLink to="/portal/manager/dashboard" className="mb-4 flex items-center gap-2 px-2 py-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#008b74] text-xs font-bold text-white">
            3TC
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-slate-900">3TC Fitness</span>
            <span className="block text-xs text-slate-500">Quản lý trung tâm</span>
          </span>
        </NavLink>
        <nav aria-label="Điều hướng quản lý" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          <NavItems pending={pending} />
        </nav>
        {footer}
      </aside>

      <main className="h-full min-h-0 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
