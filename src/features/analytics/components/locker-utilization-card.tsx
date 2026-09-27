import React, { useState } from "react";
import { LockerZoneSummary, LockerItem } from "../types/manager-dashboard.types";
import { Progress } from "@/components/ui/progress";
import { Lock, Unlock, Wrench, Shield, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LockerUtilizationCardProps {
  zones?: LockerZoneSummary[];
}

const DEFAULT_ZONES: LockerZoneSummary[] = [
  {
    zone: "MALE",
    label: "Khu vực Nam",
    total: 80,
    occupied: 62,
    available: 15,
    maintenance: 3,
    utilizationRate: 77.5,
  },
  {
    zone: "FEMALE",
    label: "Khu vực Nữ",
    total: 80,
    occupied: 58,
    available: 20,
    maintenance: 2,
    utilizationRate: 72.5,
  },
  {
    zone: "VIP",
    label: "Khu vực VIP",
    total: 40,
    occupied: 22,
    available: 17,
    maintenance: 1,
    utilizationRate: 55.0,
  },
];

// Generate representative mock lockers for the selected zone
const generateMockLockers = (zone: string, total: number, occupied: number, maintenance: number) => {
  const list: { code: string; status: "OCCUPIED" | "AVAILABLE" | "MAINTENANCE" }[] = [];
  const prefix = zone === "MALE" ? "M" : zone === "FEMALE" ? "F" : "VIP";

  for (let i = 1; i <= Math.min(total, 36); i++) {
    const code = `${prefix}-${String(i).padStart(2, "0")}`;
    if (i <= occupied) {
      list.push({ code, status: "OCCUPIED" });
    } else if (i <= occupied + maintenance) {
      list.push({ code, status: "MAINTENANCE" });
    } else {
      list.push({ code, status: "AVAILABLE" });
    }
  }
  return list;
};

export const LockerUtilizationCard: React.FC<LockerUtilizationCardProps> = ({
  zones = DEFAULT_ZONES,
}) => {
  const [selectedZoneKey, setSelectedZoneKey] = useState<"MALE" | "FEMALE" | "VIP">("MALE");

  const totalLockers = zones.reduce((acc, z) => acc + z.total, 0);
  const totalOccupied = zones.reduce((acc, z) => acc + z.occupied, 0);
  const totalRate = Math.round((totalOccupied / totalLockers) * 100);

  const activeZone = zones.find((z) => z.zone === selectedZoneKey) || zones[0];
  const sampleLockers = generateMockLockers(
    activeZone.zone,
    activeZone.total,
    Math.round(activeZone.occupied * 0.45),
    activeZone.maintenance
  );

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Sơ Đồ & Tỷ Lệ Tủ Đồ (Lockers)
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Tỷ lệ chiếm dụng tủ đồ theo từng khu vực phòng thay đồ
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-slate-900 font-mono">
              {totalOccupied} / {totalLockers} tủ
            </span>
            <p className="text-[11px] font-semibold text-[#008b74]">
              Đang sử dụng ({totalRate}%)
            </p>
          </div>
        </div>

        {/* Zone Selector Buttons */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {zones.map((z) => {
            const isSelected = selectedZoneKey === z.zone;
            return (
              <button
                key={z.zone}
                type="button"
                onClick={() => setSelectedZoneKey(z.zone)}
                className={cn(
                  "rounded-xl p-3 text-left transition-all border select-none",
                  isSelected
                    ? "border-[#008b74] bg-[#e6f7f2] shadow-sm"
                    : "border-slate-200/80 bg-[#f8fafc] hover:bg-slate-100/70"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      isSelected ? "text-[#008b74]" : "text-slate-700"
                    )}
                  >
                    {z.label}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-mono font-bold",
                      isSelected ? "text-[#008b74]" : "text-slate-800"
                    )}
                  >
                    {z.utilizationRate}%
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  {z.occupied}/{z.total} đang khóa
                </div>
                <Progress
                  value={z.utilizationRate}
                  max={100}
                  className="mt-2 h-1.5 bg-slate-200"
                  indicatorClassName={
                    isSelected ? "bg-[#008b74]" : "bg-slate-400"
                  }
                />
              </button>
            );
          })}
        </div>

        {/* Live Matrix Grid for Active Zone */}
        <div className="mt-5 rounded-xl border border-slate-100 bg-[#f8fafc] p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-tight text-[11px]">
              Trực quan khoang tủ: {activeZone.label}
            </span>
            {/* Status Indicator Legend */}
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="h-2 w-2 rounded-sm bg-[#008b74]" /> Đang dùng ({activeZone.occupied})
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="h-2 w-2 rounded-sm bg-slate-300" /> Trống ({activeZone.available})
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="h-2 w-2 rounded-sm bg-amber-500" /> Bảo trì ({activeZone.maintenance})
              </span>
            </div>
          </div>

          {/* Matrix Grid of Locker Boxes */}
          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-1.5">
            {sampleLockers.map((locker) => (
              <div
                key={locker.code}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg py-2 px-1 text-[10px] font-mono font-bold transition-all select-none border",
                  locker.status === "OCCUPIED"
                    ? "bg-[#008b74] text-white border-[#007461] shadow-xs"
                    : locker.status === "MAINTENANCE"
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                )}
                title={`Tủ ${locker.code}: ${
                  locker.status === "OCCUPIED"
                    ? "Đang sử dụng"
                    : locker.status === "MAINTENANCE"
                    ? "Đang bảo trì"
                    : "Đang trống"
                }`}
              >
                <span>{locker.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>Tự động giải phóng mã sau 24:00 mỗi ngày</span>
        <span className="font-semibold text-slate-700">Tủ VIP: 100% khóa thẻ từ RFID</span>
      </div>
    </div>
  );
};
