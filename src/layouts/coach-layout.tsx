import React, { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { useAuth } from '@/context/auth-context'
import { apiOrigin, readTokens } from '@/lib/api'
import {
  CalendarCheck,
  Clock,
  Users,
  Dumbbell,
  ShieldAlert,
  UserCheck,
  LogOut,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import gymFacility from '@/assets/images/plan-gym-facility.jpg'

const logoutButtonClassName =
  'w-full border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-none hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-500'

const coachNavLinks = [
  { label: 'Lịch giảng dạy & Huấn luyện', path: '/portal/coach/schedule', icon: CalendarCheck },
  { label: 'Khung giờ rảnh PT', path: '/portal/coach/availability', icon: Clock },
  { label: 'Học viên của tôi', path: '/portal/coach/members', icon: Users },
  { label: 'Giáo án bài tập', path: '/portal/coach/workout-plans', icon: Dumbbell },
  { label: 'Đơn hủy & Kỷ luật', path: '/portal/coach/requests', icon: ShieldAlert },
  { label: 'Hồ sơ cá nhân', path: '/portal/coach/profile', icon: UserCheck },
]

export const CoachLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const tokens = readTokens()
    if (!tokens?.accessToken) return

    const socket = io(`${apiOrigin()}/realtime`, {
      transports: ['websocket', 'polling'],
      auth: { token: tokens.accessToken },
    })

    const invalidateSchedule = () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] })
      queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] })
      queryClient.invalidateQueries({ queryKey: ['coach', 'availability'] })
    }

    const invalidateRequests = () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'cancellation-requests'] })
      queryClient.invalidateQueries({ queryKey: ['coach', 'penalties'] })
      queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] })
      queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] })
    }

    socket.on('cancellation.reviewed', invalidateRequests)
    socket.on('schedule.updated', invalidateSchedule)
    socket.on('attendance.updated', invalidateSchedule)
    socket.on('booking.updated', invalidateSchedule)
    socket.on('booking.created', invalidateSchedule)
    socket.on('booking.cancelled', invalidateSchedule)

    return () => {
      socket.off('cancellation.reviewed', invalidateRequests)
      socket.off('schedule.updated', invalidateSchedule)
      socket.off('attendance.updated', invalidateSchedule)
      socket.off('booking.updated', invalidateSchedule)
      socket.off('booking.created', invalidateSchedule)
      socket.off('booking.cancelled', invalidateSchedule)
      socket.disconnect()
    }
  }, [queryClient, user?.id])

  const handleLogout = async () => {
    navigate('/auth/login', { replace: true })
    await logout()
  }

  return (
    <div className="h-screen w-full overflow-hidden grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] md:grid-rows-1 md:grid-cols-[250px_minmax(0,1fr)] bg-[#f8fafc] text-slate-800">
      {/* Mobile Top Header */}
      <details className="relative z-40 border-b border-slate-200 bg-white md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
          <span>
            3TC <span className="text-[#008b74]">Fitness</span>
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <Menu aria-hidden="true" className="h-5 w-5" />
            Menu
          </span>
        </summary>
        <div className="absolute inset-x-0 top-full max-h-[70vh] overflow-y-auto border-b border-slate-200 bg-white p-4 shadow-lg">
          <nav aria-label="Điều hướng huấn luyện viên" className="grid gap-1">
            {coachNavLinks.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold',
                    isActive ? 'bg-emerald-50 text-[#008b74]' : 'text-slate-600 hover:bg-slate-50',
                  )
                }
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleLogout()}
            className={cn(logoutButtonClassName, 'mt-3')}
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </details>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden h-full max-h-screen overflow-hidden bg-white border-r border-slate-200/90 md:flex flex-col justify-between p-4 md:p-6 shadow-xs">
        <div className="flex flex-col min-h-0 flex-1 space-y-6">
          {/* Brand Logo & Portal Tag */}
          <NavLink
            className="shrink-0 flex items-center gap-2.5 font-bold text-lg text-slate-900 px-2"
            to="/portal/coach/schedule"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008b74] text-white font-black text-xs shadow-sm">
              3TC
            </div>
            <div>
              <span className="leading-none">
                3TC <span className="text-[#008b74]">Fitness</span>
              </span>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                COACH PORTAL
              </p>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1">
            {coachNavLinks.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-[#008b74] shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="shrink-0 pt-4 border-t border-slate-100 mt-auto space-y-3">
          <div className="px-2">
            <p className="text-md font-bold text-slate-900 truncate">
              {user?.fullName || 'Huấn luyện viên'}
            </p>
            <p className="text-[13px] text-slate-400 truncate">{user?.email}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleLogout()}
            className={logoutButtonClassName}
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="h-full min-h-0 overflow-y-auto p-4 sm:p-8 w-full min-w-0 relative isolate">
        <div
          className="inbody-backdrop"
          style={{ backgroundImage: `url("${gymFacility}")` }}
        />
        <div className="relative">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
