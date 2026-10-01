import React from "react";
import { Star, Users } from "lucide-react";
import { CoachPerformance } from "@/features/analytics/types/analytics.types";

interface CoachPerformanceTableProps {
  coaches: CoachPerformance[];
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
        Hiệu suất huấn luyện viên
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded bg-[#edf7f3]" />
          ))}
        </div>
      ) : coaches.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e4f0ec] text-xs uppercase tracking-wide text-[#6a7d78]">
                <th className="pb-3 font-semibold">Huấn luyện viên</th>
                <th className="pb-3 font-semibold">Buổi PT đã hoàn thành</th>
                <th className="pb-3 font-semibold">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                <tr key={coach.coachId} className="border-b border-[#eef6f2] last:border-0">
                  <td className="py-4 font-semibold text-[#10221f]">{coach.coachName}</td>
                  <td className="py-4 text-[#334843]">{coach.ptSessionsCompleted}</td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#fff8e6] px-2.5 py-1 font-semibold text-[#936400]">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {coach.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[#cde4dc] bg-[#f8fffc] p-6 text-sm text-[#6a7d78]">
          API KPI chưa trả về dữ liệu huấn luyện viên.
        </div>
      )}
    </section>
  );
};
