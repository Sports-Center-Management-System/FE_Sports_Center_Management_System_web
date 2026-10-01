import React from "react";
import { Users } from "lucide-react";
import { CoachKpi } from "@/features/analytics/types/analytics.types";

interface CoachPerformanceTableProps {
  coaches: CoachKpi[];
  isLoading: boolean;
}

export const CoachPerformanceTable: React.FC<CoachPerformanceTableProps> = ({
  coaches,
  isLoading,
}) => {
  return (
    <section className="rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2 text-base font-semibold text-[#10221f]">
        <Users className="h-5 w-5 text-[#008b74]" />
        Lịch dạy huấn luyện viên
      </div>
      <p className="mb-5 text-sm text-[#6a7d78]">
        Số lịch và slot được ghi nhận, chưa phải số ca đã chấm công.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded bg-[#edf7f3]" />
          ))}
        </div>
      ) : coaches.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e4f0ec] text-xs text-[#6a7d78]">
                <th className="pb-3 font-semibold">Huấn luyện viên</th>
                <th className="pb-3 text-right font-semibold">Lịch dạy</th>
                <th className="pb-3 text-right font-semibold">Slot đã tạo</th>
                <th className="pb-3 text-right font-semibold">Hủy khẩn cấp tháng</th>
                <th className="pb-3 text-right font-semibold">Tổng hủy khẩn cấp</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                <tr key={coach.id} className="border-b border-[#eef6f2] last:border-0">
                  <td className="py-4 font-semibold text-[#10221f]">{coach.fullName}</td>
                  <td className="py-4 text-right text-[#334843]">{coach._count.coachedSchedules}</td>
                  <td className="py-4 text-right text-[#334843]">{coach._count.coachAvailabilities}</td>
                  <td className="py-4 text-right text-[#334843]">
                    {coach.coachProfile?.monthlyEmergencyCancellations ?? "—"}
                  </td>
                  <td className="py-4 text-right text-[#334843]">
                    {coach.coachProfile?.emergencyCancellationCount ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[#cde4dc] bg-[#f8fffc] p-6 text-sm text-[#6a7d78]">
          Chưa có dữ liệu lịch dạy huấn luyện viên.
        </div>
      )}
    </section>
  );
};
