import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '@/context/auth-context'
import {
  Calendar,
  CreditCard,
  History,
  User,
  Activity,
  BookOpen,
  CheckCircle2,
  Package,
  Dumbbell,
  // KeyRound,
  FileText,
  LogOut,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const memberNavLinks = [
  { label: "Gói tập", path: "/portal/member/plans", icon: Package },
  { label: "Huấn luyện viên", path: "/portal/member/coaches", icon: Dumbbell },
  { label: "Lịch tuần", path: "/portal/member/bookings", icon: Calendar },
  { label: "Gói của tôi", path: "/portal/member/subscriptions", icon: CreditCard },
  { label: "Giao dịch", path: "/portal/member/transactions", icon: History },
  { label: "Hóa đơn", path: "/portal/member/invoices", icon: FileText },
  { label: "Lịch sử", path: "/portal/member/history", icon: CheckCircle2 },
  { label: "Hồ sơ", path: "/portal/member/profile", icon: User },
  { label: "InBody", path: "/portal/member/progress", icon: Activity },
  { label: "Giáo án", path: "/portal/member/workout-plans", icon: BookOpen },
  // { label: "Điểm danh", path: "/portal/member/attendances", icon: CheckCircle2 },
  // { label: "Tủ đồ", path: "/portal/member/lockers", icon: KeyRound },
];

export const MemberLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    navigate('/auth/login', { replace: true })
    await logout()
  }

  return (
    <div className="h-screen w-full overflow-hidden grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] md:grid-rows-1 md:grid-cols-[250px_minmax(0,1fr)] bg-[#f8fafc] text-slate-800">
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
          <nav aria-label="Điều hướng hội viên" className="grid gap-1">
            {memberNavLinks.map(({ label, path, icon: Icon }) => (
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
          <button type="button" onClick={() => void handleLogout()} className="mt-3 w-full text-xs">
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </details>
      {/* Sidebar Navigation */}
      <aside className="hidden h-full max-h-screen overflow-hidden bg-white border-r border-slate-200/90 md:flex flex-col justify-between p-4 md:p-6 shadow-xs">
        <div className="flex flex-col min-h-0 flex-1 space-y-6">
          {/* Brand Logo */}
          <NavLink
            className="shrink-0 flex items-center gap-2.5 font-bold text-lg text-slate-900 px-2"
            to="/portal/member/bookings"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008b74] text-white font-black text-xs shadow-sm">
              3TC
            </div>
            <div>
              <span className="leading-none">
                3TC <span className="text-[#008b74]">Fitness</span>
              </span>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                MEMBER PORTAL
              </p>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1">
            {memberNavLinks.map(({ label, path, icon: Icon }) => (
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
              {user?.fullName || 'Hội viên'}
            </p>
            <p className="text-[13px] text-slate-400 truncate">{user?.email}</p>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border 
            border-slate-200 text-xs font-bold text-white hover:bg-green hover:border-rose-200 
            transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 " />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="h-full min-h-0 overflow-y-auto p-4 sm:p-8 w-full min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
