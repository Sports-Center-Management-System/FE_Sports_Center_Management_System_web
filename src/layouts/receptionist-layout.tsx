import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/auth-context'
import {
  BellRing,
  ScanLine,
  ReceiptText,
  CreditCard,
  UsersRound,
  Activity,
  LogOut,
  Menu,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getMyShifts } from '@/features/front-desk/services/front-desk-api.service'
import { MyShiftsModal } from '@/features/front-desk/components/my-shifts-modal'

import gymFacility from '@/assets/images/plan-gym-facility.jpg'

const logoutButtonClassName =
  'w-full border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-none hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-500'

const receptionistNavLinks = [
  { label: 'Bàn lễ tân', path: '/portal/desk', icon: BellRing, end: true },
  { label: 'Check-in cổng', path: '/portal/desk/gate-checkin', icon: ScanLine },
  { label: 'Bán vé & PT', path: '/portal/desk/pos', icon: ReceiptText },
  { label: 'Gia hạn & PT', path: '/portal/desk/subscriptions', icon: CreditCard },
  { label: 'Hội viên', path: '/portal/desk/members', icon: UsersRound },
  { label: 'InBody', path: '/portal/desk/inbody', icon: Activity },
]

export const ReceptionistLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showShiftsModal, setShowShiftsModal] = useState(false)

  const { data: myShifts = [] } = useQuery({
    queryKey: ['receptionist', 'my-shifts'],
    queryFn: getMyShifts,
    refetchInterval: 60000,
  })

  const now = new Date()
  const activeShift = myShifts.find((s) => {
    const start = new Date(s.startTime)
    const end = new Date(s.endTime)
    return now >= start && now <= end
  })

  const formatShortTime = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const handleLogout = async () => {
    navigate('/auth/login', { replace: true })
    await logout()
  }

  const roleLabel =
    user?.role === 'CENTER_MANAGER'
      ? 'Quản lý trung tâm'
      : user?.role === 'RECEPTIONIST'
        ? 'Lễ tân'
        : 'Nhân viên lễ tân'

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
          <nav aria-label="Điều hướng lễ tân" className="grid gap-1">
            {receptionistNavLinks.map(({ label, path, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
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
            to="/portal/desk"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008b74] text-white font-black text-xs shadow-sm">
              3TC
            </div>
            <div>
              <span className="leading-none">
                3TC <span className="text-[#008b74]">Fitness</span>
              </span>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                FRONT DESK PORTAL
              </p>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1">
            {receptionistNavLinks.map(({ label, path, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
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
          {/* Active Shift Indicator Badge */}
          <div className="px-2">
            {activeShift ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-2 text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold leading-tight">Đang trong ca trực</p>
                  <p className="text-[10px] text-emerald-600 font-medium truncate">
                    {formatShortTime(activeShift.startTime)} – {formatShortTime(activeShift.endTime)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-2 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                <p className="text-[11px] font-medium leading-tight">Ngoài ca trực</p>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowShiftsModal(true)}
            className="w-full text-xs font-semibold gap-2 border-emerald-200/80 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Lịch trực của tôi</span>
          </Button>

          <div className="px-2">
            <p className="text-md font-bold text-slate-900 truncate">
              {user?.fullName || 'Lễ tân'}
            </p>
            <p className="text-[13px] text-slate-400 truncate">
              {roleLabel} {user?.email ? `• ${user.email}` : ''}
            </p>
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

      <MyShiftsModal isOpen={showShiftsModal} onClose={() => setShowShiftsModal(false)} />
    </div>
  )
}
