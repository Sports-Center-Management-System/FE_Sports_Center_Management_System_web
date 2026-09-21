import React from "react";
import { Search, Bell } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

export interface HeaderProps {
  title?: string;
  userName?: string;
  userRoleLabel?: string;
  userAvatar?: string;
  onSearchChange?: (val: string) => void;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Hội viên của tôi",
  userName = "Nguyễn Minh Khang",
  userRoleLabel = "Thành viên Premium",
  userAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
  onSearchChange,
  notificationCount = 1,
}) => {
  return (
    <header className="flex h-20 w-full items-center justify-between border-b border-slate-100 bg-white px-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
      </div>

      {/* Right controls: Search + Notification + User */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Tìm kiếm bài tập, huấn luyện viên..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-full border border-slate-200/80 bg-[#f8fafc] py-2.5 pl-11 pr-4 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008b74]/15 transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-[#f8fafc] text-slate-600 transition-all hover:bg-slate-100">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer pl-1">
          <div className="text-right">
            <p className="text-xs font-bold leading-tight text-slate-900">
              {userName}
            </p>
            <p className="text-[11px] font-semibold text-[#008b74]">
              {userRoleLabel}
            </p>
          </div>
          <Avatar
            src={userAvatar}
            alt={userName}
            fallback="NK"
            size="md"
            className="border-2 border-emerald-100 shadow-sm"
          />
        </div>
      </div>
    </header>
  );
};
