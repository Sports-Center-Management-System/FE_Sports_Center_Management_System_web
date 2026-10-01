import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Home,
  LineChart,
  RefreshCw,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { CoachPerformanceTable } from "@/features/analytics/components/coach-performance-table";
import {
  CoachTimesheetReport,
  RenewalReport,
  UnderfilledClassesReport,
} from "@/features/analytics/components/pending-reports";
import { ReportFiltersBar } from "@/features/analytics/components/report-filters";
import { RevenueChart } from "@/features/analytics/components/revenue-chart";
import { RevenueSummary } from "@/features/analytics/components/revenue-summary";
import { RoomScheduledHours } from "@/features/analytics/components/room-scheduled-hours";
import { getKpiReport, getRevenueReport } from "@/features/analytics/services/analytics-api.service";
import {
  AnalyticsError,
  KpiReport,
  ReportFilters,
  RevenueReport,
} from "@/features/analytics/types/analytics.types";

const defaultFilters: ReportFilters = {
  fromDate: "",
  toDate: "",
  discipline: "ALL",
  membershipTier: "ALL",
};

const getErrorMessage = (error: unknown, reportName: string): AnalyticsError => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string }; status?: number } }).response;
    if (response?.status === 404) {
      return { message: `API ${reportName} chưa được triển khai trên backend (HTTP 404).`, statusCode: 404 };
    }
    return {
      message: response?.data?.message || `Không thể tải ${reportName}.`,
      statusCode: response?.status,
    };
  }

  if (error instanceof Error) {
    return { message: `Không thể kết nối để tải ${reportName}. Vui lòng thử lại.` };
  }

  return { message: `Không thể tải ${reportName}.` };
};

export const ReportsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [kpi, setKpi] = useState<KpiReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<AnalyticsError | null>(null);
  const [kpiError, setKpiError] = useState<AnalyticsError | null>(null);
  const hasUnavailableReport = revenueError?.statusCode === 404 || kpiError?.statusCode === 404;
  const hasRetryableError =
    (revenueError !== null && revenueError.statusCode !== 404) ||
    (kpiError !== null && kpiError.statusCode !== 404);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setRevenueError(null);
    setKpiError(null);

    const [revenueResult, kpiResult] = await Promise.allSettled([
      getRevenueReport(),
      getKpiReport(),
    ]);
    if (revenueResult.status === "fulfilled") {
      setRevenue(revenueResult.value);
    } else {
      setRevenue(null);
      setRevenueError(getErrorMessage(revenueResult.reason, "báo cáo doanh thu"));
    }
    if (kpiResult.status === "fulfilled") {
      setKpi(kpiResult.value);
    } else {
      setKpi(null);
      setKpiError(getErrorMessage(kpiResult.reason, "báo cáo KPI"));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return (
    <div className="min-h-screen bg-[#f1faf6] text-[#10221f]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[#dceee8] bg-white md:flex md:flex-col">
          <div className="border-b border-[#e6f2ee] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#008b74] text-white">
                <LineChart className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-sm font-bold leading-tight text-[#10221f]">
                Sports Center Management System
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5 text-sm">
            <span className="flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-[#8aa09a]" aria-disabled="true">
              <Home className="h-4 w-4" />
              Tổng quan
            </span>
            <span className="flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-[#8aa09a]" aria-disabled="true">
              <UserCircle className="h-4 w-4" />
              Hồ sơ quản lý
            </span>
            <a
              className="flex items-center justify-between rounded-md bg-[#e5f7f1] px-3 py-2.5 font-semibold text-[#008b74]"
              href="/portal/manager/reports"
            >
              <span className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4" />
                Báo cáo
              </span>
              <ChevronRight className="h-4 w-4" />
            </a>
            <span className="flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-[#8aa09a]" aria-disabled="true">
              <CalendarDays className="h-4 w-4" />
              Lịch hoạt động
            </span>
          </nav>

          <div className="border-t border-[#e6f2ee] p-4">
            <div className="rounded-lg bg-[#effaf6] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#008b74]">
                <ShieldCheck className="h-4 w-4" />
                QUẢN LÝ TRUNG TÂM
              </div>
              <p className="mt-2 text-xs leading-5 text-[#5d716b]">
                Báo cáo doanh thu và chỉ số hoạt động của trung tâm.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-[#dceee8] bg-white px-4 py-3 md:hidden">
            <span className="min-w-0 text-sm font-bold leading-tight text-[#10221f]">
              Sports Center Management System
            </span>
            <a
              href="/portal/manager/reports"
              className="shrink-0 rounded-md bg-[#e5f7f1] px-3 py-2 text-xs font-semibold text-[#008b74]"
            >
              Báo cáo
            </a>
          </div>
          <header className="sticky top-0 z-10 border-b border-[#dceee8] bg-white/95 px-4 py-3 backdrop-blur md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#008b74]">
                  Quản lý trung tâm
                </p>
                <h1 className="text-xl font-bold text-[#10221f] md:text-2xl">
                  Báo cáo doanh thu & KPI
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 rounded-full bg-[#f7fdfb] py-1 pl-1 pr-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#008b74] text-sm font-bold text-white">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "M"}
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-sm font-semibold text-[#10221f]">
                      {user?.fullName || "Quản lý trung tâm"}
                    </div>
                    <div className="text-xs text-[#6a7d78]">{user?.email}</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-6 px-4 py-6 md:px-8">
            <section className="rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#10221f]">
                    Tổng quan hoạt động trung tâm
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[#6a7d78]">
                    Theo dõi doanh thu, lịch dạy huấn luyện viên và giờ phòng đã xếp lịch.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadReports()}
                    disabled={isLoading}
                    className="border-[#cfe5de] bg-white text-[#10221f] hover:bg-[#f1faf6]"
                  >
                    <RefreshCw className={isLoading ? "animate-spin" : ""} />
                    Tải lại
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void logout()}>
                    Đăng xuất
                  </Button>
                </div>
              </div>
            </section>

            <ReportFiltersBar
              filters={filters}
              onChange={setFilters}
              onApply={() => void loadReports()}
            />

            {hasUnavailableReport && (
              <p className="text-sm text-[#6a7d78]" role="status">
                Chức năng báo cáo đang được cập nhật.
              </p>
            )}

            {hasRetryableError && (
              <section className="rounded-lg border border-[#f6c6c2] bg-[#fff5f4] p-5 text-[#9f1d15]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <h3 className="font-semibold">Chưa thể tải đầy đủ báo cáo</h3>
                      {revenueError && revenueError.statusCode !== 404 && (
                        <p className="mt-1 text-sm">Doanh thu: {revenueError.message}</p>
                      )}
                      {kpiError && kpiError.statusCode !== 404 && (
                        <p className="mt-1 text-sm">KPI: {kpiError.message}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadReports()}
                    className="border-[#eaa5a0] bg-white text-[#9f1d15] hover:bg-[#fff0ef]"
                  >
                    <RefreshCw />
                    Thử lại
                  </Button>
                </div>
              </section>
            )}

            <RevenueSummary revenue={revenue} isLoading={isLoading} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
              <RevenueChart revenue={revenue} isLoading={isLoading} />
              <RoomScheduledHours rooms={kpi?.rooms ?? []} isLoading={isLoading} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <RenewalReport />
              <UnderfilledClassesReport />
            </div>

            <CoachPerformanceTable
              coaches={kpi?.coaches ?? []}
              isLoading={isLoading}
            />
            <CoachTimesheetReport />
          </div>
        </main>
      </div>
    </div>
  );
};
