import React, { useState } from "react";
import { StaffOnDuty } from "../types/manager-dashboard.types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, Search, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnDutyStaffCardProps {
  staffList?: StaffOnDuty[];
}

const DEFAULT_STAFF_LIST: StaffOnDuty[] = [
  {
    id: "st-1",
    employeeCode: "EMP-0102",
    fullName: "Trần Văn Hoàng",
    role: "HEAD_COACH",
    roleLabel: "HLV Trưởng / Master PT",
    department: "Bộ phận Huấn Luyện",
    avatarUrl:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80",
    shift: "Ca 2 (14:00 - 22:00)",
    status: "ON_SHIFT",
    statusLabel: "Đang trong ca",
    ptSessionsToday: 5,
    phone: "0901 234 567",
  },
  {
    id: "st-2",
    employeeCode: "EMP-0108",
    fullName: "Nguyễn Quỳnh Anh",
    role: "PT_TRAINER",
    roleLabel: "HLV Pilates & Yoga",
    department: "Bộ phận Huấn Luyện",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    shift: "Ca 2 (14:00 - 22:00)",
    status: "ON_SHIFT",
    statusLabel: "Đang trong ca",
    ptSessionsToday: 4,
    phone: "0908 765 432",
  },
  {
    id: "st-3",
    employeeCode: "EMP-0115",
    fullName: "Lê Hoàng Nam",
    role: "PT_TRAINER",
    roleLabel: "HLV Boxing & Thể lực",
    department: "Bộ phận Huấn Luyện",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    shift: "Ca 1 (06:00 - 14:00)",
    status: "ON_SHIFT",
    statusLabel: "Đang trong ca",
    ptSessionsToday: 3,
    phone: "0912 345 678",
  },
  {
    id: "st-4",
    employeeCode: "EMP-0201",
    fullName: "Phạm Thu Trang",
    role: "RECEPTIONIST",
    roleLabel: "Trưởng ca Lễ tân",
    department: "Bộ phận Dịch Vụ Khách Hàng",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    shift: "Ca 2 (14:00 - 22:00)",
    status: "ON_SHIFT",
    statusLabel: "Đang trong ca",
    phone: "0987 112 233",
  },
  {
    id: "st-5",
    employeeCode: "EMP-0304",
    fullName: "Vũ Đình Trọng",
    role: "LIFEGUARD",
    roleLabel: "Cứu hộ Bể bơi 4 mùa",
    department: "Bộ phận An Toàn Bể Bơi",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    shift: "Ca 2 (14:00 - 22:00)",
    status: "ON_SHIFT",
    statusLabel: "Đang trong ca",
    phone: "0976 543 210",
  },
  {
    id: "st-6",
    employeeCode: "EMP-0120",
    fullName: "Đặng Bảo Ngọc",
    role: "PT_TRAINER",
    roleLabel: "HLV Phục Hồi Chức Năng",
    department: "Bộ phận Huấn Luyện",
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    shift: "Ca tối (18:00 - 22:00)",
    status: "UPCOMING",
    statusLabel: "Sắp vào ca",
    ptSessionsToday: 2,
    phone: "0934 567 890",
  },
];

export const OnDutyStaffCard: React.FC<OnDutyStaffCardProps> = ({
  staffList = DEFAULT_STAFF_LIST,
}) => {
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredStaff = staffList.filter((s) => {
    if (filterRole !== "ALL" && s.role !== filterRole) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.roleLabel.toLowerCase().includes(q) ||
        s.employeeCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const onShiftCount = staffList.filter((s) => s.status === "ON_SHIFT").length;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            Nhân Viên & Huấn Luyện Viên Trực Ca Hôm Nay
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Theo dõi điểm danh và phân bổ nhân sự vận hành thực tế
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{onShiftCount} / {staffList.length} nhân sự đang trực</span>
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "HEAD_COACH", label: "HLV Trưởng" },
            { id: "PT_TRAINER", label: "HLV Cá nhân (PT)" },
            { id: "RECEPTIONIST", label: "Lễ tân" },
            { id: "LIFEGUARD", label: "Cứu hộ" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterRole(tab.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all select-none",
                filterRole === tab.id
                  ? "bg-[#008b74] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc mã NV..."
            className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 pb-2 text-[11px] font-semibold text-slate-400 uppercase">
              <th className="pb-2.5 font-semibold">Nhân sự</th>
              <th className="pb-2.5 font-semibold">Chức danh / Bộ phận</th>
              <th className="pb-2.5 font-semibold">Ca làm việc</th>
              <th className="pb-2.5 font-semibold text-center">Ca PT phụ trách</th>
              <th className="pb-2.5 font-semibold text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredStaff.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                {/* Staff Name + Avatar */}
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={staff.avatarUrl}
                      alt={staff.fullName}
                      fallback={staff.fullName.substring(0, 2)}
                      size="sm"
                      className="border border-slate-200"
                    />
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">
                        {staff.fullName}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {staff.employeeCode}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="py-3 text-slate-600">
                  <p className="font-medium text-slate-800">{staff.roleLabel}</p>
                  <span className="text-[10px] text-slate-400">{staff.department}</span>
                </td>

                {/* Shift */}
                <td className="py-3 text-slate-600 font-medium">
                  {staff.shift}
                </td>

                {/* PT Sessions */}
                <td className="py-3 text-center">
                  {staff.ptSessionsToday !== undefined ? (
                    <span className="font-bold text-[#008b74] font-mono">
                      {staff.ptSessionsToday} ca
                    </span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>

                {/* Status */}
                <td className="py-3 text-center">
                  {staff.status === "ON_SHIFT" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {staff.statusLabel}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {staff.statusLabel}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
