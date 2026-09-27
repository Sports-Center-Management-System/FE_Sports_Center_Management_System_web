import React, { useState, useMemo } from "react";
import {
  Lock,
  Unlock,
  Wrench,
  Search,
  Filter,
  Users,
  Shield,
  Clock,
  Sparkles,
  ArrowRightLeft,
} from "lucide-react";
import {
  LockerItem,
  LockerZone,
  LockerStatus,
  LockerZoneStats,
} from "../types";
import { calculateLockerStats } from "../mock-data";

interface LockersGridViewProps {
  lockers: LockerItem[];
  onSelectLockerToEdit: (locker: LockerItem) => void;
  onQuickToggleStatus?: (locker: LockerItem) => void;
}

export const LockersGridView: React.FC<LockersGridViewProps> = ({
  lockers,
  onSelectLockerToEdit,
}) => {
  const [selectedZone, setSelectedZone] = useState<"ALL" | LockerZone>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | LockerStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Stats calculation
  const zoneStats = useMemo(() => calculateLockerStats(lockers), [lockers]);

  // Overall stats
  const totalCount = lockers.length;
  const availableCount = lockers.filter((l) => l.status === "AVAILABLE").length;
  const occupiedCount = lockers.filter((l) => l.status === "OCCUPIED").length;
  const maintenanceCount = lockers.filter((l) => l.status === "MAINTENANCE").length;

  // Filtered lockers
  const filteredLockers = useMemo(() => {
    return lockers.filter((locker) => {
      if (selectedZone !== "ALL" && locker.zone !== selectedZone) {
        return false;
      }
      if (selectedStatus !== "ALL" && locker.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = locker.code.toLowerCase().includes(q);
        const matchName = locker.currentMemberName?.toLowerCase().includes(q);
        const matchPhone = locker.currentMemberPhone?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone) {
          return false;
        }
      }
      return true;
    });
  }, [lockers, selectedZone, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 3 Zone Utilization Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {zoneStats.map((stat) => (
          <div
            key={stat.zone}
            onClick={() => setSelectedZone(selectedZone === stat.zone ? "ALL" : stat.zone)}
            className={`cursor-pointer rounded-2xl border p-4.5 transition-all ${
              selectedZone === stat.zone
                ? "border-[#008b74] bg-[#008b74]/5 shadow-sm ring-2 ring-[#008b74]/20"
                : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                    stat.zone === "MALE"
                      ? "bg-blue-100 text-blue-700"
                      : stat.zone === "FEMALE"
                      ? "bg-pink-100 text-pink-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {stat.zone === "MALE" ? "M" : stat.zone === "FEMALE" ? "F" : "VIP"}
                </span>
                <span className="font-bold text-sm text-slate-800">{stat.zoneLabel}</span>
              </div>
              <span className="text-xs font-bold font-mono text-[#008b74]">
                {stat.utilizationRate}% Lấp đầy
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#008b74] transition-all"
                style={{ width: `${stat.utilizationRate}%` }}
              />
            </div>

            {/* Details */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-blue-700">
                {stat.occupied} Đang dùng
              </span>
              <span className="font-semibold text-emerald-700">
                {stat.available} Sẵn sàng
              </span>
              <span className="font-semibold text-amber-700">
                {stat.maintenance} Bảo trì
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Zone Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: `Tất cả các khu (${totalCount})` },
              { id: "MALE", label: `Khu Nam (36 tủ)` },
              { id: "FEMALE", label: `Khu Nữ (36 tủ)` },
              { id: "VIP", label: `Khu VIP (20 tủ)` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedZone(tab.id as any)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all select-none ${
                  selectedZone === tab.id
                    ? "bg-[#008b74] text-white shadow-xs font-bold"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Filters: Status & Search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[180px] flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã tủ (M-01), hội viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
            </div>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-[#008b74] focus:bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Sẵn sàng (Trống - {availableCount})</option>
              <option value="OCCUPIED">Đang dùng ({occupiedCount})</option>
              <option value="MAINTENANCE">Bảo trì ({maintenanceCount})</option>
            </select>
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
            Chú giải trạng thái:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-700 font-medium">Sẵn Sàng ({availableCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-600 shrink-0" />
            <span className="text-slate-700 font-medium">Đang Dùng ({occupiedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-700 font-medium">Bảo Trì ({maintenanceCount})</span>
          </div>
          <span className="ml-auto text-[11px] text-slate-400 italic">
            * Nhấp vào ô tủ để chuyển đổi trạng thái (PUT) hoặc xem thông tin
          </span>
        </div>
      </div>

      {/* Lockers Matrix Grid */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
        {filteredLockers.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
            {filteredLockers.map((locker) => {
              const isAvailable = locker.status === "AVAILABLE";
              const isOccupied = locker.status === "OCCUPIED";
              const isMaintenance = locker.status === "MAINTENANCE";

              return (
                <div
                  key={locker.id}
                  onClick={() => onSelectLockerToEdit(locker)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-2.5 transition-all duration-150 cursor-pointer hover:shadow-md hover:scale-[1.02] select-none ${
                    isAvailable
                      ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-50"
                      : isOccupied
                      ? "border-blue-200 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50"
                      : "border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50"
                  }`}
                >
                  {/* Top Bar: Code + Status Icon */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-mono text-xs font-black tracking-tight ${
                        isAvailable
                          ? "text-emerald-800"
                          : isOccupied
                          ? "text-blue-900"
                          : "text-amber-900"
                      }`}
                    >
                      {locker.code}
                    </span>

                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-white ${
                        isAvailable
                          ? "bg-emerald-500"
                          : isOccupied
                          ? "bg-blue-600"
                          : "bg-amber-500"
                      }`}
                    >
                      {isAvailable && <Unlock className="h-3 w-3" />}
                      {isOccupied && <Lock className="h-3 w-3" />}
                      {isMaintenance && <Wrench className="h-3 w-3" />}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="my-2 min-h-[38px] flex flex-col justify-center">
                    {isOccupied && (
                      <div className="space-y-0.5">
                        <p
                          className="text-[11px] font-bold text-blue-950 truncate leading-snug"
                          title={locker.currentMemberName}
                        >
                          {locker.currentMemberName}
                        </p>
                        {locker.checkInTime && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-700">
                            <Clock className="h-2.5 w-2.5 shrink-0" />
                            <span>Vào: {locker.checkInTime}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {isAvailable && (
                      <span className="text-[11px] font-semibold text-emerald-700">
                        Sẵn sàng
                      </span>
                    )}

                    {isMaintenance && (
                      <p
                        className="text-[10px] font-medium text-amber-800 truncate"
                        title={locker.maintenanceReason}
                      >
                        {locker.maintenanceReason || "Bảo dưỡng"}
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Hint */}
                  <div className="flex items-center justify-between border-t border-slate-200/50 pt-1 text-[10px] font-semibold">
                    <span className="text-slate-400 font-mono">
                      {locker.zone === "MALE" ? "Nam" : locker.zone === "FEMALE" ? "Nữ" : "VIP"}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[#008b74] opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRightLeft className="h-2.5 w-2.5" /> Đổi
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm font-semibold text-slate-500">
              Không tìm thấy tủ đồ nào phù hợp với bộ lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedZone("ALL");
                setSelectedStatus("ALL");
                setSearchQuery("");
              }}
              className="mt-2 text-xs font-bold text-[#008b74] hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
