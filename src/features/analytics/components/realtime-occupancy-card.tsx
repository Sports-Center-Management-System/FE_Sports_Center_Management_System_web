import React from "react";
import { RealtimeOccupancyData } from "../types/manager-dashboard.types";
import { Progress } from "@/components/ui/progress";
import { Activity, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RealtimeOccupancyCardProps {
  occupancy: RealtimeOccupancyData;
}

const DEFAULT_OCCUPANCY_DATA: RealtimeOccupancyData = {
  totalCurrent: 186,
  totalCapacity: 250,
  overallRate: 74.4,
  peakStatus: "PEAK",
  zones: [
    {
      id: "z-1",
      name: "Khu tạ & Cardio (Gym Floor)",
      currentCount: 88,
      maxCapacity: 110,
      occupancyRate: 80.0,
      status: "BUSY",
    },
    {
      id: "z-2",
      name: "Studio Yoga & Pilates Reformer",
      currentCount: 28,
      maxCapacity: 35,
      occupancyRate: 80.0,
      status: "BUSY",
    },
    {
      id: "z-3",
      name: "Bể bơi 4 mùa & Thủy trị liệu",
      currentCount: 24,
      maxCapacity: 40,
      occupancyRate: 60.0,
      status: "NORMAL",
    },
    {
      id: "z-4",
      name: "Khu Functional & Combat Boxing",
      currentCount: 18,
      maxCapacity: 30,
      occupancyRate: 60.0,
      status: "NORMAL",
    },
    {
      id: "z-5",
      name: "Khu vực Xông hơi & Phục hồi",
      currentCount: 28,
      maxCapacity: 35,
      occupancyRate: 80.0,
      status: "BUSY",
    },
  ],
  hourlyTraffic: [
    { hour: "06:00", headcount: 45, isPeak: false },
    { hour: "08:00", headcount: 95, isPeak: false },
    { hour: "10:00", headcount: 110, isPeak: false },
    { hour: "12:00", headcount: 70, isPeak: false },
    { hour: "14:00", headcount: 85, isPeak: false },
    { hour: "16:00", headcount: 140, isPeak: true },
    { hour: "18:00", headcount: 186, isPeak: true },
    { hour: "20:00", headcount: 165, isPeak: true },
    { hour: "21:30", headcount: 60, isPeak: false },
  ],
};

export const RealtimeOccupancyCard: React.FC<RealtimeOccupancyCardProps> = ({
  occupancy = DEFAULT_OCCUPANCY_DATA,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Tỷ lệ Lấp Đầy Thời Gian Thực
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Mật độ hội viên theo từng khu vực tập luyện
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>Giờ cao điểm ({occupancy.overallRate}%)</span>
          </div>
        </div>

        {/* Zone Breakdown List */}
        <div className="mt-5 space-y-4">
          {occupancy.zones.map((zone) => {
            const isHigh = zone.occupancyRate >= 80;
            return (
              <div key={zone.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {zone.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {zone.currentCount} / {zone.maxCapacity} người
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[10px] font-bold font-mono",
                        isHigh
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      )}
                    >
                      {zone.occupancyRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={zone.occupancyRate}
                  max={100}
                  className="h-2 bg-slate-100"
                  indicatorClassName={
                    isHigh ? "bg-amber-500" : "bg-[#008b74]"
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Density Distribution */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="font-bold text-slate-800 uppercase tracking-tight text-[11px]">
            Mật độ khách theo khung giờ hôm nay
          </span>
          <span className="text-[11px] text-slate-400">Đơn vị: Khách</span>
        </div>

        <div className="grid grid-cols-9 gap-1.5 text-center">
          {occupancy.hourlyTraffic.map((item, idx) => {
            const heightPercent = Math.min((item.headcount / 200) * 100, 100);
            return (
              <div key={idx} className="flex flex-col items-center">
                <div className="h-14 w-full bg-slate-50 rounded-md flex items-end justify-center p-0.5">
                  <div
                    className={cn(
                      "w-full rounded-sm transition-all duration-300",
                      item.isPeak ? "bg-[#008b74]" : "bg-slate-300"
                    )}
                    style={{ height: `${heightPercent}%` }}
                    title={`${item.hour}: ${item.headcount} khách`}
                  />
                </div>
                <span className="mt-1 text-[9px] font-medium text-slate-500">
                  {item.hour.split(":")[0]}h
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
