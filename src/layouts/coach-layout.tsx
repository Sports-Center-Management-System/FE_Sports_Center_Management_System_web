import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/auth-context';
import { apiOrigin, readTokens } from '@/lib/api';
import {
  CalendarCheck,
  Clock,
  Users,
  Dumbbell,
  ShieldAlert,
  UserCheck,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import logo3tc from '@/assets/images/logo-3tc.png';

const coachNavLinks = [
  { label: 'Lịch giảng dạy & Calendar', path: '/portal/coach/schedule', icon: CalendarCheck },
  { label: 'Khung giờ rảnh PT', path: '/portal/coach/availability', icon: Clock },
  { label: 'Học viên của tôi', path: '/portal/coach/members', icon: Users },
  { label: 'Giáo án bài tập', path: '/portal/coach/workout-plans', icon: Dumbbell },
  { label: 'Đơn hủy & Kỷ luật', path: '/portal/coach/requests', icon: ShieldAlert },
  { label: 'Hồ sơ cá nhân', path: '/portal/coach/profile', icon: UserCheck },
];

export const CoachLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const tokens = readTokens();
    if (!tokens?.accessToken) return;

    const socket = io(`${apiOrigin()}/realtime`, {
      transports: ['websocket', 'polling'],
      auth: { token: tokens.accessToken },
    });

    const invalidateSchedule = () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['coach', 'availability'] });
    };

    const invalidateRequests = () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'cancellation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['coach', 'penalties'] });
      queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] });
    };

    socket.on('cancellation.reviewed', invalidateRequests);
    socket.on('schedule.updated', invalidateSchedule);
    socket.on('attendance.updated', invalidateSchedule);
    socket.on('booking.updated', invalidateSchedule);
    socket.on('booking.created', invalidateSchedule);
    socket.on('booking.cancelled', invalidateSchedule);

    return () => {
      socket.off('cancellation.reviewed', invalidateRequests);
      socket.off('schedule.updated', invalidateSchedule);
      socket.off('attendance.updated', invalidateSchedule);
      socket.off('booking.updated', invalidateSchedule);
      socket.off('booking.created', invalidateSchedule);
      socket.off('booking.cancelled', invalidateSchedule);
      socket.disconnect();
    };
  }, [queryClient, user?.id]);

  const handleLogout = async () => {
    navigate('/auth/login', { replace: true });
    await logout();
  };

  return (
    <div
      className={cn(
        'h-full w-full overflow-hidden grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] md:grid-rows-1 bg-[#f8fafc] text-slate-800 transition-all duration-300 ease-in-out',
        isCollapsed ? 'md:grid-cols-[76px_minmax(0,1fr)]' : 'md:grid-cols-[260px_minmax(0,1fr)]'
      )}
    >
      {/* Mobile Top Header */}
      <details className="relative z-40 border-b border-slate-200 bg-white md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2">
            <img src={logo3tc} alt="3TC FITNESS" className="h-6 w-auto object-contain" />
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              COACH
            </span>
          </div>
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Menu aria-hidden="true" className="h-5 w-5" />
            Menu
          </span>
        </summary>
        <div className="absolute inset-x-0 top-full max-h-[75vh] overflow-y-auto border-b border-slate-200 bg-white p-4 shadow-xl">
          <nav aria-label="Điều hướng HLV" className="grid gap-1.5">
            {coachNavLinks.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  )
                }
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0) || 'C'
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleLogout()}
              className="w-full justify-center gap-2 border-slate-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              <span>Đăng xuất</span>
            </Button>
          </div>
        </div>
      </details>

      {/* Desktop Sidebar Navigation with Smooth Collapse & Expand */}
      <aside
        className={cn(
          'hidden h-full max-h-full overflow-hidden bg-white border-r border-slate-200/90 md:flex flex-col justify-between shadow-xs transition-all duration-300 ease-in-out shrink-0 select-none',
          isCollapsed ? 'p-2.5 pb-2 w-[70px]' : 'p-3 pb-2 w-[240px]'
        )}
      >
        <div className="flex flex-col min-h-0 space-y-1.5">
          {/* Header Row: 'Quản lý Huấn Luyện' and Collapse Toggle Arrow */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Quản lý Huấn Luyện
              </span>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Thu gọn menu"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                title="Mở rộng menu"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Nav List */}
          <nav className="space-y-0.5">
            {coachNavLinks.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                title={isCollapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center rounded-xl text-xs font-bold transition-all',
                    isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        'shrink-0 transition-colors',
                        isCollapsed ? 'h-4 w-4' : 'h-4 w-4',
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Card with Logout INSIDE the character border */}
        <div className="pt-2 border-t border-slate-200/90 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden shrink-0 ring-2 ring-emerald-500/20">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    user?.fullName?.charAt(0) || 'C'
                  )}
                </div>
                <div className="truncate min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {user?.fullName || 'HLV'}
                  </p>
                  <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded mt-0.5">
                    Huấn Luyện Viên
                  </span>
                </div>
              </div>

              {/* Logout Button directly inside character border */}
              <button
                type="button"
                onClick={() => void handleLogout()}
                title="Đăng xuất khỏi hệ thống"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-1">
              <div
                title={`${user?.fullName || 'HLV'} (Huấn Luyện Viên)`}
                className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden shrink-0 ring-2 ring-emerald-500/20"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0) || 'C'
                )}
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                title="Đăng xuất"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="h-full overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
};
