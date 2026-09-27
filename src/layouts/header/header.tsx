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
  title = "Tổng quan điều hành",
  userName = "Võ Thành Nam",
  userRoleLabel = "Giám Đốc Trung Tâm",
  userAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
  onSearchChange,
  notificationCount = 3,
}) => {
  return (
    <header className="flex h-20 w-full shrink-0 items-center justify-between border-b border-slate-100 bg-white px-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
      </div>

      {/* Right controls: Search + Notification + Executive Profile */}
      <div className="flex items-center gap-5">
        {/* Search Bar */}
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Tìm kiếm báo cáo, hóa đơn, nhân sự..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-[#f8fafc] py-2 pl-9 pr-4 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74] transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-[#f8fafc] text-slate-600 transition-all hover:bg-slate-100">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
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
            fallback="TN"
            size="md"
            className="border-2 border-emerald-100 shadow-sm"
          />
        </div>
      </div>
    </header>
  );
};
