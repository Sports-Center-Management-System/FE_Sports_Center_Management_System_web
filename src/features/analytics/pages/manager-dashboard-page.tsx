import React, { useState } from "react";
import {
  Calendar,
  Building2,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { ExecutiveKPIGrid } from "../components/executive-kpi-grid";
import { RevenueBreakdownChart } from "../components/revenue-breakdown-chart";
import { RealtimeOccupancyCard } from "../components/realtime-occupancy-card";
import { LockerUtilizationCard } from "../components/locker-utilization-card";
import { OnDutyStaffCard } from "../components/on-duty-staff-card";
import { Button } from "@/components/ui/button";
import { ManagerDashboardData } from "../types/manager-dashboard.types";
import { cn } from "@/lib/utils";

const MOCK_DASHBOARD_DATA: ManagerDashboardData = {
  todayRevenue: {
    totalAmount: 42500000,
    baseAmount: 24500000,
    ptAmount: 18000000,
    growthPercent: 12.4,
  },
  monthlyRevenue: {
    totalAmount: 648200000,
    baseAmount: 382200000,
    ptAmount: 266000000,
    growthPercent: 15.6,
    targetAmount: 750000000,
    achievementPercent: 86.4,
  },
  memberGrowth: {
    todayCount: 18,
    monthCount: 342,
    growthRate: 14.8,
    activeTotal: 1840,
    packageBreakdown: [
      { packageName: "Platinum 12 tháng", count: 144, percentage: 42 },
      { packageName: "Hội viên kèm PT", count: 123, percentage: 36 },
      { packageName: "Gói trải nghiệm / Tháng", count: 75, percentage: 22 },
    ],
  },
  occupancy: {
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
  },
  lockersSummary: {
    totalLockers: 200,
    totalOccupied: 142,
    totalRate: 71,
    zones: [
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
    ],
    recentLockers: [],
  },
  staffOnDuty: [],
  lastUpdated: "20:45:12 - Hôm nay",
};

export const ManagerDashboardPage: React.FC = () => {
  const [data, setData] = useState<ManagerDashboardData>(MOCK_DASHBOARD_DATA);
  const [timeRange, setTimeRange] = useState<"TODAY" | "7DAYS" | "MONTH">("TODAY");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setData((prev) => ({
        ...prev,
        lastUpdated: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " - Hôm nay",
      }));
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="space-y-7 pb-12 w-full max-w-7xl mx-auto">
      {/* Executive Control Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#e6f7f2] px-2 py-0.5 text-[10px] font-bold text-[#008b74] tracking-wide uppercase">
              CENTER_MANAGER
            </span>
            <span className="text-xs text-slate-400">
              Cập nhật lúc: {data.lastUpdated}
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Tổng Quan Điều Hành Trung Tâm
          </h2>
          <p className="text-xs text-slate-500">
            Giám sát thời gian thực: Doanh thu, Hội viên, Công suất sàn tập và Nhân sự vận hành
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs">
            {[
              { id: "TODAY", label: "Hôm nay" },
              { id: "7DAYS", label: "7 ngày" },
              { id: "MONTH", label: "Tháng này" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeRange(tab.id as any)}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-semibold transition-all select-none",
                  timeRange === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw
              className={cn("mr-1.5 h-3.5 w-3.5", isRefreshing && "animate-spin")}
            />
            {isRefreshing ? "Đang tải..." : "Làm mới"}
          </Button>

          {/* Export Report */}
          <Button
            variant="mint"
            size="sm"
            onClick={() => alert("Hệ thống đang xuất file báo cáo điều hành PDF...")}
            className="rounded-xl text-xs font-bold shadow-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Row 1: Key Executive KPIs */}
      <ExecutiveKPIGrid
        todayRevenue={data.todayRevenue}
        monthlyRevenue={data.monthlyRevenue}
        memberGrowth={data.memberGrowth}
        occupancy={data.occupancy}
      />

      {/* Row 2: Financial Structure & Realtime Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (60%): Revenue Breakdown (Base vs PT) */}
        <div className="lg:col-span-7">
          <RevenueBreakdownChart />
        </div>

        {/* Right (40%): Realtime Occupancy & Peak density */}
        <div className="lg:col-span-5">
          <RealtimeOccupancyCard occupancy={data.occupancy} />
        </div>
      </div>

      {/* Row 3: Lockers Matrix & On-duty Staff Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (50%): Locker Map & Utilization */}
        <div className="lg:col-span-6">
          <LockerUtilizationCard zones={data.lockersSummary.zones} />
        </div>

        {/* Right (50%): Staff & Trainers On Duty */}
        <div className="lg:col-span-6">
          <OnDutyStaffCard />
        </div>
      </div>
    </div>
  );
};
