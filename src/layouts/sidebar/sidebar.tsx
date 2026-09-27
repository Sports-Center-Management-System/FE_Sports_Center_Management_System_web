import React from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Receipt,
  Lock,
  Users,
} from "lucide-react";
import { AICoachCard } from "./ai-coach-card";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  isActive?: boolean;
}

export interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = "shifts",
  onTabChange,
  className,
}) => {
  const navItems: NavItem[] = [
    { id: "overview", label: "Tổng quan điều hành", icon: LayoutDashboard },
    { id: "shifts", label: "Phân ca trực Lễ tân", icon: CalendarCheck },
    { id: "invoices", label: "Doanh thu & Hóa đơn", icon: Receipt },
    { id: "lockers", label: "Tủ đồ & Check-in", icon: Lock },
    { id: "members", label: "Quản lý hội viên", icon: Users },
  ];

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col justify-between border-r border-slate-100 bg-white shadow-[1px_0_4px_rgba(0,0,0,0.02)] shrink-0 overflow-y-auto select-none",
        className
      )}
    >
      {/* Brand Header & Navigation List */}
      <div className="flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#008b74] text-white shadow-md shadow-[#008b74]/20 shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight text-[#008b74]">
              Dao mẻ WDP
            </h1>
            <p className="text-[9px] font-bold tracking-wider text-slate-400">
              SPORTS & WELLNESS
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                className={cn(
                  "flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 text-left",
                  isActive
                    ? "bg-[#e6f7f2] text-[#008b74] font-bold shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-[#008b74]" : "text-slate-400"
                  )}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Executive Assistant Widget */}
      <div className="pt-6 pb-2 shrink-0">
        <AICoachCard />
      </div>
    </aside>
  );
};
